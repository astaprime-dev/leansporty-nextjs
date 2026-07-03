-- S4 (Studio plan) — let an instructor read the watch sessions of their OWN classes,
-- for replay watch-time analytics. The existing policy is own-rows-only
-- (auth.uid() = user_id), so an instructor couldn't aggregate their class's watch time.
-- Policies are OR'd, so this only widens instructor reads. iOS does NOT touch
-- stream_watch_sessions (verified), so this is backward-compatible.

create policy "Instructors read watch sessions for own classes"
  on public.stream_watch_sessions
  for select
  to authenticated
  using (
    stream_id in (
      select s.id
      from public.live_stream_sessions s
      join public.instructors i on i.id = s.instructor_id
      where i.user_id = auth.uid()
    )
  );
