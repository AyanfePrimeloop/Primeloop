import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

// Interim backup measure until you're on a Supabase plan with real
// point-in-time recovery — exports the tables that would hurt most to lose:
// who your engagers are, what's been paid, and your order history.
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  const [{ data: engagers }, { data: clients }, { data: orders }, { data: payouts }] = await Promise.all([
    supabaseAdmin.from('engagers').select('code, full_name, whatsapp, tier, status, bank_name, bank_account_number, bank_account_name, tasks_completed, tasks_approved, created_at'),
    supabaseAdmin.from('clients').select('email, total_spent, status, created_at'),
    supabaseAdmin.from('orders').select('platform, post_link, amount_total, payment_status, created_at'),
    supabaseAdmin.from('payouts').select('engager_id, period_start, period_end, amount, status, paid_at'),
  ]);

  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    engagers: engagers || [],
    clients: clients || [],
    orders: orders || [],
    payouts: payouts || [],
  });
}
