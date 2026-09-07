import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// GET /api/onboarding/test?platform=facebook
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { platform } = req.query;

  const { data: test, error } = await supabaseAdmin
    .from('onboarding_tests')
    .select('*')
    .eq('platform', platform)
    .eq('active', true)
    .single();

  if (error || !test) return res.status(404).json({ error: 'No active onboarding test for this platform yet' });
  return res.status(200).json({ test });
}
