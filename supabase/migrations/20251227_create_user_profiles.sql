-- ============================================================================
-- Create user_profiles Table
-- Identity table for ALL users (mandatory 1:1 with auth.users)
-- ============================================================================

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity (required)
  display_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,

  -- Profile (optional)
  bio TEXT,
  profile_photo_url TEXT,

  -- Personal (optional)
  location VARCHAR(255),
  birthday DATE,

  -- Social (optional)
  instagram_handle VARCHAR(255),
  website_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_profiles_username_format CHECK (username ~ '^[a-z0-9-]+$')
);

-- 2. Create indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view all profiles
CREATE POLICY "User profiles are publicly viewable"
  ON user_profiles FOR SELECT
  TO public
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create their own profile
CREATE POLICY "Authenticated users can create their profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Auto-create profile trigger for new signups
CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name, username)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_profile();

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Comments
COMMENT ON TABLE user_profiles IS 'Public profiles for all users. Mandatory 1:1 relationship with auth.users.';
COMMENT ON COLUMN user_profiles.user_id IS 'Links profile to auth user. One user can only have one profile.';
COMMENT ON COLUMN user_profiles.username IS 'URL-friendly unique identifier for public profile pages (e.g., /@john-smith)';
COMMENT ON COLUMN user_profiles.display_name IS 'User-facing display name shown in comments, viewer lists, etc.';
