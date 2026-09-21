import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';
import { fetchAll } from '../../../lib/fetchAll';

// GET -> every client with how many paid orders they have placed, how much they
// have spent, and when they last ordered. Super-admin only (it holds customer
// emails and WhatsApp numbers).
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const [clients, orders] = await Promise.all([
    fetchAll(() => supabaseAdmin.from('clients').select('*').order('id')),
    fetchAll(() => supabaseAdmin.from('orders').select('client_id, amount_total, payment_status, created_at').order('id')),
  ]);
  if (clients.error || orders.error) return res.status(500).json({ error: (clients.error || orders.error).message });

  const byClient = {};
  for (const o of orders.data) {
    if (o.payment_status !== 'paid') continue;
    const s = (byClient[o.client_id] ||= { orders: 0, spent: 0, last: null });
    s.orders += 1;
    s.spent += Number(o.amount_total) || 0;
    if (!s.last || o.created_at > s.last) s.last = o.created_at;
  }

  return res.status(200).json({
    clients: clients.data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map((c) => ({
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      whatsapp: c.whatsapp,
      status: c.status,
      created_at: c.created_at,
      paid_orders: byClient[c.id]?.orders || 0,
      total_spent: byClient[c.id]?.spent || 0,
      last_order_at: byClient[c.id]?.last || null,
    })),
  });
}
