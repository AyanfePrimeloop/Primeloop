import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { resolveVerdict } from '../../../lib/verificationRouter';
import { isDuplicateHash } from '../../../lib/aiVerify';
import { applyRegularVerdict } from '../../../lib/regularSubmissionEffects';
import { uploadScreenshot, validateScreenshotUpload } from '../../../lib/storage';
import { requireEngager } from '../../../lib/requireEngager';
import { checkRateLimit } from '../../../lib/rateLimit';

// Body: { taskCode, imageBase64, imageMediaType }
// Who's submitting comes from the login session now, not a typed code —
// this closes the gap where anyone could type someone else's engager code.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const engager = auth.engager;

  // Unlike task claiming, nothing else here naturally caps how many times
  // this can be called — each hit pays for an AI-verification call and a
  // storage upload, so it's the one submission-side endpoint worth
  // rate-limiting on its own.
  const rateCheck = await checkRateLimit(supabaseAdmin, `submission-create:${engager.id}`, { maxAttempts: 30, windowSeconds: 3600 });
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many submissions in a short time. Please try again later.' });
  }

  const { taskCode, imageBase64, imageMediaType } = req.body;
  if (!taskCode || !imageBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const uploadCheck = validateScreenshotUpload({ base64: imageBase64, mediaType: imageMediaType });
  if (!uploadCheck.ok) {
    return res.status(400).json({ error: uploadCheck.reason });
  }

  // 1. Look up the task
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('task_code', taskCode)
    .single();
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'open') return res.status(409).json({ error: 'This task is already closed' });

  // 1b. Block self-dealing: if this same login also has a client account,
  // and this task belongs to an order THEY placed, they can't complete it
  // as an engager — that would mean collecting a payout for "engaging"
  // with their own post, which isn't real engagement.
  const { data: ownClient } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('auth_user_id', auth.user.id)
    .eq('id', task.client_id)
    .maybeSingle();
  if (ownClient) {
    return res.status(403).json({ error: "You can't complete tasks on your own order." });
  }

  // 2. Platform gate: must have PASSED the onboarding test for this platform
  //    before claiming any real, paid task on it.
  const { data: platformAccount } = await supabaseAdmin
    .from('engager_platform_accounts')
    .select('*')
    .eq('engager_id', engager.id)
    .eq('platform', task.platform)
    .maybeSingle();

  if (!platformAccount || platformAccount.verification_status !== 'verified') {
    return res.status(403).json({
      error: `Complete your ${task.platform} onboarding test before claiming real tasks on this platform.`,
      needsOnboarding: true,
      platform: task.platform,
    });
  }

  // 3. Tier gate: if still in the early-access window, only Gold/Platinum can submit
  const isGated = task.tier_gate_until && new Date(task.tier_gate_until) > new Date();
  if (isGated && !['gold', 'platinum'].includes(engager.tier)) {
    return res.status(403).json({ error: 'This task is in early access for Gold/Platinum engagers right now' });
  }

  // 4. Prevent an engager from claiming the same task twice
  const { data: existing } = await supabaseAdmin
    .from('submissions')
    .select('id')
    .eq('task_id', task.id)
    .eq('engager_id', engager.id)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'You have already submitted for this task' });

  // 5. Hash the screenshot for duplicate detection
  const screenshotHash = crypto.createHash('sha256').update(imageBase64).digest('hex');
  const { data: taskSubmissions } = await supabaseAdmin
    .from('submissions')
    .select('screenshot_hash')
    .eq('task_id', task.id);
  const existingHashes = (taskSubmissions || []).map((s) => s.screenshot_hash).filter(Boolean);

  let verdict, reason;
  let reviewedBy = 'ai';
  if (isDuplicateHash(screenshotHash, existingHashes)) {
    verdict = 'rejected';
    reason = 'This screenshot matches one already submitted for this task.';
  } else {
    // 6. Verification, routed by the admin's toggle: manual / ai_always / ai_sampled
    const result = await resolveVerdict({
      platform: task.platform,
      action: task.action,
      imageBase64,
      imageMediaType: imageMediaType || 'image/png',
      expectedAccountName: platformAccount.profile_name || engager.full_name,
      profileLink: platformAccount.profile_link,
      postLink: task.post_link,
      specialInstructions: task.special_instructions,
      engagerId: engager.id,
    });
    verdict = result.verdict;
    reason = result.reason;
    reviewedBy = result.reviewedBy || 'ai';
  }

  // 7. Record the submission — screenshot goes to Supabase Storage first
  //    so the admin review queue can actually display it.
  const finalStatus = verdict === 'approved' ? 'approved' : verdict === 'rejected' ? 'rejected' : 'pending';
  const screenshotUrl = await uploadScreenshot({
    base64: imageBase64,
    mediaType: imageMediaType || 'image/png',
    pathPrefix: `tasks/${task.task_code}`,
  });
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('submissions')
    .insert({
      task_id: task.id,
      engager_id: engager.id,
      screenshot_url: screenshotUrl,
      screenshot_hash: screenshotHash,
      ai_verdict: verdict,
      ai_reason: reason,
      final_status: finalStatus,
      reviewed_by: finalStatus === 'pending' ? null : reviewedBy,
      reviewed_at: finalStatus !== 'pending' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (subErr) return res.status(500).json({ error: subErr.message });

  // 8. Apply consequences immediately if AI already decided; if it's
  //    'pending', this happens later when an admin resolves it manually
  //    (see pages/api/admin/review-queue.js).
  await applyRegularVerdict({ task, engager, finalStatus });

  return res.status(200).json({ verdict: finalStatus, reason });
}
