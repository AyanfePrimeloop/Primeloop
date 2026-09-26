import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { isKnownPlatform, normalizeLink, linkMatchesPlatform, extractProfileHandle } from '../../../lib/platformDomains';
import { capacityFor } from '../../../lib/capacity';

// GET ?platform=facebook[&link=...] -> { capacity: { like: 21, comment: 21, ... } }
// What can be delivered right now, so the order page can show "up to N" beside
// each engagement. With a link it also subtracts what that post already has.
// Only these headline numbers leave the server, never engager details.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const ip = getClientIp(req);
  const rate = await checkRateLimit(supabaseAdmin, `order-capacity:${ip}`, { maxAttempts: 120, windowSeconds: 3600 });
  if (!rate.allowed) return res.status(429).json({ error: 'Too many requests.' });

  const { platform, link: rawLink } = req.query;
  if (!isKnownPlatform(platform)) return res.status(400).json({ error: 'Unknown platform.' });

  const link = normalizeLink(rawLink);
  const useLink = link && linkMatchesPlatform(link, platform) ? link : undefined;

  const { data: rules } = await supabaseAdmin.from('pricing_rules').select('action').eq('platform', platform).eq('active', true);
  const capacity = {};
  for (const { action } of rules || []) {
    const isFollow = ['follow', 'subscribe'].includes(action);
    const handle = isFollow && useLink ? extractProfileHandle(platform, useLink) : null;
    capacity[action] = (await capacityFor(supabaseAdmin, { platform, action, link: useLink, handle })).available;
  }
  return res.status(200).json({ capacity });
}
