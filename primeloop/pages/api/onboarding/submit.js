import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { resolveVerdict } from '../../../lib/verificationRouter';
import { recomputeOnboardingStatus } from '../../../lib/onboardingProgress';
import { uploadScreenshot, validateScreenshotUpload } from '../../../lib/storage';
import { requireEngager } from '../../../lib/requireEngager';

// Body: { platform, action, imageBase64, imageMediaType }
// Called once per required action (e.g. once for 'like', once for 'comment', etc.)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const engager = auth.engager;

  const { platform, action, imageBase64, imageMediaType } = req.body;
  if (!platform || !action || !imageBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const uploadCheck = validateScreenshotUpload({ base64: imageBase64, mediaType: imageMediaType });
  if (!uploadCheck.ok) {
    return res.status(400).json({ error: uploadCheck.reason });
  }

  const { data: test } = await supabaseAdmin
    .from('onboarding_tests')
    .select('*')
    .eq('platform', platform)
    .eq('active', true)
    .single();
  if (!test) return res.status(404).json({ error: 'No active onboarding test for this platform' });
  if (!test.required_actions.includes(action)) {
    return res.status(400).json({ error: `${action} is not part of the ${platform} onboarding test` });
  }

  // The engager must have registered their page BEFORE submitting any proof
  // — this is what makes the uniqueness check actually mean something,
  // instead of a blank placeholder row that anyone could fill in later.
  const { data: platformAccount } = await supabaseAdmin
    .from('engager_platform_accounts')
    .select('*')
    .eq('engager_id', engager.id)
    .eq('platform', platform)
    .maybeSingle();
  if (!platformAccount || !platformAccount.profile_link) {
    return res.status(400).json({ error: 'Register your page for this platform before submitting proof.', needsPageRegistration: true });
  }
  await supabaseAdmin
    .from('engager_platform_accounts')
    .update({ test_status: 'in_progress' })
    .eq('id', platformAccount.id);

  const screenshotHash = crypto.createHash('sha256').update(imageBase64).digest('hex');

  // Count how many times this engager has already attempted THIS specific
  // action on THIS platform. After 2 attempts, force manual review — a
  // human can't be brute-forced into a lucky approval the way repeated
  // AI calls theoretically could be, so this is the real anti-gaming gate,
  // not a cooldown timer.
  const { count: priorAttempts } = await supabaseAdmin
    .from('onboarding_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('engager_id', engager.id)
    .eq('platform', platform)
    .eq('action', action);

  const attemptNumber = (priorAttempts || 0) + 1;
  const forceManual = attemptNumber > 2;

  const result = forceManual
    ? { verdict: 'needs_review', reason: `Attempt ${attemptNumber} — routed to manual review after repeated attempts on this action.`, checkedByAI: false }
    : await resolveVerdict({
        platform,
        action,
        imageBase64,
        imageMediaType: imageMediaType || 'image/png',
        expectedAccountName: platformAccount.profile_name || engager.full_name,
        postLink: test.post_link,
      });

  const finalStatus = result.verdict === 'approved' ? 'approved' : result.verdict === 'rejected' ? 'rejected' : 'pending';

  const screenshotUrl = await uploadScreenshot({
    base64: imageBase64,
    mediaType: imageMediaType || 'image/png',
    pathPrefix: `onboarding/${engager.code}/${platform}`,
  });

  await supabaseAdmin.from('onboarding_submissions').insert({
    engager_id: engager.id,
    platform,
    action,
    screenshot_url: screenshotUrl,
    screenshot_hash: screenshotHash,
    ai_verdict: result.verdict,
    ai_reason: result.reason,
    final_status: finalStatus,
    reviewed_by: finalStatus === 'pending' ? null : 'ai',
    reviewed_at: finalStatus !== 'pending' ? new Date().toISOString() : null,
  });

  // Whether the engager is now fully verified on this platform is recomputed
  // from scratch here — same helper the admin review queue uses, so both
  // paths always agree.
  const progress = await recomputeOnboardingStatus(engager.id, platform);

  return res.status(200).json({
    verdict: finalStatus,
    reason: result.reason,
    attemptNumber,
    progress,
  });
}
