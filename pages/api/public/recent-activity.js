import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Powers the "live activity" ticker on the landing page hero — the site's
// whole pitch is "watch it happen live", so this has to show genuinely
// recent approved work, not decorative fake rows. Deliberately returns only
// platform + action + timestamp: nothing that identifies the client, the
// engager, or the post, since this is public and unauthenticated.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select('reviewed_at, tasks(platform, action)')
    .eq('final_status', 'approved')
    .not('reviewed_at', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(6);
  if (error) return res.status(500).json({ error: error.message });

  const activity = (data || [])
    .filter((s) => s.tasks)
    .map((s) => ({ platform: s.tasks.platform, action: s.tasks.action, at: s.reviewed_at }));

  return res.status(200).json({ activity });
}
