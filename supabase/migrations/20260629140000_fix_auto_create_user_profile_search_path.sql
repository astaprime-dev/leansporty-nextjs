-- FIX: new-user signup was failing with "Database error saving new user"
-- (Postgres 42P01: relation "user_profiles" does not exist).
--
-- Root cause: auto_create_user_profile() is SECURITY DEFINER but referenced
-- `user_profiles` UNQUALIFIED and set no search_path. It runs with the GoTrue
-- connection's search_path, which (after Supabase's search_path hardening) no
-- longer includes `public` — so the table couldn't be resolved, the AFTER INSERT
-- trigger threw, and the whole auth.users insert aborted. It fires before the
-- credit triggers (alphabetical), so it blocked ALL signups (magic-link + OAuth).
--
-- Fix: schema-qualify public.user_profiles and pin `SET search_path = ''`
-- (the recommended secure pattern for SECURITY DEFINER). The string functions
-- used here are pg_catalog built-ins, always resolvable regardless of search_path.
-- Behaviour is otherwise identical to the original.

CREATE OR REPLACE FUNCTION public.auto_create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    LOWER(REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      '[^a-zA-Z0-9-]', '-', 'g'
    )) || '-' || substr(NEW.id::text, 1, 4)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
