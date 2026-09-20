// Starter packs: a ready-made mix of engagements for a budget. The mix is
// spread over the actions each platform actually offers, and priced from the
// live pricing rules with no discount, so a pack is a shortcut, not a sale.

export const PACKS = [
  { id: 'starter', name: 'Starter', budget: 1000 },
  { id: 'growth', name: 'Growth', budget: 2500 },
  { id: 'boost', name: 'Boost', budget: 5000 },
];

// Share of the budget per action. The three actions differ by platform.
const DEFAULT_MIX = [['like', 0.45], ['comment', 0.35], ['share', 0.2]];
const MIXES = {
  x: [['like', 0.45], ['reply', 0.35], ['repost', 0.2]],
  youtube: [['like', 0.45], ['comment', 0.35], ['watch', 0.2]],
};

/**
 * Returns [{ action, qty, price }] for this platform and budget, using only
 * actions that have an active price. Empty if none of the pack's actions exist.
 */
export function buildPack(rules, platform, budget) {
  const mix = MIXES[platform] || DEFAULT_MIX;
  const lines = [];
  for (const [action, share] of mix) {
    const rule = rules.find((r) => r.action === action);
    if (!rule || !(Number(rule.client_price) > 0)) continue;
    const price = Number(rule.client_price);
    lines.push({ action, price, qty: Math.max(1, Math.round((budget * share) / price)) });
  }
  // Rounding can land a little under the pack's price. Top up with the first
  // (cheapest) action so a pack never delivers less than it says.
  let guard = 0;
  while (lines.length && packTotal(lines) < budget && guard++ < 1000) lines[0].qty += 1;
  return lines;
}

const PLURALS = { reply: 'replies', watch: 'views' };

/** "1 like", "23 replies", "13 views": readable labels for a line. */
export function packLineLabel(line) {
  const noun = line.action === 'watch' ? 'view' : line.action;
  if (line.qty === 1) return `1 ${noun}`;
  return `${line.qty} ${PLURALS[line.action] || noun + 's'}`;
}

export const packTotal = (lines) => lines.reduce((t, l) => t + l.qty * l.price, 0);
