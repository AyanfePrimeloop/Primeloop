import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Call this at the top of any engager-only API route:
 *   const check = await requireEngager(req);
 *   if (check.error) return res.status(check.status).json({ error: check.error });
 *   const engager = check.engager;
 *
 * This replaces trusting a client-supplied engagerCode — nobody can submit
 * proof or run onboarding tasks as someone else anymore.
 */
export async function requireEngager(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return { error: 'Not signed in', status: 401 };

  const { data: userData, error: userErr } = await authCheckClient.auth.getUser(token);
  if (userErr || !userData?.user) return { error: 'Invalid session', status: 401 };

  const { data: engager } = await supabaseAdmin
    .from('engagers')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (!engager) return { error: 'No engager profile linked to this account', status: 403 };

  return { user: userData.user, engager };
}
