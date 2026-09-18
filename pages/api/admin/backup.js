import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';
import { fetchAll } from '../../../lib/fetchAll';

// Interim backup measure until you're on a Supabase plan with real
// point-in-time recovery — exports the tables that would hurt most to lose:
// who your engagers are, what's been paid, and your order history.
// Every table is paged in full: the database API stops at 1000 rows per
// request without any warning, and a backup that quietly leaves rows out is
// worse than no backup because it looks complete.
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const [engagers, clients, orders, payouts] = await Promise.all([
    fetchAll(() => supabaseAdmin.from('engagers').select('id, code, full_name, whatsapp, tier, status, bank_name, bank_account_number, bank_account_name, tasks_completed, tasks_approved, created_at').order('id')),
    fetchAll(() => supabaseAdmin.from('clients').select('id, email, total_spent, status, created_at').order('id')),
    fetchAll(() => supabaseAdmin.from('orders').select('id, client_id, platform, post_link, amount_total, payment_status, created_at').order('id')),
    fetchAll(() => supabaseAdmin.from('payouts').select('id, engager_id, period_start, period_end, amount, status, paid_at').order('id')),
  ]);

  const failed = [engagers, clients, orders, payouts].find((r) => r.error);
  if (failed) return res.status(500).json({ error: `Backup failed: ${failed.error.message}` });

  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    engagers: engagers.data,
    clients: clients.data,
    orders: orders.data,
    payouts: payouts.data,
  });
}
