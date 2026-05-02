-- Advisor onboarding state.
--
-- Adds onboarding_completed to gate /app on first-run setup. New advisors
-- are bounced to /onboarding until they complete it. The `title` column
-- already exists from the initial schema (20260501120001) and is reused.
--
-- Existing advisor rows (the dogfood account) are backfilled to true so
-- the live working app isn't disrupted by the rollout. The column default
-- for new rows stays false.

alter table advisors
  add column onboarding_completed boolean not null default false;

update advisors set onboarding_completed = true;
