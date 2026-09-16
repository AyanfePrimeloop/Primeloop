-- ============================================================
-- MIGRATION 7: Extra instructions from client, visible to engagers
-- Run this in Supabase SQL Editor AFTER migration_6
-- ============================================================

alter table orders add column if not exists special_instructions text;
alter table tasks add column if not exists special_instructions text;
