-- S2 (Studio plan) — paid live classes on the real Stripe rails.
--
-- Model: a paid class links to a `products` row (kind='single') owned by an
-- instructor. Access to a paid class is gated by an ENTITLEMENT (written only by the
-- Stripe webhook), NOT by a stream_enrollments row — because the enrollments INSERT
-- policy lets any user self-insert their own row, which would bypass payment. Free
-- classes keep the self-serve enrollment/roster model.

-- Attribute a product to an instructor (E2.7, partial). Platform products (e.g. the
-- 21-Day Challenge) leave this null. Also store the Stripe product id so re-pricing
-- adds a Price to the same Stripe product instead of creating a new one each time.
alter table public.products
  add column if not exists instructor_id uuid references public.instructors(id) on delete set null,
  add column if not exists stripe_product_id text;
create index if not exists products_instructor_idx on public.products(instructor_id);

-- Link a live class to its product (null = free class). One product per paid class.
alter table public.live_stream_sessions
  add column if not exists product_id uuid references public.products(id) on delete set null;
create index if not exists live_stream_sessions_product_idx on public.live_stream_sessions(product_id);

-- Tighten enrollment: a user may self-enroll ONLY into a FREE class. Paid-class
-- roster rows are inserted by the webhook (service-role) on purchase, so payment
-- can't be bypassed by inserting an enrollment row directly.
-- iOS does NOT touch stream_enrollments (verified), so this is backward-compatible.
drop policy if exists "Users can create enrollments" on public.stream_enrollments;
create policy "Users can enroll in free classes"
  on public.stream_enrollments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.live_stream_sessions s
      where s.id = stream_id
        and s.product_id is null
    )
  );

-- Let an instructor read the roster of their OWN classes. The existing SELECT policy
-- is own-rows-only (auth.uid() = user_id), which meant an instructor couldn't see who
-- enrolled in their class (this also silently emptied the dashboard's recent-enrollments
-- and blocks the roster page). Policies are OR'd, so this only widens instructor reads.
create policy "Instructors read rosters for own classes"
  on public.stream_enrollments
  for select
  to authenticated
  using (
    stream_id in (
      select s.id
      from public.live_stream_sessions s
      join public.instructors i on i.id = s.instructor_id
      where i.user_id = auth.uid()
    )
  );
