// e.g. FB-5714-A6 — platform prefix, 4 digits, 2 letters/digits.
export function generateTaskCode(platform) {
  const prefix = { facebook: 'FB', instagram: 'IG', tiktok: 'TT', youtube: 'YT', x: 'XT' }[platform] || 'PL';
  const num = Math.floor(1000 + Math.random() * 8999);
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `${prefix}-${num}-${suffix}`;
}
