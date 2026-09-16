import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> list settings (optionally ?platform=facebook)
// PUT  -> body: { id, mode, sample_rate }
// Admin-only — no public use case for this data.
export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    let query = supabaseAdmin.from('verification_settings').select('*').order('platform');
    if (req.query.platform) query = query.eq('platform', req.query.platform);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ settings: data });
  }

  if (req.method === 'PUT') {
    const { id, mode, sample_rate } = req.body;
    const { data, error } = await supabaseAdmin
      .from('verification_settings')
      .update({ mode, sample_rate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ setting: data });
  }

  return res.status(405).end();
}
