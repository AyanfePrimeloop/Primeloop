-- ============================================================
-- RESET — only run this if you need to start the database over
-- (e.g. you got a "relation already exists" error and have no
-- real data yet worth keeping).
--
-- This deletes every Primeloop table and all data in them.
-- It does NOT touch your Supabase login/auth users.
-- ============================================================

drop table if exists onboarding_submissions cascade;
drop table if exists onboarding_tests cascade;
drop table if exists verification_settings cascade;
drop table if exists payouts cascade;
drop table if exists submissions cascade;
drop table if exists follow_ledger cascade;
drop table if exists tasks cascade;
drop table if exists orders cascade;
drop table if exists pricing_rules cascade;
drop table if exists engager_platform_accounts cascade;
drop table if exists admins cascade;
drop table if exists engagers cascade;
drop table if exists clients cascade;
