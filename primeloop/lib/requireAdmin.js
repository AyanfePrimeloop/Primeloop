import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';

// A separate lightweight client just for checking who a token belongs to.
const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Call this at the top of any admin-only API route:
 *   const check = await requireAdmin(req);
 *   if (check.error) return res.status(check.status).json({ error: check.error });
 */
export async function requireAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return { error: 'Not signed in', status: 401 };

  const { data: userData, error: userErr } = await authCheckClient.auth.getUser(token);
  if (userErr || !userData?.user) return { error: 'Invalid session', status: 401 };

  const { data: adminRow } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (!adminRow) return { error: 'This account is not an admin', status: 403 };

  return { user: userData.user, admin: adminRow };
}
