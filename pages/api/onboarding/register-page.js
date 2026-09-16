import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';

// Body: { platform, profileName, profileLink }
// Must be called before an engager can submit any onboarding proof for a
// platform. Registering (or changing) a page link is what makes the same
// page unusable by any other engager account — enforced both here and by
// a database constraint (migration_9) as a second line of defense.
export default async function handler(req, res) {
  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const engager = auth.engager;

  if (req.method === 'GET') {
    const { data } = await supabaseAdmin
      .from('engager_platform_accounts')
      .select('*')
      .eq('engager_id', engager.id)
      .eq('platform', req.query.platform)
      .maybeSingle();
    return res.status(200).json({ platformAccount: data || null });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { platform, profileName, profileLink } = req.body;
  if (!platform || !profileName || !profileLink) {
    return res.status(400).json({ error: 'Page name and link are both required' });
  }

  // Is this exact page already claimed by a DIFFERENT engager?
  const { data: clash } = await supabaseAdmin
    .from('engager_platform_accounts')
    .select('engager_id')
    .eq('platform', platform)
    .eq('profile_link', profileLink)
    .neq('engager_id', engager.id)
    .maybeSingle();
  if (clash) {
    return res.status(409).json({ error: 'This page is already registered to another engager account.' });
  }

  const { data: existing } = await supabaseAdmin
    .from('engager_platform_accounts')
    .select('*')
    .eq('engager_id', engager.id)
    .eq('platform', platform)
    .maybeSingle();

  const linkChanged = existing && existing.profile_link !== profileLink;

  if (existing) {
    // Changing the page link means it's a different account than whatever
    // was previously verified — that has to go through onboarding again,
    // it can't just inherit the old verification status.
    const { data: updated, error } = await supabaseAdmin
      .from('engager_platform_accounts')
      .update({
        profile_name: profileName,
        profile_link: profileLink,
        ...(linkChanged ? { verification_status: 'pending', test_status: 'not_started' } : {}),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ platformAccount: updated, needsReonboarding: linkChanged });
  }

  const { data: created, error } = await supabaseAdmin
    .from('engager_platform_accounts')
    .insert({
      engager_id: engager.id,
      platform,
      profile_name: profileName,
      profile_link: profileLink,
      verification_status: 'pending',
      test_status: 'not_started',
    })
    .select()
    .single();
  if (error) {
    // Catches the rare race condition where two people register the same
    // page in the same instant, slipping past the check above.
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This page is already registered to another engager account.' });
    }
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ platformAccount: created, needsReonboarding: false });
}
