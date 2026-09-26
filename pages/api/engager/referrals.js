import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';
import { REFERRAL_BONUS, REFERRAL_MILESTONE } from '../../../lib/referral';

// Separate from the referral_bonuses RLS policy on purpose: "people referred"
// includes everyone who signed up with this engager's link, not just the ones
// who've earned a bonus (see lib/regularSubmissionEffects.js) — RLS on
// engagers only lets a row see itself, so this needs the service role,
// scoped here to exactly the referrer's own id.
//
// Returns the two numbers the dashboard has always shown (count, earned) plus
// what the Refer & earn page needs: each referred person's first name and how
// far they are towards the milestone. Only first names are shared.
export default async function handler(req, res) {
  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const [{ data: referred }, { data: bonuses }] = await Promise.all([
    supabaseAdmin
      .from('engagers')
      .select('id, full_name, status, tasks_approved, created_at')
      .eq('referred_by', auth.engager.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('referral_bonuses')
      .select('referred_id, bonus_amount, status')
      .eq('referrer_id', auth.engager.id),
  ]);

  const list = referred || [];
  const paidStatuses = ['earned_unpaid', 'paid'];
  const earnedRows = (bonuses || []).filter((b) => paidStatuses.includes(b.status));
  const earned = earnedRows.reduce((sum, b) => sum + Number(b.bonus_amount), 0);
  const waiting = (bonuses || []).filter((b) => b.status === 'earned_unpaid').reduce((sum, b) => sum + Number(b.bonus_amount), 0);
  const reachedIds = new Set(earnedRows.map((b) => b.referred_id));

  const people = list.map((p) => ({
    name: String(p.full_name || '').trim().split(/\s+/)[0] || 'New engager',
    approved: Math.min(p.tasks_approved || 0, REFERRAL_MILESTONE),
    reached: reachedIds.has(p.id) || (p.tasks_approved || 0) >= REFERRAL_MILESTONE,
    dismissed: p.status === 'dismissed',
  }));

  return res.status(200).json({
    count: list.length,
    earned,
    waiting, // earned but not yet in a payout
    active: people.filter((p) => p.approved > 0).length,
    reached: people.filter((p) => p.reached).length,
    bonus: REFERRAL_BONUS,
    milestone: REFERRAL_MILESTONE,
    people,
  });
}
