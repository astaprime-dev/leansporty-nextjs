-- ============================================================================
-- Migrate Existing Data to user_profiles
-- Copies instructor identity data and backfills other users
-- ============================================================================

-- 1. Copy instructor identity data to user_profiles
-- This takes display_name, bio, photo, etc. from instructors table
-- and creates user_profiles entries for the 2 instructors
INSERT INTO user_profiles (
  user_id,
  display_name,
  username,
  bio,
  profile_photo_url,
  instagram_handle,
  website_url
)
SELECT
  i.user_id,
  i.display_name,
  LOWER(REGEXP_REPLACE(i.slug, '[^a-zA-Z0-9-]', '-', 'g')),  -- Generate username from slug
  i.bio,
  i.profile_photo_url,
  i.instagram_handle,
  i.website_url
FROM instructors i
ON CONFLICT (user_id) DO NOTHING;

-- 2. Backfill other users (non-instructors) from auth.users
-- This creates user_profiles entries for users who aren't instructors
-- Uses their auth metadata or email to generate display_name and username
INSERT INTO user_profiles (user_id, display_name, username)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1),
    'User'
  ),
  LOWER(REGEXP_REPLACE(
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      SPLIT_PART(au.email, '@', 1)
    ),
    '[^a-zA-Z0-9-]', '-', 'g'
  )) || '-' || substr(au.id::text, 1, 4)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
  v_user_count INTEGER;
  v_profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM auth.users;
  SELECT COUNT(*) INTO v_profile_count FROM user_profiles;

  RAISE NOTICE 'Migration complete: % auth users, % user_profiles created', v_user_count, v_profile_count;

  IF v_user_count != v_profile_count THEN
    RAISE WARNING 'User count mismatch: % users but % profiles', v_user_count, v_profile_count;
  END IF;
END $$;
