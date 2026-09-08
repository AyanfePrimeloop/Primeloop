import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const authCheckClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(200).json({ role: null });

  const { data: userData } = await authCheckClient.auth.getUser(token);
  if (!userData?.user) return res.status(200).json({ role: null });

  const { data: adminRow } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (adminRow) return res.status(200).json({ role: 'admin', email: userData.user.email });

  const { data: engagerRow } = await supabaseAdmin
    .from('engagers')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (engagerRow) return res.status(200).json({ role: 'engager', engager: engagerRow });

  const { data: clientRow } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (clientRow) return res.status(200).json({ role: 'client', client: clientRow });

  return res.status(200).json({ role: null });
}
