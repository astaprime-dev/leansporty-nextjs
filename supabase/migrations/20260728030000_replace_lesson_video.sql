-- Replace the video of an existing lesson, without risking the original.
--
-- An improved re-shoot of a lesson used to mean creating a NEW lesson (losing
-- the day slot, progress and feedback attached to workouts.id). This adds a
-- replacement lifecycle on top of the existing upload pipeline instead: a
-- replacement is an ordinary program_uploads row that carries
-- replaces_workout_id, so it uploads/processes through the same code while the
-- lesson keeps serving its CURRENT video. Nothing changes for students until
-- the instructor previews the result and applies it.
--
-- Applying swaps workouts.cloudflare_uid (a plain column update — every
-- consumer keys on workouts.id, so entitlements, progress and feedback ride
-- through untouched) and stashes the OLD uid in replaced_uid, which is what
-- makes Revert and an explicit Discard possible. Nothing auto-deletes the old
-- video: it lives until the instructor says so.
--
-- Scope: program_uploads only (staging, NOT iOS-visible). The workouts schema
-- is untouched.

alter table public.program_uploads
  add column if not exists replaces_workout_id uuid
    references public.workouts(id) on delete cascade,
  add column if not exists replaced_uid text,
  add column if not exists replaced_duration_seconds integer;

comment on column public.program_uploads.replaces_workout_id is
  'When set, this upload is a video REPLACEMENT for that lesson: the status poller must not promote it into a new workouts row.';
comment on column public.program_uploads.replaced_uid is
  'The lesson''s original Cloudflare UID, captured at apply so Revert/Discard work. Null before apply, and after revert/discard.';
comment on column public.program_uploads.replaced_duration_seconds is
  'The lesson''s original duration, restored on revert.';

-- 'applied' = the swap is live and the original is still on Cloudflare,
-- awaiting Revert or Discard.
--
-- The old constraint came from an inline `check (status in (...))`, so its name
-- is Postgres-generated. Drop it by what it CONSTRAINS rather than by a guessed
-- name: a leftover old check would silently reject 'applied' at runtime.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'program_uploads'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.program_uploads drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.program_uploads add constraint program_uploads_status_check
  check (status in ('uploading', 'processing', 'ready', 'error', 'applied'));

create index if not exists program_uploads_replaces_idx
  on public.program_uploads (replaces_workout_id);
