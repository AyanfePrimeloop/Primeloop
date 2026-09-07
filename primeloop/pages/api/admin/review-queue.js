import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { applyRegularVerdict } from '../../../lib/regularSubmissionEffects';
import { recomputeOnboardingStatus } from '../../../lib/onboardingProgress';
import { requireAdmin } from '../../../lib/requireAdmin';

// GET  -> { regular: [...], onboarding: [...], links: [...pending_review tasks...] }
// POST -> body: { type: 'regular' | 'onboarding' | 'link', id, decision: 'approved' | 'rejected' }
export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data: regular, error: regErr } = await supabaseAdmin
      .from('submissions')
      .select('*, tasks(task_code, platform, action, post_link, quantity_needed, quantity_filled), engagers(code, full_name, tier)')
      .eq('final_status', 'pending')
      .order('submitted_at', { ascending: true });
    if (regErr) return res.status(500).json({ error: regErr.message });

    const { data: onboarding, error: obErr } = await supabaseAdmin
      .from('onboarding_submissions')
      .select('*, engagers(code, full_name)')
      .eq('final_status', 'pending')
      .order('submitted_at', { ascending: true });
    if (obErr) return res.status(500).json({ error: obErr.message });

    const { data: links, error: linkErr } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });
    if (linkErr) return res.status(500).json({ error: linkErr.message });

    // Attach an attempt count to each onboarding item so the admin can see
    // "this is attempt 4" at a glance, matching the forced-manual-review rule.
    const withAttempts = await Promise.all(
      (onboarding || []).map(async (item) => {
        const { count } = await supabaseAdmin
          .from('onboarding_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('engager_id', item.engager_id)
          .eq('platform', item.platform)
          .eq('action', item.action)
          .lte('submitted_at', item.submitted_at);
        return { ...item, attemptNumber: count };
      })
    );

    return res.status(200).json({ regular: regular || [], onboarding: withAttempts, links: links || [] });
  }

  if (req.method === 'POST') {
    const { type, id, decision } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    }

    if (type === 'link') {
      const { data: task } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.status !== 'pending_review') {
        return res.status(409).json({ error: 'This task was already resolved' });
      }
      // Approved -> opens to engagers now. Rejected -> stays closed permanently;
      // reach out to the client manually to get a working link (no automated
      // client notification exists yet — same as how you'd handle it today).
      await supabaseAdmin
        .from('tasks')
        .update({ status: decision === 'approved' ? 'open' : 'rejected' })
        .eq('id', id);
      return res.status(200).json({ ok: true });
    }

    if (type === 'regular') {
      const { data: submission } = await supabaseAdmin
        .from('submissions')
        .select('*, tasks(*), engagers(*)')
        .eq('id', id)
        .single();
      if (!submission) return res.status(404).json({ error: 'Submission not found' });
      if (submission.final_status !== 'pending') {
        return res.status(409).json({ error: 'This submission was already resolved' });
      }

      await supabaseAdmin
        .from('submissions')
        .update({ final_status: decision, reviewed_by: 'admin', reviewed_at: new Date().toISOString() })
        .eq('id', id);

      await applyRegularVerdict({ task: submission.tasks, engager: submission.engagers, finalStatus: decision });
      return res.status(200).json({ ok: true });
    }

    if (type === 'onboarding') {
      const { data: submission } = await supabaseAdmin
        .from('onboarding_submissions')
        .select('*')
        .eq('id', id)
        .single();
      if (!submission) return res.status(404).json({ error: 'Submission not found' });
      if (submission.final_status !== 'pending') {
        return res.status(409).json({ error: 'This submission was already resolved' });
      }

      await supabaseAdmin
        .from('onboarding_submissions')
        .update({ final_status: decision, reviewed_by: 'admin', reviewed_at: new Date().toISOString() })
        .eq('id', id);

      const progress = await recomputeOnboardingStatus(submission.engager_id, submission.platform);
      return res.status(200).json({ ok: true, progress });
    }

    return res.status(400).json({ error: 'type must be regular, onboarding, or link' });
  }

  return res.status(405).end();
}
