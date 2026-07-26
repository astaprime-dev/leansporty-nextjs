-- Personal invite links (/welcome/<code>): the invite page greets the instructor
-- by name. Additive, nullable column on a service-role-only table (deny-all RLS
-- unchanged) — never client-readable, no iOS impact.

alter table public.instructor_invites
  add column if not exists invited_name text;

comment on column public.instructor_invites.invited_name is
  'Display name shown on the personal /welcome/<code> invite page for this code. '
  'Rendered server-side only, and only for the exact code being visited.';
