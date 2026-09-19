import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isValidNigerianPhone } from '../../../lib/validation';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { createEngager } from '../../../lib/createEngager';

// Body: { authUserId, fullName, whatsapp, referredByCode? }
// Called right after supabase.auth.signUp() succeeds on the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getClientIp(req);
  const rateCheck = await checkRateLimit(supabaseAdmin, `signup:${ip}`, { maxAttempts: 8, windowSeconds: 3600 });
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many signups attempted from this connection. Please try again later.' });
  }

  const { authUserId, fullName, whatsapp, referredByCode } = req.body;
  if (!authUserId || !fullName || !whatsapp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidNigerianPhone(whatsapp)) {
    return res.status(400).json({ error: 'Enter a valid Nigerian WhatsApp number, e.g. 08012345678.' });
  }

  // Can't require a bearer session here — Supabase's "confirm email" setting
  // (the default; see pages/signup.js) means there's no session yet at this
  // point in signup, only the just-created user's id. So instead of trusting
  // authUserId at face value (which would let anyone bind an engager profile
  // to any known/leaked auth id), verify it's genuinely fresh — created by
  // this same signup, moments ago — and not already some other account.
  const { data: authUser, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(authUserId);
  if (authUserErr || !authUser?.user) return res.status(400).json({ error: 'Invalid signup session' });
  const createdMsAgo = Date.now() - new Date(authUser.user.created_at).getTime();
  if (createdMsAgo > 15 * 60 * 1000) {
    return res.status(403).json({ error: 'This account is already set up. Please log in instead.' });
  }

  const [{ data: existing }, { data: existingClient }, { data: existingAdmin }] = await Promise.all([
    supabaseAdmin.from('engagers').select('id').eq('auth_user_id', authUserId).maybeSingle(),
    supabaseAdmin.from('clients').select('id').eq('auth_user_id', authUserId).maybeSingle(),
    supabaseAdmin.from('admins').select('id').eq('auth_user_id', authUserId).maybeSingle(),
  ]);
  if (existing) return res.status(409).json({ error: 'This account is already registered' });
  if (existingClient || existingAdmin) {
    return res.status(403).json({ error: 'This account is already set up. Please log in instead.' });
  }

  const created = await createEngager(supabaseAdmin, { authUserId, fullName, whatsapp, referredByCode });
  if (created.error) return res.status(500).json({ error: created.error });

  return res.status(200).json({ engager: created.engager });
}
