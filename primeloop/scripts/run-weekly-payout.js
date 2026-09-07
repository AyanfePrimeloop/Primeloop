// Run this every Friday — either manually (`npm run payout-run`) or via a
// Vercel Cron Job pointed at an API route wrapping this same logic.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

async function run() {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  // 1. Sum approved-and-unpaid submissions per engager for the period
  const { data: submissions, error } = await supabaseAdmin
    .from('submissions')
    .select('engager_id, task_id, final_status, reviewed_at, tasks(price_per_unit, action)')
    .eq('final_status', 'approved')
    .gte('reviewed_at', periodStart.toISOString())
    .lte('reviewed_at', periodEnd.toISOString());

  if (error) throw error;

  const totalsByEngager = {};
  for (const s of submissions) {
    const payout = s.tasks?.price_per_unit || 0; // NOTE: swap to engager_payout from pricing_rules in production
    totalsByEngager[s.engager_id] = (totalsByEngager[s.engager_id] || 0) + payout;
  }

  // 2. Only pay engagers whose platform account is verified (see engager_platform_accounts)
  //    and who have Paystack recipient details on file.
  for (const [engagerId, amount] of Object.entries(totalsByEngager)) {
    const { data: engager } = await supabaseAdmin
      .from('engagers')
      .select('*')
      .eq('id', engagerId)
      .single();

    if (!engager?.paystack_recipient_code) {
      console.log(`Skipping ${engager?.code} — no Paystack recipient on file yet`);
      continue;
    }

    const { data: payoutRow } = await supabaseAdmin
      .from('payouts')
      .insert({
        engager_id: engagerId,
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        amount,
        status: 'pending',
      })
      .select()
      .single();

    const transfer = await paystackFetch('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: engager.paystack_recipient_code,
        reason: `Primeloop weekly payout ${payoutRow.period_start} to ${payoutRow.period_end}`,
      }),
    });

    await supabaseAdmin
      .from('payouts')
      .update({
        status: transfer.status ? 'paid' : 'failed',
        paystack_transfer_code: transfer.data?.transfer_code || null,
        paid_at: transfer.status ? new Date().toISOString() : null,
      })
      .eq('id', payoutRow.id);

    console.log(`${engager.code}: ₦${amount} — ${transfer.status ? 'paid' : 'FAILED: ' + transfer.message}`);
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
