import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifyTransaction } from '../../../lib/paystack';
import { checkPostLink } from '../../../lib/checkPostLink';

// Paystack sends raw body — we need it unparsed to verify the signature.
export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);

  // 1. Verify this really came from Paystack (never trust the payload otherwise)
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const reference = event.data.reference;

    // 2. Double-check with Paystack directly — don't trust the webhook body alone
    const verified = await verifyTransaction(reference);
    if (verified.data.status !== 'success') {
      return res.status(200).json({ received: true, note: 'Payment not confirmed on re-check' });
    }

    // 3. Mark the order paid
    const { data: order } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('paystack_reference', reference)
      .select()
      .single();

    if (!order) return res.status(200).json({ received: true, note: 'Order not found' });

    // 4. Check the post link once, before creating any tasks from this order —
    //    a bad link should never reach engagers, and there's no reason to
    //    check it once per action when it's the same link for every task.
    const linkCheck = await checkPostLink(order.post_link, order.platform);

    // 5. Create the tasks now that money has actually landed. Good links
    //    open immediately; bad ones go straight to the admin link-review
    //    queue instead of ever reaching an engager.
    const lineItems = event.data.metadata?.line_items || [];
    for (const item of lineItems) {
      const taskCode = generateTaskCode(order.platform);
      await supabaseAdmin.from('tasks').insert({
        task_code: taskCode,
        order_id: order.id,
        client_id: order.client_id,
        platform: order.platform,
        post_link: order.post_link,
        action: item.action,
        quantity_needed: item.quantity,
        price_per_unit: item.price_per_unit,
        target_account_handle: item.targetAccountHandle || null,
        // Gold/Platinum get a 15-minute head start before the task opens to everyone
        tier_gate_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: linkCheck.ok ? 'open' : 'pending_review',
        link_check_reason: linkCheck.ok ? null : linkCheck.reason,
      });
    }

    // 6. (Phase 2) Trigger WhatsApp Cloud API alert to relevant engagers here
    //    — only for tasks that actually opened, obviously.
  }

  return res.status(200).json({ received: true });
}

function generateTaskCode(platform) {
  const prefix = { facebook: 'FB', instagram: 'IG', tiktok: 'TT', youtube: 'YT', x: 'XT' }[platform] || 'PL';
  const num = Math.floor(1000 + Math.random() * 8999);
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}
