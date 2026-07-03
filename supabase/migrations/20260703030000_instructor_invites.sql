-- HARDENING (Studio plan S0.3): instructor activation used ONE static shared secret
-- (INSTRUCTOR_ACCESS_TOKEN) compared with `!==`, no rate limit, no record of who used
-- it — brute-forceable, and unattributable.
--
-- This table replaces it with single-use, per-instructor invite codes that can expire
-- and are tied to the person who redeemed them. Codes are consumed atomically by the
-- activation route using the SERVICE-ROLE client only.
--
-- RLS is enabled with NO anon/authenticated policies on purpose: nobody may read or
-- enumerate codes through the public API. Only the service-role client (which bypasses
-- RLS) touches this table. Issuing invites is a manual operator action (SQL) while
-- instructor count is small — see docs/INSTRUCTOR_INVITES.md.

create table if not exists public.instructor_invites (
  code text primary key,
  email text,                 -- optional: who this invite was meant for (from a teach-apply lead)
  note text,                  -- optional operator note
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,     -- null = never expires
  created_at timestamptz not null default now()
);

comment on table public.instructor_invites is
  'Single-use instructor activation codes (replaces the shared INSTRUCTOR_ACCESS_TOKEN). '
  'Consumed atomically by the activation route via the service-role client. RLS-enabled '
  'with no public policies — never readable/enumerable by anon or authenticated users.';

alter table public.instructor_invites enable row level security;
-- (No policies: deny-all to anon/authenticated; service-role bypasses RLS.)
