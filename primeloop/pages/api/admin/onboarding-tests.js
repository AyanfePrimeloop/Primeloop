import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> list all onboarding tests
// PUT  -> body: { id, post_link, required_actions, active }
// Admin-only — engagers read a single platform's test via /api/onboarding/test.js instead.
export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('onboarding_tests').select('*').order('platform');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tests: data });
  }

  if (req.method === 'PUT') {
    const { id, post_link, required_actions, active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('onboarding_tests')
      .update({ post_link, required_actions, active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ test: data });
  }

  return res.status(405).end();
}
