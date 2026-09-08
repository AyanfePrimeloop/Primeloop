// Manual fallback — run this from your computer with `npm run payout-run` if
// you ever need to trigger a payout outside the normal Friday schedule.
// The automatic version runs itself via Vercel Cron (see vercel.json).
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { runWeeklyPayout } = require('../lib/runWeeklyPayout');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

runWeeklyPayout(supabaseAdmin, process.env.PAYSTACK_SECRET_KEY)
  .then((results) => {
    results.forEach((r) => console.log(`${r.engagerCode}: ₦${r.amount} — ${r.status}`));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
