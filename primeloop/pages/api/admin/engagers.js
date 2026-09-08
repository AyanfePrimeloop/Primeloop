import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> list all engagers (optionally ?status=active)
// PUT  -> body: { id, status } to change active/warned/dismissed, or { id, tier }
export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    let query = supabaseAdmin
      .from('engagers')
      .select('*, engager_platform_accounts(platform, verification_status)')
      .order('created_at', { ascending: false });
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ engagers: data });
  }

  if (req.method === 'PUT') {
    const { id, status, tier } = req.body;
    const update = {};
    if (status) update.status = status;
    if (tier) update.tier = tier;
    const { data, error } = await supabaseAdmin
      .from('engagers')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ engager: data });
  }

  return res.status(405).end();
}
