// Starter packs: the same number of each of three engagements, priced from the
// live pricing rules with no discount, so a pack is a shortcut, not a sale.
// They are sized to what can really be delivered: each engager can do an action
// once per post, so a pack can be no bigger than the engagers we have (the order
// page switches a pack off when it is too big for the platform right now).

export const PACKS = [
  { id: 'starter', name: 'Starter', budget: 500 },
  { id: 'growth', name: 'Growth', budget: 750 },
  { id: 'boost', name: 'Boost', budget: 1000 },
];

// The three actions in a pack. They differ by platform.
const DEFAULT_MIX = ['like', 'comment', 'share'];
const MIXES = {
  x: ['like', 'reply', 'repost'],
  youtube: ['like', 'comment', 'watch'],
};

/**
 * Returns [{ action, qty, price }] for this platform and budget, using only
 * actions that have an active price. Empty if none of the pack's actions exist.
 */
export function buildPack(rules, platform, budget) {
  const mix = MIXES[platform] || DEFAULT_MIX;
  const lines = [];
  for (const action of mix) {
    const rule = rules.find((r) => r.action === action);
    if (!rule || !(Number(rule.client_price) > 0)) continue;
    lines.push({ action, price: Number(rule.client_price), qty: 1 });
  }
  // The same quantity of each, as many as the budget buys.
  const each = Math.max(1, Math.floor(budget / (lines.reduce((t, l) => t + l.price, 0) || 1)));
  lines.forEach((l) => (l.qty = each));
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
