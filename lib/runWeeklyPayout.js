const PAYSTACK_BASE = 'https://api.paystack.co';
const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request
const CHUNK = 100; // ids per .in() filter, to keep request URLs short

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

function chunks(list, size = CHUNK) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const money = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Marks these rows as belonging to `payoutId` — but only the ones nobody else
 * has already claimed. Returns the ids that were actually claimed. Claiming
 * BEFORE the transfer is what makes a payout run safe to repeat: if a run
 * crashes mid-way, the affected rows stay attached to a visible 'pending'
 * payout instead of being paid a second time.
 */
async function claim(supabaseAdmin, table, ids, payoutId) {
  const claimed = [];
  for (const part of chunks(ids)) {
    const { data } = await supabaseAdmin
      .from(table)
      .update({ payout_id: payoutId })
      .in('id', part)
      .is('payout_id', null)
      .select('id');
    for (const row of data || []) claimed.push(row.id);
  }
  return claimed;
}

async function release(supabaseAdmin, table, ids) {
  for (const part of chunks(ids)) {
    await supabaseAdmin.from(table).update({ payout_id: null }).in('id', part);
  }
}

/**
 * Pays every engager for approved work that hasn't been paid yet.
 * Called either by scripts/run-weekly-payout.js (manual, from your computer)
 * or by pages/api/cron/weekly-payout.js (automatic, every Friday via Vercel Cron).
 *
 * "Not paid yet" is tracked per submission (submissions.payout_id), NOT by a
 * date window. So:
 *   - running this twice in a row (or the manual script on top of the Friday
 *     cron) pays nothing the second time,
 *   - an engager with no bank details yet, or a transfer that failed, is
 *     simply picked up again on the next run — nothing is ever dropped.
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
  const results = [];

  // 1. Every approved submission not yet covered by a payout, oldest first.
  //    tasks.price_per_unit is the engager's payout rate. Paged, because a
  //    single query silently stops at 1000 rows.
  const groups = {};
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('id, engager_id, reviewed_at, tasks(price_per_unit)')
      .eq('final_status', 'approved')
      .is('payout_id', null)
      .lte('reviewed_at', periodEnd.toISOString())
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    for (const s of data || []) {
      const g = (groups[s.engager_id] ||= { subs: [], bonuses: [] });
      g.subs.push({ id: s.id, amount: Number(s.tasks?.price_per_unit || 0), at: s.reviewed_at });
    }
    if (!data || data.length < PAGE_SIZE) break;
  }

  // 1b. Fold in earned-but-unpaid referral bonuses — paid alongside the
  //     referrer's normal earnings, in the same transfer.
  const { data: earnedBonuses } = await supabaseAdmin
    .from('referral_bonuses')
    .select('*')
    .eq('status', 'earned_unpaid')
    .is('payout_id', null);
  for (const b of earnedBonuses || []) {
    const g = (groups[b.referrer_id] ||= { subs: [], bonuses: [] });
    g.bonuses.push({ id: b.id, amount: Number(b.bonus_amount) });
  }

  // 2. One engager at a time.
  for (const [engagerId, group] of Object.entries(groups)) {
    const expected = money(group.subs.reduce((t, s) => t + s.amount, 0) + group.bonuses.reduce((t, b) => t + b.amount, 0));

    const { data: engager } = await supabaseAdmin.from('engagers').select('*').eq('id', engagerId).single();

    // Dismissed engagers are not paid. Leave their work unclaimed (nothing is
    // deleted) so it stays visible if an admin ever reinstates them.
    if (engager?.status === 'dismissed') {
      results.push({ engagerCode: engager.code, amount: expected, status: 'skipped_dismissed' });
      continue;
    }

    // No bank details yet: leave everything unclaimed. It stays owed and is
    // paid automatically on the first run after they add their account.
    if (!engager?.paystack_recipient_code) {
      results.push({ engagerCode: engager?.code || engagerId, amount: expected, status: 'skipped_no_recipient' });
      continue;
    }

    const earliest = group.subs.map((s) => s.at).filter(Boolean).sort()[0] || periodEnd.toISOString();
    const { data: payoutRow } = await supabaseAdmin
      .from('payouts')
      .insert({
        engager_id: engagerId,
        period_start: earliest.slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        amount: expected,
        status: 'pending',
      })
      .select()
      .single();
    if (!payoutRow) {
      results.push({ engagerCode: engager.code, amount: expected, status: 'failed: could not record payout' });
      continue;
    }

    // Claim first, pay second (see claim()).
    const claimedSubIds = new Set(await claim(supabaseAdmin, 'submissions', group.subs.map((s) => s.id), payoutRow.id));
    const claimedBonusIds = new Set(await claim(supabaseAdmin, 'referral_bonuses', group.bonuses.map((b) => b.id), payoutRow.id));
    const amount = money(
      group.subs.filter((s) => claimedSubIds.has(s.id)).reduce((t, s) => t + s.amount, 0) +
        group.bonuses.filter((b) => claimedBonusIds.has(b.id)).reduce((t, b) => t + b.amount, 0)
    );

    // Everything was claimed by someone else in the meantime, or nothing
    // payable: drop the empty payout record and move on.
    if (!(amount > 0)) {
      await release(supabaseAdmin, 'submissions', [...claimedSubIds]);
      await release(supabaseAdmin, 'referral_bonuses', [...claimedBonusIds]);
      await supabaseAdmin.from('payouts').delete().eq('id', payoutRow.id);
      continue;
    }
    if (amount !== expected) {
      await supabaseAdmin.from('payouts').update({ amount }).eq('id', payoutRow.id);
    }

    let transfer;
    let networkError = null;
    try {
      transfer = await paystackFetch(paystackSecretKey, '/transfer', {
        method: 'POST',
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(amount * 100),
          recipient: engager.paystack_recipient_code,
          reason: `Primeloop payout ${payoutRow.period_start} to ${payoutRow.period_end}`,
          // Paystack treats a repeated reference as the SAME transfer, so a
          // retry after a network hiccup can never pay twice.
          reference: payoutRow.id,
        }),
      });
    } catch (e) {
      networkError = e;
    }

    // We can't tell whether Paystack received it. Leave the payout 'pending'
    // and everything claimed — better to under-pay visibly than pay twice.
    // Check the transfer in the Paystack dashboard, then fix the row by hand.
    if (networkError) {
      results.push({ engagerCode: engager.code, amount, status: `unknown_check_paystack (${networkError.message})` });
      continue;
    }

    // Transfers need a one-time code to confirm when "Confirm transfers before
    // sending" is on in Paystack settings. The API accepts the request but the
    // money does NOT move. Keep it pending and claimed; the fix is turning
    // that setting off (see GETTING_STARTED.md), not paying again.
    if (transfer.status && transfer.data?.status === 'otp') {
      await supabaseAdmin
        .from('payouts')
        .update({ paystack_transfer_code: transfer.data?.transfer_code || null })
        .eq('id', payoutRow.id);
      results.push({ engagerCode: engager.code, amount, status: 'otp_required (turn off transfer OTP in Paystack settings)' });
      continue;
    }

    if (transfer.status) {
      await supabaseAdmin
        .from('payouts')
        .update({
          status: 'paid',
          paystack_transfer_code: transfer.data?.transfer_code || null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', payoutRow.id);
      // Referral bonuses are only marked paid now that the transfer went out.
      for (const part of chunks([...claimedBonusIds])) {
        await supabaseAdmin
          .from('referral_bonuses')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .in('id', part);
      }
      results.push({ engagerCode: engager.code, amount, status: 'paid' });
      continue;
    }

    // Paystack clearly refused (e.g. balance too low). Nothing was sent, so
    // release everything — the next run pays it.
    await supabaseAdmin.from('payouts').update({ status: 'failed' }).eq('id', payoutRow.id);
    await release(supabaseAdmin, 'submissions', [...claimedSubIds]);
    await release(supabaseAdmin, 'referral_bonuses', [...claimedBonusIds]);
    results.push({ engagerCode: engager.code, amount, status: 'failed: ' + transfer.message });
  }

  return results;
}

module.exports = { runWeeklyPayout };
