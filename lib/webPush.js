import webpush from 'web-push';
import { platformLabel } from './platformDomains';

// Free task alerts through the browser's own push service (no per-message
// cost). Needs three env vars: NEXT_PUBLIC_VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT. Without them this is a quiet no-op.

let configured = null;
function configure() {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:info@primeloop.app', pub, priv);
  configured = true;
  return true;
}

export function pushConfigured() {
  return configure();
}

export function taskPushPayload(task) {
  const qty = Number(task.quantity_needed) || 0;
  const action = `${task.action}${qty > 1 ? 's' : ''}`;
  const platform = task.platform ? platformLabel(task.platform) : '';
  return {
    title: `New task: ${qty} ${action} on ${platform}`.replace('  ', ' '),
    body: `Earn ₦${task.price_per_unit} each. Tap to claim it.`,
    url: '/engager/dashboard',
    tag: `task-${task.task_code || task.id}`,
  };
}

/**
 * Sends `payload` to every saved subscription for the given engager ids.
 * Dead subscriptions (the person cleared site data or revoked permission)
 * are deleted so we stop trying them. Never throws.
 */
export async function pushToEngagers(supabaseAdmin, engagerIds, payload) {
  if (!configure() || !engagerIds.length) return { sent: 0, attempted: 0 };

  const { data: subs, error } = await supabaseAdmin
    .from('engager_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('engager_id', engagerIds);
  // Table missing (migration 12 not run yet) or any read error: skip quietly.
  if (error || !subs?.length) return { sent: 0, attempted: 0 };

  const body = JSON.stringify(payload);
  const dead = [];
  const okIds = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 6 });
        okIds.push(s.id);
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) await supabaseAdmin.from('engager_push_subscriptions').delete().in('id', dead);
  if (okIds.length) {
    await supabaseAdmin.from('engager_push_subscriptions').update({ last_success_at: new Date().toISOString() }).in('id', okIds);
  }
  return { sent: okIds.length, attempted: subs.length };
}
