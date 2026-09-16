import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';

// Separate from the referral_bonuses RLS policy on purpose: "people referred"
// now includes everyone who signed up with this engager's link, not just the
// ones who've earned a bonus (see lib/regularSubmissionEffects.js) — RLS on
// engagers only lets a row see itself, so this needs the service role,
// scoped here to exactly the referrer's own id.
export default async function handler(req, res) {
  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const [{ count }, { data: bonuses }] = await Promise.all([
    supabaseAdmin
      .from('engagers')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', auth.engager.id),
    supabaseAdmin
      .from('referral_bonuses')
      .select('bonus_amount, status')
      .eq('referrer_id', auth.engager.id),
  ]);

  const earned = (bonuses || [])
    .filter((b) => ['earned_unpaid', 'paid'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.bonus_amount), 0);

  return res.status(200).json({ count: count || 0, earned });
}
