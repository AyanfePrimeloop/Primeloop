function generateEngagerCode(fullName) {
  const initials = (fullName || 'XX').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'XX';
  const num = Math.floor(1000 + Math.random() * 8999);
  return `EN${num}${initials}`;
}

/**
 * Creates the engager profile for an existing login. Shared by the signup
 * route (brand-new login) and the "become an engager" route (someone who
 * already has a login, e.g. from placing an order as a client).
 *
 * Every engager can share their referral link from day one and earn the
 * referral bonus. The relationship is recorded here; the bonus itself is only
 * created later, when the referred engager reaches their milestone (see
 * regularSubmissionEffects.js), so a signup that never does real work earns
 * nothing.
 */
export async function createEngager(supabaseAdmin, { authUserId, fullName, whatsapp, referredByCode }) {
  // Generate a code and retry on the rare chance of a collision
  let code = generateEngagerCode(fullName);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabaseAdmin.from('engagers').select('id').eq('code', code).maybeSingle();
    if (!clash) break;
    code = generateEngagerCode(fullName);
  }

  let referrer = null;
  if (referredByCode) {
    const { data: found } = await supabaseAdmin.from('engagers').select('id').eq('code', referredByCode).maybeSingle();
    if (found) referrer = found;
  }

  const { data: engager, error } = await supabaseAdmin
    .from('engagers')
    .insert({
      auth_user_id: authUserId,
      code,
      full_name: fullName,
      whatsapp,
      referred_by: referrer?.id || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  return { engager };
}
