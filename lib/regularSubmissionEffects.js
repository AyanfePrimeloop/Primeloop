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

    // Check whether this approval just pushed a REFERRED engager past the
    // referral milestone (10 approved tasks) — the bonus only unlocks once
    // real work is done, so a fake signup with zero approved tasks never
    // earns anything. referral_bonuses rows are created here, not at
    // signup, specifically so the referrer's Gold/Platinum requirement is
    // checked at the moment it matters (now) rather than back when they
    // shared the link.
    const MILESTONE_TASKS = 10;
    const newApprovedCount = engager.tasks_approved + 1;
    if (engager.referred_by && newApprovedCount >= MILESTONE_TASKS) {
      const { data: existingBonus } = await supabaseAdmin
        .from('referral_bonuses')
        .select('id')
        .eq('referred_id', engager.id)
        .maybeSingle();
      if (!existingBonus) {
        const { data: referrer } = await supabaseAdmin
          .from('engagers')
          .select('id, tier')
          .eq('id', engager.referred_by)
          .maybeSingle();
        if (referrer && ['gold', 'platinum'].includes(referrer.tier)) {
          await supabaseAdmin.from('referral_bonuses').insert({
            referrer_id: referrer.id,
            referred_id: engager.id,
            milestone_tasks: MILESTONE_TASKS,
            status: 'earned_unpaid',
            earned_at: new Date().toISOString(),
          });
        }
      }
    }
  } else if (finalStatus === 'rejected') {
    await supabaseAdmin
      .from('engagers')
      .update({ tasks_completed: engager.tasks_completed + 1 })
      .eq('id', engager.id);
  }
}
