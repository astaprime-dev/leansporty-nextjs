-- E1.7 — Email / lead capture (Phase 1, FR-1.7.1/1.7.2)
-- One row per email that a NON-buyer (or a logged-in user who hasn't purchased)
-- leaves through a capture form. This is the top of the funnel: leads are later
-- pulled into the Phase-3 nurture sequences (taster → challenge → membership).
--
-- Provider integration is deferred (FR-1.7.2) — capture must NOT block on an email
-- provider. We store first, email best-effort. The same Resend infra that drives
-- checkout-recovery sends an optional welcome, and the existing email_opt_outs
-- suppression list is honored before any send.
--
-- Writers: the service-role lead-capture server action (captureLeadAction) and,
-- later, the nurture cron. Both bypass RLS. There is NO user read/write path —
-- this is an operational table, locked down like checkout_recovery / entitlements.

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  -- Always stored lowercased/trimmed (normalized by the capture action) so the
  -- plain unique index below dedupes case-insensitively and PostgREST upsert can
  -- target it via onConflict='email' (an expression index on lower(email) can't be).
  email       text not null,
  -- Where the email was captured, for attribution (e.g. 'challenge-exit', 'homepage').
  source      text not null,
  -- Set when a signed-in user submits; null for anonymous cold leads.
  user_id     uuid references auth.users(id) on delete set null,
  -- Lifecycle: 'new' on capture, advanced by the nurture cron / on conversion.
  status      text not null default 'new'
                check (status in ('new','welcomed','converted','unsubscribed')),
  -- Active opt-in: the timestamp at which consent was given (they submitted the form).
  consent_at  timestamptz not null default now(),
  -- Free-form attribution payload (utm params, intent, etc.).
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),  -- first-seen; never overwritten on re-submit
  updated_at  timestamptz not null default now()
);

-- One row per (normalized) email. Re-submitting refreshes source/updated_at in the
-- capture action via upsert (onConflict='email'); created_at/consent_at stay at first-seen.
create unique index if not exists leads_email_idx on public.leads (email);
-- The nurture cron scans by status.
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;
-- NO policies: only the service-role capture action / nurture cron touch this table.
-- Users never read or write leads directly.
