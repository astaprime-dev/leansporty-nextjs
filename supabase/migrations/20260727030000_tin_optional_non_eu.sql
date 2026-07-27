-- TIN is mandatory only for EU-resident instructors (DAC7 reportable sellers —
-- no de-minimis for services). Non-EU residents are outside DAC7, and asking
-- e.g. a US instructor for a "TIN" means asking for their SSN — needless
-- friction and data liability (GDPR minimization). The form/API enforce
-- EU → required; the column itself becomes nullable.
alter table public.instructor_billing alter column tin drop not null;

comment on column public.instructor_billing.tin is
  'Tax identification number. Required for EU-resident instructors (DAC7); '
  'optional for non-EU residents (outside DAC7 scope — do not demand it).';
