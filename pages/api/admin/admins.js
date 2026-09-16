import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';

// GET  -> list all admins
// POST -> body: { email, role } — invites a new admin by email (they get a
//         link to set their own password) and adds them to the admins table
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('admins').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ admins: data });
  }

  if (req.method === 'POST') {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { data: existing } = await supabaseAdmin.from('admins').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'This email is already an admin' });

    // Sends the new admin an email with a link to set their own password —
    // cleaner than us generating one and having to share it separately.
    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
    if (inviteErr) return res.status(500).json({ error: 'Could not send invite: ' + inviteErr.message });

    const { data: adminRow, error } = await supabaseAdmin
      .from('admins')
      .insert({ auth_user_id: invited.user.id, email, role: role === 'super_admin' ? 'super_admin' : 'admin' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ admin: adminRow });
  }

  return res.status(405).end();
}
