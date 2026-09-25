import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../lib/requireSuperAdmin';
import { fetchAll } from '../../../lib/fetchAll';
import { checkRateLimit } from '../../../lib/rateLimit';
import { pushToEngagers, pushConfigured } from '../../../lib/webPush';
import { validateAnnouncement, tableMissing } from '../../../lib/announcements';

// Super-admin broadcasts to all engagers, all clients, or everyone.
//
// GET  -> { ready, announcements, recipients: { engagers, clients, pushDevices } }
//         ready is false until migration 16 has been run.
// POST -> body: { audience, title, body, linkUrl?, linkLabel?, expiresInDays?, sendPush? }
//         Saves it (recipients see it as a banner on their dashboard) and, when
//         asked, sends a browser alert to every engager device that has alerts on.
// PUT  -> body: { id, active: false } stops showing a message.
//
// Dismissed engagers are left out: they are no longer part of the community.
export default async function handler(req, res) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const [engagers, clients, devices, list] = await Promise.all([
      fetchAll(() => supabaseAdmin.from('engagers').select('id, status').order('id')),
      supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('engager_push_subscriptions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const engagerCount = (engagers.data || []).filter((e) => e.status !== 'dismissed').length;
    const recipients = { engagers: engagerCount, clients: clients.count || 0, pushDevices: devices.count || 0 };

    if (list.error) {
      if (tableMissing(list.error)) return res.status(200).json({ ready: false, announcements: [], recipients });
      return res.status(500).json({ error: list.error.message });
    }
    return res.status(200).json({ ready: true, announcements: list.data || [], recipients });
  }

  if (req.method === 'POST') {
    // A fat-fingered double click should not message everyone twice.
    const rate = await checkRateLimit(supabaseAdmin, `broadcast:${auth.user.id}`, { maxAttempts: 20, windowSeconds: 3600 });
    if (!rate.allowed) return res.status(429).json({ error: 'Too many broadcasts in the last hour. Try again later.' });

    const checked = validateAnnouncement(req.body);
    if (checked.error) return res.status(400).json({ error: checked.error });

    const { data: created, error } = await supabaseAdmin
      .from('announcements')
      .insert({ ...checked.value, created_by: auth.user.email })
      .select()
      .single();
    if (error) {
      if (tableMissing(error)) {
        return res.status(503).json({ error: 'Broadcasts need a one-time setup: run supabase/migration_16_announcements.sql in the Supabase SQL Editor, then try again.' });
      }
      return res.status(500).json({ error: error.message });
    }

    let push = { requested: false, configured: pushConfigured(), sent: 0, attempted: 0 };
    if (req.body?.sendPush && created.audience !== 'clients') {
      push.requested = true;
      const engagers = await fetchAll(() => supabaseAdmin.from('engagers').select('id, status').order('id'));
      const ids = (engagers.data || []).filter((e) => e.status !== 'dismissed').map((e) => e.id);
      const result = await pushToEngagers(supabaseAdmin, ids, {
        title: created.title,
        body: created.body.length > 140 ? `${created.body.slice(0, 137)}...` : created.body,
        url: created.link_url && created.link_url.startsWith('/') ? created.link_url : '/engager/dashboard',
        tag: `announcement-${created.id}`,
      });
      push = { ...push, sent: result.sent, attempted: result.attempted };
      await supabaseAdmin.from('announcements').update({ push_attempted: result.attempted, push_sent: result.sent }).eq('id', created.id);
    }

    return res.status(200).json({ announcement: created, push });
  }

  if (req.method === 'PUT') {
    const { id, active } = req.body || {};
    if (!id || active !== false) return res.status(400).json({ error: 'Only stopping a message is supported.' });
    const { error } = await supabaseAdmin.from('announcements').update({ active: false }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
