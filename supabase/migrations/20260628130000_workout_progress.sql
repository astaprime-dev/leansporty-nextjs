-- Per-user workout progress (CHALLENGE_PRODUCTIZATION_SPEC §7).
-- Fallback table (the spec's §13 open item leaves reuse of the iOS-owned
-- `workout_sessions` table unresolved). Read/write-own RLS; one row per
-- (user, workout). Completion drives the My Program grid + progress bar.

create table if not exists public.workout_progress (
  user_id               uuid not null references auth.users(id) on delete cascade,
  workout_id            uuid not null references public.workouts(id) on delete cascade,
  completed_at          timestamptz,
  last_position_seconds int,
  updated_at            timestamptz not null default now(),
  primary key (user_id, workout_id)
);
create index if not exists workout_progress_user_idx on public.workout_progress(user_id);

alter table public.workout_progress enable row level security;

create policy "read own workout_progress" on public.workout_progress
  for select using (auth.uid() = user_id);
create policy "insert own workout_progress" on public.workout_progress
  for insert with check (auth.uid() = user_id);
create policy "update own workout_progress" on public.workout_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
