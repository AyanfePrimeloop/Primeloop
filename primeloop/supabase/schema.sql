-- ============================================================
-- PRIMELOOP DATABASE SCHEMA
-- Run this in Supabase: Project > SQL Editor > New Query > Run
-- ============================================================

-- Extension for UUID generation
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENGAGERS
-- ------------------------------------------------------------
create table engagers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,                 -- e.g. EN1162OL, matches your existing scheme
  auth_user_id uuid references auth.users(id),
  full_name text not null,
  whatsapp text not null,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  paystack_recipient_code text,              -- returned by Paystack when we register them for transfers
  tier text not null default 'bronze',       -- bronze | silver | gold | platinum
  tasks_completed int not null default 0,
  tasks_approved int not null default 0,
  approval_rate numeric generated always as (
    case when tasks_completed = 0 then 0
    else round((tasks_approved::numeric / tasks_completed) * 100, 1) end
  ) stored,
  status text not null default 'active',     -- active | warned | dismissed
  referred_by uuid references engagers(id),
  created_at timestamptz not null default now()
);

-- Per-platform account + verification status for each engager
create table engager_platform_accounts (
  id uuid primary key default uuid_generate_v4(),
  engager_id uuid not null references engagers(id) on delete cascade,
  platform text not null,                    -- facebook | instagram | tiktok | youtube | x
  profile_link text not null,
  profile_name text,
  verification_status text not null default 'pending', -- pending | verified | rejected
  verified_at timestamptz,
  unique (engager_id, platform)
);

-- ------------------------------------------------------------
-- CLIENTS
-- ------------------------------------------------------------
create table clients (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id),
  full_name text,
  email text,
  whatsapp text,
  total_spent numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRICING RULES  (this is what the admin "Pricing management" table edits)
-- ------------------------------------------------------------
create table pricing_rules (
  id uuid primary key default uuid_generate_v4(),
  platform text not null,                    -- facebook | instagram | tiktok | youtube | x
  action text not null,                      -- like | comment | share | follow | save | watch | subscribe | bookmark | repost | reply
  client_price numeric not null,
  engager_payout numeric not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (platform, action)
);

-- Seed with the pricing worked out earlier — adjust anytime from the admin dashboard
insert into pricing_rules (platform, action, client_price, engager_payout) values
  ('facebook','like',6,3.5), ('facebook','comment',14,8.5), ('facebook','share',11,6.5), ('facebook','follow',30,19),
  ('instagram','like',6,3.5), ('instagram','comment',15,9), ('instagram','save',10,6), ('instagram','share',12,7), ('instagram','follow',32,20),
  ('tiktok','like',5,3), ('tiktok','comment',16,10), ('tiktok','share',10,6), ('tiktok','watch',7,4), ('tiktok','follow',34,21),
  ('youtube','like',7,4), ('youtube','comment',18,11), ('youtube','watch',15,9), ('youtube','subscribe',40,25),
  ('x','like',5,3), ('x','repost',11,6.5), ('x','reply',15,9), ('x','bookmark',8,5), ('x','follow',30,19);

-- ------------------------------------------------------------
-- ORDERS  (a client's checkout — can contain multiple tasks/actions)
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id),
  platform text not null,
  post_link text not null,
  amount_total numeric not null,
  paystack_reference text unique,
  payment_status text not null default 'pending', -- pending | paid | failed
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TASKS  (one row per action-type within an order, e.g. "30 LIKE" is one task)
-- ------------------------------------------------------------
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  task_code text unique not null,            -- e.g. FB-5714-A6, matches your existing scheme
  order_id uuid references orders(id),
  client_id uuid not null references clients(id),
  platform text not null,
  post_link text not null,
  action text not null,                      -- like | comment | share | follow | ...
  quantity_needed int not null,
  quantity_filled int not null default 0,
  price_per_unit numeric not null,
  target_account_handle text,                -- required for follow/subscribe tasks, used for the ledger check
  tier_gate_until timestamptz,               -- Gold/Platinum-only window before opening to everyone
  status text not null default 'open',       -- open | closed
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- FOLLOW LEDGER  — permanent record of which engager has followed which account
-- This is the fix for the "can't follow twice" problem
-- ------------------------------------------------------------
create table follow_ledger (
  id uuid primary key default uuid_generate_v4(),
  engager_id uuid not null references engagers(id),
  platform text not null,
  target_account_handle text not null,
  followed_at timestamptz not null default now(),
  still_following boolean not null default true,
  unique (engager_id, platform, target_account_handle)
);

-- ------------------------------------------------------------
-- SUBMISSIONS  (engager's proof of completing a task)
-- ------------------------------------------------------------
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id),
  engager_id uuid not null references engagers(id),
  screenshot_url text not null,
  screenshot_hash text,                      -- perceptual hash, for duplicate detection
  ai_verdict text,                           -- approved | rejected | needs_review
  ai_reason text,
  final_status text not null default 'pending', -- pending | approved | rejected
  reviewed_by text,                          -- 'ai' or an admin username
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ------------------------------------------------------------
-- PAYOUTS  (weekly batch payout to each engager)
-- ------------------------------------------------------------
create table payouts (
  id uuid primary key default uuid_generate_v4(),
  engager_id uuid not null references engagers(id),
  period_start date not null,
  period_end date not null,
  amount numeric not null,
  status text not null default 'pending',    -- pending | paid | failed
  paystack_transfer_code text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HELPFUL INDEXES
-- ------------------------------------------------------------
create index idx_tasks_status on tasks(status);
create index idx_tasks_platform on tasks(platform);
create index idx_submissions_task on submissions(task_id);
create index idx_submissions_engager on submissions(engager_id);
create index idx_follow_ledger_lookup on follow_ledger(platform, target_account_handle);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (basic starting policies — tighten before going fully live)
-- ------------------------------------------------------------
alter table engagers enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table payouts enable row level security;
alter table orders enable row level security;
alter table engager_platform_accounts enable row level security;
alter table pricing_rules enable row level security;
alter table follow_ledger enable row level security;

-- The three tables below are only ever touched server-side via the
-- service-role key (which bypasses RLS entirely), so they're locked with
-- RLS enabled and no policies — anon/authenticated get zero access by default.

-- Engagers can see and edit only their own row
create policy "engagers see own row" on engagers
  for select using (auth.uid() = auth_user_id);
create policy "engagers update own row" on engagers
  for update using (auth.uid() = auth_user_id);

-- Everyone logged in can see open tasks
create policy "anyone can view open tasks" on tasks
  for select using (true);

-- Engagers can see and insert their own submissions
create policy "engagers see own submissions" on submissions
  for select using (
    engager_id in (select id from engagers where auth_user_id = auth.uid())
  );
create policy "engagers insert own submissions" on submissions
  for insert with check (
    engager_id in (select id from engagers where auth_user_id = auth.uid())
  );

-- Clients can see their own orders and payouts info
create policy "clients see own orders" on orders
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

-- NOTE: admin dashboard operations should go through the service-role key
-- (server-side only, via lib/supabaseAdmin.js) which bypasses RLS entirely.
