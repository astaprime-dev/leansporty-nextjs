-- SECURITY FIX (P0, INSTRUCTOR_STUDIO_PLAN.md S0.1): live_stream_sessions has a
-- public SELECT policy ("Anyone can view streams" USING(true) TO anon). RLS is
-- ROW-level, not column-level, so that policy exposes EVERY column — including the
-- live-ingest secrets:
--   cloudflare_rtmps_url, cloudflare_rtmps_stream_key,   (OBS/RTMPS ingest)
--   cloudflare_webrtc_url, cloudflare_webrtc_token       (browser/WHIP ingest)
-- Anyone with the public anon key could read these for any stream and broadcast
-- arbitrary video into a live class. (Audit 2026-07-03.)
--
-- Fix: move the four ingest secrets into a separate table readable ONLY by the
-- owning instructor. The public SELECT on live_stream_sessions stays intact for the
-- remaining (non-secret) columns — so discovery, the watch page, and iOS are
-- unaffected. Egress/playback (cloudflare_whep_playback_url, cloudflare_playback_id)
-- is NOT a secret and stays on live_stream_sessions.
--
-- Backward-compatible:
--  - iOS does NOT touch live_stream_sessions (verified) — and never read the ingest
--    columns (it has no broadcast feature).
--  - Instructor create route runs as the authenticated user and writes its own row →
--    the owner-scoped INSERT policy below ALLOWS it.
--  - The migrate/cleanup crons use the service-role client (bypass RLS); they never
--    referenced the ingest columns.

create table if not exists public.live_stream_ingest (
  stream_id uuid primary key
    references public.live_stream_sessions(id) on delete cascade,
  rtmps_url text,
  rtmps_stream_key text,
  webrtc_url text,
  webrtc_token text,
  created_at timestamptz not null default now()
);

comment on table public.live_stream_ingest is
  'Owner-only live-ingest secrets (RTMPS key/url, WHIP url/token). Split out of '
  'live_stream_sessions because that table has a public SELECT policy and RLS cannot '
  'hide individual columns. Never expose to anon or to non-owning instructors.';

alter table public.live_stream_ingest enable row level security;

-- Owner-only for ALL operations. Ownership resolves through the stream → instructor
-- chain: the ingest row's stream must belong to an instructors row owned by the caller.
create policy "Owning instructor reads ingest secrets"
  on public.live_stream_ingest
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

create policy "Owning instructor inserts ingest secrets"
  on public.live_stream_ingest
  for insert
  to authenticated
  with check (
    stream_id in (
      select s.id
      from public.live_stream_sessions s
      join public.instructors i on i.id = s.instructor_id
      where i.user_id = auth.uid()
    )
  );

create policy "Owning instructor updates ingest secrets"
  on public.live_stream_ingest
  for update
  to authenticated
  using (
    stream_id in (
      select s.id
      from public.live_stream_sessions s
      join public.instructors i on i.id = s.instructor_id
      where i.user_id = auth.uid()
    )
  )
  with check (
    stream_id in (
      select s.id
      from public.live_stream_sessions s
      join public.instructors i on i.id = s.instructor_id
      where i.user_id = auth.uid()
    )
  );

-- Owner-scoped DELETE on live_stream_sessions. There was previously NO delete policy,
-- so an instructor (and the create route's rollback path) could not remove even their
-- own stream. Ingest rows cascade-delete with the stream. (iOS never deletes here;
-- anon can't — TO authenticated + owner-scoped.)
create policy "Instructors delete own streams"
  on public.live_stream_sessions
  for delete
  to authenticated
  using (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );

-- Backfill existing streams' secrets, then drop the exposed columns.
insert into public.live_stream_ingest (stream_id, rtmps_url, rtmps_stream_key, webrtc_url, webrtc_token)
select
  id,
  cloudflare_rtmps_url,
  cloudflare_rtmps_stream_key,
  cloudflare_webrtc_url,
  cloudflare_webrtc_token
from public.live_stream_sessions
where cloudflare_rtmps_url is not null
   or cloudflare_rtmps_stream_key is not null
   or cloudflare_webrtc_url is not null
   or cloudflare_webrtc_token is not null
on conflict (stream_id) do nothing;

alter table public.live_stream_sessions
  drop column if exists cloudflare_rtmps_url,
  drop column if exists cloudflare_rtmps_stream_key,
  drop column if exists cloudflare_webrtc_url,
  drop column if exists cloudflare_webrtc_token;
