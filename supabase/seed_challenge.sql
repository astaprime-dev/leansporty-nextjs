-- =============================================================================
-- Operator seed: "21-Day Dance Challenge" (CHALLENGE_PRODUCTIZATION_SPEC §3.6/§11)
-- Idempotent. Run AFTER the entitlements migration (20260628120000) and after the
-- 15 workout rows exist with their cloudflare_uid set.
--
-- NOT a migration — it depends on data (workout rows, a Stripe Price) that only
-- exist once the operator has loaded the catalog and created the Stripe product.
-- Fill the two TODO blocks below, then run in the Supabase SQL editor.
-- =============================================================================

-- (1) Pre-req check — the 15 assets must be ready with a Cloudflare UID.
--     Run this first; if it returns < 15, adjust the mapping in (3) (graceful
--     degrade D5: seed left-to-right, 5 workout days/week, trailing days = rest).
-- select id, title, cloudflare_uid from public.workouts where cloudflare_uid is not null order by created_at;

-- (2) Upsert the product. Replace <STRIPE_PRICE_ID> with the €49 one-time Price.
insert into public.products
  (slug, kind, title, subtitle, price_cents, currency, stripe_price_id, is_active, config)
values
  ('21-day-dance-challenge', 'challenge',
   '21-Day Dance Challenge',
   'Three weeks. Fifteen feel-good sessions. Zero equipment.',
   4900, 'eur',
   '<STRIPE_PRICE_ID>',                          -- TODO: Stripe Price id
   true,
   '{"program_length_days":21,"drip_enabled":false,"workout_count":15}'::jsonb)
on conflict (slug) do update set
  title           = excluded.title,
  subtitle        = excluded.subtitle,
  price_cents     = excluded.price_cents,
  stripe_price_id = excluded.stripe_price_id,
  config          = excluded.config,
  is_active       = excluded.is_active;

-- (3) Upsert the 15 items. Map each workout_id (W1..W15, intended order) to its
--     calendar day per §2. Day 1 is the free preview. Replace every <W..> with a
--     real workouts.id. position = overall order 1..15; day_number = calendar day.
with product as (
  select id from public.products where slug = '21-day-dance-challenge'
)
insert into public.product_items
  (product_id, content_id, position, day_number, is_preview)
select product.id, v.content_id, v.position, v.day_number, v.is_preview
from product, (values
  ('<W1>'::uuid,   1,  1, true ),   -- Day 1  · free preview
  ('<W2>'::uuid,   2,  2, false),   -- Day 2
  ('<W3>'::uuid,   3,  3, false),   -- Day 3
  ('<W4>'::uuid,   4,  4, false),   -- Day 4
  ('<W5>'::uuid,   5,  5, false),   -- Day 5
  ('<W6>'::uuid,   6,  8, false),   -- Day 8
  ('<W7>'::uuid,   7,  9, false),   -- Day 9
  ('<W8>'::uuid,   8, 10, false),   -- Day 10
  ('<W9>'::uuid,   9, 11, false),   -- Day 11
  ('<W10>'::uuid, 10, 12, false),   -- Day 12
  ('<W11>'::uuid, 11, 15, false),   -- Day 15
  ('<W12>'::uuid, 12, 16, false),   -- Day 16
  ('<W13>'::uuid, 13, 17, false),   -- Day 17
  ('<W14>'::uuid, 14, 18, false),   -- Day 18
  ('<W15>'::uuid, 15, 19, false)    -- Day 19
) as v(content_id, position, day_number, is_preview)
on conflict (product_id, content_id) do update set
  position   = excluded.position,
  day_number = excluded.day_number,
  is_preview = excluded.is_preview;
