import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

// GET  -> list settings (optionally ?platform=facebook)
// PUT  -> body: { id, mode, sample_rate }
// Super-admin only — no public use case for this data.
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    let query = supabaseAdmin.from('verification_settings').select('*').order('platform');
    if (req.query.platform) query = query.eq('platform', req.query.platform);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ settings: data });
  }

  if (req.method === 'PUT') {
    const { id, mode, sample_rate, all } = req.body;
    const MODES = ['manual', 'ai_always', 'ai_sampled', 'trust_based'];
    if (!MODES.includes(mode)) return res.status(400).json({ error: 'Unknown mode' });
    const rate = Number(sample_rate);
    if (!(rate >= 0 && rate <= 1)) return res.status(400).json({ error: 'Rate must be between 0% and 100%' });
    if (all === true) {
      const { error: allErr } = await supabaseAdmin
        .from('verification_settings')
        .update({ mode, sample_rate: rate, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (allErr) return res.status(500).json({ error: allErr.message });
      return res.status(200).json({ ok: true });
    }
    const { data, error } = await supabaseAdmin
      .from('verification_settings')
      .update({ mode, sample_rate: rate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ setting: data });
  }

  return res.status(405).end();
}
