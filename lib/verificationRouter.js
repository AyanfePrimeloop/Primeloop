import { supabaseAdmin } from './supabaseAdmin';
import { verifyScreenshot } from './aiVerify';
import { getEngagerTrust } from './engagerTrust';

// Actions that pay the engager the most (and are the easiest to fake for a
// gain), so they are always AI-checked in trust_based mode.
const HIGH_VALUE_ACTIONS = new Set(['follow', 'subscribe']);

/**
 * Looks up the admin's verification_settings for this platform+action and
 * decides how to handle a submission:
 *  - 'manual'      -> never calls AI, always goes to the human review queue
 *  - 'ai_always'   -> always calls AI
 *  - 'ai_sampled'  -> calls AI only for a random sample_rate fraction of
 *                     submissions; the rest go to the manual review queue
 *  - 'trust_based' -> new or flagged engagers: AI checks every submission.
 *                     Trusted engagers (see lib/engagerTrust.js): most are
 *                     approved automatically and a random sample_rate fraction
 *                     is AI-checked as a spot check. Follows and subscribes are
 *                     always AI-checked. The AI never rejects on its own here:
 *                     anything it does not approve goes to a human, so an
 *                     honest engager is never turned down by a model's mistake.
 *
 * Returns { verdict, reason, checkedByAI, reviewedBy }
 */
export async function resolveVerdict({
  platform,
  action,
  imageBase64,
  imageMediaType,
  expectedAccountName,
  postLink,
  engagerId,
  db = supabaseAdmin,
}) {
  const { data: setting } = await db
    .from('verification_settings')
    .select('*')
    .eq('platform', platform)
    .eq('action', action)
    .maybeSingle();

  const mode = setting?.mode || 'manual'; // default to manual if no row exists yet
  const sampleRate = setting?.sample_rate ?? 0.3;

  let shouldRunAI;
  let humanOnAiDoubt = false; // trust_based: AI never rejects by itself
  if (mode === 'trust_based') {
    humanOnAiDoubt = true;
    const trust = engagerId ? await getEngagerTrust(db, engagerId) : { trusted: false };
    if (!trust.trusted || HIGH_VALUE_ACTIONS.has(action)) {
      shouldRunAI = true;
    } else if (Math.random() < sampleRate) {
      shouldRunAI = true; // spot check on a trusted engager
    } else {
      return {
        verdict: 'approved',
        reason: 'Approved automatically (trusted engager).',
        checkedByAI: false,
        reviewedBy: 'auto-trusted',
      };
    }
  } else {
    shouldRunAI = mode === 'ai_always' || (mode === 'ai_sampled' && Math.random() < sampleRate);
  }

  if (!shouldRunAI) {
    return { verdict: 'needs_review', reason: 'Routed to manual review (AI check off for this action).', checkedByAI: false };
  }

  // An AI outage, rate limit, or bad key must never cost an engager their
  // submission (this used to bubble up as a 500 and the upload was lost).
  // Fall back to the human review queue instead.
  try {
    const aiResult = await verifyScreenshot({
      imageBase64,
      imageMediaType,
      action,
      expectedAccountName,
      postLink,
    });
    if (humanOnAiDoubt && aiResult.verdict !== 'approved') {
      return {
        verdict: 'needs_review',
        reason: `Sent for a human check: ${aiResult.reason}`,
        checkedByAI: true,
        reviewedBy: 'ai',
      };
    }
    return { ...aiResult, checkedByAI: true, reviewedBy: 'ai' };
  } catch (e) {
    console.error('AI verification failed, routing to manual review:', e.message);
    return { verdict: 'needs_review', reason: 'AI check was unavailable — routed to manual review.', checkedByAI: false };
  }
}
