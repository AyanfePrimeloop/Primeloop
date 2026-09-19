-- ============================================================
-- MIGRATION 13: Close direct-database loopholes
-- Run this in the Supabase SQL Editor. It is safe to run more than once.
--
-- Why: the public "anon" key ships inside the website, so anyone signed in can
-- talk to the database directly from their browser, bypassing our server
-- checks. Two old policies allowed that to be abused:
--   * engagers could INSERT their own submissions, including with
--     final_status = 'approved', which the Friday payout would then pay;
--   * engagers could UPDATE their own row, including tier, status and counters.
-- The app itself never does either from the browser (it only reads), so both
-- are removed. Reads stay, but only for signed-in users and only for live data.
-- ============================================================

-- 1. No direct writes by engagers. All writes go through our server routes,
--    which use the service role and enforce every rule.
drop policy if exists "engagers insert own submissions" on submissions;
drop policy if exists "engagers update own row" on engagers;

-- 2. Tasks: signed-in users only (was: anyone, including logged-out visitors),
--    and never tasks still held for review or rejected.
drop policy if exists "anyone can view open tasks" on tasks;
drop policy if exists "signed-in users see live tasks" on tasks;
create policy "signed-in users see live tasks" on tasks
  for select to authenticated
  using (status in ('open', 'closed'));

-- 3. Onboarding tests: signed-in users only.
drop policy if exists "anyone can view onboarding tests" on onboarding_tests;
drop policy if exists "signed-in users see active onboarding tests" on onboarding_tests;
create policy "signed-in users see active onboarding tests" on onboarding_tests
  for select to authenticated
  using (active);

-- 4. One submission per engager per task, enforced by the database so two
--    simultaneous requests cannot both slip through. If old test data already
--    breaks this, the notice below says so and nothing else is affected.
do $$
begin
  create unique index if not exists submissions_one_per_engager_task
    on submissions (task_id, engager_id);
exception when others then
  raise notice 'Skipped the one-submission-per-task index: %. Remove duplicate rows first, then run this again.', sqlerrm;
end $$;
