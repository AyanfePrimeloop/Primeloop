import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { initializeTransaction } from '../../../lib/paystack';
import { getOrCreateClient } from '../../../lib/clientRecord';
import { isValidEmail, normalizeEmail } from '../../../lib/validation';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { isKnownPlatform, linkMismatchMessage, normalizeLink, linkMatchesPlatform, extractProfileHandle } from '../../../lib/platformDomains';

const MAX_ITEMS = 12;
const MAX_QUANTITY = 10000; // per line item

// Body: { email, platform, postLink, items: [{ action, quantity }] }
// items' prices are looked up server-side from pricing_rules — never trust
// a price sent from the browser. Quantities are validated here too: the
// order form enforces them, but anyone can call this endpoint directly, and
// a negative quantity on one line would quietly discount every other line.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getClientIp(req);
  const rateCheck = await checkRateLimit(supabaseAdmin, `order-create:${ip}`, { maxAttempts: 15, windowSeconds: 3600 });
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many orders attempted from this connection. Please try again in a while, or contact us on WhatsApp.' });
  }

  const { email, platform, postLink, items, specialInstructions } = req.body || {};
  if (!email || !platform || !postLink || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!isKnownPlatform(platform)) {
    return res.status(400).json({ error: 'Please choose a platform.' });
  }
  const link = normalizeLink(postLink);
  if (!link) {
    return res.status(400).json({ error: 'Please enter a valid post link.' });
  }
  if (!linkMatchesPlatform(link, platform)) {
    return res.status(400).json({ error: linkMismatchMessage(platform) });
  }

  if (items.length > MAX_ITEMS) {
    return res.status(400).json({ error: 'Too many items in one order.' });
  }
  // Merge repeated actions, and reject anything that isn't a whole number
  // of engagements from 1 up to a sane maximum.
  const merged = new Map();
  for (const item of items) {
    const q = item?.quantity;
    if (typeof item?.action !== 'string' || !Number.isInteger(q) || q < 1 || q > MAX_QUANTITY) {
      return res.status(400).json({ error: `Each engagement needs a whole-number quantity between 1 and ${MAX_QUANTITY.toLocaleString()}.` });
    }
    const existing = merged.get(item.action);
    merged.set(item.action, {
      action: item.action,
      quantity: (existing?.quantity || 0) + q,
      targetAccountHandle: existing?.targetAccountHandle || cleanHandle(item.targetAccountHandle),
    });
  }
  const orderItems = [...merged.values()];
  if (orderItems.some((i) => i.quantity > MAX_QUANTITY)) {
    return res.status(400).json({ error: `Each engagement needs a whole-number quantity between 1 and ${MAX_QUANTITY.toLocaleString()}.` });
  }

  const extraInstructions = typeof specialInstructions === 'string' ? specialInstructions.trim().slice(0, 500) : '';

  // 1. Look up real prices and check Follow capacity for any follow/subscribe items
  const { data: rules, error: rulesErr } = await supabaseAdmin
    .from('pricing_rules')
    .select('*')
    .eq('platform', platform)
    .eq('active', true)
    .in('action', orderItems.map((i) => i.action));
  if (rulesErr) return res.status(500).json({ error: rulesErr.message });

  let amountTotal = 0;
  const lineItems = [];
  for (const item of orderItems) {
    const rule = rules.find((r) => r.action === item.action);
    if (!rule) return res.status(400).json({ error: `Unknown action: ${item.action}` });

    let targetAccountHandle = null;
    if (['follow', 'subscribe'].includes(item.action)) {
      // The follow ledger ("this engager already follows that account") can
      // only work if we know which account. The order form never asks for it
      // separately, so read it off the profile link they pasted.
      targetAccountHandle = item.targetAccountHandle || extractProfileHandle(platform, link);
      const capacity = await getFollowCapacity(platform, targetAccountHandle);
      if (item.quantity > capacity) {
        return res.status(409).json({
          error: `Only ${capacity} unique engagers on ${platform} haven't already followed this account. Reduce quantity or choose a different order type.`,
          maxAvailable: capacity,
        });
      }
    }

    amountTotal += rule.client_price * item.quantity;
    // IMPORTANT: engager_payout is what becomes tasks.price_per_unit later,
    // which is what engagers see and what the weekly payout pays them —
    // it must be the engager's rate, never the client's price.
    lineItems.push({
      action: item.action,
      quantity: item.quantity,
      targetAccountHandle,
      engager_payout: rule.engager_payout,
    });
  }
  if (!(amountTotal > 0)) {
    return res.status(400).json({ error: 'This order has no payable items.' });
  }

  // 2. Find or create the client record — also creates a real login for them
  //    (no password needed, they'll use a magic link at /client-login later)
  //    so they can come back and track this order without any extra signup step.
  const { client, error: clientErr } = await getOrCreateClient(supabaseAdmin, cleanEmail);
  if (clientErr || !client) return res.status(500).json({ error: clientErr?.message || 'Could not set up your account.' });

  // 3. Create the order in "pending" state — tasks are only created once
  //    the Paystack webhook confirms payment (see pages/api/paystack/webhook.js)
  const reference = `PL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      client_id: client.id,
      platform,
      post_link: link,
      amount_total: amountTotal,
      paystack_reference: reference,
      payment_status: 'pending',
      special_instructions: extraInstructions || null,
    })
    .select()
    .single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });

  // 4. Kick off Paystack checkout. If Paystack is down or misconfigured, the
  //    visitor must get a readable message, not a blank crash.
  try {
    const paystackRes = await initializeTransaction({
      email: cleanEmail,
      amountNaira: amountTotal,
      reference,
      metadata: { order_id: order.id, line_items: lineItems },
    });
    return res.status(200).json({
      authorization_url: paystackRes.data.authorization_url,
      order_id: order.id,
    });
  } catch (e) {
    console.error('Paystack initialize failed:', e.message);
    await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
    return res.status(502).json({ error: "We couldn't start the payment just now. Please try again in a minute, or message us on WhatsApp." });
  }
}

function cleanHandle(handle) {
  return typeof handle === 'string' && handle.trim() ? handle.trim().toLowerCase().slice(0, 100) : null;
}

async function getFollowCapacity(platform, targetAccountHandle) {
  const { count: totalEngagers } = await supabaseAdmin
    .from('engagers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  let alreadyFollowed = 0;
  if (targetAccountHandle) {
    const { count } = await supabaseAdmin
      .from('follow_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('platform', platform)
      .eq('target_account_handle', targetAccountHandle)
      .eq('still_following', true);
    alreadyFollowed = count || 0;
  }

  return Math.max(0, (totalEngagers || 0) - alreadyFollowed);
}
