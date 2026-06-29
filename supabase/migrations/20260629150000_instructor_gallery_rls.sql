-- SECURITY FIX: instructor_gallery_items had RLS NEVER enabled, so the table was
-- fully readable/writable by anyone with the public anon key (shipped in the
-- browser) directly via PostgREST — bypassing the ownership checks the gallery API
-- route enforces. (Audit 2026-06-29.)
--
-- Backward-compatible by design:
--  - iOS does NOT touch this table (verified) → no iOS impact.
--  - Web reads are the public profile page → keep SELECT open to everyone.
--  - Web writes go only through app/api/instructor/gallery, which runs as the
--    authenticated user and already sets/verifies instructor_id = the caller's
--    instructor → owner-scoped write policies ALLOW those and BLOCK anon abuse.

alter table public.instructor_gallery_items enable row level security;

-- Public read: instructor galleries are shown on public profile pages.
create policy "Gallery items are publicly viewable"
  on public.instructor_gallery_items
  for select
  using (true);

-- Owner writes: an instructor may only create/modify/remove their own gallery rows.
create policy "Instructors insert own gallery items"
  on public.instructor_gallery_items
  for insert
  to authenticated
  with check (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );

create policy "Instructors update own gallery items"
  on public.instructor_gallery_items
  for update
  to authenticated
  using (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  )
  with check (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );

create policy "Instructors delete own gallery items"
  on public.instructor_gallery_items
  for delete
  to authenticated
  using (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );
