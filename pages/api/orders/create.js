import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { initializeTransaction } from '../../../lib/paystack';
import { getOrCreateClient } from '../../../lib/clientRecord';
import { isValidEmail, normalizeEmail } from '../../../lib/validation';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { buildOrder } from '../../../lib/orderBuilder';

// Body: { email, platform, postLink, items: [{ action, quantity }] }
// items' prices are looked up server-side from pricing_rules — never trust
// a price sent from the browser (see lib/orderBuilder.js, which also validates
// quantities: anyone can call this endpoint directly, and a negative quantity
// on one line would quietly discount every other line).
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

  // 1. Validate and price the order (real prices, follow capacity, minimum order)
  const built = await buildOrder(supabaseAdmin, { platform, postLink, items, specialInstructions });
  if (built.fail) return res.status(built.fail.status).json(built.fail.body);
  const { link, amountTotal, lineItems, extraInstructions } = built;

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
