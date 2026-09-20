-- ============================================================
-- MIGRATION 14: Let an admin mark an order as handled
-- Run this in the Supabase SQL Editor. Safe to run more than once.
--
-- Used by the "Needs your attention" panel on the Accounting page: once you
-- have refunded a customer (or decided nothing is owed, for example a test
-- order), "Mark handled" hides that order from the list.
-- ============================================================
alter table orders add column if not exists attention_resolved_at timestamptz;
