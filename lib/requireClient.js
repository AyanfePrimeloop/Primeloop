import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';
import { escapeLike } from './validation';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Verifies a client the same way requireEngager/requireAdmin do, but with
 * one extra safety net: if no client row is linked directly by
 * auth_user_id, it falls back to matching by email (case-insensitive) and
 * immediately repairs the link. This exists because relying purely on
 * auth_user_id staying perfectly in sync has bitten us before — this way,
 * a client can never be "invisible" to their own dashboard as long as a
 * row with their email exists somewhere.
 */
export async function requireClient(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return { error: 'Not signed in', status: 401 };

  const { data: userData, error: userErr } = await authCheckClient.auth.getUser(token);
  if (userErr || !userData?.user) return { error: 'Invalid session', status: 401 };

  let { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (!client && userData.user.email) {
    const { data: byEmail } = await supabaseAdmin
      .from('clients')
      .select('*')
      .ilike('email', escapeLike(userData.user.email))
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (byEmail) {
      const { data: healed } = await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: userData.user.id })
        .eq('id', byEmail.id)
        .select()
        .single();
      client = healed || byEmail;
    }
  }

  if (!client) return { error: 'No client profile linked to this account', status: 403 };
  return { user: userData.user, client };
}
