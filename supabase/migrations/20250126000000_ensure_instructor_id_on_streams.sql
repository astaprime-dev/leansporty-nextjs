-- Migration: Ensure all streams have instructor_id
-- This migration backfills instructor_id for any streams missing it
-- and makes instructor_id NOT NULL

-- Step 1: For any streams with instructor_name but no instructor_id,
-- try to find the matching instructor by display_name
UPDATE live_stream_sessions
SET instructor_id = (
  SELECT id
  FROM instructors
  WHERE instructors.display_name = live_stream_sessions.instructor_name
  LIMIT 1
)
WHERE instructor_id IS NULL
  AND instructor_name IS NOT NULL;

-- Step 2: Log any streams that still don't have instructor_id
-- (These would need manual intervention)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM live_stream_sessions
  WHERE instructor_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Warning: % stream(s) found without instructor_id. These need manual assignment.', orphan_count;
  END IF;
END $$;

-- Step 3: Make instructor_id NOT NULL (only if no orphans exist)
-- This will fail if there are streams without instructor_id, which is intentional
ALTER TABLE live_stream_sessions
  ALTER COLUMN instructor_id SET NOT NULL;

-- Step 4: Add comment to deprecate instructor_name column
COMMENT ON COLUMN live_stream_sessions.instructor_name IS
  'Deprecated: Use instructor_id to join with instructors table for current display_name';
