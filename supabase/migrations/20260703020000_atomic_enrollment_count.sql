-- HARDENING (Studio plan S0.4.4): live_stream_sessions.total_enrollments was bumped
-- by a read-then-write in enrollInStream (app/actions.ts) — two problems:
--   1. Lost-update race: concurrent enrollments read the same value and both write +1.
--   2. Since 20260629170000 restricted UPDATE on live_stream_sessions to the OWNING
--      instructor, a normal (non-instructor) enrollee's counter update is silently
--      filtered by RLS — so the count effectively stopped incrementing for real viewers.
--
-- Fix: increment atomically via a SECURITY DEFINER trigger on stream_enrollments INSERT.
-- A single UPDATE statement is race-free, and SECURITY DEFINER bypasses the owner-only
-- RLS safely (it only ever does +1 on the exact stream just enrolled). The app-side
-- manual increment is removed in the same change.

create or replace function public.bump_stream_enrollment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.live_stream_sessions
     set total_enrollments = total_enrollments + 1
   where id = new.stream_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_stream_enrollment_count on public.stream_enrollments;

create trigger trg_bump_stream_enrollment_count
  after insert on public.stream_enrollments
  for each row
  execute function public.bump_stream_enrollment_count();
