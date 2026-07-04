-- Backfill: 20260708000000 added the missing AFTER DELETE decrement trigger, but
-- any count inflated by roster deletions BEFORE that trigger existed (e.g. the
-- refund webhook removing a paid-class roster row) was never corrected and would
-- stay wrong forever. One-time recount from the roster; idempotent, so safe to
-- re-run. Runs after the trigger migration, so counts can't drift again.

update public.live_stream_sessions s
   set total_enrollments = (
     select count(*)
       from public.stream_enrollments e
      where e.stream_id = s.id
   )
 where s.total_enrollments is distinct from (
     select count(*)
       from public.stream_enrollments e
      where e.stream_id = s.id
   );
