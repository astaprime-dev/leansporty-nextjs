-- SECURITY FIX: live_stream_sessions had permissive write policies
-- (INSERT WITH CHECK(true), UPDATE USING(true) WITH CHECK(true)) — any authenticated
-- user could create or tamper with ANY stream (title, price_in_tokens, status, times)
-- straight through the anon client. (Audit 2026-06-29.)
--
-- Backward-compatible:
--  - iOS does NOT touch this table (verified).
--  - Public SELECT ("Anyone can view streams") stays — needed for discovery/watch.
--  - Instructor API routes (create/start/end/update) run as the authenticated user
--    and set/scope instructor_id = their own → owner-scoped policies ALLOW them.
--  - The migrate/cleanup crons now use the service-role client (bypass RLS).

drop policy if exists "Authenticated users can create streams" on public.live_stream_sessions;
drop policy if exists "Authenticated users can update streams" on public.live_stream_sessions;

create policy "Instructors create own streams"
  on public.live_stream_sessions
  for insert
  to authenticated
  with check (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );

create policy "Instructors update own streams"
  on public.live_stream_sessions
  for update
  to authenticated
  using (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  )
  with check (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );
