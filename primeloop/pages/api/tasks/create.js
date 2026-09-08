import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { checkPostLink } from '../../../lib/checkPostLink';

// Body: { clientEmail, platform, postLink, action, quantity, targetAccountHandle? }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { clientEmail, platform, postLink, action, quantity, targetAccountHandle } = req.body;

  const { data: rule } = await supabaseAdmin
    .from('pricing_rules')
    .select('*')
    .eq('platform', platform)
    .eq('action', action)
    .single();
  if (!rule) return res.status(400).json({ error: 'No pricing rule for this platform/action' });

  let { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('email', clientEmail)
    .maybeSingle();
  if (!client) {
    let authUserId = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({ email: clientEmail, email_confirm: true });
      authUserId = authUser?.user?.id || null;
    } catch (e) {
      // Task creation shouldn't be blocked if login creation fails for any reason.
    }
    const { data: newClient } = await supabaseAdmin
      .from('clients')
      .insert({ email: clientEmail, auth_user_id: authUserId })
      .select()
      .single();
    client = newClient;
  }

  const prefix = { facebook: 'FB', instagram: 'IG', tiktok: 'TT', youtube: 'YT', x: 'XT' }[platform] || 'PL';
  const taskCode = `${prefix}-${Math.floor(1000 + Math.random() * 8999)}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

  const linkCheck = await checkPostLink(postLink, platform);

  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      task_code: taskCode,
      client_id: client.id,
      platform,
      post_link: postLink,
      action,
      quantity_needed: quantity,
      price_per_unit: rule.engager_payout,
      target_account_handle: targetAccountHandle || null,
      tier_gate_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: linkCheck.ok ? 'open' : 'pending_review',
      link_check_reason: linkCheck.ok ? null : linkCheck.reason,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ task });
}
