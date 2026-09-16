import { sendWhatsAppTemplate } from './whatsapp';

// A safety cap on how many people get messaged for one task. WhatsApp's
// Cloud API rate-limits new/unverified business numbers heavily (as low as
// a couple hundred messages per day at first), and Vercel's serverless
// functions have their own execution time limit — sending to thousands of
// engagers synchronously here would risk both. Once you have a verified
// business number and real message volume, revisit this with Anthropic/me
// to move to a proper background queue instead of sending inline like this.
const MAX_RECIPIENTS_PER_TASK = 250;

/**
 * Sends a WhatsApp alert to every engager eligible for this task right now,
 * respecting the Gold/Platinum early-access window and platform verification.
 * Failures for individual numbers don't stop the others from sending.
 */
export async function notifyEngagersOfTask(supabaseAdmin, task) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    return { sent: 0, skipped: 'WhatsApp not configured' };
  }

  const isGated = task.tier_gate_until && new Date(task.tier_gate_until) > new Date();

  let query = supabaseAdmin
    .from('engagers')
    .select('id, code, whatsapp, tier, engager_platform_accounts!inner(platform, verification_status)')
    .eq('status', 'active')
    .eq('engager_platform_accounts.platform', task.platform)
    .eq('engager_platform_accounts.verification_status', 'verified')
    .limit(MAX_RECIPIENTS_PER_TASK);

  if (isGated) {
    query = query.in('tier', ['gold', 'platinum']);
  }

  const { data: engagers, error } = await query;
  if (error) return { sent: 0, error: error.message };

  const results = await Promise.allSettled(
    (engagers || []).map((e) =>
      sendWhatsAppTemplate({
        toNumber: e.whatsapp,
        templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'new_task_alert',
        params: [task.task_code, task.platform, task.action, String(task.quantity_needed), String(task.price_per_unit)],
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
  return { sent, attempted: (engagers || []).length };
}
