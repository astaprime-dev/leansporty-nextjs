# Instructor invites (activation codes)

Instructor activation is gated by **single-use invite codes** in the
`instructor_invites` table (migration `20260703030000`), replacing the old shared
`INSTRUCTOR_ACCESS_TOKEN`. Codes are consumed atomically by
`POST /api/instructor/activate` via the service-role client; the table is RLS-locked
with no public policies, so codes are never readable or enumerable by clients.

While instructor count is small, issuing a code is a **manual operator action** in the
Supabase SQL editor — no admin UI (that's deferred in `INSTRUCTOR_STUDIO_PLAN.md`).

## Issue a code (approving a `/teach` applicant)

Applications land in `leads` with `source = 'teach-apply'` (name/social/about in
`metadata`). To approve one, issue an invite:

```sql
insert into public.instructor_invites (code, email, note, expires_at)
values (
  'ls-anna-7c3f9a2b',                    -- share this with the instructor
  'anna@example.com',                    -- optional: intended recipient
  'Latin dance, ~8k IG — approved 2026-07-03',
  now() + interval '30 days'             -- optional expiry (null = never)
);
```

Use a **high-entropy, unguessable** code (e.g. a name prefix + random hex). Send it to
the instructor; they enter it at `/instructor/activate` (or via the "Instructor Studio"
footer link → sign in → activate).

## Check who redeemed what

```sql
select code, email, note, used_by, used_at, expires_at
from public.instructor_invites
order by created_at desc;
```

`used_by` / `used_at` are set the moment a code is redeemed. A code with `used_by`
already set, or past `expires_at`, is rejected.

## Retiring the legacy shared token

The activation route still honors the old `INSTRUCTOR_ACCESS_TOKEN` **only while that
env var is set** (a migration convenience — it logs a warning when used). Once you've
issued invite codes to your instructors, **unset `INSTRUCTOR_ACCESS_TOKEN`** in Vercel
+ `.env.local`. That deletes the last shared-secret path; from then on every
activation is a single-use, attributable invite.
