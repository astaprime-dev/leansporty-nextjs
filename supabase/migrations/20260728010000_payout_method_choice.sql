-- 1) The instructor's explicit payout-method choice (the radio on
--    payout-details; persisted on click). null = never chosen: use whatever is
--    set up, preferring Stripe. 'manual' overrides an active Stripe account —
--    the payout run then lists the instructor on the manual rail.
alter table public.instructor_billing
  add column if not exists payout_method text
  check (payout_method in ('stripe', 'manual'));

-- 2) Progressive filling for the Stripe path: onboarding creates the row with
--    the declared country only, name/address are imported FROM Stripe after
--    hosted onboarding (no duplicate typing), and only TIN/VAT/business status
--    are asked in the app (DAC7 — Stripe doesn't share tax numbers). The
--    identity columns therefore become nullable; the manual (bank-transfer)
--    path still collects and requires them in its one combined form.
alter table public.instructor_billing
  alter column legal_name drop not null,
  alter column address_line drop not null,
  alter column city drop not null,
  alter column postal_code drop not null,
  alter column business_status drop not null;
