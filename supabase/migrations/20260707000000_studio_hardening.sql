-- S5 (Studio plan) — schema hardening & cleanup.
--
-- (a) Pin search_path on trigger/helper functions whose bodies only touch NEW/OLD or
--     already schema-qualify their references — defense-in-depth after the June
--     search_path incident. The reaction triggers (check_reaction_rate_limit,
--     aggregate_stream_reactions) and set_migration_schedule reference tables
--     unqualified and are SECURITY INVOKER (lower risk); left as-is to avoid a risky
--     rewrite — see docs/DATABASE_ARCHITECTURE.md.
-- (b) get_playable_uid (SECURITY DEFINER) → search_path '' (its refs are already
--     fully qualified; auth.uid()/now() resolve via schema-qualification / pg_catalog).
-- (c) Give instructors UPDATE/DELETE on their own comment replies (there was an
--     update-timestamp trigger but no UPDATE/DELETE policy, so replies were immutable).

-- (a) Trivial timestamp/validation triggers — bodies only reference NEW/OLD.
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.update_user_profiles_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.update_instructors_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.trigger_update_timestamp()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;

create or replace function public.trigger_check_edit_window()
returns trigger language plpgsql set search_path = '' as $$
begin
  if extract(epoch from (now() - old.created_at)) / 3600 > 24 then
    raise exception 'Comments can only be edited within 24 hours';
  end if;
  new.edited_at := now();
  new.updated_at := now();
  return new;
end;
$$;

-- Calls a helper — schema-qualify it so search_path='' resolves it.
create or replace function public.trigger_validate_comment()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform public.validate_comment_eligibility(new.enrollment_id, new.stream_id);
  return new;
end;
$$;

-- (b) get_playable_uid: normalize to search_path = '' (all refs already qualified).
create or replace function public.get_playable_uid(p_content_id uuid)
returns text
language sql stable security definer set search_path = '' as $$
  select w.cloudflare_uid
  from public.workouts w
  where w.id = p_content_id
    and (
      exists (
        select 1 from public.product_items pi
        where pi.content_id = w.id and pi.is_preview = true
      )
      or
      exists (
        select 1
        from public.entitlements e
        join public.product_items pi on pi.product_id = e.product_id
        where e.user_id = auth.uid()
          and pi.content_id = w.id
          and (e.expires_at is null or e.expires_at > now())
      )
    );
$$;
revoke all on function public.get_playable_uid(uuid) from public;
grant execute on function public.get_playable_uid(uuid) to authenticated;

-- (c) Instructors can edit/delete their own replies (owner = the reply's author).
drop policy if exists "Instructors update own replies" on public.stream_comment_replies;
create policy "Instructors update own replies"
  on public.stream_comment_replies
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Instructors delete own replies" on public.stream_comment_replies;
create policy "Instructors delete own replies"
  on public.stream_comment_replies
  for delete
  to authenticated
  using (auth.uid() = user_id);
