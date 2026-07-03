-- HARDENING (Studio plan S0.4.1): stream_reactions INSERT was WITH CHECK(true)
-- ("simplified for testing", 20251226000001) — any authenticated user could react to
-- any stream. Worse, the browser insert never set user_id (the column had no default),
-- so reactions were anonymous AND the per-user 5s rate-limit trigger — guarded by
-- `NEW.user_id IS NOT NULL` — never fired.
--
-- Fix: default user_id to auth.uid() (attributes reactions + activates the rate limit)
-- and restore the enrollment gate. Safe: iOS does NOT touch stream_reactions (verified),
-- and the watch page redirects non-enrolled users, so every legitimate reactor is
-- enrolled. Existing anonymous rows are left as-is (harmless history).

alter table public.stream_reactions
  alter column user_id set default auth.uid();

drop policy if exists "Authenticated users can react" on public.stream_reactions;

create policy "Enrolled users can react"
  on public.stream_reactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.stream_enrollments e
      where e.stream_id = stream_reactions.stream_id
        and e.user_id = auth.uid()
        and e.can_watch_live = true
    )
  );
