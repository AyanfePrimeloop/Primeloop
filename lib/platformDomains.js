// Single source of truth for "which domains count as platform X", shared by
// the client-side order form (instant feedback, before payment) and
// checkPostLink.js (the authoritative server-side check after payment).
// Keeping one list means the two can never quietly drift apart.
export const PLATFORM_DOMAINS = {
  facebook: ['facebook.com', 'fb.watch'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['x.com', 'twitter.com'],
};

const LABELS = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X' };

// Display name with the brand's own capitalisation ("YouTube", not "Youtube").
export function platformLabel(platform) {
  return LABELS[platform] || (platform ? platform[0].toUpperCase() + platform.slice(1) : '');
}

// "an Instagram", "a Facebook" — so messages read naturally.
export function platformWithArticle(platform) {
  return `${['instagram', 'x'].includes(platform) ? 'an' : 'a'} ${platformLabel(platform)}`;
}

// The one message shown everywhere a link doesn't belong to the chosen platform.
export function linkMismatchMessage(platform) {
  return `That doesn't look like ${platformWithArticle(platform)} link — paste a link from ${PLATFORM_DOMAINS[platform][0]}.`;
}

// True only for the five real platform names. (A plain PLATFORM_DOMAINS[x]
// lookup would also "find" inherited keys like "constructor".)
export function isKnownPlatform(platform) {
  return typeof platform === 'string' && Object.prototype.hasOwnProperty.call(PLATFORM_DOMAINS, platform);
}

// Exact host or real subdomain only — a plain .includes() would let
// "facebook.com.attacker.example" through.
export function isAllowedHost(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

// Lenient parse: tolerates a link pasted without "https://".
export function parseUrl(link) {
  if (typeof link !== 'string') return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {}
  try {
    return new URL(`https://${trimmed}`);
  } catch {}
  return null;
}

// Returns a full, safe "https://..." link (adding the scheme if the person
// pasted "facebook.com/..." without it), or null if it isn't a usable web
// link. The order form sends this, so the server never sees a bare domain.
export function normalizeLink(link) {
  const url = parseUrl(link);
  if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
  return url.href;
}

export function linkMatchesPlatform(link, platform) {
  const url = parseUrl(link);
  if (!url || !['http:', 'https:'].includes(url.protocol)) return false;
  const allowedDomains = isKnownPlatform(platform) ? PLATFORM_DOMAINS[platform] : [];
  return allowedDomains.some((d) => isAllowedHost(url.hostname, d));
}

// First path segments that are NOT a profile name on each platform
// (e.g. instagram.com/p/<post> is a post, not the account "p").
const NOT_A_PROFILE = {
  instagram: ['p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'direct'],
  facebook: ['groups', 'watch', 'share', 'reel', 'reels', 'photo', 'photos', 'permalink.php', 'story.php', 'events', 'marketplace', 'pages', 'posts', 'videos', 'hashtag', 'login'],
  x: ['i', 'home', 'search', 'hashtag', 'intent', 'share', 'explore', 'settings', 'messages', 'notifications'],
};

// Best-effort: pulls the account a Follow/Subscribe order is about out of a
// profile link, so the follow ledger ("this engager already follows that
// account") has something to match on. Returns null when the link isn't
// clearly a profile — callers must treat null as "unknown", never as an error.
export function extractProfileHandle(platform, link) {
  const url = parseUrl(link);
  if (!url) return null;
  const segs = url.pathname.split('/').filter(Boolean);
  if (!segs.length) return null;
  let first;
  try {
    first = decodeURIComponent(segs[0]);
  } catch {
    first = segs[0];
  }
  const lower = first.toLowerCase();

  if (platform === 'tiktok') return lower.startsWith('@') ? lower : null;

  if (platform === 'youtube') {
    if (lower.startsWith('@')) return lower;
    if (['channel', 'c', 'user'].includes(lower) && segs[1]) return `${lower}/${segs[1].toLowerCase()}`;
    return null;
  }

  if (platform === 'facebook' && lower === 'profile.php') {
    const id = url.searchParams.get('id');
    return id ? `profile.php?id=${id}` : null;
  }

  if (['instagram', 'facebook', 'x'].includes(platform)) {
    if ((NOT_A_PROFILE[platform] || []).includes(lower)) return null;
    return lower;
  }

  return null;
}
