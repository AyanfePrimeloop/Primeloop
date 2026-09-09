import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(200).json({ role: null, roles: [] });

  const { data: userData } = await authCheckClient.auth.getUser(token);
  if (!userData?.user) return res.status(200).json({ role: null, roles: [] });

  // A single email/login CAN be linked to more than one role (e.g. someone
  // who's both an engager and placed a client order with the same email).
  // We check all three and return everything found, rather than stopping
  // at the first match — the login page then asks which dashboard to open
  // if there's more than one.
  const [{ data: adminRow }, { data: engagerRow }, { data: clientRow }] = await Promise.all([
    supabaseAdmin.from('admins').select('*').eq('auth_user_id', userData.user.id).maybeSingle(),
    supabaseAdmin.from('engagers').select('*').eq('auth_user_id', userData.user.id).maybeSingle(),
    supabaseAdmin.from('clients').select('*').eq('auth_user_id', userData.user.id).maybeSingle(),
  ]);

  const roles = [];
  if (adminRow) roles.push('admin');
  if (engagerRow) roles.push('engager');
  if (clientRow) roles.push('client');

  return res.status(200).json({
    role: roles[0] || null, // kept for backward compatibility with single-role checks
    roles,
    email: userData.user.email,
    admin: adminRow || null,
    engager: engagerRow || null,
    client: clientRow || null,
  });
}
