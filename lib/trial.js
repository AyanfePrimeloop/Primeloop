import { parseUrl } from './platformDomains';

// What a free trial contains. Deliberately the two cheapest, highest-volume
// actions — a like is the fastest proof "a real person did this", and a real
// readable comment is the strongest. Follows/subscribes are excluded on
// purpose: they're the most expensive actions and each one permanently uses
// up real follow capacity on the target account.
export const TRIAL_BUNDLE = { like: 5, comment: 2 };

// X has no "comment" action — its equivalent is "reply".
export function trialActionsFor(platform) {
  return [
    { action: 'like', quantity: TRIAL_BUNDLE.like },
    { action: platform === 'x' ? 'reply' : 'comment', quantity: TRIAL_BUNDLE.comment },
  ];
}

// How many free trials can be granted in any rolling 7 days, across the whole
// platform. A hard ceiling on the worst-case cost of the offer — raise it by
// setting TRIAL_WEEKLY_CAP in Vercel once you've seen the real numbers.
export function trialWeeklyCap() {
  const n = parseInt(process.env.TRIAL_WEEKLY_CAP, 10);
  return Number.isFinite(n) && n >= 0 ? n : 40;
}

// Canonical form of an email for "have we seen this person before?".
// Lowercase, "+tag" stripped, and dots stripped for Gmail — so
// "Ayo.Ade+promo@gmail.com" and "ayoade@gmail.com" are one person.
export function canonicalEmail(email) {
  if (typeof email !== 'string') return '';
  const [rawLocal = '', rawDomain = ''] = email.trim().toLowerCase().split('@');
  let local = rawLocal.split('+')[0];
  let domain = rawDomain;
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replace(/\./g, '');
  return `${local}@${domain}`;
}

// Canonical form of a post link, so the same post can't be reused by
// varying the link's cosmetics (www./m., tracking params, trailing slash,
// youtu.be vs youtube.com). Path case is kept — YouTube ids and Instagram
// shortcodes are case-sensitive. Query params are dropped EXCEPT the few
// that actually identify the post (YouTube's ?v=, Facebook's story_fbid/id/fbid).
const IDENTIFYING_PARAMS = ['v', 'story_fbid', 'id', 'fbid', 'p'];

export function canonicalPostKey(link) {
  const url = parseUrl(link);
  if (!url) return null;
  let host = url.hostname.toLowerCase().replace(/^(www|m|mobile|web|mbasic)\./, '');
  if (host === 'twitter.com') host = 'x.com';
  if (host === 'youtu.be') return `youtube.com/watch?v=${url.pathname.slice(1)}`;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const params = IDENTIFYING_PARAMS.filter((k) => url.searchParams.get(k))
    .map((k) => `${k}=${url.searchParams.get(k)}`)
    .join('&');
  return `${host}${path}${params ? `?${params}` : ''}`;
}
