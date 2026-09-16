-- ============================================================
-- MIGRATION 2: Verification toggle + engager onboarding tests
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- VERIFICATION SETTINGS — the admin toggle per platform + action
-- mode: 'manual'     -> AI is skipped entirely, goes straight to human review queue
--       'ai_always'  -> every submission is AI-checked
--       'ai_sampled' -> only sample_rate fraction get AI-checked, the rest go to manual queue
-- ------------------------------------------------------------
create table verification_settings (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,
  action text not null,
  mode text not null default 'manual' check (mode in ('manual','ai_always','ai_sampled')),
  sample_rate numeric not null default 0.3,   -- only used when mode = 'ai_sampled', 0.3 = 30%
  updated_at timestamptz not null default now(),
  unique (platform, action)
);

-- Seed everything as MANUAL to start — matches "resolve to manual for now".
-- Flip individual rows to ai_always / ai_sampled from the admin dashboard later.
insert into verification_settings (platform, action, mode)
select platform, action, 'manual' from pricing_rules;

-- ------------------------------------------------------------
-- ONBOARDING TESTS — one active test post per platform, set by admin
-- ------------------------------------------------------------
create table onboarding_tests (
  id uuid primary key default uuid_generate_v4(),
  platform text unique not null,
  post_link text not null,
  required_actions text[] not null,   -- e.g. '{like,comment,share,follow}'
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Placeholder rows — admin fills in the real post link for each platform
-- from the admin dashboard before engagers can complete onboarding.
insert into onboarding_tests (platform, post_link, required_actions) values
  ('facebook', 'PASTE_ADMIN_TEST_POST_LINK_HERE', '{like,comment,share,follow}'),
  ('instagram', 'PASTE_ADMIN_TEST_POST_LINK_HERE', '{like,comment,save,follow}'),
  ('tiktok', 'PASTE_ADMIN_TEST_POST_LINK_HERE', '{like,comment,share,follow}'),
  ('youtube', 'PASTE_ADMIN_TEST_POST_LINK_HERE', '{like,comment,subscribe}'),
  ('x', 'PASTE_ADMIN_TEST_POST_LINK_HERE', '{like,repost,reply,follow}');

-- ------------------------------------------------------------
-- ONBOARDING SUBMISSIONS — the engager's proof for the test task
-- One row per required action, so partial failures are visible
-- (e.g. Like passed, Comment needs review, Follow failed)
-- ------------------------------------------------------------
create table onboarding_submissions (
  id uuid primary key default uuid_generate_v4(),
  engager_id uuid not null references engagers(id),
  platform text not null,
  action text not null,
  screenshot_url text,
  screenshot_hash text,
  ai_verdict text,
  ai_reason text,
  final_status text not null default 'pending', -- pending | approved | rejected
  reviewed_by text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ------------------------------------------------------------
-- Extend engager_platform_accounts with a clear test/verification state
-- ------------------------------------------------------------
alter table engager_platform_accounts
  add column if not exists test_status text not null default 'not_started'
    check (test_status in ('not_started','in_progress','passed','failed'));

-- verification_status stays as the overall flag real task submission checks against:
-- 'pending' until test_status = 'passed', then flipped to 'verified' automatically.

alter table verification_settings enable row level security;
alter table onboarding_tests enable row level security;
alter table onboarding_submissions enable row level security;

create policy "anyone can view onboarding tests" on onboarding_tests
  for select using (true);

create policy "engagers see own onboarding submissions" on onboarding_submissions
  for select using (
    engager_id in (select id from engagers where auth_user_id = auth.uid())
  );
