-- Checkout now defines prices inline (price_data from products.price_cents/currency)
-- instead of referencing pre-created Stripe Price objects. Stored Price ids are
-- mode-bound (test vs live) and account-bound — after the move to the dedicated
-- Lean Sporty Stripe account they broke whichever environment didn't mint them.
-- With inline pricing no Stripe ids need to live in the DB at all.
--
-- ⚠️ DEFERRED CLEANUP — do NOT apply as part of the go-live release.
-- Apply only after the inline-price code has soaked in production long enough
-- that a Vercel rollback would no longer target a build that still selects
-- these columns (old code + this migration = checkout 500s on the missing
-- column, and the rollback path cannot be restored because the id data is
-- dropped). The data itself is already dead — every stored id points at the
-- decommissioned 22 Skills Stripe account. Until applied, the new code simply
-- ignores the columns; they are nullable and harmless.

drop table if exists public.stripe_class_prices;

alter table public.products drop column if exists stripe_price_id;
alter table public.products drop column if exists stripe_product_id;
