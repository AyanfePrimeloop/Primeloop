import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isValidNigerianPhone } from '../../../lib/validation';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

function generateEngagerCode(fullName) {
  const initials = (fullName || 'XX').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'XX';
  const num = Math.floor(1000 + Math.random() * 8999);
  return `EN${num}${initials}`;
}

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

  // Generate a code and retry on the rare chance of a collision
  let code = generateEngagerCode(fullName);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabaseAdmin.from('engagers').select('id').eq('code', code).maybeSingle();
    if (!clash) break;
    code = generateEngagerCode(fullName);
  }

  // Every engager can share their link from day one — the referral
  // relationship is recorded here regardless of the referrer's tier. The
  // Gold/Platinum requirement for actually *earning* a bonus is still
  // enforced, just checked later, at the moment the referred engager hits
  // their milestone (see regularSubmissionEffects.js) instead of here at
  // signup. That's strictly better as an anti-abuse check too — it can't be
  // gamed by holding Gold just long enough to refer someone.
  let referrer = null;
  if (referredByCode) {
    const { data: found } = await supabaseAdmin
      .from('engagers')
      .select('id')
      .eq('code', referredByCode)
      .maybeSingle();
    if (found) referrer = found;
  }

  const { data: engager, error } = await supabaseAdmin
    .from('engagers')
    .insert({
      auth_user_id: authUserId,
      code,
      full_name: fullName,
      whatsapp,
      referred_by: referrer?.id || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ engager });
}
