-- ============================================================
-- MIGRATION 12: Free web-push task alerts
-- Run this in the Supabase SQL Editor AFTER migration_11.
-- It is safe to run more than once.
-- ============================================================

-- One row per browser/phone an engager has allowed task alerts on.
-- endpoint is unique so re-subscribing the same device just updates the row.
create table if not exists engager_push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  engager_id uuid not null references engagers(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create index if not exists engager_push_subscriptions_engager_idx
  on engager_push_subscriptions (engager_id);

-- Only the server (service role) reads or writes this table.
alter table engager_push_subscriptions enable row level security;
