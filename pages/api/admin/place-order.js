import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { initializeTransaction } from '../../../lib/paystack';
import { getOrCreateClient } from '../../../lib/clientRecord';
import { isValidEmail, normalizeEmail, escapeLike } from '../../../lib/validation';
import { checkRateLimit } from '../../../lib/rateLimit';
import { buildOrder } from '../../../lib/orderBuilder';
import { createTasksForOrder } from '../../../lib/orderTasks';

// Orders an admin places for a client who does not want to do it themselves.
// The pricing, minimums, follow limits and task creation are exactly the
// client checkout's (lib/orderBuilder.js and lib/orderTasks.js).
//
// GET                -> { ready, orders: [...recent admin-placed orders] }
// GET ?email=x       -> { exists, name } so the form can say "existing client"
// POST               -> body: { email, name?, whatsapp?, platform, postLink, items,
//                              specialInstructions?, payment: 'link' | 'manual', paymentNote? }
//    payment 'link'   -> the client pays a Paystack link; tasks are created when
//                        Paystack confirms it, the same as any client order.
//    payment 'manual' -> money was received another way (bank transfer, cash).
//                        Super-admin only, because it starts real work for money
//                        that Paystack has not seen. The note is required.
//
// Needs migration 17 (placed_by, payment_method, payment_url, payment_note).

const missingColumn = (e) => !!e && /PGRST204|42703|placed_by|payment_method|payment_url|payment_note|schema cache/i.test(`${e.code || ''} ${e.message || ''}`);
const MIGRATION_MSG = 'Placing orders for clients needs a one-time setup: run supabase/migration_17_admin_placed_orders.sql in the Supabase SQL Editor, then try again.';

export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const isSuper = auth.admin.role === 'super_admin';

  if (req.method === 'GET') {
    if (req.query.email) {
      const email = normalizeEmail(String(req.query.email));
      if (!isValidEmail(email)) return res.status(200).json({ exists: false });
      const { data } = await supabaseAdmin.from('clients').select('full_name').ilike('email', escapeLike(email)).limit(1);
      return res.status(200).json({ exists: !!data?.length, name: data?.[0]?.full_name || null });
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, platform, post_link, amount_total, payment_status, payment_method, payment_url, payment_note, placed_by, clients(email, full_name, whatsapp)')
      .not('placed_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) {
      if (missingColumn(error)) return res.status(200).json({ ready: false, orders: [], isSuper });
      return res.status(500).json({ error: error.message });
    }
    const ids = (orders || []).map((o) => o.id);
    const { data: tasks } = ids.length
      ? await supabaseAdmin.from('tasks').select('order_id, status, quantity_needed, quantity_filled').in('order_id', ids)
      : { data: [] };
    const progress = {};
    for (const t of tasks || []) {
      const p = (progress[t.order_id] ||= { needed: 0, filled: 0 });
      if (t.status !== 'closed') { p.needed += t.quantity_needed || 0; p.filled += t.quantity_filled || 0; }
    }
    return res.status(200).json({ ready: true, isSuper, orders: (orders || []).map((o) => ({ ...o, progress: progress[o.id] || null })) });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const rate = await checkRateLimit(supabaseAdmin, `admin-order:${auth.user.id}`, { maxAttempts: 30, windowSeconds: 3600 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many orders placed in the last hour. Try again later.' });

  const { email, name, whatsapp, platform, postLink, items, specialInstructions, payment, paymentNote } = req.body || {};
  const cleanEmail = normalizeEmail(email || '');
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: "Enter the client's email address." });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Choose at least one engagement.' });
  if (!['link', 'manual'].includes(payment)) return res.status(400).json({ error: 'Choose how the client will pay.' });

  // Before creating anything (not even the client), make sure migration 17 is in place.
  const probe = await supabaseAdmin.from('orders').select('placed_by').limit(1);
  if (probe.error && missingColumn(probe.error)) return res.status(503).json({ error: MIGRATION_MSG });

  const manual = payment === 'manual';
  const note = String(paymentNote || '').trim().slice(0, 200);
  if (manual) {
    if (!isSuper) return res.status(403).json({ error: 'Only a super-admin can record a payment received outside Paystack.' });
    if (note.length < 3) return res.status(400).json({ error: 'Say how the money was received (for example: GTBank transfer, ref 1234).' });
  }

  // 1. Validate and price the order: identical to the client checkout.
  const built = await buildOrder(supabaseAdmin, { platform, postLink, items, specialInstructions });
  if (built.fail) return res.status(built.fail.status).json(built.fail.body);
  const { link, amountTotal, lineItems, extraInstructions } = built;

  // 2. The client's account (created with a passwordless login if new).
  const { client, created, error: clientErr } = await getOrCreateClient(supabaseAdmin, cleanEmail);
  if (clientErr || !client) return res.status(500).json({ error: clientErr?.message || 'Could not set up the client.' });

  // Guard against the same order being sent twice (a double click or refresh).
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: dupes, error: dupErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('client_id', client.id)
    .eq('post_link', link)
    .eq('amount_total', amountTotal)
    .not('placed_by', 'is', null)
    .gte('created_at', twoMinutesAgo)
    .limit(1);
  if (dupErr && missingColumn(dupErr)) return res.status(503).json({ error: MIGRATION_MSG });
  if (dupes?.length) return res.status(409).json({ error: 'This exact order was just placed. Check the list below before placing it again.' });

  // Fill in details the client does not have yet. Never overwrite what is already there.
  const cleanName = String(name || '').trim().slice(0, 100);
  const cleanWa = String(whatsapp || '').trim().slice(0, 25);
  const fill = {};
  if (cleanName && !client.full_name) fill.full_name = cleanName;
  if (cleanWa && !client.whatsapp) fill.whatsapp = cleanWa;
  if (Object.keys(fill).length) await supabaseAdmin.from('clients').update(fill).eq('id', client.id);

  // 3. Create the order.
  const reference = manual
    ? `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    : `PL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      client_id: client.id,
      platform,
      post_link: link,
      amount_total: amountTotal,
      paystack_reference: reference,
      payment_status: manual ? 'paid' : 'pending',
      special_instructions: extraInstructions || null,
      placed_by: auth.user.email,
      payment_method: manual ? 'manual' : 'paystack',
      payment_note: manual ? note : null,
    })
    .select()
    .single();
  if (orderErr) {
    if (missingColumn(orderErr)) return res.status(503).json({ error: MIGRATION_MSG });
    return res.status(500).json({ error: orderErr.message });
  }

  const summary = { orderId: order.id, total: amountTotal, platform, lines: lineItems.map((l) => ({ action: l.action, quantity: l.quantity })), client: { email: cleanEmail, name: client.full_name || cleanName || null, whatsapp: client.whatsapp || cleanWa || null, isNew: !!created } };

  // 4a. Money already received: start the work now, exactly as the webhook would.
  if (manual) {
    const result = await createTasksForOrder(supabaseAdmin, order, lineItems);
    return res.status(200).json({ ...summary, payment: 'manual', tasksCreated: result.created.length, linkOk: result.linkOk });
  }

  // 4b. Otherwise the client pays a Paystack link. Tasks are created when Paystack confirms it.
  try {
    const paystackRes = await initializeTransaction({
      email: cleanEmail,
      amountNaira: amountTotal,
      reference,
      metadata: { order_id: order.id, line_items: lineItems, placed_by_admin: auth.user.email },
    });
    const paymentUrl = paystackRes.data.authorization_url;
    await supabaseAdmin.from('orders').update({ payment_url: paymentUrl }).eq('id', order.id);
    return res.status(200).json({ ...summary, payment: 'link', paymentUrl });
  } catch (e) {
    console.error('Paystack initialize failed (admin order):', e.message);
    await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
    return res.status(502).json({ error: "Paystack couldn't create the payment link just now. Nothing was charged. Try again in a minute." });
  }
}
