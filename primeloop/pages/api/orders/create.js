import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { initializeTransaction } from '../../../lib/paystack';

// Body: { email, platform, postLink, items: [{ action, quantity }] }
// items' prices are looked up server-side from pricing_rules — never trust
// a price sent from the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, platform, postLink, items, specialInstructions } = req.body;
  if (!email || !platform || !postLink || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Look up real prices and check Follow capacity for any follow/subscribe items
  const { data: rules, error: rulesErr } = await supabaseAdmin
    .from('pricing_rules')
    .select('*')
    .eq('platform', platform)
    .in('action', items.map((i) => i.action));
  if (rulesErr) return res.status(500).json({ error: rulesErr.message });

  let amountTotal = 0;
  const lineItems = [];
  for (const item of items) {
    const rule = rules.find((r) => r.action === item.action);
    if (!rule) return res.status(400).json({ error: `Unknown action: ${item.action}` });

    if (['follow', 'subscribe'].includes(item.action)) {
      const capacity = await getFollowCapacity(platform, item.targetAccountHandle);
      if (item.quantity > capacity) {
        return res.status(409).json({
          error: `Only ${capacity} unique engagers on ${platform} haven't already followed this account. Reduce quantity or choose a different order type.`,
          maxAvailable: capacity,
        });
      }
    }

    const lineAmount = rule.client_price * item.quantity;
    amountTotal += lineAmount;
    // IMPORTANT: this is what becomes tasks.price_per_unit later, which is
    // what engagers see and what the weekly payout script pays them —
    // it must be the engager's rate, never the client's price.
    lineItems.push({ ...item, engager_payout: rule.engager_payout });
  }

  // 2. Find or create the client record — also create a real login for them
  //    (no password needed, they'll use a magic link at /client-login later)
  //    so they can come back and track this order without any extra signup step.
  let { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (!client) {
    let authUserId = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
      authUserId = authUser?.user?.id || null;
    } catch (e) {
      // If account creation fails for any reason, the order still proceeds —
      // dashboard login can be set up manually later, checkout should never
      // be blocked by this.
    }
    const { data: newClient, error: clientErr } = await supabaseAdmin
      .from('clients')
      .insert({ email, auth_user_id: authUserId })
      .select()
      .single();
    if (clientErr) return res.status(500).json({ error: clientErr.message });
    client = newClient;
  }

  // 3. Create the order in "pending" state — tasks are only created once
  //    the Paystack webhook confirms payment (see pages/api/paystack/webhook.js)
  const reference = `PL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      client_id: client.id,
      platform,
      post_link: postLink,
      amount_total: amountTotal,
      paystack_reference: reference,
      payment_status: 'pending',
      special_instructions: specialInstructions || null,
    })
    .select()
    .single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });

  // 4. Kick off Paystack checkout
  const paystackRes = await initializeTransaction({
    email,
    amountNaira: amountTotal,
    reference,
    metadata: { order_id: order.id, line_items: lineItems },
  });

  return res.status(200).json({
    authorization_url: paystackRes.data.authorization_url,
    order_id: order.id,
  });
}

async function getFollowCapacity(platform, targetAccountHandle) {
  const { count: totalEngagers } = await supabaseAdmin
    .from('engagers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: alreadyFollowed } = await supabaseAdmin
    .from('follow_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .eq('target_account_handle', targetAccountHandle)
    .eq('still_following', true);

  return (totalEngagers || 0) - (alreadyFollowed || 0);
}
