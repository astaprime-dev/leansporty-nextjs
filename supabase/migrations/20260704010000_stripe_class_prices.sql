-- S2 refinement — shared Stripe Prices for paid classes, keyed by amount.
--
-- Instead of one Stripe Product+Price per class (a "zoo"), all paid classes share a
-- single "Lean Sporty live class" Stripe Product, and every distinct price amount is
-- created ONCE and reused across every class at that price. This cache maps
-- (currency, amount) → the reusable Stripe Price. Number of Stripe objects = number
-- of distinct amounts ever used, not number of classes.
--
-- Each class still has its own `products` row (for entitlement/instructor/roster) —
-- only the Stripe-side Price/Product objects are shared. The per-class products row's
-- stripe_price_id points at the shared Price.

create table if not exists public.stripe_class_prices (
  currency          text not null,
  unit_amount       int  not null,     -- minor units (cents)
  stripe_price_id   text not null,
  stripe_product_id text not null,     -- the shared "live class" product for this currency
  created_at        timestamptz not null default now(),
  primary key (currency, unit_amount)
);

comment on table public.stripe_class_prices is
  'Reusable Stripe Prices for paid live classes, deduped by (currency, amount). '
  'Written/read only by the server-side provisioning helper via the service-role '
  'client — RLS-enabled with no policies (no anon/authenticated access).';

alter table public.stripe_class_prices enable row level security;
-- No policies: service-role only.
