-- ============================================================================
-- Add instructor_id to stream_comments
-- Allows instructors to showcase reviews on their public profiles
-- ============================================================================

-- 1. Add instructor_id column
ALTER TABLE stream_comments
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE;

-- 2. Backfill instructor_id from stream data
UPDATE stream_comments
SET instructor_id = (
  SELECT instructor_id
  FROM live_stream_sessions
  WHERE live_stream_sessions.id = stream_comments.stream_id
)
WHERE instructor_id IS NULL;

-- 3. Make instructor_id NOT NULL (after backfill)
ALTER TABLE stream_comments
ALTER COLUMN instructor_id SET NOT NULL;

-- 4. Create index for efficient instructor comment queries
CREATE INDEX IF NOT EXISTS idx_comments_instructor ON stream_comments(instructor_id, created_at DESC);

-- 5. Add comment
COMMENT ON COLUMN stream_comments.instructor_id IS 'Links comment to instructor for showcasing reviews on profile pages';
