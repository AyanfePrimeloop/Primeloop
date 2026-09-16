// Deliberately simple checks — not trying to fully validate per RFC 5322,
// just catching obvious garbage input before it hits the database or
// triggers a Paystack/Supabase API call.
export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidNigerianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  // Accepts 11-digit local format (080...) or 13-digit with country code (234...)
  return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
}
