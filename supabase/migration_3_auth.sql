-- ============================================================
-- MIGRATION 3: Authentication
-- Run this in Supabase SQL Editor AFTER migration_2
-- ============================================================

-- Only rows in this table are allowed to use the admin dashboard.
-- There is deliberately no self-serve way to become an admin — you add
-- yourself manually the first time (see GETTING_STARTED.md Step 9).
create table admins (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique not null references auth.users(id),
  email text,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "admins see own row" on admins
  for select using (auth.uid() = auth_user_id);

-- Engagers already have an auth_user_id column from schema.sql — this just
-- makes sure one login can't be linked to two engager profiles.
alter table engagers
  add constraint engagers_auth_user_id_unique unique (auth_user_id);
