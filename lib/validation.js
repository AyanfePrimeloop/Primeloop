// Deliberately simple checks — not trying to fully validate per RFC 5322,
// just catching obvious garbage input before it hits the database or
// triggers a Paystack/Supabase API call.
export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Phone keyboards love to capitalise the first letter of an email, and
// "Ayo@x.com" vs "ayo@x.com" must be the same person. Everything that stores
// or looks up a client by email goes through this first.
export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// In a SQL/PostgREST ILIKE, "_" and "%" are wildcards — and "_" is very
// common in real email addresses ("john_doe@..."). Escape them so an email
// lookup matches that exact address and never a lookalike.
export function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function isValidNigerianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  // Accepts 11-digit local format (080...) or 13-digit with country code (234...)
  return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
}
