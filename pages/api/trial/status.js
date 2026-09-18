import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { trialWeeklyCap, TRIAL_BUNDLE } from '../../../lib/trial';

// Public. Tells the "Try it free" page whether trials are open and how many
// of this week's spots are left — the limit is real, so the scarcity shown
// to visitors is honest. `available: false` also covers "not set up yet".
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error, status } = await supabaseAdmin
    .from('trial_grants')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  // A count request with no body can swallow the error when the table doesn't
  // exist, so "no error" isn't proof it worked — a real count is a number.
  if (error || status >= 400 || typeof count !== 'number') {
    return res.status(200).json({ available: false, reason: 'not_set_up', bundle: TRIAL_BUNDLE });
  }

  const remaining = Math.max(0, trialWeeklyCap() - (count || 0));
  return res.status(200).json({ available: remaining > 0, remaining, bundle: TRIAL_BUNDLE });
}
