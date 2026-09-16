-- ============================================================
-- MIGRATION 4: Automated post-link checking
-- Run this in Supabase SQL Editor AFTER migration_3
-- ============================================================

alter table tasks
  add column if not exists link_check_reason text;

-- No RLS changes needed — tasks already has RLS enabled from schema.sql.
