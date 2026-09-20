// Business rules shared by the server and the pages. Both read the same
// NEXT_PUBLIC_ variable, so changing it in Vercel changes the site wording and
// the payout run together. Set a value of 0 to switch the minimum off.

function positiveOrZero(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Earnings below this roll over to the next Friday instead of being paid,
// because every bank transfer has a fixed fee that can exceed a tiny payout.
export const MIN_PAYOUT = positiveOrZero(process.env.NEXT_PUBLIC_MIN_PAYOUT_NAIRA, 500);

// Smallest order a client can pay for. The free trial covers "try it small".
export const MIN_ORDER = positiveOrZero(process.env.NEXT_PUBLIC_MIN_ORDER_NAIRA, 500);
