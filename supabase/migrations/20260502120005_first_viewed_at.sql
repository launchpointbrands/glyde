-- Track when an advisor first lands on the case Overview after
-- completing discovery. Used to fire the celebratory confetti exactly
-- once and to avoid replaying it on subsequent visits.

alter table cases
  add column if not exists first_viewed_at timestamptz;
