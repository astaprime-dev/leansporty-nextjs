-- Instructor outreach engine — the top of the recruiting funnel.
--
-- docs/INSTRUCTOR_OUTREACH.md documents the whole funnel (DM → /teach →
-- application → mint invite → /welcome/<code> → activation) and ends with "a
-- spreadsheet is enough at this scale". That spreadsheet never existed, so the
-- funnel had no top: the same Instagram accounts kept resurfacing, nothing
-- recorded who had already been contacted, and coverage was random rather than
-- geographic. These two tables are that spreadsheet, deduplicated and
-- organised by city.
--
-- outreach_prospects — one row per account, keyed on a normalized handle. The
--   unique index on handle is the whole point: every discovery lane (paste,
--   hashtag sweep, Google Places, Google operators) funnels through the same
--   import path, so re-finding an account is a no-op instead of a duplicate.
-- outreach_territories — the city queue, so sweeps are systematic. Localized
--   hashtags matter: English-only tags miss most local instructors.
--
-- Writers: the service-role admin routes under app/api/admin/outreach/* and the
-- best-effort attribution write in consumeInstructorInvite(). There is NO user
-- read/write path — these are operational tables, locked down like leads /
-- checkout_recovery / instructor_invites.
--
-- Sending DMs is deliberately NOT automated: Meta's Messaging API forbids
-- business-initiated messages outside a 24-hour reply window, and unofficial DM
-- automation gets accounts flagged. The tool renders the message; a human sends
-- it. These tables track everything around that send.

-- ---------------------------------------------------------------------------
-- Territories: the city queue that drives sweeps.
-- ---------------------------------------------------------------------------

create table if not exists public.outreach_territories (
  id                  uuid primary key default gen_random_uuid(),
  -- ISO-3166-1 alpha-2, uppercase.
  country             text not null,
  -- Null would mean a country-wide territory; every seeded row is a city.
  city                text,
  -- 1 = work first. Seeded 1 English-speaking, 2 Poland/Central Europe,
  -- 3 rest of EEA/UK, 4 Ukraine + LatAm (manual Wise payout rail).
  priority            integer not null default 100,
  -- Localized Instagram hashtags for the browser-assisted sweep.
  hashtags            text[] not null default '{}',
  -- site:instagram.com operator queries, with local-language words for
  -- "instructor" — English-only queries miss most non-English markets.
  search_queries      text[] not null default '{}',
  -- Google Places (New) Text Search queries for the studio lane.
  places_queries      text[] not null default '{}',
  status              text not null default 'queued'
                        check (status in ('queued','sweeping','swept','exhausted')),
  last_swept_at       timestamptz,
  -- Running counters, updated by the import path — makes coverage visible
  -- instead of remembered.
  prospects_found     integer not null default 0,
  prospects_qualified integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- One territory per city. Plain (not expression) index so the seed below can
-- infer it in ON CONFLICT and PostgREST can target it — re-running is safe.
create unique index if not exists outreach_territories_country_city_idx
  on public.outreach_territories (country, city);
-- The territory board and the sweep routes scan by priority within status.
create index if not exists outreach_territories_status_priority_idx
  on public.outreach_territories (status, priority);

alter table public.outreach_territories enable row level security;
-- NO policies: only the service-role admin routes touch this table.

-- ---------------------------------------------------------------------------
-- Prospects: one row per account, deduplicated on handle.
-- ---------------------------------------------------------------------------

create table if not exists public.outreach_prospects (
  id             uuid primary key default gen_random_uuid(),
  -- Normalized by normalizeHandle() in lib/outreach.ts: lowercased, no '@', no
  -- URL wrapper, no query string. Stored bare (e.g. 'anastasiia.fit') so the
  -- unique index below dedupes across every discovery lane and PostgREST upsert
  -- can target it via onConflict='handle'.
  handle         text not null,
  platform       text not null default 'instagram'
                   check (platform in ('instagram','tiktok','youtube','web')),
  display_name   text,
  profile_url    text,
  bio            text,
  -- The link-in-bio. A linktree with a booking page is an ICP signal: she is
  -- already trying to monetize.
  external_link  text,
  followers      integer,
  -- What she teaches — 'latin', 'zumba', 'pilates', 'hiphop', 'strength', …
  discipline     text,
  -- Language she teaches in (ISO-639-1), so DMs go out in the right one.
  language       text,
  city           text,
  country        text,
  territory_id   uuid references public.outreach_territories(id) on delete set null,
  source         text not null default 'manual'
                   check (source in ('hashtag','places','google','similar','manual','inbound')),
  -- Which hashtag / search query / studio website produced this row.
  source_detail  text,
  -- Claude's ICP fit, 0–100, with its one-line reason. Below the threshold the
  -- row is stored as 'rejected' rather than deleted, so another lane finding
  -- the same account doesn't resurface it.
  score          integer,
  score_reason   text,
  scored_at      timestamptz,
  status         text not null default 'new'
                   check (status in ('new','qualified','rejected','contacted',
                                     'replied','invited','activated','passed')),
  -- The {specific_thing} personalization slot Touch 1 needs: one concrete post
  -- or detail of hers. The line that proves the DM is not a mass send.
  specific_thing text,
  t1_at          timestamptz,
  t2_at          timestamptz,
  t3_at          timestamptz,
  -- Drives the work queue: Touch 2 lands +3 days, Touch 3 +4 days after that,
  -- per the sequence in docs/INSTRUCTOR_OUTREACH.md.
  next_touch_at  timestamptz,
  -- Set when an invite is minted for her; the attribution write in
  -- consumeInstructorInvite() matches on this to flip status to 'activated'.
  invite_code    text references public.instructor_invites(code) on delete set null,
  user_id        uuid references auth.users(id) on delete set null,
  notes          text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- THE dedupe key. Everything else in this file exists to serve it.
create unique index if not exists outreach_prospects_handle_idx
  on public.outreach_prospects (handle);
-- The panel filters by status.
create index if not exists outreach_prospects_status_idx
  on public.outreach_prospects (status);
-- The work queue scans for what is due.
create index if not exists outreach_prospects_next_touch_idx
  on public.outreach_prospects (next_touch_at);
-- The territory board counts per city.
create index if not exists outreach_prospects_territory_idx
  on public.outreach_prospects (territory_id);
-- The queue orders best-fit first.
create index if not exists outreach_prospects_score_idx
  on public.outreach_prospects (score desc);
-- The attribution write in consumeInstructorInvite() looks up by invite code.
create index if not exists outreach_prospects_invite_code_idx
  on public.outreach_prospects (invite_code);

alter table public.outreach_prospects enable row level security;
-- NO policies: only the service-role admin routes and the attribution write
-- touch this table. Prospects are people who have not opted in to anything —
-- nothing here is ever exposed to a user-facing read path.

-- ---------------------------------------------------------------------------
-- Seed the city queue.
--
-- Priority order is the founder's: English-speaking first (biggest paying
-- audience for the classes), then Poland/Central Europe (home market, Connect
-- payouts), then the rest of the EEA/UK, then Ukraine + LatAm (manual Wise
-- rail, high instructor density).
--
-- search_queries and places_queries are derived from the city name and the
-- local-language words for "instructor" so the seed stays readable.
-- ---------------------------------------------------------------------------

insert into public.outreach_territories
  (country, city, priority, hashtags, search_queries, places_queries)
select
  t.country,
  t.city,
  t.priority,
  t.hashtags,
  array[
    'site:instagram.com "' || t.city || '" (' || t.local_terms || ')',
    'site:instagram.com "' || t.city || '" (bachata OR salsa OR zumba OR pilates)'
  ],
  array[
    'dance studio in ' || t.city,
    'dance fitness studio in ' || t.city,
    'pilates studio in ' || t.city
  ]
from (values
  -- Priority 1 — English-speaking
  ('US','New York',    1, array['#nycdance','#nycdancefitness','#bachatanyc','#nycpilates'],            'instructor OR teacher OR coach'),
  ('US','Los Angeles', 1, array['#ladancer','#ladancefitness','#bachatala','#lapilates'],               'instructor OR teacher OR coach'),
  ('US','Chicago',     1, array['#chicagodance','#chicagodancefitness','#chicagosalsa'],                'instructor OR teacher OR coach'),
  ('US','Miami',       1, array['#miamidance','#bachatamiami','#zumbamiami','#miamifitness'],           'instructor OR teacher OR coach'),
  ('US','Houston',     1, array['#houstondance','#houstonfitness','#bachatahouston'],                   'instructor OR teacher OR coach'),
  ('US','Atlanta',     1, array['#atlantadance','#atlantafitness','#atlbachata'],                       'instructor OR teacher OR coach'),
  ('CA','Toronto',     1, array['#torontodance','#torontofitness','#bachatatoronto'],                   'instructor OR teacher OR coach'),
  ('CA','Vancouver',   1, array['#vancouverdance','#vancouverfitness','#bachatavancouver'],             'instructor OR teacher OR coach'),
  ('CA','Montreal',    1, array['#montrealdanse','#bachatamontreal','#montrealfitness'],                'professeure OR instructrice OR coach'),
  ('GB','London',      1, array['#londondance','#londondancefitness','#bachatalondon','#londonpilates'],'instructor OR teacher OR coach'),
  ('GB','Manchester',  1, array['#manchesterdance','#manchesterfitness','#bachatamanchester'],          'instructor OR teacher OR coach'),
  ('GB','Birmingham',  1, array['#birminghamdance','#birminghamfitness'],                               'instructor OR teacher OR coach'),
  ('AU','Sydney',      1, array['#sydneydance','#sydneyfitness','#bachatasydney'],                      'instructor OR teacher OR coach'),
  ('AU','Melbourne',   1, array['#melbournedance','#melbournefitness','#bachatamelbourne'],             'instructor OR teacher OR coach'),
  ('AU','Brisbane',    1, array['#brisbanedance','#brisbanefitness'],                                   'instructor OR teacher OR coach'),

  -- Priority 2 — Poland + Central Europe
  ('PL','Warsaw',      2, array['#warszawataniec','#bachatawarszawa','#zumbawarszawa','#treningwarszawa'], 'instruktorka OR trenerka OR zajecia'),
  ('PL','Krakow',      2, array['#krakowtaniec','#bachatakrakow','#zumbakrakow'],                       'instruktorka OR trenerka OR zajecia'),
  ('PL','Wroclaw',     2, array['#wroclawtaniec','#bachatawroclaw','#zumbawroclaw'],                    'instruktorka OR trenerka OR zajecia'),
  ('PL','Poznan',      2, array['#poznantaniec','#bachatapoznan','#zumbapoznan'],                       'instruktorka OR trenerka OR zajecia'),
  ('PL','Gdansk',      2, array['#gdansktaniec','#bachatagdansk','#zumbagdansk'],                       'instruktorka OR trenerka OR zajecia'),
  ('PL','Lodz',        2, array['#lodztaniec','#zumbalodz'],                                            'instruktorka OR trenerka OR zajecia'),
  ('CZ','Prague',      2, array['#prahatanec','#bachataprague','#zumbapraha'],                          'lektorka OR trenerka'),
  ('HU','Budapest',    2, array['#budapesttanc','#bachatabudapest','#zumbabudapest'],                   'oktato OR edzo'),
  ('SK','Bratislava',  2, array['#bratislavatanec','#zumbabratislava'],                                 'lektorka OR trenerka'),
  ('RO','Bucharest',   2, array['#dansbucuresti','#bachatabucuresti','#zumbabucuresti'],                'instructor OR antrenor'),

  -- Priority 3 — rest of the EEA + Ireland
  ('DE','Berlin',      3, array['#berlintanzen','#bachataberlin','#zumbaberlin','#berlinfitness'],      'Tanzlehrerin OR Trainerin'),
  ('DE','Munich',      3, array['#muenchentanzen','#bachatamunich','#zumbamuenchen'],                   'Tanzlehrerin OR Trainerin'),
  ('DE','Hamburg',     3, array['#hamburgtanzen','#bachatahamburg'],                                    'Tanzlehrerin OR Trainerin'),
  ('NL','Amsterdam',   3, array['#amsterdamdance','#bachataamsterdam','#zumbaamsterdam'],               'docent OR trainer'),
  ('ES','Madrid',      3, array['#bailemadrid','#bachatamadrid','#zumbamadrid','#madridfitness'],       'profesora OR instructora OR entrenadora'),
  ('ES','Barcelona',   3, array['#bailebarcelona','#bachatabarcelona','#zumbabarcelona'],               'profesora OR instructora OR entrenadora'),
  ('ES','Valencia',    3, array['#bailevalencia','#bachatavalencia'],                                   'profesora OR instructora OR entrenadora'),
  ('IT','Milan',       3, array['#ballomilano','#bachatamilano','#zumbamilano'],                        'insegnante OR istruttrice'),
  ('IT','Rome',        3, array['#balloroma','#bachataroma','#zumbaroma'],                              'insegnante OR istruttrice'),
  ('FR','Paris',       3, array['#danseparis','#bachataparis','#zumbaparis'],                           'professeure OR coach'),
  ('IE','Dublin',      3, array['#dublindance','#bachatadublin','#dublinfitness'],                      'instructor OR teacher OR coach'),
  ('PT','Lisbon',      3, array['#dancalisboa','#bachatalisboa','#zumbalisboa'],                        'professora OR instrutora'),
  ('SE','Stockholm',   3, array['#stockholmdans','#bachatastockholm'],                                  'instruktor OR tranare'),

  -- Priority 4 — Ukraine + LatAm (manual Wise payout rail)
  ('UA','Kyiv',        4, array['#kyivdance','#танцікиїв','#зумбакиїв'],                                'тренерка OR викладачка'),
  ('UA','Lviv',        4, array['#lvivdance','#танцільвів'],                                            'тренерка OR викладачка'),
  ('UA','Odesa',       4, array['#odesadance','#танціодеса'],                                           'тренерка OR викладачка'),
  ('AR','Buenos Aires',4, array['#bailebuenosaires','#bachatabuenosaires','#zumbabuenosaires'],         'profesora OR instructora'),
  ('CO','Bogota',      4, array['#bailebogota','#bachatabogota','#zumbabogota'],                        'profesora OR instructora'),
  ('CO','Medellin',    4, array['#bailemedellin','#bachatamedellin','#zumbamedellin'],                  'profesora OR instructora'),
  ('MX','Mexico City', 4, array['#bailecdmx','#bachatacdmx','#zumbacdmx'],                              'profesora OR instructora'),
  ('MX','Guadalajara', 4, array['#bailegdl','#zumbaguadalajara'],                                       'profesora OR instructora'),
  ('BR','Sao Paulo',   4, array['#dancasaopaulo','#bachatasaopaulo','#zumbasaopaulo'],                  'professora OR instrutora'),
  ('CL','Santiago',    4, array['#bailesantiago','#zumbasantiago'],                                     'profesora OR instructora'),
  ('PE','Lima',        4, array['#bailelima','#zumbalima'],                                             'profesora OR instructora')
) as t(country, city, priority, hashtags, local_terms)
on conflict (country, city) do nothing;
