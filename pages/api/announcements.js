import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { escapeLike } from '../../lib/validation';
import { visibleAnnouncements, tableMissing } from '../../lib/announcements';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET -> the broadcasts the signed-in engager and/or client should see right
// now. The audience is decided here from who the login actually is, never from
// anything the browser sends, so nobody can ask for another audience's
// messages. Anyone who is neither an engager nor a client gets an empty list.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(200).json({ announcements: [] });
  const { data: userData } = await authCheckClient.auth.getUser(token);
  const user = userData?.user;
  if (!user) return res.status(200).json({ announcements: [] });

  const roles = [];
  const { data: engager } = await supabaseAdmin
    .from('engagers')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (engager && engager.status !== 'dismissed') roles.push('engagers');

  let { data: client } = await supabaseAdmin.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!client && user.email) {
    ({ data: client } = await supabaseAdmin.from('clients').select('id').ilike('email', escapeLike(user.email)).limit(1).maybeSingle());
  }
  if (client) roles.push('clients');

  if (!roles.length) return res.status(200).json({ announcements: [] });

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, audience, title, body, link_url, link_label, created_at, expires_at, active')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    // Table not created yet (migration 16): quietly show nothing.
    if (tableMissing(error)) return res.status(200).json({ announcements: [] });
    return res.status(500).json({ error: error.message });
  }

  const shown = visibleAnnouncements(data, roles).map(({ audience, active, expires_at, ...rest }) => rest);
  return res.status(200).json({ announcements: shown });
}
