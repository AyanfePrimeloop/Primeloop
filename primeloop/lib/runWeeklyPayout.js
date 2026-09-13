const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackFetch(secretKey, path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

/**
 * Pays every engager for their approved-and-unpaid work over the last 7 days.
 * Called either by scripts/run-weekly-payout.js (manual, from your computer)
 * or by pages/api/cron/weekly-payout.js (automatic, every Friday via Vercel Cron).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAdmin
 * @param {string} paystackSecretKey
 * @returns {Promise<{engagerCode: string, amount: number, status: string}[]>}
 */
async function runWeeklyPayout(supabaseAdmin, paystackSecretKey) {
  // Housekeeping: sweep out rate-limit buckets older than a day — they're
  // only ever relevant within their own short window, so nothing recent is
  // ever touched here, this just stops the table growing forever.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from('rate_limits').delete().lt('created_at', oneDayAgo);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const results = [];

  // 1. Sum approved submissions per engager for the period.
  //    tasks.price_per_unit is the engager's payout rate (fixed a bug where
  //    this used to accidentally be the client's price — see project history).
  const { data: submissions, error } = await supabaseAdmin
    .from('submissions')
    .select('engager_id, task_id, final_status, reviewed_at, tasks(price_per_unit, action)')
    .eq('final_status', 'approved')
    .gte('reviewed_at', periodStart.toISOString())
    .lte('reviewed_at', periodEnd.toISOString());

  if (error) throw error;

  const totalsByEngager = {};
  for (const s of submissions) {
    const payout = s.tasks?.price_per_unit || 0;
    totalsByEngager[s.engager_id] = (totalsByEngager[s.engager_id] || 0) + payout;
  }

  // 1b. Fold in any earned-but-unpaid referral bonuses — these get paid out
  //     alongside the referrer's normal weekly earnings, in the same transfer.
  const { data: earnedBonuses } = await supabaseAdmin
    .from('referral_bonuses')
    .select('*')
    .eq('status', 'earned_unpaid');

  const bonusIdsByReferrer = {};
  for (const b of earnedBonuses || []) {
    totalsByEngager[b.referrer_id] = (totalsByEngager[b.referrer_id] || 0) + Number(b.bonus_amount);
    (bonusIdsByReferrer[b.referrer_id] ||= []).push(b.id);
  }

  // 2. Only pay engagers who have Paystack recipient details on file.
  for (const [engagerId, amount] of Object.entries(totalsByEngager)) {
    const { data: engager } = await supabaseAdmin
      .from('engagers')
      .select('*')
      .eq('id', engagerId)
      .single();

    if (!engager?.paystack_recipient_code) {
      results.push({ engagerCode: engager?.code || engagerId, amount, status: 'skipped_no_recipient' });
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

    const transfer = await paystackFetch(paystackSecretKey, '/transfer', {
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

    // Mark any referral bonuses that were included in this transfer as paid,
    // so next week's run doesn't count them again.
    if (transfer.status && bonusIdsByReferrer[engagerId]) {
      await supabaseAdmin
        .from('referral_bonuses')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', bonusIdsByReferrer[engagerId]);
    }

    results.push({ engagerCode: engager.code, amount, status: transfer.status ? 'paid' : 'failed: ' + transfer.message });
  }

  return results;
}

module.exports = { runWeeklyPayout };
