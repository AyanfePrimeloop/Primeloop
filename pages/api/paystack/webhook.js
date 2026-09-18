import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifyTransaction } from '../../../lib/paystack';
import { checkPostLink } from '../../../lib/checkPostLink';
import { notifyEngagersOfTask } from '../../../lib/notifyEngagersOfTask';
import { generateTaskCode } from '../../../lib/taskCode';

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

function safeEqual(a, b) {
  const bufA = Buffer.from(a || '');
  const bufB = Buffer.from(b || '');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
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
  if (!safeEqual(signature, expected)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (event.event === 'charge.success') {
    await handleChargeSuccess(event);
  } else if (['transfer.success', 'transfer.failed', 'transfer.reversed'].includes(event.event)) {
    await handleTransferEvent(event);
  }

  return res.status(200).json({ received: true });
}

async function handleChargeSuccess(event) {
  const reference = event.data.reference;

  // 2. Double-check with Paystack directly — don't trust the webhook body alone
  const verified = await verifyTransaction(reference);
  if (verified.data.status !== 'success') return;

  // 3. Mark the order paid
  const { data: order } = await supabaseAdmin
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('paystack_reference', reference)
    .select()
    .single();
  if (!order) return;

  // 4. Check the post link once, before creating any tasks from this order —
  //    a bad link should never reach engagers, and there's no reason to
  //    check it once per action when it's the same link for every task.
  const linkCheck = await checkPostLink(order.post_link, order.platform);

  // 5. Create the tasks now that money has actually landed. Good links
  //    open immediately; bad ones go straight to the admin link-review
  //    queue instead of ever reaching an engager.
  const lineItems = event.data.metadata?.line_items || [];
  for (const item of lineItems) {
    // Paystack re-sends a webhook whenever it doesn't get a fast 200 (and
    // this handler does slow work: a link check plus WhatsApp alerts). A
    // retry must never create a second copy of the same task — that would
    // deliver, and pay engagers for, double what the client bought.
    const { data: existing } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('order_id', order.id)
      .eq('action', item.action)
      .limit(1);
    if (existing?.length) continue;

    // task_code is unique; on the (rare) chance of a collision, try a new
    // code rather than silently losing a task the client has already paid for.
    let task = null;
    for (let attempt = 0; attempt < 5 && !task; attempt++) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          task_code: generateTaskCode(order.platform),
          order_id: order.id,
          client_id: order.client_id,
          platform: order.platform,
          post_link: order.post_link,
          action: item.action,
          quantity_needed: item.quantity,
          price_per_unit: item.engager_payout,
          target_account_handle: item.targetAccountHandle || null,
          special_instructions: order.special_instructions,
          // Gold/Platinum get a 15-minute head start before the task opens to everyone
          tier_gate_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: linkCheck.ok ? 'open' : 'pending_review',
          link_check_reason: linkCheck.ok ? null : linkCheck.reason,
        })
        .select()
        .single();
      if (data) {
        task = data;
      } else if (error?.code !== '23505') {
        console.error(`Could not create ${item.action} task for order ${order.id}:`, error?.message);
        break;
      }
    }

    // 6. Alert eligible engagers now — failures here never block the
    //    payment/order flow, since the task is already live either way.
    if (task && linkCheck.ok) {
      try {
        await notifyEngagersOfTask(supabaseAdmin, task);
      } catch (e) {
        console.error('WhatsApp notify failed:', e.message);
      }
    }
  }
}

// Paystack tells us, after the fact, whether a payout transfer really
// arrived. A transfer that failed or was reversed means the engager did NOT
// get paid — release everything that payout covered so the next payout run
// picks it up again, instead of it silently never being paid.
async function handleTransferEvent(event) {
  const code = event.data?.transfer_code;
  if (!code) return;

  const { data: payout } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('paystack_transfer_code', code)
    .maybeSingle();
  if (!payout) return;

  if (event.event === 'transfer.success') {
    if (payout.status !== 'paid') {
      await supabaseAdmin
        .from('payouts')
        .update({ status: 'paid', paid_at: payout.paid_at || new Date().toISOString() })
        .eq('id', payout.id);
    }
    return;
  }

  await supabaseAdmin.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
  await supabaseAdmin.from('submissions').update({ payout_id: null }).eq('payout_id', payout.id);
  await supabaseAdmin
    .from('referral_bonuses')
    .update({ payout_id: null, status: 'earned_unpaid', paid_at: null })
    .eq('payout_id', payout.id);
}
