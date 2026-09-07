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
  } else if (finalStatus === 'rejected') {
    await supabaseAdmin
      .from('engagers')
      .update({ tasks_completed: engager.tasks_completed + 1 })
      .eq('id', engager.id);
  }
}
