/**
 * Simple bucketed rate limiter using Supabase as the store — no Redis or
 * external service needed. Buckets by time window so table growth stays
 * bounded (one row per key per window, not one row per request).
 *
 * @param {string} key - e.g. `order-create:${ip}` or `signup:${ip}`
 * @param {object} opts - { maxAttempts, windowSeconds }
 * @returns {Promise<{allowed: boolean}>}
 */
export async function checkRateLimit(supabaseAdmin, key, { maxAttempts, windowSeconds }) {
  const windowBucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const bucketKey = `${key}:${windowBucket}`;

  const { data: existing } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .eq('bucket_key', bucketKey)
    .maybeSingle();

  if (existing) {
    if (existing.count >= maxAttempts) {
      return { allowed: false };
    }
    await supabaseAdmin.from('rate_limits').update({ count: existing.count + 1 }).eq('id', existing.id);
    return { allowed: true };
  }

  await supabaseAdmin.from('rate_limits').insert({ bucket_key: bucketKey, count: 1 });
  return { allowed: true };
}

/** Best-effort real client IP from Vercel's forwarded header. */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}
