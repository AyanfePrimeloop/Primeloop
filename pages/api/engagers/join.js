import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isValidNigerianPhone } from '../../../lib/validation';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { createEngager } from '../../../lib/createEngager';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Body: { fullName, whatsapp, referredByCode? }  (needs a signed-in session)
// Lets someone who already has a login (for example a client who ordered
// with this email) add an engager profile to that same login, so one person
// can be both. Ownership of the email is proven by the signed-in session.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  const { data: userData } = await authCheckClient.auth.getUser(token);
  const user = userData?.user;
  if (!user) return res.status(401).json({ error: 'Please log in first.' });

  const rate = await checkRateLimit(supabaseAdmin, `join:${user.id}:${getClientIp(req)}`, { maxAttempts: 8, windowSeconds: 3600 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });

  const { fullName, whatsapp, referredByCode } = req.body || {};
  if (typeof fullName !== 'string' || !fullName.trim() || !whatsapp) {
    return res.status(400).json({ error: 'Add your full name and WhatsApp number.' });
  }
  if (!isValidNigerianPhone(whatsapp)) {
    return res.status(400).json({ error: 'Enter a valid Nigerian WhatsApp number, e.g. 08012345678.' });
  }

  const { data: existing } = await supabaseAdmin.from('engagers').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (existing) return res.status(409).json({ error: 'You already have an engager account. Open it from Switch dashboard.' });

  const created = await createEngager(supabaseAdmin, {
    authUserId: user.id,
    fullName: fullName.trim(),
    whatsapp,
    referredByCode: typeof referredByCode === 'string' ? referredByCode : null,
  });
  if (created.error) return res.status(500).json({ error: 'Could not create your engager account. Please try again.' });

  return res.status(200).json({ engager: created.engager });
}
