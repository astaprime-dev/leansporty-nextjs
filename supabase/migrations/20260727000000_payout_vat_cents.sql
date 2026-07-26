-- Net-of-VAT instructor split.
--
-- As merchant of record the platform owes VAT on the FULL charged amount (CJEU
-- C-695/20 "OnlyFans" deemed-supplier rule), so the instructor split now applies
-- to gross minus VAT — splitting the VAT-inclusive gross put the platform fee
-- below the ~23% VAT and lost money on sales. Record the VAT portion per sale so the
-- ledger reconciles: gross_cents = vat_cents + platform_fee_cents + instructor_share_cents.
alter table public.instructor_payouts
  add column if not exists vat_cents int not null default 0;

comment on column public.instructor_payouts.vat_cents is
  'VAT portion of gross_cents — remitted by the platform to the tax office, not split. '
  'Stripe''s amount_tax when automatic tax ran on the session; otherwise backed out at '
  'PAYOUT_VAT_PCT (default 23%). 0 on rows written before 2026-07-27, when the split '
  'was still applied to the VAT-inclusive gross.';
