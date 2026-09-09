-- ============================================================
-- MIGRATION 8: Multiple admins + super-admin
-- Run this in Supabase SQL Editor AFTER migration_7
-- ============================================================

alter table admins add column if not exists role text not null default 'admin'
  check (role in ('admin', 'super_admin'));

-- IMPORTANT — one manual step: promote yourself (the first admin you made)
-- to super_admin, since everyone starts as a regular 'admin' by default.
-- Run this separately, with your own email:
--
--   update admins set role = 'super_admin' where email = 'you@email.com';
--
-- Only a super_admin can add other admins or see the accounting page —
-- regular admins keep access to everything else (pricing, tasks, engagers,
-- review queue, onboarding tests, verification settings) exactly as before.
