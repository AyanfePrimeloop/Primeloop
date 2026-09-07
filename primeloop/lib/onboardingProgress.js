import { supabaseAdmin } from './supabaseAdmin';

/**
 * Re-reads all onboarding_submissions for this engager+platform against the
 * platform's required_actions, and updates engager_platform_accounts
 * (test_status, verification_status) accordingly. Safe to call repeatedly —
 * it always recomputes from scratch rather than incrementing state.
 */
export async function recomputeOnboardingStatus(engagerId, platform) {
  const { data: test } = await supabaseAdmin
    .from('onboarding_tests')
    .select('*')
    .eq('platform', platform)
    .eq('active', true)
    .single();
  if (!test) return null;

  const { data: allSubs } = await supabaseAdmin
    .from('onboarding_submissions')
    .select('action, final_status')
    .eq('engager_id', engagerId)
    .eq('platform', platform);

  const approvedActions = new Set(
    (allSubs || []).filter((s) => s.final_status === 'approved').map((s) => s.action)
  );
  const anyRejected = (allSubs || []).some((s) => s.final_status === 'rejected');
  const allApproved = test.required_actions.every((a) => approvedActions.has(a));

  const { data: platformAccount } = await supabaseAdmin
    .from('engager_platform_accounts')
    .select('*')
    .eq('engager_id', engagerId)
    .eq('platform', platform)
    .maybeSingle();
  if (!platformAccount) return null;

  let newTestStatus = platformAccount.test_status;
  let newVerificationStatus = platformAccount.verification_status;
  if (allApproved) {
    newTestStatus = 'passed';
    newVerificationStatus = 'verified';
  } else if (anyRejected) {
    newTestStatus = 'failed';
  }

  await supabaseAdmin
    .from('engager_platform_accounts')
    .update({ test_status: newTestStatus, verification_status: newVerificationStatus })
    .eq('id', platformAccount.id);

  return {
    requiredActions: test.required_actions,
    approvedActions: Array.from(approvedActions),
    allApproved,
  };
}
