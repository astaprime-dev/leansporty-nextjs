-- Watch experience: program reviews (public social proof), private per-lesson
-- feedback to the instructor, and the 21-Day Challenge converted into a
-- regular program owned by the house instructor (editable in the Studio).
-- Spec: INSTRUCTOR_PROGRAMS_PLAN.md.

-- ---------------------------------------------------------------------------
-- 1. program_reviews — one star rating (+ optional comment) per buyer per
--    program. Publicly readable (sales-page social proof); writable only by
--    users holding a live entitlement to the product.
-- ---------------------------------------------------------------------------
create table if not exists public.program_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment_text text check (char_length(comment_text) <= 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists program_reviews_product_idx on public.program_reviews (product_id);

alter table public.program_reviews enable row level security;

drop policy if exists "reviews are public" on public.program_reviews;
create policy "reviews are public" on public.program_reviews
  for select using (is_hidden = false);

drop policy if exists "buyers write own review" on public.program_reviews;
create policy "buyers write own review" on public.program_reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid()
        and e.product_id = program_reviews.product_id
        and (e.expires_at is null or e.expires_at > now())
    )
  );

drop policy if exists "authors update own review" on public.program_reviews;
create policy "authors update own review" on public.program_reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_hidden = false);

-- ---------------------------------------------------------------------------
-- 2. program_lesson_feedback — PRIVATE thumbs up/down + optional note per
--    lesson, from buyer to instructor. Readable only by the author and the
--    program's instructor (never public).
-- ---------------------------------------------------------------------------
create table if not exists public.program_lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  content_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sentiment text not null check (sentiment in ('up', 'down')),
  comment_text text check (char_length(comment_text) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, content_id, user_id)
);

create index if not exists program_lesson_feedback_product_idx
  on public.program_lesson_feedback (product_id);

alter table public.program_lesson_feedback enable row level security;

drop policy if exists "author reads own feedback" on public.program_lesson_feedback;
create policy "author reads own feedback" on public.program_lesson_feedback
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "instructor reads program feedback" on public.program_lesson_feedback;
create policy "instructor reads program feedback" on public.program_lesson_feedback
  for select to authenticated
  using (
    exists (
      select 1
      from public.products p
      join public.instructors i on i.id = p.instructor_id
      where p.id = program_lesson_feedback.product_id
        and i.user_id = auth.uid()
    )
  );

drop policy if exists "buyers write own feedback" on public.program_lesson_feedback;
create policy "buyers write own feedback" on public.program_lesson_feedback
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid()
        and e.product_id = program_lesson_feedback.product_id
        and (e.expires_at is null or e.expires_at > now())
    )
  );

drop policy if exists "authors update own feedback" on public.program_lesson_feedback;
create policy "authors update own feedback" on public.program_lesson_feedback
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Convert the 21-Day Challenge into a house-instructor program so it is
--    editable in the Studio like any other program. split_pct=100: sales
--    still write instructor_payouts rows (to the house account, minus the
--    €1.50 platform fee floor) — self-paid bookkeeping, accepted.
-- ---------------------------------------------------------------------------
update public.products
set
  kind = 'course',
  instructor_id = (select id from public.instructors where slug = 'leansporty'),
  split_pct = 100
where slug = '21-day-dance-challenge'
  and exists (select 1 from public.instructors where slug = 'leansporty');
