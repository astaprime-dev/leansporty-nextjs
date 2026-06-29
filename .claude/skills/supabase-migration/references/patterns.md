# Migration patterns & the Phase-1 entitlements migration

## RLS templates

```sql
alter table public.my_table enable row level security;

-- read own
create policy "read own my_table" on public.my_table
  for select using (auth.uid() = user_id);

-- write own
create policy "insert own my_table" on public.my_table
  for insert with check (auth.uid() = user_id);
create policy "update own my_table" on public.my_table
  for update using (auth.uid() = user_id);

-- public catalog (read-only to everyone)
create policy "public read" on public.products for select using (true);
```

## security definer RPC (the access gate)

Always `revoke from public` then `grant execute to authenticated`, and pin `search_path`:

```sql
create or replace function public.my_gate(p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select ... where auth.uid() = ... ;
$$;
revoke all on function public.my_gate(uuid) from public;
grant execute on function public.my_gate(uuid) to authenticated;
```

## updated_at trigger (reuse existing function)

```sql
create trigger set_updated_at before update on public.my_table
  for each row execute function public.update_updated_at_column();
```

---

## Phase-1 migration: payments & entitlements

`supabase/migrations/<timestamp>_payments_and_entitlements.sql`. Reuses the existing `workouts` table as "content" (decision OD-3) instead of a separate `content` table.

```sql
-- PRODUCTS = what is sold
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null check (kind in ('course','challenge','membership','single')),
  title text not null,
  subtitle text,
  cover_image_url text,
  price_cents int not null default 0,
  currency text not null default 'eur',
  stripe_price_id text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,   -- challenge: {program_length_days, drip_enabled, workout_count}
  created_at timestamptz not null default now()
);

-- CONTENT = existing workouts rows; add the Stream UID
alter table public.workouts add column if not exists cloudflare_uid text;
create index if not exists workouts_cloudflare_uid_idx on public.workouts(cloudflare_uid);

-- mapping product -> content, with scheduling + preview
create table if not exists public.product_items (
  product_id uuid not null references public.products(id) on delete cascade,
  content_id uuid not null references public.workouts(id) on delete cascade,
  position int not null default 0,
  day_number int,
  is_preview boolean not null default false,
  item_label text,
  primary key (product_id, content_id)
);

-- ENTITLEMENTS = what a user owns
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  source text not null default 'stripe',        -- stripe | voucher | comp
  stripe_session_id text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,                        -- null = lifetime; set for memberships
  unique (user_id, product_id)
);
create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists entitlements_session_idx on public.entitlements(stripe_session_id);

-- RLS
alter table public.entitlements enable row level security;
create policy "read own entitlements" on public.entitlements for select using (auth.uid() = user_id);
alter table public.products enable row level security;
create policy "public catalog" on public.products for select using (true);
alter table public.product_items enable row level security;
create policy "public product_items" on public.product_items for select using (true);
-- entitlements are written ONLY by the service-role Stripe webhook (bypasses RLS); no insert policy for users.

-- THE GATE (preview-aware): UID returned if content is a free preview OR caller is entitled.
create or replace function public.get_playable_uid(p_content_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select w.cloudflare_uid from public.workouts w
  where w.id = p_content_id
    and (
      exists (select 1 from public.product_items pi
              where pi.content_id = w.id and pi.is_preview = true)
      or exists (select 1 from public.entitlements e
              join public.product_items pi on pi.product_id = e.product_id
              where e.user_id = auth.uid() and pi.content_id = w.id
                and (e.expires_at is null or e.expires_at > now()))
    );
$$;
revoke all on function public.get_playable_uid(uuid) from public;
grant execute on function public.get_playable_uid(uuid) to authenticated;
```

Notes:
- The webhook writes entitlements with the **service-role** client, so no user `insert` policy is needed (and none should be added — users must not self-grant).
- Preview playback still returns a *signed* token; `is_preview` only removes the *purchase* requirement, not the signing (see the `secure-playback` skill).
- For memberships (Phase 2), set `expires_at` from the Stripe subscription period; the same gate handles expiry.
- Voucher/comp grants insert an `entitlements` row with `source` set accordingly — same gate, no special-casing.
