-- =============================================================================
-- Operator seed: "21-Day Dance Challenge" (CHALLENGE_PRODUCTIZATION_SPEC §3.6/§11)
-- Idempotent. Run in the Supabase SQL editor AFTER the entitlements migration
-- (20260628120000). Reuses the EXISTING workouts rows (no duplicates) — their
-- cloudflare_uid is backfilled from the videoUrl, which already embeds the UID.
--
-- Currently maps 14 ready videos (Workout1..14) to days 1-5, 8-12, 15-18.
-- Day 1 = free preview. Day 19 stays a rest day until Workout15 is uploaded —
-- then add its row to the mapping in (3) and bump config.workout_count to 15.
-- =============================================================================

-- (1) Backfill cloudflare_uid on existing rows from their Cloudflare HLS videoUrl.
update public.workouts
set cloudflare_uid = substring("videoUrl" from 'cloudflarestream\.com/([a-f0-9]{32})')
where cloudflare_uid is null
  and "videoUrl" ~ 'cloudflarestream\.com/[a-f0-9]{32}';

-- (2) Upsert the product. Add the Stripe Price id when you wire checkout
--     (leave null for now to test preview + comped playback without Stripe).
insert into public.products
  (slug, kind, title, subtitle, price_cents, currency, stripe_price_id, is_active, config)
values
  ('21-day-dance-challenge', 'challenge',
   '21-Day Dance Challenge',
   'Three weeks of feel-good dance sessions. Zero equipment.',
   4900, 'eur',
   null,                         -- TODO: Stripe Price id (e.g. price_...) when wiring checkout
   true,
   '{"program_length_days":21,"drip_enabled":false,"workout_count":14,"access_months":12}'::jsonb)
on conflict (slug) do update set
  title       = excluded.title,
  subtitle    = excluded.subtitle,
  price_cents = excluded.price_cents,
  config      = excluded.config,
  is_active   = excluded.is_active;

-- (3) Upsert the 14 items. content_id is resolved by joining workouts on the
--     backfilled cloudflare_uid, so no workout ids to copy by hand.
with product as (
  select id from public.products where slug = '21-day-dance-challenge'
),
mapping (cloudflare_uid, position, day_number, is_preview) as (
  values
    ('5f8fe5b3fc6136b494904cea9a04bf61',  1,  1, true ),  -- Workout1  · Day 1 · free preview
    ('a6a4d5d8d23c5e1510db52e2bb865533',  2,  2, false),  -- Workout2  · Day 2
    ('ac121b213d9f7db370c744e71667171f',  3,  3, false),  -- Workout3  · Day 3
    ('01453b2f7dea992bab707178c0e54799',  4,  4, false),  -- Workout4  · Day 4
    ('d661ca621b8e63f957aa913cd81324c1',  5,  5, false),  -- Workout5  · Day 5
    ('b07147506368f2a3c9ed44c463c1d867',  6,  8, false),  -- Workout6  · Day 8
    ('3ea7b091ad91376cb0ea371da2898db7',  7,  9, false),  -- Workout7  · Day 9
    ('bf22c534c2551741dd8109461d399e97',  8, 10, false),  -- Workout8  · Day 10
    ('45dd3acad29764231e17233d04dfc9d7',  9, 11, false),  -- Workout9  · Day 11
    ('7a8fce830373940d077cebf6b96935fa', 10, 12, false),  -- Workout10 · Day 12
    ('78b8eb722e4bbfab118451672162376c', 11, 15, false),  -- Workout11 · Day 15
    ('6ba6a4840d1e1a1fc903df4b4fbab8f0', 12, 16, false),  -- Workout12 · Day 16
    ('6988d51b6a242b123debbbd91304722e', 13, 17, false),  -- Workout13 · Day 17
    ('f134459df51b977f73122b9c78d3ff20', 14, 18, false)   -- Workout14 · Day 18
    -- ('<WORKOUT15_UID>',                15, 19, false)   -- add when uploaded; set workout_count=15
)
insert into public.product_items (product_id, content_id, position, day_number, is_preview)
select p.id, w.id, m.position, m.day_number, m.is_preview
from product p
join mapping m on true
join public.workouts w on w.cloudflare_uid = m.cloudflare_uid
on conflict (product_id, content_id) do update set
  position   = excluded.position,
  day_number = excluded.day_number,
  is_preview = excluded.is_preview;

-- (4) Verify: should return 14 rows (each day with its workout title).
-- select pi.position, pi.day_number, pi.is_preview, w.title, w.cloudflare_uid
-- from public.product_items pi
-- join public.products p on p.id = pi.product_id and p.slug = '21-day-dance-challenge'
-- join public.workouts w on w.id = pi.content_id
-- order by pi.position;

-- (5) OPTIONAL (testing without Stripe): comp yourself the full program so you can
--     see /my-program with all sessions unlocked. Replace <YOUR_AUTH_USER_ID>
--     (Supabase → Authentication → Users → your id).
-- insert into public.entitlements (user_id, product_id, source)
-- select '<YOUR_AUTH_USER_ID>', id, 'comp'
-- from public.products where slug = '21-day-dance-challenge'
-- on conflict (user_id, product_id) do nothing;
