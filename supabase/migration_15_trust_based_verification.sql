-- ============================================================
-- MIGRATION 15: Allow the trust-based verification mode
-- Run this in the Supabase SQL Editor. Safe to run more than once.
--
-- Adds 'trust_based' to the allowed modes for verification_settings. It does
-- not change any current setting; choose it on Admin > Verification.
-- ============================================================
alter table verification_settings drop constraint if exists verification_settings_mode_check;
alter table verification_settings
  add constraint verification_settings_mode_check
  check (mode in ('manual', 'ai_always', 'ai_sampled', 'trust_based'));
