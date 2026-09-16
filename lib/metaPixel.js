// Loads the Meta Pixel and exposes small helpers for the two events that
// actually matter for ad optimization: someone signing up as an engager
// (a "Lead"), and a client completing a paid order (a "Purchase").
// Safe to deploy before you have a Pixel ID — everything below silently
// does nothing until NEXT_PUBLIC_META_PIXEL_ID is set.

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function pixelPageView() {
  if (!PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

export function pixelLead() {
  if (!PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Lead');
}

export function pixelPurchase(valueNaira) {
  if (!PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'Purchase', { value: valueNaira, currency: 'NGN' });
}
