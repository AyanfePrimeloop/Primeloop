import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  // Total revenue: every order the client actually paid for.
  const { data: paidOrders } = await supabaseAdmin
    .from('orders')
    .select('amount_total, created_at')
    .eq('payment_status', 'paid');
  const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + Number(o.amount_total), 0);

  // Total paid out to engagers so far (regular payouts).
  const { data: paidPayouts } = await supabaseAdmin.from('payouts').select('amount').eq('status', 'paid');
  const totalPaidOut = (paidPayouts || []).reduce((sum, p) => sum + Number(p.amount), 0);

  // Approved-but-not-yet-paid work — what you owe engagers right now.
  const { data: approvedSubs } = await supabaseAdmin
    .from('submissions')
    .select('tasks(price_per_unit)')
    .eq('final_status', 'approved');
  // NOTE: this is a simple approximation (total approved minus total paid) —
  // for a fully precise "owed right now" figure you'd track per-submission
  // payout status directly. Good enough for a health-at-a-glance view.
  const totalApprovedValue = (approvedSubs || []).reduce((sum, s) => sum + Number(s.tasks?.price_per_unit || 0), 0);
  const pendingPayout = Math.max(0, totalApprovedValue - totalPaidOut);

  // Referral bonuses — earned and paid, tracked separately since they're not
  // tied to a specific task's margin.
  const { data: bonuses } = await supabaseAdmin.from('referral_bonuses').select('bonus_amount, status');
  const bonusesPaid = (bonuses || []).filter((b) => b.status === 'paid').reduce((sum, b) => sum + Number(b.bonus_amount), 0);
  const bonusesOwed = (bonuses || []).filter((b) => b.status === 'earned_unpaid').reduce((sum, b) => sum + Number(b.bonus_amount), 0);

  // Revenue over the last 30 days, for a simple trend line.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRevenue = (paidOrders || [])
    .filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + Number(o.amount_total), 0);

  return res.status(200).json({
    totalRevenue,
    totalPaidOut,
    pendingPayout,
    bonusesPaid,
    bonusesOwed,
    grossMargin: totalRevenue - totalPaidOut - bonusesPaid,
    recentRevenue30d: recentRevenue,
    totalOrders: (paidOrders || []).length,
  });
}
