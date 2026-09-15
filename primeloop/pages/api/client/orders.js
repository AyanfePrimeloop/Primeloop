import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireClient } from '../../../lib/requireClient';

export default async function handler(req, res) {
  const auth = await requireClient(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('client_id', auth.client.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const orderIds = (orders || []).map((o) => o.id);
  let tasksByOrder = {};
  if (orderIds.length) {
    const { data: tasks } = await supabaseAdmin.from('tasks').select('*').in('order_id', orderIds);
    for (const t of tasks || []) {
      (tasksByOrder[t.order_id] ||= []).push(t);
    }
  }

  return res.status(200).json({ orders: orders || [], tasksByOrder });
}
