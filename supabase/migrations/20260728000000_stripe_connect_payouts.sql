-- Stripe Connect payouts (dual rail). Connect becomes the automated payout rail
-- for instructors in countries it can reach from a PL platform (EEA + UK at 0%,
-- CH/US/CA at 0.25%); instructors elsewhere (e.g. Ukraine, Brazil) stay on a
-- manual rail (bank details in instructor_billing, sent via Wise/Payoneer and
-- marked paid in the admin payout run). Charges are untouched — the platform
-- remains merchant of record; payouts are separate transfers created from the
-- instructor_payouts ledger. See docs/INSTRUCTOR_PAYOUTS.md.

-- 1) Connected-account state, one row per instructor. Written only by the
--    Connect API routes and the Connect webhook (service role); the instructor
--    reads their own row to drive the onboarding card.
create table if not exists public.instructor_connect_accounts (
  instructor_id     uuid primary key references public.instructors(id) on delete cascade,
  stripe_account_id text not null unique,      -- acct_...
  country           text not null,             -- locked at account creation (immutable on Stripe)
  details_submitted boolean not null default false,
  payouts_enabled   boolean not null default false,
  transfers_status  text not null default 'inactive'
    check (transfers_status in ('inactive', 'pending', 'active')),
  disabled_reason   text,                      -- requirements.disabled_reason; null when healthy
  requirements_due  int not null default 0,    -- count of requirements.currently_due (UI hint)
  onboarding_completed_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.instructor_connect_accounts is
  'Stripe Connect account per instructor (transfers-only capability, Express '
  'dashboard). Synced from account.updated webhooks and the status route. '
  'Transfers are gated on transfers_status = active AND payouts_enabled.';

alter table public.instructor_connect_accounts enable row level security;

create policy "Instructors read own connect account"
  on public.instructor_connect_accounts for select to authenticated
  using (instructor_id in (select id from public.instructors where user_id = auth.uid()));
-- No insert/update/delete policies: only the API routes and the Connect webhook
-- (service role) write.

-- 2) Ledger: carry the Stripe references needed to transfer per sale, and stop
--    hard-deleting rows on refund — refunds become status transitions so the
--    ledger stays a complete audit trail.
alter table public.instructor_payouts
  add column if not exists stripe_payment_intent_id text,  -- captured by the webhook at sale time
  add column if not exists stripe_charge_id         text,  -- resolved lazily at payout time
  add column if not exists stripe_transfer_id       text,  -- tr_..., set when the transfer is created
  add column if not exists transfer_error           text,  -- last failure message; cleared on success
  add column if not exists paid_via                 text
    check (paid_via in ('stripe_connect', 'manual'));      -- which rail actually paid this row

alter table public.instructor_payouts drop constraint if exists instructor_payouts_status_check;
alter table public.instructor_payouts add constraint instructor_payouts_status_check
  check (status in ('pending', 'paid', 'refunded', 'reversed', 'reversal_failed'));

comment on column public.instructor_payouts.status is
  'pending → sale recorded, not yet paid out. paid → transfer created (Connect) '
  'or founder marked the manual payment done. refunded → refund arrived before '
  'any payout (row kept for audit, excluded from runs). reversed → refund after '
  'a Connect transfer, reversal succeeded. reversal_failed → reversal (or manual '
  'clawback) needed but not completed — surfaced in the admin payout page.';

create unique index if not exists instructor_payouts_transfer_idx
  on public.instructor_payouts (stripe_transfer_id) where stripe_transfer_id is not null;
create index if not exists instructor_payouts_pending_by_instructor_idx
  on public.instructor_payouts (instructor_id) where status = 'pending';

-- 3) Bank details become optional: Connect-country instructors give their bank
--    account to Stripe during hosted onboarding; the fields stay for manual-rail
--    (out-of-region) instructors.
alter table public.instructor_billing
  alter column iban drop not null,
  alter column account_holder drop not null;
