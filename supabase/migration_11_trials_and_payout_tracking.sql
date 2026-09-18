-- ============================================================
-- MIGRATION 11: Free trials + safe payout tracking
-- Run this in Supabase SQL Editor AFTER migration_10.
-- It is safe to run more than once.
-- ============================================================

-- ------------------------------------------------------------
-- 1. FREE TRIALS
-- One row per free trial ever granted. The two UNIQUE constraints are what
-- actually enforce "one free trial per person" and "one free trial per post" —
-- the database rejects a second attempt even if two requests race each other.
-- ------------------------------------------------------------
create table if not exists trial_grants (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id),
  order_id uuid references orders(id),
  email_key text not null,        -- canonical email: lowercase, +tags stripped, gmail dots stripped
  post_link_key text not null,    -- canonical post URL, so the same post can't be re-used
  platform text not null,
  ip text,
  created_at timestamptz not null default now(),
  unique (email_key),
  unique (post_link_key)
);

create index if not exists idx_trial_grants_created on trial_grants(created_at);

-- Only ever touched through the service-role key (server-side).
alter table trial_grants enable row level security;

-- ------------------------------------------------------------
-- 2. PAYOUT TRACKING
-- Until now a payout run just paid "everything approved in the last 7 days",
-- with nothing recording what had already been paid. That meant:
--   - running the manual payout script on top of the Friday cron paid
--     everyone twice,
--   - an engager with no bank details on Friday (or a failed transfer) was
--     never paid for that week at all.
-- Each approved submission (and referral bonus) now records which payout
-- covered it, so a run only ever pays what hasn't been paid yet, and anything
-- skipped or failed is picked up automatically next time.
-- ------------------------------------------------------------
alter table submissions add column if not exists payout_id uuid references payouts(id);
alter table referral_bonuses add column if not exists payout_id uuid references payouts(id);

create index if not exists idx_submissions_unpaid
  on submissions (final_status, payout_id);

-- Backfill: anything already covered by a payout that was actually paid is
-- marked as paid, so the very first run after this migration doesn't pay
-- last month's work a second time. Approved work NOT covered by any paid
-- payout stays unpaid on purpose — that's exactly what the next run should pay.
update submissions s
set payout_id = p.id
from payouts p
where s.payout_id is null
  and s.final_status = 'approved'
  and p.status = 'paid'
  and p.engager_id = s.engager_id
  and s.reviewed_at::date between p.period_start and p.period_end;

update referral_bonuses b
set payout_id = p.id
from payouts p
where b.payout_id is null
  and b.status = 'paid'
  and p.status = 'paid'
  and p.engager_id = b.referrer_id
  and b.paid_at::date between p.period_start and p.period_end;
