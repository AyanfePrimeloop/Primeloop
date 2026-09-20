import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';
import { fetchAll } from '../../../lib/fetchAll';
import { trialWeeklyCap } from '../../../lib/trial';

const sum = (rows, pick) => (rows || []).reduce((t, r) => t + Number(pick(r) || 0), 0);

export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).end();

  // Total revenue: every order the client actually paid for. (Free-trial
  // orders have their own payment_status, so they never count as revenue.)
  // All of these are paged in full — a plain query silently stops at 1000 rows.
  const { data: paidOrders } = await fetchAll(() =>
    supabaseAdmin.from('orders').select('id, amount_total, created_at').eq('payment_status', 'paid').order('id')
  );
  const totalRevenue = sum(paidOrders, (o) => o.amount_total);

  // Total paid out to engagers so far (regular payouts).
  const { data: paidPayouts } = await fetchAll(() =>
    supabaseAdmin.from('payouts').select('id, amount').eq('status', 'paid').order('id')
  );
  const totalPaidOut = sum(paidPayouts, (p) => p.amount);

  // Approved work, with what each piece pays the engager and whether it
  // belongs to a free trial. `payout_id` (added in migration 11) says whether
  // it has been paid yet; if that migration hasn't been run, fall back to the
  // older approximation rather than failing.
  let approved = await fetchAll(() =>
    supabaseAdmin
      .from('submissions')
      .select('id, payout_id, engagers(status), tasks(price_per_unit, orders(payment_status))')
      .eq('final_status', 'approved')
      .order('id')
  );
  let exact = true;
  if (approved.error) {
    exact = false;
    approved = await fetchAll(() =>
      supabaseAdmin
        .from('submissions')
        .select('id, tasks(price_per_unit, orders(payment_status))')
        .eq('final_status', 'approved')
        .order('id')
    );
  }
  const approvedSubs = approved.data || [];
  const price = (s) => s.tasks?.price_per_unit;
  const totalApprovedValue = sum(approvedSubs, price);
  // What you owe engagers right now: exact once payouts are tracked per
  // submission; otherwise total approved minus total paid.
  const pendingPayout = exact
    ? sum(approvedSubs.filter((s) => !s.payout_id && s.engagers?.status !== 'dismissed'), price)
    : Math.max(0, totalApprovedValue - totalPaidOut);

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

  // Free trials: how many were granted, how many of this week's allowance is
  // used, and what the trial engagements have cost in engager payouts (that
  // cost is already inside "paid out" above — this just shows it separately).
  // null means the trial feature isn't set up yet (migration 11 not run).
  let trials = null;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: granted, error: trialErr, status: trialStatus }, { count: last7d }] = await Promise.all([
    supabaseAdmin.from('trial_grants').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('trial_grants').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ]);
  if (!trialErr && trialStatus < 400 && typeof granted === 'number') {
    trials = {
      granted: granted || 0,
      last7d: last7d || 0,
      weeklyCap: trialWeeklyCap(),
      cost: sum(approvedSubs.filter((s) => s.tasks?.orders?.payment_status === 'trial'), price),
    };
  }

  // Things that need a person: money taken but nothing delivered, and orders
  // past the 5-day refund promise. Refunds are made by hand in Paystack, so
  // this is the list to work through.
  const attention = { paidWithoutTasks: [], overdue: [] };
  {
    // attention_resolved_at comes from migration 14; before it is run, fall
    // back to the same query without it so this page never breaks.
    const orderQuery = (cols) => () =>
      supabaseAdmin.from('orders').select(cols).eq('payment_status', 'paid').order('id');
    let ordersRes = await fetchAll(orderQuery('id, amount_total, platform, paystack_reference, created_at, attention_resolved_at, clients(email)'));
    if (ordersRes.error) ordersRes = await fetchAll(orderQuery('id, amount_total, platform, paystack_reference, created_at, clients(email)'));
    const orders = (ordersRes.data || []).filter((o) => !o.attention_resolved_at);
    const { data: tasks } = await fetchAll(() =>
      supabaseAdmin.from('tasks').select('id, order_id, status, quantity_needed, quantity_filled').order('id')
    );
    const byOrder = new Map();
    for (const t of tasks || []) {
      const g = byOrder.get(t.order_id) || { needed: 0, filled: 0, count: 0 };
      // A closed task is settled (filled, or closed by an admin on purpose), so
      // it never counts as undelivered.
      if (t.status !== 'closed') {
        g.needed += t.quantity_needed || 0;
        g.filled += t.quantity_filled || 0;
      }
      g.count += 1;
      byOrder.set(t.order_id, g);
    }
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    for (const o of orders || []) {
      const g = byOrder.get(o.id);
      const row = { id: o.id, reference: o.paystack_reference, email: o.clients?.email || '', platform: o.platform, amount: Number(o.amount_total), paidAt: o.created_at };
      if (!g) {
        attention.paidWithoutTasks.push(row);
      } else if (g.needed > g.filled && new Date(o.created_at).getTime() < fiveDaysAgo) {
        attention.overdue.push({ ...row, unfilled: g.needed - g.filled, needed: g.needed });
      }
    }
  }

  return res.status(200).json({
    attention,
    totalRevenue,
    totalPaidOut,
    pendingPayout,
    bonusesPaid,
    bonusesOwed,
    grossMargin: totalRevenue - totalPaidOut - bonusesPaid,
    recentRevenue30d: recentRevenue,
    totalOrders: (paidOrders || []).length,
    trials,
  });
}
