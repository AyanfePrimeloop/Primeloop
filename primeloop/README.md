# Primeloop — Deployment Guide

This is the real, working codebase — not a mockup. It needs a few accounts set up
(all free to start) before it goes live. Follow these steps in order.

## What's already built
- **Real login** for both sides — admins log in at `/login`, engagers sign up at `/signup`
  and log in at `/login`. Every admin API route and every submission now checks who's
  actually logged in (`lib/requireAdmin.js`, `lib/requireEngager.js`) instead of trusting
  a typed code — nobody can act as someone else anymore.
- Database schema (`supabase/schema.sql`) — engagers, clients, tasks, submissions,
  payouts, pricing rules, and the follow-ledger that solves the "can't follow twice" problem
- **Migration 2** (`supabase/migration_2_verification_and_onboarding.sql`) — the
  verification toggle and engager onboarding test system
- **Migration 3** (`supabase/migration_3_auth.sql`) — the admins table
- **Migration 4** (`supabase/migration_4_link_check.sql`) — adds automated post-link
  checking. When a task is created, the link is checked automatically (does it load?
  does the domain match the platform paid for?). Good links open immediately; bad ones
  go to a new **"Link reviews"** section on `/admin/review` instead of ever reaching
  engagers (`lib/checkPostLink.js`).
- **Admin review queue** at `/admin/review` — shows the actual screenshot, AI reasoning,
  attempt count, one click to approve/reject
- Screenshot storage via Supabase Storage (`lib/storage.js`)
- Client order builder → Paystack checkout → automatic task creation on payment
- Engager dashboard and onboarding tests, gated by login and by platform verification
- Client-side screenshot compression before every AI check (`lib/compressImage.js`)
- Admin pricing management, editable per platform
- Weekly automated payout script via Paystack Transfers

## What still needs your input before going live
- **You need to make yourself an admin manually, once** — there's no self-serve signup
  for admin accounts on purpose. Full instructions in `GETTING_STARTED.md`, Step 9.
- **Set your real onboarding test posts** at `/admin/onboarding-tests` once deployed and logged in.
- The recruitment landing page and the fuller dashboard UI from the earlier prototype
  aren't ported into React yet — the pages above are functional but simpler.

## New here? Start with GETTING_STARTED.md instead of this file.
It walks through every single click, assuming zero coding background.

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once created, go to **SQL Editor** → New Query, paste the entire contents of
   `supabase/schema.sql`, and click Run — choose **"Run and enable RLS"** if prompted.
3. Run a second query with the entire contents of
   `supabase/migration_2_verification_and_onboarding.sql` — this adds the verification
   toggle and onboarding test tables.
3b. Run a third query with the entire contents of `supabase/migration_3_auth.sql` —
    this adds the admins table.
3c. Run a fourth query with the entire contents of `supabase/migration_4_link_check.sql`
    — this adds automated post-link checking.

### Step 1a — Create the screenshot storage bucket

1. In Supabase, go to **Storage** → New bucket.
2. Name it exactly `submission-screenshots` and set it to **Public**
   (screenshots aren't sensitive data, and Public keeps retrieval simple for the review queue).
3. That's it — `lib/storage.js` handles the rest automatically.

4. Go to **Project Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY` (keep this secret, never share it)

## Step 2 — Get your Paystack keys

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys & Webhooks.
2. Copy the **Test Secret Key** and **Test Public Key** first (use these until everything works,
   then switch to Live keys).
3. Once deployed (Step 5), come back here and set the webhook URL to:
   `https://your-app.vercel.app/api/paystack/webhook`

## Step 3 — Get your Anthropic API key (for AI screenshot verification)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.
2. Copy it — this is `ANTHROPIC_API_KEY`.

## Step 4 — Fill in your environment variables

1. Copy `.env.example` to a new file called `.env.local`.
2. Paste in the values you collected in Steps 1–3.

## Step 5 — Deploy to Vercel

1. Push this folder to a GitHub repository (ask me if you need help with this part —
   it's a one-time setup).
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo.
3. In the deployment settings, add all the same environment variables from `.env.local`.
4. Click Deploy. Vercel will install everything and give you a live URL.

## Step 6 — Test it end-to-end

1. Visit your live URL — you should see the client order builder.
2. Place a test order using a Paystack **test card** (Paystack's docs list test card numbers).
3. Confirm a task appears in your Supabase `tasks` table after payment.
4. Go to `/engager/dashboard`, use a test engager code (insert one manually into the
   `engagers` table for now), and submit a screenshot to confirm the AI check runs.

## Step 7 — Set up the weekly payout

Two options:
- **Manual for now**: run `npm run payout-run` yourself every Friday from your computer
  (with `.env.local` filled in).
- **Automatic**: set up a Vercel Cron Job that hits an API route wrapping the same
  script, scheduled for every Friday. Ask me and I'll add this route.

---

## Getting help

If any step above doesn't work exactly as described, share the error message with me
and I'll fix the code directly — most deployment hiccups are one small config change.
