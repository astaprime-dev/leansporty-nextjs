-- Split re-set 2026-07-27 (pre-launch, no instructor sales exist): standard 80,
-- featured 85 (was 85/90). Decided together with the net-of-VAT split
-- (20260727000000) and the removal of the €1.50 per-sale fee floor in favour of
-- a €5 minimum paid price — the pure 80/85 percentage now holds exactly at
-- every allowed price.
--
-- Order matters: move standard rows off 85 BEFORE reusing 85 for featured.
update public.products    set split_pct = 80 where split_pct = 85;
update public.instructors set split_pct = 80 where split_pct = 85;
update public.products    set split_pct = 85 where split_pct = 90;
update public.instructors set split_pct = 85 where split_pct = 90;

alter table public.products alter column split_pct set default 80;

comment on column public.products.split_pct is
  'Instructor share % of the net-of-VAT amount, locked per product at creation. '
  'Default 80; featured instructors 85 (copied from instructors.split_pct).';
comment on column public.instructors.split_pct is
  'null = platform default (80); 85 for featured instructors.';
