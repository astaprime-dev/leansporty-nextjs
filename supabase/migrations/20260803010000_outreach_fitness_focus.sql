-- Outreach: point the Places sweep at dance FITNESS, not dance schools.
--
-- The first seed used "dance studio in <city>", which is what Google matches
-- ballroom academies, kids' dance schools and competitive technique studios
-- against. The first live sweep of Warsaw returned Arthur Murray, a children's
-- school and a couples' technique studio — all real dance studios, none of them
-- the ICP in docs/INSTRUCTOR_OUTREACH.md, which is women teaching dance-based
-- FITNESS to an audience of women 30+.
--
-- These queries target the class format instead of the art form. Idempotent —
-- safe to re-run.

update public.outreach_territories
set places_queries = array[
      'dance fitness classes in ' || coalesce(city, country),
      'zumba class in '           || coalesce(city, country),
      'pilates studio in '        || coalesce(city, country),
      'fitness classes for women in ' || coalesce(city, country)
    ],
    updated_at = now();

comment on column public.outreach_territories.places_queries is
  'Google Places (New) Text Search queries. Target the class format (dance '
  'fitness, zumba, pilates, women''s fitness) rather than "dance studio" — the '
  'latter matches ballroom and children''s schools, which are not the ICP.';
