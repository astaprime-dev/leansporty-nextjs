-- Fix: total_enrollments only ever went UP. It's incremented by an AFTER INSERT
-- trigger (20260703020000) when someone joins, but nothing decremented it when a
-- roster row was removed — so after a refund (the webhook deletes the paid-class
-- roster row) the "N enrolled" count stayed too high. Mirror the bump with a matching
-- AFTER DELETE trigger. SECURITY DEFINER so it can update the owner-RLS'd stream row.

create or replace function public.drop_stream_enrollment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.live_stream_sessions
     set total_enrollments = greatest(total_enrollments - 1, 0)
   where id = old.stream_id;
  return old;
end;
$$;

drop trigger if exists trg_drop_stream_enrollment_count on public.stream_enrollments;

create trigger trg_drop_stream_enrollment_count
  after delete on public.stream_enrollments
  for each row
  execute function public.drop_stream_enrollment_count();
