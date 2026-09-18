import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getOrCreateClient } from '../../../lib/clientRecord';
import { checkPostLink } from '../../../lib/checkPostLink';
import { notifyEngagersOfTask } from '../../../lib/notifyEngagersOfTask';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { isValidEmail, normalizeEmail, escapeLike } from '../../../lib/validation';
import { isKnownPlatform, platformLabel, platformWithArticle, linkMismatchMessage, normalizeLink, linkMatchesPlatform } from '../../../lib/platformDomains';
import { trialActionsFor, trialWeeklyCap, canonicalEmail, canonicalPostKey } from '../../../lib/trial';
import { generateTaskCode } from '../../../lib/taskCode';

// POST { email, platform, postLink } — gives a first-time client a small free
// bundle of real engagement so they can see the proof for themselves.
//
// It runs through the same pipeline as a paid order (client record -> order
// -> tasks -> engager alerts -> screenshot proof -> admin/AI review), just
// without the payment step, so what the client sees is exactly what a
// paying client would see. The order is marked payment_status 'trial' and
// carries amount 0, so it can never be counted as revenue.
//
// Abuse guards: one trial per person (canonical email), one per post
// (canonical link), IP rate limit, a rolling weekly cap across the platform,
// and the same link check as paid orders. The two "one per" rules are
// enforced by UNIQUE constraints in the database, so racing requests can't
// both win. See supabase/migration_11_trials_and_payout_tracking.sql.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = getClientIp(req);
  // Generous enough for many people sharing one mobile-network address.
  const rate = await checkRateLimit(supabaseAdmin, `trial-create:${ip}`, { maxAttempts: 8, windowSeconds: 3600 });
  if (!rate.allowed) {
    return res.status(429).json({ code: 'rate_limited', error: 'Too many attempts from this connection. Please try again in a while, or message us on WhatsApp.' });
  }

  const { email, platform, postLink } = req.body || {};
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!isKnownPlatform(platform)) {
    return res.status(400).json({ error: 'Please choose a platform.' });
  }
  const link = normalizeLink(postLink);
  if (!link) {
    return res.status(400).json({ error: 'Please paste the link to your post.' });
  }
  const label = platformLabel(platform);
  if (!linkMatchesPlatform(link, platform)) {
    return res.status(400).json({ error: linkMismatchMessage(platform) });
  }

  const emailKey = canonicalEmail(cleanEmail);
  const postKey = canonicalPostKey(link);
  if (!emailKey || !postKey) {
    return res.status(400).json({ error: 'Please check your email and post link.' });
  }

  // --- Already had a trial? Already a customer? (friendly messages first;
  //     the database constraints below are the real, race-proof guard) ---
  const { data: byEmail, error: lookupErr } = await supabaseAdmin
    .from('trial_grants')
    .select('id')
    .eq('email_key', emailKey)
    .limit(1);
  if (lookupErr) {
    // Table missing = migration 11 hasn't been run yet.
    return res.status(503).json({ code: 'unavailable', error: "Free trials aren't open yet — please check back soon." });
  }
  if (byEmail?.length) {
    return res.status(409).json({ code: 'already_used', error: "You've already claimed your free trial with this email. You can order more anytime." });
  }
  const { data: byPost } = await supabaseAdmin.from('trial_grants').select('id').eq('post_link_key', postKey).limit(1);
  if (byPost?.length) {
    return res.status(409).json({ code: 'post_used', error: 'A free trial has already been used on this post. Try a different post, or order directly.' });
  }

  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('id')
    .ilike('email', escapeLike(cleanEmail))
    .limit(1);
  if (existingClient?.length) {
    const { count: priorOrders } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', existingClient[0].id);
    if (priorOrders > 0) {
      return res.status(409).json({ code: 'existing_client', error: "Free trials are for first-time clients — you've already ordered with us. Log in to track your orders, or order more anytime." });
    }
  }

  // --- Weekly cap across the whole platform (rolling 7 days) ---
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: usedThisWeek } = await supabaseAdmin
    .from('trial_grants')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo);
  if ((usedThisWeek || 0) >= trialWeeklyCap()) {
    return res.status(429).json({
      code: 'cap_reached',
      error: "This week's free trials are all taken. Spots free up as the week rolls forward — check back tomorrow, or order now.",
    });
  }

  // --- What's in the bundle, at today's real payout rates ---
  const wanted = trialActionsFor(platform);
  const { data: rules } = await supabaseAdmin
    .from('pricing_rules')
    .select('action, engager_payout')
    .eq('platform', platform)
    .eq('active', true)
    .in('action', wanted.map((w) => w.action));
  const items = wanted.filter((w) => rules?.some((r) => r.action === w.action));
  if (!items.some((i) => i.action === 'like')) {
    return res.status(503).json({ code: 'unavailable', error: `Free trials aren't available for ${label} right now.` });
  }

  // --- Link check. A link that's definitely bad shouldn't use up the
  //     person's one trial; a merely-uncertain one (timeout, platform
  //     hiccup) goes to the same human review queue paid orders use. ---
  const linkCheck = await checkPostLink(link, platform);
  if (!linkCheck.ok) {
    if (linkCheck.code === 'not_found') {
      return res.status(400).json({ error: "We couldn't find that post. Check the link, and make sure the post is public." });
    }
    if (['invalid', 'domain', 'redirect'].includes(linkCheck.code)) {
      return res.status(400).json({ error: `That doesn't look like a link to ${platformWithArticle(platform)} post. Please check it and try again.` });
    }
  }

  // --- Create the client, then claim the trial. Inserting the grant is the
  //     atomic step: if two requests race, exactly one insert succeeds. ---
  const { client, error: clientErr } = await getOrCreateClient(supabaseAdmin, cleanEmail);
  if (clientErr || !client) {
    return res.status(500).json({ error: "We couldn't set up your account. Please try again in a moment." });
  }

  const { data: grant, error: grantErr } = await supabaseAdmin
    .from('trial_grants')
    .insert({ client_id: client.id, email_key: emailKey, post_link_key: postKey, platform, ip })
    .select()
    .single();
  if (grantErr) {
    if (grantErr.code === '23505') {
      return res.status(409).json({ code: 'already_used', error: 'A free trial has already been claimed for this email or this post.' });
    }
    return res.status(500).json({ error: "We couldn't start your trial. Please try again in a moment." });
  }

  const undo = async (orderId) => {
    if (orderId) await supabaseAdmin.from('orders').delete().eq('id', orderId);
    await supabaseAdmin.from('trial_grants').delete().eq('id', grant.id);
  };

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      client_id: client.id,
      platform,
      post_link: link,
      amount_total: 0,
      paystack_reference: `TRIAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      payment_status: 'trial',
    })
    .select()
    .single();
  if (orderErr || !order) {
    await undo(null);
    return res.status(500).json({ error: "We couldn't start your trial. Please try again in a moment." });
  }

  const created = [];
  for (const item of items) {
    const rule = rules.find((r) => r.action === item.action);
    let task = null;
    for (let attempt = 0; attempt < 5 && !task; attempt++) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          task_code: generateTaskCode(platform),
          order_id: order.id,
          client_id: client.id,
          platform,
          post_link: link,
          action: item.action,
          quantity_needed: item.quantity,
          price_per_unit: rule.engager_payout,
          // A trial is somebody's first impression — no early-access window,
          // every verified engager can pick it up immediately.
          tier_gate_until: null,
          special_instructions: ['comment', 'reply'].includes(item.action)
            ? 'Free trial: write a genuine, relevant comment on this post — a full sentence, not just an emoji.'
            : null,
          status: linkCheck.ok ? 'open' : 'pending_review',
          link_check_reason: linkCheck.ok ? null : linkCheck.reason,
        })
        .select()
        .single();
      if (data) task = data;
      else if (error?.code !== '23505') break;
    }
    if (task) created.push(task);
  }

  if (!created.length) {
    await undo(order.id);
    return res.status(500).json({ error: "We couldn't start your trial. Please try again in a moment." });
  }

  await supabaseAdmin.from('trial_grants').update({ order_id: order.id }).eq('id', grant.id);

  if (linkCheck.ok) {
    await Promise.allSettled(
      created.map((task) =>
        notifyEngagersOfTask(supabaseAdmin, task).catch((e) => console.error('WhatsApp notify failed:', e.message))
      )
    );
  }

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    platform,
    items: created.map((t) => ({ action: t.action, quantity: t.quantity_needed })),
    // True when the link couldn't be auto-verified: a person will look at it
    // before engagers see it, so the delivery may start a little later.
    linkPending: !linkCheck.ok,
  });
}
