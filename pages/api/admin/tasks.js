import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> list tasks (optionally ?status=open&platform=facebook)
// PUT  -> body: { id, status } — e.g. manually close a task
export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    let query = supabaseAdmin.from('tasks').select('*').order('created_at', { ascending: false }).limit(200);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.platform) query = query.eq('platform', req.query.platform);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tasks: data });
  }

  if (req.method === 'PUT') {
    const { id, status } = req.body;
    const { data, error } = await supabaseAdmin.from('tasks').update({ status }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ task: data });
  }

  return res.status(405).end();
}
