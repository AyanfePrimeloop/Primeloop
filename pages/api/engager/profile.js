import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';

// GET -> own engager row plus all platform accounts
// PUT -> body: { fullName, whatsapp } — updates basic profile details.
//        Changing a platform's page link happens at /onboarding/[platform]
//        instead, since that's what needs to re-trigger verification.
export default async function handler(req, res) {
  const auth = await requireEngager(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data: platforms } = await supabaseAdmin
      .from('engager_platform_accounts')
      .select('*')
      .eq('engager_id', auth.engager.id);
    return res.status(200).json({ engager: auth.engager, platforms: platforms || [] });
  }

  if (req.method === 'PUT') {
    const { fullName, whatsapp } = req.body;
    if (!fullName || !whatsapp) return res.status(400).json({ error: 'Name and WhatsApp number are both required' });

    const { data, error } = await supabaseAdmin
      .from('engagers')
      .update({ full_name: fullName, whatsapp })
      .eq('id', auth.engager.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ engager: data });
  }

  return res.status(405).end();
}
