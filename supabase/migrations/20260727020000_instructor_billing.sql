-- Instructor payout + tax details (agreement §1/§7): business status, TIN, bank
-- account, address. Filled by the instructor in the Studio BEFORE the first
-- payout; read by the founder (service role / SQL) for the monthly bank-transfer
-- run, the self-billed settlement statements (samofakturowanie), and DAC7
-- reporting. One row per instructor. No card data and no identity documents live
-- here — KYC moves to Stripe Connect when payouts are automated.
create table if not exists public.instructor_billing (
  instructor_id   uuid primary key references public.instructors(id) on delete cascade,
  legal_name      text not null,
  business_name   text,                    -- JDG/company name, if different
  business_status text not null
    check (business_status in ('business', 'unregistered_activity', 'foreign')),
  tin             text not null,           -- NIP or foreign tax id (DAC7 + statements)
  vat_number      text,                    -- set when VAT-registered (self-billing adds VAT on top)
  address_line    text not null,
  city            text not null,
  postal_code     text not null,
  country         text not null,           -- ISO 3166-1 alpha-2
  iban            text not null,
  account_holder  text not null,           -- must be the instructor (agreement §6)
  -- Timestamp of the działalność-nierejestrowana statement (agreement §1);
  -- set when business_status = 'unregistered_activity'.
  unregistered_statement_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.instructor_billing is
  'Instructor payout + tax details (bank, TIN, business status, address). Written '
  'by the instructor in the Studio (RLS: own row); read by the founder via service '
  'role for monthly payouts, self-billed statements, and DAC7. See '
  'INSTRUCTOR_AGREEMENT.md §1/§7 and docs/INSTRUCTOR_PAYOUTS.md.';

alter table public.instructor_billing enable row level security;

create policy "Instructors read own billing"
  on public.instructor_billing for select to authenticated
  using (instructor_id in (select id from public.instructors where user_id = auth.uid()));

create policy "Instructors insert own billing"
  on public.instructor_billing for insert to authenticated
  with check (instructor_id in (select id from public.instructors where user_id = auth.uid()));

create policy "Instructors update own billing"
  on public.instructor_billing for update to authenticated
  using (instructor_id in (select id from public.instructors where user_id = auth.uid()))
  with check (instructor_id in (select id from public.instructors where user_id = auth.uid()));
-- No delete policy: the row outlives the relationship for tax records; no public
-- read: bank details are visible only to the instructor and the service role.
