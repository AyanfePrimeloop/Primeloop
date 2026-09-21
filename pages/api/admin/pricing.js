import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

// GET  -> list pricing rules (optionally ?platform=facebook). The client order
//         builder calls this without logging in, so anonymous callers only get
//         what a client needs (the price they pay, active rules only) — never
//         the engager payout, which is the business's margin. Admins get
//         everything, since this is also how the pricing page loads.
// PUT  -> body: { id, client_price, engager_payout } — super-admin only. Regular admins
//         get the same limited view as anonymous callers.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = await requireSuperAdmin(req);
    const isAdmin = !auth.error;

    let query = supabaseAdmin.from('pricing_rules').select('*').order('platform');
    if (req.query.platform) query = query.eq('platform', req.query.platform);
    if (!isAdmin) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const rules = isAdmin
      ? data
      : data.map(({ id, platform, action, client_price }) => ({ id, platform, action, client_price }));
    return res.status(200).json({ rules });
  }

  if (req.method === 'PUT') {
    const auth = await requireSuperAdmin(req);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { id, client_price, engager_payout } = req.body;
    if (!id || !(Number(client_price) >= 0) || !(Number(engager_payout) >= 0)) {
      return res.status(400).json({ error: 'Prices must be numbers of 0 or more.' });
    }
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
