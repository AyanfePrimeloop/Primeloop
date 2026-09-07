import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function generateEngagerCode(fullName) {
  const initials = (fullName || 'XX').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'XX';
  const num = Math.floor(1000 + Math.random() * 8999);
  return `EN${num}${initials}`;
}

// Body: { authUserId, fullName, whatsapp }
// Called right after supabase.auth.signUp() succeeds on the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { authUserId, fullName, whatsapp } = req.body;
  if (!authUserId || !fullName || !whatsapp) {
    return res.status(400).json({ error: 'Missing required fields' });
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

  const { data: engager, error } = await supabaseAdmin
    .from('engagers')
    .insert({ auth_user_id: authUserId, code, full_name: fullName, whatsapp })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ engager });
}
