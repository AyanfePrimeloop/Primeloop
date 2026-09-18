import { useEffect, useState } from 'react';

// The cheapest per-engagement price a client can currently pay, read live from
// the pricing table — so "from ₦X" in the marketing copy can never go stale
// when prices are edited in the admin. Null until loaded (callers should fall
// back to copy that doesn't quote a number).
export function useMinPrice() {
  const [min, setMin] = useState(null);
  useEffect(() => {
    fetch('/api/admin/pricing')
      .then((r) => r.json())
      .then((d) => {
        const prices = (d.rules || []).map((r) => Number(r.client_price)).filter((n) => n > 0);
        if (prices.length) setMin(Math.min(...prices));
      })
      .catch(() => {});
  }, []);
  return min;
}
