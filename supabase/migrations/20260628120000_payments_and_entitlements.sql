-- Phase 1 — payments & entitlements (E1.1)
-- Implements SECURE_PLAYBACK_SPEC §2 + CHALLENGE_PRODUCTIZATION_SPEC §3.
-- Entitlements become the single source of access truth; the existing `workouts`
-- table is reused as "content" (decision OD-3) instead of a separate `content` table.
-- Entitlements are written ONLY by the service-role Stripe webhook (bypasses RLS).

-- PRODUCTS = what is sold (course / challenge / membership / single class)
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            text not null check (kind in ('course','challenge','membership','single')),
  title           text not null,
  subtitle        text,
  cover_image_url text,
  price_cents     int not null default 0,
  currency        text not null default 'eur',
  stripe_price_id text,
  is_active       boolean not null default true,
  config          jsonb not null default '{}'::jsonb,   -- challenge: {program_length_days, drip_enabled, workout_count}
  created_at      timestamptz not null default now()
);

-- CONTENT = existing workouts rows; add the Cloudflare Stream UID (replaces legacy mux_playback_id)
alter table public.workouts add column if not exists cloudflare_uid text;
create index if not exists workouts_cloudflare_uid_idx on public.workouts(cloudflare_uid);

-- mapping product -> content, with scheduling + free-preview flag
create table if not exists public.product_items (
  product_id uuid not null references public.products(id) on delete cascade,
  content_id uuid not null references public.workouts(id) on delete cascade,
  position   int not null default 0,              -- overall order (1..N)
  day_number int,                                 -- calendar day 1..21 (NULL = unscheduled bundle)
  is_preview boolean not null default false,      -- free preview: gated by auth, not purchase
  item_label text,                                -- optional per-day focus label, else workouts.title
  primary key (product_id, content_id)
);
create index if not exists product_items_content_idx on public.product_items(content_id);

-- ENTITLEMENTS = what a user owns (the single source of access truth)
create table if not exists public.entitlements (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  source            text not null default 'stripe' check (source in ('stripe','voucher','comp')),
  stripe_session_id text,
  granted_at        timestamptz not null default now(),
  expires_at        timestamptz,                  -- NULL = lifetime; set for memberships / time-boxed grants
  unique (user_id, product_id)
);
create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists entitlements_session_idx on public.entitlements(stripe_session_id);

-- RLS
alter table public.entitlements enable row level security;
create policy "read own entitlements" on public.entitlements
  for select using (auth.uid() = user_id);
-- NOTE: no insert/update policy for users. Entitlements are written only by the
-- service-role Stripe webhook, which bypasses RLS. Users must not self-grant access.

alter table public.products enable row level security;
create policy "public catalog" on public.products
  for select using (true);

alter table public.product_items enable row level security;
create policy "public product_items" on public.product_items
  for select using (true);

-- THE GATE (preview-aware, CHALLENGE_PRODUCTIZATION_SPEC §3.4):
-- returns the Cloudflare UID iff the content is a free preview on some product,
-- OR the caller holds a live (non-expired) entitlement to a product containing it.
-- SECURITY DEFINER so it can read content; the WHERE clause enforces access.
create or replace function public.get_playable_uid(p_content_id uuid)
returns text
language sql stable security definer set search_path = public as $$
  select w.cloudflare_uid
  from public.workouts w
  where w.id = p_content_id
    and (
      -- (a) free preview: any authenticated caller (token route requires auth → watermark identity)
      exists (
        select 1 from public.product_items pi
        where pi.content_id = w.id and pi.is_preview = true
      )
      or
      -- (b) entitled: caller owns a product that contains this content and it hasn't expired
      exists (
        select 1
        from public.entitlements e
        join public.product_items pi on pi.product_id = e.product_id
        where e.user_id = auth.uid()
          and pi.content_id = w.id
          and (e.expires_at is null or e.expires_at > now())
      )
    );
$$;
revoke all on function public.get_playable_uid(uuid) from public;
grant execute on function public.get_playable_uid(uuid) to authenticated;
