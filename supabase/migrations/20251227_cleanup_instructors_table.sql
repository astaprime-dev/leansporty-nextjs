-- ============================================================================
-- Remove duplicate fields from instructors table
-- These fields are now stored in user_profiles table
-- ============================================================================

-- Remove duplicate columns (now in user_profiles)
ALTER TABLE instructors DROP COLUMN IF EXISTS display_name;
ALTER TABLE instructors DROP COLUMN IF EXISTS bio;
ALTER TABLE instructors DROP COLUMN IF EXISTS profile_photo_url;
ALTER TABLE instructors DROP COLUMN IF EXISTS instagram_handle;
ALTER TABLE instructors DROP COLUMN IF EXISTS website_url;

-- Update table comment to reflect new structure
COMMENT ON TABLE instructors IS 'Instructor-specific data. Display fields (name, bio, photo, social) are in user_profiles. Only stores slug for custom URLs.';

-- After this migration, instructors table contains only:
-- - id (primary key)
-- - user_id (FK to auth.users)
-- - slug (unique instructor slug for URLs like /instructor/jane-doe)
-- - created_at, updated_at (timestamps)
