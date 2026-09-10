-- ============================================================
-- MIGRATION 9: Unique page registration (anti-gaming)
-- Run this in Supabase SQL Editor AFTER migration_8
-- ============================================================

-- Prevents the same Facebook/Instagram/etc. page from being registered
-- under two different engager accounts on the same platform — the
-- "same page, multiple accounts" gaming pattern.
-- A partial index (only applying when profile_link is actually filled in)
-- since engager_platform_accounts rows can briefly exist before a real
-- link is registered.
create unique index if not exists idx_unique_platform_page
  on engager_platform_accounts (platform, profile_link)
  where profile_link is not null and profile_link <> '';

-- Also fixes a gap from the original schema: RLS was enabled on this table
-- but no policy was ever added, so engagers couldn't read their own
-- platform verification status client-side (needed for the dashboard to
-- show which platforms still need onboarding).
create policy "engagers see own platform accounts" on engager_platform_accounts
  for select using (
    engager_id in (select id from engagers where auth_user_id = auth.uid())
  );
