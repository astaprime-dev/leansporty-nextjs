-- DEF-1 fix: the live→VOD pipeline self-destructed, so the library never filled.
-- The trigger scheduled promotion for (stream end + 2 months) while cleanup deleted
-- the recording at (end + 7 days) — recordings were gone ~53 days before promotion.
--
-- Now a stream is eligible for promotion AT END; the migrate cron waits for the
-- Cloudflare recording to be ready, promotes it into `workouts`, and cleanup retains
-- promoted recordings. The 7-day TTL (recording_expires_at) now applies only to
-- recordings that never get promoted. Pairs with the rewritten migrate/cleanup crons
-- (migrate now runs BEFORE cleanup) and fetches the real recording UID from Cloudflare.

create or replace function set_migration_schedule()
returns trigger as $$
begin
  if new.actual_end_time is not null and old.actual_end_time is null then
    new.migration_scheduled_at := new.actual_end_time;                   -- eligible at end (cron checks CF readiness)
    new.recording_expires_at := new.actual_end_time + interval '7 days'; -- TTL for UN-promoted recordings only
  end if;
  return new;
end;
$$ language plpgsql;

-- FREEZE existing ended streams out of BOTH crons. Their old schedule
-- (migration_scheduled_at = end + 2 months) is now in the past for older streams, so
-- the newly-working migrate cron would otherwise auto-promote them — including test
-- streams — into the iOS-shared `workouts` catalog, and the cleanup cron would delete
-- the rest. Many of these 20 ended streams are tests. Null both schedule columns so
-- neither cron acts on them; recordings stay as-is on Cloudflare for manual curation.
--
-- To promote a specific real historical recording later:
--   update public.live_stream_sessions
--   set migration_scheduled_at = actual_end_time,
--       recording_expires_at  = now() + interval '7 days'
--   where id = '<stream-id>';
update public.live_stream_sessions
set migration_scheduled_at = null,
    recording_expires_at = null
where status = 'ended' and migrated_to_workout_id is null;
