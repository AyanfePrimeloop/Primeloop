-- ============================================================
-- MIGRATION 10: Rate limiting
-- Run this in Supabase SQL Editor AFTER migration_9
-- ============================================================

-- Bucketed rate limiting: one row per (key + time window), incremented on
-- each request. Bounded growth — old buckets stop growing once their window
-- passes, and the weekly payout cron sweeps out anything older than a day.
create table rate_limits (
  id uuid primary key default uuid_generate_v4(),
  bucket_key text unique not null,
  count int not null default 1,
  created_at timestamptz not null default now()
);

create index idx_rate_limits_created on rate_limits(created_at);

-- Only ever touched via the service-role key (server-side), so no RLS
-- policies are needed — enabling RLS with no policy just locks it to
-- service-role-only, which is exactly what we want.
alter table rate_limits enable row level security;
