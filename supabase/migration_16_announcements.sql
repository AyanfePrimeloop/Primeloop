-- ============================================================
-- MIGRATION 16: Super-admin broadcasts (announcements)
-- Run this in the Supabase SQL Editor. It is safe to run more than once.
--
-- One row per message the super-admin sends to all engagers, all clients, or
-- everyone. It shows as a dismissible banner on the recipient's dashboard until
-- it expires or is stopped. Only the server reads and writes it (row level
-- security is on with no policies), so nobody can read other audiences'
-- messages or write their own from the browser.
-- ============================================================

create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  audience text not null check (audience in ('engagers', 'clients', 'all')),
  title text not null,
  body text not null,
  link_url text,
  link_label text,
  created_by text,                          -- the super-admin's email
  created_at timestamptz not null default now(),
  expires_at timestamptz,                   -- null = shows until stopped
  active boolean not null default true,     -- false = stopped by the super-admin
  push_attempted int not null default 0,    -- devices we tried a browser alert on
  push_sent int not null default 0          -- devices it reached
);

create index if not exists announcements_active_created_idx
  on announcements (active, created_at desc);

alter table announcements enable row level security;
