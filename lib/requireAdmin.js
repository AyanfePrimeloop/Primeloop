import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';

// A separate lightweight client just for checking who a token belongs to.
const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// The access token is a JWT whose payload carries the session's "aal"
// (Authenticator Assurance Level) claim — "aal1" for password-only,
// "aal2" once a second factor has been verified. authCheckClient.auth.getUser()
// below already confirms this exact token is genuine and live (it calls
// Supabase's server), so decoding the payload afterwards is safe: we're not
// trusting anything the caller couldn't have gotten past Supabase itself.
function decodeAal(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.aal || null;
  } catch {
    return null;
  }
}

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

  // Password alone only gets a session to AAL1. If this admin has 2FA
  // enrolled, the request itself — not just the login page — must prove the
  // second factor was verified (AAL2), otherwise a leaked password alone is
  // enough to call every admin API route with 2FA never actually checked.
  const hasVerifiedFactor = (userData.user.factors || []).some((f) => f.status === 'verified');
  if (hasVerifiedFactor && decodeAal(token) !== 'aal2') {
    return { error: 'This account requires 2FA verification for this session', status: 401 };
  }

  const { data: adminRow } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (!adminRow) return { error: 'This account is not an admin', status: 403 };

  return { user: userData.user, admin: adminRow };
}
