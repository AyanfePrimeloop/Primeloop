import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

// POST { id } marks a paid order as handled so it leaves "Needs your attention".
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'POST') return res.status(405).end();

  const id = req.body?.id;
  if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Missing order id' });

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ attention_resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Could not save. Run migration 14 in Supabase first, then try again.' });
  }
  return res.status(200).json({ ok: true });
}
