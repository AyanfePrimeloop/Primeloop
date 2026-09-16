-- ============================================================
-- MIGRATION 5: Engager earnings dashboard
-- Run this in Supabase SQL Editor AFTER migration_4
-- ============================================================

-- payouts had RLS enabled from schema.sql but no policy was ever added,
-- so engagers couldn't actually see their own payout history. This fixes it.
create policy "engagers see own payouts" on payouts
  for select using (
    engager_id in (select id from engagers where auth_user_id = auth.uid())
  );
