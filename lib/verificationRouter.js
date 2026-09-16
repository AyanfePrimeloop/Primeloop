import { supabaseAdmin } from './supabaseAdmin';
import { verifyScreenshot } from './aiVerify';

/**
 * Looks up the admin's verification_settings for this platform+action and
 * decides how to handle a submission:
 *  - 'manual'     -> never calls AI, always goes to the human review queue
 *  - 'ai_always'  -> always calls AI
 *  - 'ai_sampled' -> calls AI only for a random sample_rate fraction of
 *                    submissions; the rest go to the manual review queue
 *
 * Returns { verdict, reason, checkedByAI }
 */
export async function resolveVerdict({
  platform,
  action,
  imageBase64,
  imageMediaType,
  expectedAccountName,
  postLink,
}) {
  const { data: setting } = await supabaseAdmin
    .from('verification_settings')
    .select('*')
    .eq('platform', platform)
    .eq('action', action)
    .maybeSingle();

  const mode = setting?.mode || 'manual'; // default to manual if no row exists yet
  const sampleRate = setting?.sample_rate ?? 0.3;

  const shouldRunAI =
    mode === 'ai_always' || (mode === 'ai_sampled' && Math.random() < sampleRate);

  if (!shouldRunAI) {
    return { verdict: 'needs_review', reason: 'Routed to manual review (AI check off for this action).', checkedByAI: false };
  }

  const aiResult = await verifyScreenshot({
    imageBase64,
    imageMediaType,
    action,
    expectedAccountName,
    postLink,
  });
  return { ...aiResult, checkedByAI: true };
}
