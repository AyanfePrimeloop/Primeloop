// How many of an engagement can genuinely be delivered right now.
//
// One engager can only do one action once on one post (a second "like" is not
// a second like), so a task for N likes needs N DIFFERENT engagers who are
// verified on that platform. Selling more than the pool can deliver means
// orders that stall and have to be refunded. This is the one place that works
// out how many are really available; the client checkout, the admin order tool
// and the order page's "up to N" hint all use it.
//
//   available = (verified, active engagers on the platform, scaled by how many
//                actually respond) - engagers who already did this on this post
//               - places already promised to other open orders on this post
//
// Not every verified engager answers every task, so the pool is scaled by
// ORDER_CAPACITY_FACTOR (default 0.6: about 22 of 35 Facebook engagers did
// approved work in a recent two-week window). Raise it as engagers get more
// active, lower it if orders stall.

export const DEFAULT_CAPACITY_FACTOR = 0.6;

export function capacityFactor(env = typeof process !== 'undefined' ? process.env : {}) {
  const n = Number(env.ORDER_CAPACITY_FACTOR);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_CAPACITY_FACTOR;
  return Math.min(1, Math.max(0.1, n));
}

// The arithmetic, on its own so it can be tested without a database.
export function computeCapacity({ eligible, factor, used = 0, reserved = 0 }) {
  const pool = Math.floor(Math.max(0, eligible) * factor);
  return Math.max(0, pool - Math.max(0, used) - Math.max(0, reserved));
}

// Engagers who are active AND verified on this platform.
export async function countEligible(db, platform) {
  const { count } = await db
    .from('engagers')
    .select('id, engager_platform_accounts!inner(platform, verification_status)', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('engager_platform_accounts.platform', platform)
    .eq('engager_platform_accounts.verification_status', 'verified');
  return count || 0;
}

// What is already spoken for on this exact post and action: engagers who have
// already done it (approved or waiting for review), and the places still open
// on earlier orders for the same post.
export async function countTaken(db, platform, action, link) {
  if (!link) return { used: 0, reserved: 0 };
  const { data: tasks } = await db
    .from('tasks')
    .select('id, quantity_needed, quantity_filled, status')
    .eq('platform', platform)
    .eq('action', action)
    .eq('post_link', link);
  if (!tasks?.length) return { used: 0, reserved: 0 };

  const { data: subs } = await db
    .from('submissions')
    .select('task_id, engager_id, final_status')
    .in('task_id', tasks.map((t) => t.id))
    .neq('final_status', 'rejected');

  const used = new Set((subs || []).map((s) => s.engager_id)).size;
  const perTask = {};
  for (const s of subs || []) perTask[s.task_id] = (perTask[s.task_id] || 0) + 1;
  const reserved = tasks
    .filter((t) => t.status === 'open')
    .reduce((sum, t) => sum + Math.max(0, (t.quantity_needed || 0) - Math.max(t.quantity_filled || 0, perTask[t.id] || 0)), 0);
  return { used, reserved };
}

// A follow can only be done once per account, so accounts followed before
// (the follow ledger) also count as already taken.
async function countFollowed(db, platform, handle) {
  if (!handle) return 0;
  const { count } = await db
    .from('follow_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .eq('target_account_handle', handle)
    .eq('still_following', true);
  return count || 0;
}

/**
 * { available, eligible, used, reserved } for one action on one platform.
 * `link` is the normalised post/profile link (omit it for the platform-wide
 * number the order page shows before a link is pasted).
 */
export async function capacityFor(db, { platform, action, link, handle, factor = capacityFactor() }) {
  const eligible = await countEligible(db, platform);
  const taken = await countTaken(db, platform, action, link);
  let used = taken.used;
  if (['follow', 'subscribe'].includes(action)) used = Math.max(used, await countFollowed(db, platform, handle));
  return { available: computeCapacity({ eligible, factor, used, reserved: taken.reserved }), eligible, used, reserved: taken.reserved };
}
