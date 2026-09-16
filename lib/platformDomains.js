// Single source of truth for "which domains count as platform X", shared by
// the client-side order form (instant feedback, before payment) and
// checkPostLink.js (the authoritative server-side check after payment).
// Keeping one list means the two can never quietly drift apart.
export const PLATFORM_DOMAINS = {
  facebook: ['facebook.com', 'fb.watch'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['twitter.com', 'x.com'],
};

// Exact host or real subdomain only — a plain .includes() would let
// "facebook.com.attacker.example" through.
export function isAllowedHost(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function linkMatchesPlatform(link, platform) {
  const url = parseUrl(link);
  if (!url) return false;
  const allowedDomains = PLATFORM_DOMAINS[platform] || [];
  return allowedDomains.some((d) => isAllowedHost(url.hostname, d));
}

// Lenient parse: tolerates a link pasted without "https://".
export function parseUrl(link) {
  try {
    return new URL(link);
  } catch {}
  try {
    return new URL(`https://${link}`);
  } catch {}
  return null;
}
