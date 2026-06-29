-- Phase 3 (pulled forward) — abandoned-checkout recovery (E3.4, first email win)
-- Tracks Stripe Checkout sessions that started but did not complete, and drives a
-- short recovery email sequence. The buyer is authenticated BEFORE checkout, so we
-- already hold their user_id + email + product at abandonment time.
--
-- Writers: the service-role Stripe webhook (records abandonment, marks completed)
-- and the recovery cron (sends sequence steps). Both bypass RLS. There is NO user
-- read/write path — these are operational tables, locked down like entitlements.

-- CHECKOUT_RECOVERY = one row per abandoned checkout, carrying the sequence state.
create table if not exists public.checkout_recovery (
  id                uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,                 -- the session that expired
  user_id           uuid not null references auth.users(id) on delete cascade,
  email             text not null,                        -- snapshot at checkout (where we send)
  product_id        uuid not null references public.products(id) on delete cascade,
  product_slug      text not null,                        -- denormalized for the resume link
  status            text not null default 'open'
                      check (status in ('open','completed','exhausted','unsubscribed')),
  emails_sent       int not null default 0,               -- index into the recovery sequence
  last_email_at     timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now()    -- abandonment time; sequence delays are relative to this
);
-- The cron scans by status; one open row per (user, product) is enforced in code
-- (partial unique index keeps it honest without blocking historical completed rows).
create unique index if not exists checkout_recovery_open_user_product_idx
  on public.checkout_recovery(user_id, product_id)
  where status = 'open';
create index if not exists checkout_recovery_status_idx on public.checkout_recovery(status);

alter table public.checkout_recovery enable row level security;
-- NO policies: only the service-role webhook/cron touch this table. Users never do.

-- EMAIL_OPT_OUTS = unsubscribe suppression list (EU/CASL compliance). Checked before
-- every recovery send. Keyed by email so it survives account changes.
create table if not exists public.email_opt_outs (
  email      text primary key,
  reason     text,                                        -- 'unsubscribe' | 'bounce' | 'complaint'
  created_at timestamptz not null default now()
);
alter table public.email_opt_outs enable row level security;
-- NO policies: written by the unsubscribe route (service role) only.
