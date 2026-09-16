-- ============================================================
-- MIGRATION 6: Engager referral system
-- Run this in Supabase SQL Editor AFTER migration_5
-- ============================================================

-- One row per referral relationship. A referrer's own engager code IS their
-- referral code — no separate code needed. The bonus only pays out once the
-- referred engager reaches the milestone of approved tasks, so it can't be
-- gamed with fake signups that never do any real work.
create table referral_bonuses (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references engagers(id),
  referred_id uuid not null unique references engagers(id), -- one bonus per referred engager
  milestone_tasks int not null default 10,
  bonus_amount numeric not null default 200,
  status text not null default 'pending' check (status in ('pending', 'earned_unpaid', 'paid')),
  earned_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_referral_bonuses_referrer on referral_bonuses(referrer_id, status);

alter table referral_bonuses enable row level security;

-- A referrer can see their own referral bonuses (for the dashboard stat)
create policy "engagers see own referral bonuses" on referral_bonuses
  for select using (
    referrer_id in (select id from engagers where auth_user_id = auth.uid())
  );

-- Policy note: only Gold/Platinum engagers can refer (per your tier ladder's
-- "referral code unlocked" benefit). This is enforced in application code
-- at signup time (pages/api/engagers/register.js), not here — RLS can't
-- easily express "check the referrer's tier at the time of signup" cleanly,
-- and the check only matters once, at creation.
