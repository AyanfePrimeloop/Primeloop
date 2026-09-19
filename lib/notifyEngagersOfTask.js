import { sendWhatsAppTemplate } from './whatsapp';
import { pushToEngagers, taskPushPayload } from './webPush';

// A safety cap on how many people get messaged for one task. WhatsApp's
// Cloud API rate-limits new/unverified business numbers heavily (as low as
// a couple hundred messages per day at first), and Vercel's serverless
// functions have their own execution time limit — sending to thousands of
// engagers synchronously here would risk both. Once you have a verified
// business number and real message volume, revisit this with Anthropic/me
// to move to a proper background queue instead of sending inline like this.
const MAX_RECIPIENTS_PER_TASK = 250;

/**
 * Alerts every engager eligible for this task right now, respecting the
 * Gold/Platinum early-access window and platform verification.
 *
 * Free web-push always goes out first. The paid WhatsApp template goes out
 * only when WHATSAPP_ALERTS_ENABLED is exactly "true" (Meta charges per
 * delivered message), so adding the WhatsApp token later can never start
 * spending money by accident. Failures for individual recipients don't stop
 * the others.
 */
export async function notifyEngagersOfTask(supabaseAdmin, task) {
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
  const list = engagers || [];

  const push = await pushToEngagers(supabaseAdmin, list.map((e) => e.id), taskPushPayload(task));

  let whatsapp = { sent: 0, skipped: 'paid WhatsApp alerts are off' };
  if (process.env.WHATSAPP_ALERTS_ENABLED === 'true' && process.env.WHATSAPP_ACCESS_TOKEN) {
    const results = await Promise.allSettled(
      list.map((e) =>
        sendWhatsAppTemplate({
          toNumber: e.whatsapp,
          templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'new_task_alert',
          params: [task.task_code, task.platform, task.action, String(task.quantity_needed), String(task.price_per_unit)],
        })
      )
    );
    whatsapp = {
      sent: results.filter((r) => r.status === 'fulfilled' && r.value.ok).length,
      attempted: list.length,
    };
  }

  return { sent: push.sent + whatsapp.sent, attempted: list.length, push, whatsapp };
}
