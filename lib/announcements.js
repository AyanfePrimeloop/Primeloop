// Shared rules for super-admin broadcasts. Pure functions, so the checks that
// decide what people see are easy to test without a database.

export const AUDIENCES = ['engagers', 'clients', 'all'];
export const TITLE_MAX = 80;
export const BODY_MAX = 1000;
export const EXPIRY_OPTIONS = [1, 3, 7, 14, 30]; // days; anything else means "until I stop it"

// True when the announcements table has not been created yet (migration 16
// not run). Callers treat that as "nothing to show" instead of an error.
export function tableMissing(error) {
  if (!error) return false;
  const text = `${error.code || ''} ${error.message || ''}`;
  return /42P01|PGRST205|schema cache|does not exist/i.test(text);
}

// Only https links or paths inside the app. Blocks javascript:, data: and
// protocol-relative URLs, so a message can never carry a script.
export function safeLink(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  if (u.startsWith('/') && !u.startsWith('//')) return u.slice(0, 300);
  if (/^https:\/\/[^\s]+$/i.test(u)) return u.slice(0, 300);
  return undefined; // present but not allowed
}

export function validateAnnouncement(input) {
  const audience = input?.audience;
  const title = String(input?.title || '').trim();
  const body = String(input?.body || '').trim();
  const link = safeLink(input?.linkUrl);
  const linkLabel = String(input?.linkLabel || '').trim();

  if (!AUDIENCES.includes(audience)) return { error: 'Choose who this is for.' };
  if (!title) return { error: 'Add a title.' };
  if (title.length > TITLE_MAX) return { error: `Keep the title under ${TITLE_MAX} characters.` };
  if (!body) return { error: 'Write the message.' };
  if (body.length > BODY_MAX) return { error: `Keep the message under ${BODY_MAX} characters.` };
  if (link === undefined) return { error: 'The link must start with https:// (or be a page inside Primeloop like /engager/dashboard).' };

  const days = Number(input?.expiresInDays);
  const expiresAt = EXPIRY_OPTIONS.includes(days) ? new Date(Date.now() + days * 86400000).toISOString() : null;

  return {
    value: {
      audience,
      title,
      body,
      link_url: link || null,
      link_label: link ? (linkLabel || 'Open').slice(0, 40) : null,
      expires_at: expiresAt,
    },
  };
}

// Which of the fetched rows this person should see. `roles` is any of
// 'engagers' / 'clients' for the accounts the signed-in login owns.
export function visibleAnnouncements(rows, roles, now = new Date()) {
  const mine = new Set(roles);
  return (rows || []).filter((a) => {
    if (!a.active) return false;
    if (a.expires_at && new Date(a.expires_at) <= now) return false;
    return a.audience === 'all' || mine.has(a.audience);
  });
}

export function announcementStatus(a, now = new Date()) {
  if (!a.active) return 'Stopped';
  if (a.expires_at && new Date(a.expires_at) <= now) return 'Expired';
  return 'Showing';
}

// A plain-text version to paste into WhatsApp (Channel, broadcast list or a chat).
export function whatsappText(a) {
  const lines = [`*${a.title}*`, '', a.body];
  if (a.link_url) {
    const full = a.link_url.startsWith('/') ? `https://primeloop.app${a.link_url}` : a.link_url;
    lines.push('', full);
  }
  return lines.join('\n');
}
