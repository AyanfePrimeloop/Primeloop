import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireEngager } from '../../../lib/requireEngager';

// POST   -> body: { subscription } from PushManager.subscribe(); saves this device
// DELETE -> body: { endpoint }; removes this device
export default async function handler(req, res) {
  const check = await requireEngager(req);
  if (check.error) return res.status(check.status).json({ error: check.error });
  const engager = check.engager;

  if (req.method === 'POST') {
    const sub = req.body?.subscription;
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !p256dh || !auth) {
      return res.status(400).json({ error: 'That notification setup looks incomplete. Please try again.' });
    }
    const { error } = await supabaseAdmin.from('engager_push_subscriptions').upsert(
      {
        engager_id: engager.id,
        endpoint,
        p256dh,
        auth,
        user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
      },
      { onConflict: 'endpoint' }
    );
    if (error) {
      return res.status(500).json({ error: 'Task alerts are not switched on for the platform yet. Please try again later.' });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const endpoint = req.body?.endpoint;
    if (typeof endpoint !== 'string') return res.status(400).json({ error: 'Missing endpoint' });
    await supabaseAdmin.from('engager_push_subscriptions').delete().eq('endpoint', endpoint).eq('engager_id', engager.id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
