import { findOrCreateAuthUser } from './findOrCreateAuthUser';
import { normalizeEmail, escapeLike } from './validation';

/**
 * Finds the client for this email — or creates one (plus a passwordless login
 * for them) if this is their first time. Used by every place that turns an
 * email address into a client: paid checkout, free trials, admin-created tasks.
 *
 * Emails are matched case-insensitively (and stored lowercase), so
 * "Ayo@x.com" and "ayo@x.com" can never become two separate clients — which
 * used to split someone's orders across two records and lock them out of
 * their own dashboard.
 */
export async function getOrCreateClient(supabaseAdmin, rawEmail) {
  const email = normalizeEmail(rawEmail);

  const { data: rows } = await supabaseAdmin
    .from('clients')
    .select('*')
    .ilike('email', escapeLike(email))
    .order('created_at', { ascending: true })
    .limit(1);
  let client = rows?.[0] || null;

  if (!client) {
    const authUserId = await findOrCreateAuthUser(supabaseAdmin, email);
    const { data: created, error } = await supabaseAdmin
      .from('clients')
      .insert({ email, auth_user_id: authUserId })
      .select()
      .single();
    if (error) return { error };
    return { client: created, created: true };
  }

  // Self-healing: a client row from before the earlier linking fix (or any
  // other edge case) can end up with no login attached. Repair it here
  // instead of letting it stay silently broken.
  if (!client.auth_user_id) {
    const authUserId = await findOrCreateAuthUser(supabaseAdmin, email);
    if (authUserId) {
      const { data: repaired } = await supabaseAdmin
        .from('clients')
        .update({ auth_user_id: authUserId })
        .eq('id', client.id)
        .select()
        .single();
      if (repaired) client = repaired;
    }
  }

  return { client, created: false };
}
