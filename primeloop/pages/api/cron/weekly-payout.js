import { supabaseAdmin } from '../../../lib/supabaseAdmin';
const { runWeeklyPayout } = require('../../../lib/runWeeklyPayout');

// This route is called automatically by Vercel Cron (see vercel.json for the
// schedule) — not by any page in the app, and not meant to be clicked by a
// person. It's protected so a stranger can't trigger real bank transfers by
// guessing the URL: Vercel automatically sends "Authorization: Bearer
// <CRON_SECRET>" when it calls a cron route, as long as you've set a
// CRON_SECRET environment variable — see GETTING_STARTED.md for the setup step.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = await runWeeklyPayout(supabaseAdmin, process.env.PAYSTACK_SECRET_KEY);
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
