-- Create Instructors Table
-- This allows users to become instructors and have public profiles

-- ============================================
-- INSTRUCTORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Information
  display_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE, -- URL-friendly username (e.g., /instructor/jane-doe)
  bio TEXT,
  profile_photo_url TEXT,

  -- Social Links (optional)
  instagram_handle VARCHAR(255),
  website_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT instructors_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create index on slug for faster lookups
CREATE INDEX idx_instructors_slug ON instructors(slug);
CREATE INDEX idx_instructors_user_id ON instructors(user_id);

-- ============================================
-- UPDATE LIVE_STREAM_SESSIONS TABLE
-- ============================================

-- Add instructor_id to link streams to instructor profiles
ALTER TABLE live_stream_sessions
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL;

-- Create index for faster instructor stream lookups
CREATE INDEX IF NOT EXISTS idx_streams_instructor_id ON live_stream_sessions(instructor_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on instructors table
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Public can view instructor profiles
CREATE POLICY "Instructor profiles are publicly viewable"
  ON instructors FOR SELECT
  TO public
  USING (true);

-- Only the instructor (user) can update their own profile
CREATE POLICY "Instructors can update their own profile"
  ON instructors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can insert (will be done via app logic with instructor token check)
CREATE POLICY "Authenticated users can create instructor profile"
  ON instructors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instructors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_instructors_updated_at
  BEFORE UPDATE ON instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_instructors_updated_at();

-- Function to generate slug from display name
CREATE OR REPLACE FUNCTION generate_instructor_slug(display_name TEXT)
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

COMMENT ON TABLE instructors IS 'Instructor profiles linked to user accounts. Users with instructor token can create/manage their instructor profile.';
COMMENT ON COLUMN instructors.slug IS 'URL-friendly unique identifier for public profile pages (e.g., /instructor/jane-doe)';
COMMENT ON COLUMN instructors.user_id IS 'Links instructor to their user account. One user can only be one instructor.';
