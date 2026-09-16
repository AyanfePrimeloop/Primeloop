import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> list all pricing rules (optionally ?platform=facebook) — public,
//         since the client order builder needs to show prices to anyone.
// PUT  -> body: { id, client_price, engager_payout } — admin only.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    let query = supabaseAdmin.from('pricing_rules').select('*').order('platform');
    if (req.query.platform) query = query.eq('platform', req.query.platform);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ rules: data });
  }

  if (req.method === 'PUT') {
    const auth = await requireAdmin(req);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { id, client_price, engager_payout } = req.body;
    const { data, error } = await supabaseAdmin
      .from('pricing_rules')
      .update({ client_price, engager_payout, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ rule: data });
  }

  return res.status(405).end();
}
