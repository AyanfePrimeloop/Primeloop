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

  const { data: existing } = await supabaseAdmin
    .from('engagers')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'This account is already registered' });

  // Generate a code and retry on the rare chance of a collision
  let code = generateEngagerCode(fullName);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabaseAdmin.from('engagers').select('id').eq('code', code).maybeSingle();
    if (!clash) break;
    code = generateEngagerCode(fullName);
  }

  // Referrals only count from Gold/Platinum engagers, matching the tier
  // ladder's "referral code unlocked" benefit — checked here, once, at
  // signup time, since that's the only moment it actually matters.
  let referrer = null;
  if (referredByCode) {
    const { data: found } = await supabaseAdmin
      .from('engagers')
      .select('*')
      .eq('code', referredByCode)
      .maybeSingle();
    if (found && ['gold', 'platinum'].includes(found.tier)) {
      referrer = found;
    }
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

  if (referrer) {
    await supabaseAdmin.from('referral_bonuses').insert({
      referrer_id: referrer.id,
      referred_id: engager.id,
    });
  }

  return res.status(200).json({ engager });
}
