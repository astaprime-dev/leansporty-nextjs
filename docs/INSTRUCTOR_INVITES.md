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
`metadata`) — and each one also emails the founder inbox. To approve one, issue an
invite:

```sql
insert into public.instructor_invites (code, email, invited_name, note, expires_at)
values (
  'ls-anna-7c3f9a2b',                    -- high-entropy; becomes the /welcome link
  'anna@example.com',                    -- optional: intended recipient
  'Anna',                                -- greets her by name on the invite page
  'Latin dance, ~8k IG — approved 2026-07-03',
  now() + interval '30 days'             -- optional expiry (null = never)
)
returning 'https://leansporty.com/welcome/' || code as invite_link;
```

Use a **high-entropy, unguessable** code (e.g. a name prefix + random hex). Send the
instructor the **personal link** the insert returns —
`https://leansporty.com/welcome/<code>`. It greets them by name, restates the featured
deal, and activates in one click after sign-in (no code to copy/paste). The same code
also still works manually at `/instructor/activate`.

**Featured (85%) instructors:** the invite doesn't set the split (standard is 80%,
`products.split_pct` default). After they redeem, set it once:

```sql
update public.instructors i
set split_pct = 85
from public.instructor_invites v
where v.code = 'ls-anna-7c3f9a2b' and i.user_id = v.used_by;
```

## Check who redeemed what

```sql
select code, email, note, used_by, used_at, expires_at
from public.instructor_invites
order by created_at desc;
```

`used_by` / `used_at` are set the moment a code is redeemed. A code with `used_by`
already set, or past `expires_at`, is rejected.

## Retiring the legacy shared token

**Retired 2026-07-27**: `INSTRUCTOR_ACCESS_TOKEN` was removed from Vercel,
`.env.local`, and `.env.example`, and the activation route's fallback branch was
deleted from the code. Every activation now goes through a single-use, attributable
invite code — there is no shared-secret path anymore.
