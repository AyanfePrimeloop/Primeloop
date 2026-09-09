import { supabaseAdmin } from './supabaseAdmin';

/**
 * Applies the consequences of a final verdict on a regular (paid) task
 * submission. Called either immediately after an AI check, or later when
 * an admin manually approves/rejects a 'pending' item from the review queue.
 * Must only be called ONCE per submission — the caller is responsible for
 * making sure a submission isn't processed twice.
 */
export async function applyRegularVerdict({ task, engager, finalStatus }) {
  if (finalStatus === 'approved') {
    await supabaseAdmin
      .from('tasks')
      .update({
        quantity_filled: task.quantity_filled + 1,
        status: task.quantity_filled + 1 >= task.quantity_needed ? 'closed' : 'open',
      })
      .eq('id', task.id);

    await supabaseAdmin
      .from('engagers')
      .update({
        tasks_completed: engager.tasks_completed + 1,
        tasks_approved: engager.tasks_approved + 1,
      })
      .eq('id', engager.id);

    if (['follow', 'subscribe'].includes(task.action) && task.target_account_handle) {
      await supabaseAdmin.from('follow_ledger').insert({
        engager_id: engager.id,
        platform: task.platform,
        target_account_handle: task.target_account_handle,
      });
    }

    // Check whether this approval just pushed a REFERRED engager past their
    // referrer's milestone — the bonus only unlocks once real work is done,
    // so a fake signup with zero approved tasks never earns anything.
    const newApprovedCount = engager.tasks_approved + 1;
    const { data: pendingBonus } = await supabaseAdmin
      .from('referral_bonuses')
      .select('*')
      .eq('referred_id', engager.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (pendingBonus && newApprovedCount >= pendingBonus.milestone_tasks) {
      await supabaseAdmin
        .from('referral_bonuses')
        .update({ status: 'earned_unpaid', earned_at: new Date().toISOString() })
        .eq('id', pendingBonus.id);
    }
  } else if (finalStatus === 'rejected') {
    await supabaseAdmin
      .from('engagers')
      .update({ tasks_completed: engager.tasks_completed + 1 })
      .eq('id', engager.id);
  }
}
