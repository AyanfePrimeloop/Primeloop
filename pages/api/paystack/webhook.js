import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifyTransaction } from '../../../lib/paystack';
import { createTasksForOrder } from '../../../lib/orderTasks';

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

  // 4. Create the tasks now that money has actually landed (shared with the
  //    admin "payment received" path, see lib/orderTasks.js). The link is
  //    checked once first: good links open immediately, bad ones go straight
  //    to the admin link-review queue instead of ever reaching an engager.
  await createTasksForOrder(supabaseAdmin, order, event.data.metadata?.line_items || []);
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
