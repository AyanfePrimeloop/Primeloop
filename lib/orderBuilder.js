import { MIN_ORDER } from './payoutRules';
import { capacityFor } from './capacity';
import { isKnownPlatform, linkMismatchMessage, normalizeLink, linkMatchesPlatform, extractProfileHandle } from './platformDomains';

export const MAX_ITEMS = 12;
export const MAX_QUANTITY = 10000; // per line item

function cleanHandle(handle) {
  return typeof handle === 'string' && handle.trim() ? handle.trim().toLowerCase().slice(0, 100) : null;
}


/**
 * Turns "this platform, this post, these engagements" into a priced order.
 * The single place order pricing lives: the client checkout and the admin
 * "place an order for a client" tool both call this, so they can never price
 * differently. Prices come from pricing_rules on the server, never from the
 * browser.
 *
 * Returns { link, amountTotal, lineItems, extraInstructions } on success, or
 * { fail: { status, body } } with the exact response to send back.
 *
 * `engager_payout` on each line becomes tasks.price_per_unit (what engagers
 * see and what the weekly payout pays), so it must be the engager's rate,
 * never the client's price.
 */
export async function buildOrder(db, { platform, postLink, items, specialInstructions }) {
  const fail = (status, body) => ({ fail: { status, body } });

  if (!isKnownPlatform(platform)) return fail(400, { error: 'Please choose a platform.' });
  const link = normalizeLink(postLink);
  if (!link) return fail(400, { error: 'Please enter a valid post link.' });
  if (!linkMatchesPlatform(link, platform)) return fail(400, { error: linkMismatchMessage(platform) });

  if (!Array.isArray(items) || items.length > MAX_ITEMS) return fail(400, { error: 'Too many items in one order.' });
  // Merge repeated actions, and reject anything that isn't a whole number of
  // engagements from 1 up to a sane maximum. A negative quantity on one line
  // would quietly discount every other line.
  const merged = new Map();
  for (const item of items) {
    const q = item?.quantity;
    if (typeof item?.action !== 'string' || !Number.isInteger(q) || q < 1 || q > MAX_QUANTITY) {
      return fail(400, { error: `Each engagement needs a whole-number quantity between 1 and ${MAX_QUANTITY.toLocaleString()}.` });
    }
    const existing = merged.get(item.action);
    merged.set(item.action, {
      action: item.action,
      quantity: (existing?.quantity || 0) + q,
      targetAccountHandle: existing?.targetAccountHandle || cleanHandle(item.targetAccountHandle),
    });
  }
  const orderItems = [...merged.values()];
  if (orderItems.some((i) => i.quantity > MAX_QUANTITY)) {
    return fail(400, { error: `Each engagement needs a whole-number quantity between 1 and ${MAX_QUANTITY.toLocaleString()}.` });
  }

  const extraInstructions = typeof specialInstructions === 'string' ? specialInstructions.trim().slice(0, 500) : '';

  const { data: rules, error: rulesErr } = await db
    .from('pricing_rules')
    .select('*')
    .eq('platform', platform)
    .eq('active', true)
    .in('action', orderItems.map((i) => i.action));
  if (rulesErr) return fail(500, { error: rulesErr.message });

  let amountTotal = 0;
  const lineItems = [];
  for (const item of orderItems) {
    const rule = rules.find((r) => r.action === item.action);
    if (!rule) return fail(400, { error: `Unknown action: ${item.action}` });

    let targetAccountHandle = null;
    const isFollow = ['follow', 'subscribe'].includes(item.action);
    if (isFollow) {
      // The follow ledger ("this engager already follows that account") can
      // only work if we know which account. The order form never asks for it
      // separately, so read it off the profile link they pasted.
      targetAccountHandle = item.targetAccountHandle || extractProfileHandle(platform, link);
    }
    // Every action, not just follows: one engager can do each thing once on a
    // post, so a quantity beyond the people we can actually reach would stall.
    const cap = await capacityFor(db, { platform, action: item.action, link, handle: targetAccountHandle });
    if (item.quantity > cap.available) {
      const what = isFollow ? 'follow' : item.action;
      return fail(409, {
        error: cap.available > 0
          ? `We can deliver up to ${cap.available} ${what}${cap.available === 1 ? '' : 's'} on this ${isFollow ? 'account' : 'post'} right now. Please reduce the quantity to ${cap.available} or fewer.`
          : `We can't take more ${what} orders on this ${isFollow ? 'account' : 'post'} right now. Please try a different post, or check back later.`,
        maxAvailable: cap.available,
        action: item.action,
      });
    }

    amountTotal += rule.client_price * item.quantity;
    lineItems.push({
      action: item.action,
      quantity: item.quantity,
      targetAccountHandle,
      engager_payout: rule.engager_payout,
    });
  }
  if (!(amountTotal > 0)) return fail(400, { error: 'This order has no payable items.' });
  if (amountTotal < MIN_ORDER) {
    return fail(400, { error: `The minimum order is ₦${MIN_ORDER.toLocaleString()}. Add a little more, or choose a starter pack.` });
  }

  return { link, amountTotal, lineItems, extraInstructions };
}
