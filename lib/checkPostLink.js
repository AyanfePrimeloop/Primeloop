import { PLATFORM_DOMAINS, isAllowedHost } from './platformDomains';

/**
 * A lightweight, automatic sanity check on a client's post link — this is
 * NOT a substitute for a human glancing at genuinely ambiguous cases, it
 * just catches the obvious problems automatically so most good links never
 * need a human at all:
 *  - the link doesn't even load (typo, deleted post, dead domain)
 *  - the domain doesn't match the platform they're paying for
 *    (e.g. a TikTok link submitted under a Facebook order)
 *
 * Returns { ok: true } or { ok: false, reason: '...' }
 */
export async function checkPostLink(postLink, platform) {
  let url;
  try {
    url = new URL(postLink);
  } catch {
    return { ok: false, reason: 'This is not a valid web link.' };
  }

  // Exact host or real subdomain only — a plain .includes() would let
  // "facebook.com.attacker.example" through, which then gets fetched below.
  // That's an SSRF oracle handed to anyone who can place an order, so the
  // domain check has to be as strict as the fetch that follows it.
  const allowedDomains = PLATFORM_DOMAINS[platform] || [];
  const matchesDomain = allowedDomains.some((d) => isAllowedHost(url.hostname, d));
  if (!matchesDomain) {
    return { ok: false, reason: `Link domain doesn't look like ${platform} (got ${url.hostname}).` };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(postLink, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);

    // A redirect could otherwise be used to land the server's outbound
    // request on a host that never would have passed the check above.
    const finalHost = new URL(res.url).hostname;
    if (!allowedDomains.some((d) => isAllowedHost(finalHost, d))) {
      return { ok: false, reason: `Link redirected away from ${platform} (ended up at ${finalHost}).` };
    }

    if (res.status === 404 || res.status === 410) {
      return { ok: false, reason: `The link returned a "not found" error (status ${res.status}).` };
    }
    if (res.status >= 500) {
      return { ok: false, reason: `The link's server returned an error (status ${res.status}) — may be temporary.` };
    }
    // A 200-399 range is treated as "loads fine" — we deliberately don't try
    // to parse page content here, since most platforms serve a login wall to
    // logged-out requests regardless of whether the post itself is valid.
    // Anything genuinely wrong that slips past this shows up when engagers
    // try the task and their proof gets rejected — which is a much stronger
    // signal than guessing from an unauthenticated page fetch.
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `Couldn't reach the link at all (${err.message}).` };
  }
}
