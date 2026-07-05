-- Instructor Programs (self-serve on-demand video products, kind='course').
-- Spec: INSTRUCTOR_PROGRAMS_PLAN.md (workspace root).
--
-- 1. products: self-serve publishing metadata + founder kill-switch.
-- 2. workouts: hygiene columns so program lessons are attributable/filterable
--    (additive only — table is iOS-shared; no RLS changes).
-- 3. program_uploads: staging for direct Cloudflare Stream uploads, so
--    half-uploaded/processing videos never touch the shared workouts catalog.
-- 4. get_playable_uid: instructors can play their own lessons without buying.

-- ---------------------------------------------------------------------------
-- 1. products
-- ---------------------------------------------------------------------------
-- admin_disabled is the founder kill-switch: while true the publish API refuses
-- to reactivate and checkout/public pages exclude the product, so an instructor
-- cannot re-enable a program the platform pulled. Flipped via SQL in v1.
alter table public.products
  add column if not exists admin_disabled boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  -- Long-form sales copy for instructor programs (subtitle is the one-liner).
  add column if not exists description text;

comment on column public.products.admin_disabled is
  'Founder kill-switch. While true: checkout rejects, public pages hide, instructor publish API refuses.';
comment on column public.products.terms_accepted_at is
  'When the instructor accepted the content/music rights warranty at publish time.';

-- ---------------------------------------------------------------------------
-- 2. workouts (iOS-shared, camelCase video columns — additive only)
-- ---------------------------------------------------------------------------
-- visibility: 'public' = general catalog (existing rows, migrated recordings);
-- 'program' = uploaded as a program lesson. Nothing filters on it yet on the
-- web; it exists so the iOS rewrite (and future web catalogs) can exclude paid
-- lesson rows. instructor_id makes lessons/recordings attributable and drives
-- the "reuse a recording" picker + get_playable_uid owner branch.
alter table public.workouts
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'program')),
  add column if not exists instructor_id uuid references public.instructors(id) on delete set null;

create index if not exists workouts_instructor_idx on public.workouts (instructor_id);

-- ---------------------------------------------------------------------------
-- 3. program_uploads (staging; NOT iOS-visible)
-- ---------------------------------------------------------------------------
-- One row per direct-upload attempt. The workouts row is created only when
-- Cloudflare reports readyToStream (promotion), keyed idempotently on the
-- unique cloudflare_uid + workout_id still null. duration_seconds (from
-- Cloudflare) is the basis for the per-instructor stored-minutes cap.
create table if not exists public.program_uploads (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  cloudflare_uid text not null unique,
  title text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'error')),
  duration_seconds integer,
  error_message text,
  workout_id uuid references public.workouts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists program_uploads_instructor_idx on public.program_uploads (instructor_id);
create index if not exists program_uploads_product_idx on public.program_uploads (product_id);

alter table public.program_uploads enable row level security;

-- Instructors see their own upload rows (status polling reads go through the
-- API, but direct reads are harmless). All writes are service-role only via
-- the programs API routes — no insert/update/delete policies on purpose.
drop policy if exists "instructor reads own uploads" on public.program_uploads;
create policy "instructor reads own uploads" on public.program_uploads
  for select to authenticated
  using (
    instructor_id in (
      select i.id from public.instructors i where i.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. get_playable_uid: + owner branch
-- ---------------------------------------------------------------------------
-- Same signature and grants as 20260707000000_studio_hardening.sql; adds one
-- OR branch so an instructor can preview lessons they own without an
-- entitlement. search_path stays '' (all refs schema-qualified).
create or replace function public.get_playable_uid(p_content_id uuid)
returns text
language sql stable security definer set search_path = '' as $$
  select w.cloudflare_uid
  from public.workouts w
  where w.id = p_content_id
    and (
      exists (
        select 1 from public.product_items pi
        where pi.content_id = w.id and pi.is_preview = true
      )
      or
      exists (
        select 1
        from public.entitlements e
        join public.product_items pi on pi.product_id = e.product_id
        where e.user_id = auth.uid()
          and pi.content_id = w.id
          and (e.expires_at is null or e.expires_at > now())
      )
      or
      exists (
        select 1 from public.instructors i
        where i.id = w.instructor_id and i.user_id = auth.uid()
      )
    );
$$;
revoke all on function public.get_playable_uid(uuid) from public;
grant execute on function public.get_playable_uid(uuid) to authenticated;
