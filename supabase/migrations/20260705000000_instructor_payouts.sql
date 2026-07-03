-- S3 (Studio plan) — instructor payout ledger.
--
-- Every paid-class sale records what the instructor is owed (their split of the amount
-- actually charged), so the founder can pay them by MANUAL monthly bank transfer while
-- instructor count is small (Stripe Connect stays deferred until ~5 active instructors).
-- Written ONLY by the Stripe webhook (service-role); instructors read their own rows.

-- The instructor's share % is stored per product (locked when the class is created) so
-- a later default change doesn't retroactively alter past classes. Default 85 (platform
-- keeps 15%); founding instructors can be set to 90 on their instructors row, which the
-- provisioning helper copies onto new products.
alter table public.products
  add column if not exists split_pct int not null default 85;

alter table public.instructors
  add column if not exists split_pct int;   -- null = platform default (85); e.g. 90 for founding

create table if not exists public.instructor_payouts (
  id                    uuid primary key default gen_random_uuid(),
  instructor_id         uuid not null references public.instructors(id) on delete cascade,
  product_id            uuid references public.products(id) on delete set null,
  stream_id             uuid references public.live_stream_sessions(id) on delete set null,
  user_id               uuid references auth.users(id) on delete set null,   -- buyer, for reconciliation
  stripe_session_id     text not null unique,                                -- one payout row per sale (idempotent)
  gross_cents           int  not null,          -- amount actually charged
  currency              text not null,
  split_pct             int  not null,          -- instructor % applied (audit)
  platform_fee_cents    int  not null,          -- max((100-split)%, €1.50 floor), clamped ≤ gross
  instructor_share_cents int not null,          -- gross - platform_fee
  status                text not null default 'pending' check (status in ('pending','paid')),
  payout_batch_id       text,                   -- set when marked paid
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);
create index if not exists instructor_payouts_instructor_idx on public.instructor_payouts(instructor_id);
create index if not exists instructor_payouts_status_idx on public.instructor_payouts(status);

comment on table public.instructor_payouts is
  'Per-sale record of what each instructor is owed (their split of the charged amount). '
  'Written only by the Stripe webhook (service-role). Source for manual monthly payouts '
  'until Stripe Connect is built. See docs/INSTRUCTOR_PAYOUTS.md.';

alter table public.instructor_payouts enable row level security;
create policy "Instructors read own payouts"
  on public.instructor_payouts
  for select
  to authenticated
  using (
    instructor_id in (select id from public.instructors where user_id = auth.uid())
  );
-- No insert/update/delete policy: the webhook (service-role) is the only writer.
