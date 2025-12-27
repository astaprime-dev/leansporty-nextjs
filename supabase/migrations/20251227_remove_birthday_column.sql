-- ============================================================================
-- Remove birthday column from user_profiles
-- This field is not needed for the application
-- ============================================================================

ALTER TABLE user_profiles DROP COLUMN IF EXISTS birthday;

-- Add comment
COMMENT ON TABLE user_profiles IS 'Public profiles for all users. Mandatory 1:1 relationship with auth.users. Location field available for regular users.';
