// Google Analytics 4, wired the same way as lib/metaPixel.js — a page-view
// tracker plus the two events that matter for conversion reporting: an
// engager signing up, and a client completing a paid order. Safe to deploy
// without a measurement ID; everything below silently no-ops until
// NEXT_PUBLIC_GA_MEASUREMENT_ID is set.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function gaPageView(url) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

export function gaSignUp() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'sign_up', { method: 'engager' });
}

export function gaTrial() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'generate_lead', { method: 'free_trial' });
}

export function gaPurchase(valueNaira, transactionId) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'purchase', {
    value: valueNaira,
    currency: 'NGN',
    transaction_id: transactionId,
  });
}
