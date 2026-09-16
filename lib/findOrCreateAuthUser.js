/**
 * Returns the auth_user_id for this email — reusing an existing login if
 * one already exists (e.g. someone who's already an engager placing their
 * first client order), or creating a new one if not.
 *
 * This matters because Supabase requires unique emails across all logins:
 * without this check, creating a second auth account for an email that's
 * already registered fails silently, leaving that role's record with no
 * login attached — which is why "switch dashboard" couldn't find both
 * roles for the same person before this fix.
 */
export async function findOrCreateAuthUser(supabaseAdmin, email) {
  try {
    const { data } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
    if (data?.user?.id) return data.user.id;
  } catch (e) {
    // Falls through to the lookup below — most likely this email already exists.
  }

  // Email already registered under another role — find that same login
  // instead of leaving this new role disconnected from any account.
  let page = 1;
  while (page <= 20) { // sane upper bound so this can never loop forever
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) break; // last page
    page++;
  }

  return null;
}
