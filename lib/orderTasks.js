import { checkPostLink } from './checkPostLink';
import { notifyEngagersOfTask } from './notifyEngagersOfTask';
import { generateTaskCode } from './taskCode';

/**
 * Creates the tasks for a paid order and tells engagers about the good ones.
 * Used by the Paystack webhook (payment confirmed) and by an admin recording
 * a payment received another way, so both paths make tasks identically.
 *
 * Safe to run more than once for the same order: a task that already exists
 * for an action is never created a second time (Paystack re-sends webhooks,
 * and a duplicate would deliver and pay engagers for double what was bought).
 *
 * The post link is checked once, before any task exists: a bad link goes to
 * the admin link-review queue instead of ever reaching an engager.
 *
 * `deps` exists so tests can run this without the network.
 */
export async function createTasksForOrder(db, order, lineItems, deps = {}) {
  const check = deps.checkPostLink || checkPostLink;
  const notify = deps.notifyEngagersOfTask || notifyEngagersOfTask;
  const makeCode = deps.generateTaskCode || generateTaskCode;

  const linkCheck = await check(order.post_link, order.platform);
  const created = [];

  for (const item of lineItems || []) {
    const { data: existing } = await db
      .from('tasks')
      .select('id')
      .eq('order_id', order.id)
      .eq('action', item.action)
      .limit(1);
    if (existing?.length) continue;

    // task_code is unique; on the (rare) chance of a collision, try a new
    // code rather than silently losing a task the client has already paid for.
    let task = null;
    for (let attempt = 0; attempt < 5 && !task; attempt++) {
      const { data, error } = await db
        .from('tasks')
        .insert({
          task_code: makeCode(order.platform),
          order_id: order.id,
          client_id: order.client_id,
          platform: order.platform,
          post_link: order.post_link,
          action: item.action,
          quantity_needed: item.quantity,
          price_per_unit: item.engager_payout,
          target_account_handle: item.targetAccountHandle || null,
          special_instructions: order.special_instructions,
          // Gold/Platinum get a 15-minute head start before the task opens to everyone
          tier_gate_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: linkCheck.ok ? 'open' : 'pending_review',
          link_check_reason: linkCheck.ok ? null : linkCheck.reason,
        })
        .select()
        .single();
      if (data) {
        task = data;
      } else if (error?.code !== '23505') {
        console.error(`Could not create ${item.action} task for order ${order.id}:`, error?.message);
        break;
      }
    }

    // Alert eligible engagers now — failures here never block the
    // payment/order flow, since the task is already live either way.
    if (task && linkCheck.ok) {
      try {
        await notify(db, task);
      } catch (e) {
        console.error('WhatsApp notify failed:', e.message);
      }
    }
    if (task) created.push(task);
  }

  return { created, linkOk: !!linkCheck.ok };
}
