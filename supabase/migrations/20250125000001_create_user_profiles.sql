-- Create User Profiles Table
-- This allows regular users to have public profiles separate from instructors

-- ============================================
-- USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Information
  display_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE, -- URL-friendly username (e.g., /@john-smith)
  bio TEXT,
  profile_photo_url TEXT,

  -- Optional Personal Info
  location VARCHAR(255),
  birthday DATE,

  -- Social Links (optional)
  instagram_handle VARCHAR(255),
  website_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT user_profiles_username_format CHECK (username ~ '^[a-z0-9-]+$')
);

-- Create index on username for faster lookups
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view user profiles
CREATE POLICY "User profiles are publicly viewable"
  ON user_profiles FOR SELECT
  TO public
  USING (true);

-- Only the user can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can create their profile
CREATE POLICY "Authenticated users can create their profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to generate username from display name
CREATE OR REPLACE FUNCTION generate_username(display_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(display_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Public profiles for regular users (non-instructors). Separate from instructor profiles.';
COMMENT ON COLUMN user_profiles.username IS 'URL-friendly unique identifier for public profile pages (e.g., /@john-smith)';
COMMENT ON COLUMN user_profiles.user_id IS 'Links profile to user account. One user can only have one profile.';
