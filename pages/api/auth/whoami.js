import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { escapeLike } from '../../../lib/validation';

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
  const [{ data: adminRow }, { data: engagerRow }] = await Promise.all([
    supabaseAdmin.from('admins').select('*').eq('auth_user_id', userData.user.id).maybeSingle(),
    supabaseAdmin.from('engagers').select('*').eq('auth_user_id', userData.user.id).maybeSingle(),
  ]);

  // Client lookup goes through the same self-healing logic used everywhere
  // else a client is verified — if the direct auth_user_id link is ever
  // missing, this repairs it by matching on email instead of just failing.
  let clientRow = null;
  const { data: clientById } = await supabaseAdmin.from('clients').select('*').eq('auth_user_id', userData.user.id).maybeSingle();
  if (clientById) {
    clientRow = clientById;
  } else if (userData.user.email) {
    const { data: clientByEmail } = await supabaseAdmin
      .from('clients')
      .select('*')
      .ilike('email', escapeLike(userData.user.email))
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (clientByEmail) {
      const { data: healed } = await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: userData.user.id })
        .eq('id', clientByEmail.id)
        .select()
        .single();
      clientRow = healed || clientByEmail;
    }
  }

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
