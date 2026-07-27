-- Instructor Agreement acceptance logging (INSTRUCTOR_AGREEMENT.md checklist item).
-- Activation (/welcome/[code] and /instructor/activate) now requires an explicit
-- acceptance checkbox; the API stamps which version was accepted and when.
-- Nullable: instructors activated before this feature have no recorded acceptance.

alter table public.instructors
  add column if not exists agreement_version text,
  add column if not exists agreement_accepted_at timestamptz;

comment on column public.instructors.agreement_version is
  'Version of the Instructor Agreement accepted at activation (e.g. 2026-07-27). Null for pre-feature activations.';
comment on column public.instructors.agreement_accepted_at is
  'When the Instructor Agreement was accepted. Written once by the activation API (service role); never overwritten.';
