-- Live Stream Reaction System Migration
-- This migration creates the infrastructure for real-time reactions during live streams

-- ============================================================================
-- TABLE: stream_reactions
-- Stores individual reaction events from viewers
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('love_it', 'feeling_burn', 'need_slower', 'cant_see', 'no_audio')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_stream_reactions_stream_id ON stream_reactions(stream_id);
CREATE INDEX idx_stream_reactions_created_at ON stream_reactions(created_at);
CREATE INDEX idx_stream_reactions_stream_created ON stream_reactions(stream_id, created_at DESC);

-- ============================================================================
-- TABLE: stream_reaction_aggregates
-- Stores aggregated reaction counts in 10-second time windows
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_reaction_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  time_window TIMESTAMPTZ NOT NULL, -- 10-second window start time
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(stream_id, reaction_type, time_window)
);

-- Indexes for efficient queries
CREATE INDEX idx_stream_reaction_aggregates_stream ON stream_reaction_aggregates(stream_id);
CREATE INDEX idx_stream_reaction_aggregates_window ON stream_reaction_aggregates(time_window);

-- ============================================================================
-- FUNCTION: Rate Limiting
-- Prevents users from spamming reactions (5-second cooldown)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_reaction_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has reacted within last 5 seconds
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM stream_reactions
    WHERE user_id = NEW.user_id
    AND stream_id = NEW.stream_id
    AND created_at > NOW() - INTERVAL '5 seconds'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 5 seconds between reactions.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce rate limiting
CREATE TRIGGER trigger_check_reaction_rate_limit
BEFORE INSERT ON stream_reactions
FOR EACH ROW
EXECUTE FUNCTION check_reaction_rate_limit();

-- ============================================================================
-- FUNCTION: Aggregation
-- Automatically aggregates reactions into 10-second time windows
-- ============================================================================
CREATE OR REPLACE FUNCTION aggregate_stream_reactions()
RETURNS TRIGGER AS $$
DECLARE
  window_start TIMESTAMPTZ;
BEGIN
  -- Round down to nearest 10-second window
  window_start := DATE_TRUNC('minute', NEW.created_at) +
                  (FLOOR(EXTRACT(EPOCH FROM NEW.created_at - DATE_TRUNC('minute', NEW.created_at)) / 10) * 10 || ' seconds')::INTERVAL;

  -- Upsert into aggregates table
  INSERT INTO stream_reaction_aggregates (stream_id, reaction_type, time_window, count)
  VALUES (NEW.stream_id, NEW.reaction_type, window_start, 1)
  ON CONFLICT (stream_id, reaction_type, time_window)
  DO UPDATE SET
    count = stream_reaction_aggregates.count + 1,
    last_updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to aggregate reactions
CREATE TRIGGER trigger_aggregate_reactions
AFTER INSERT ON stream_reactions
FOR EACH ROW
EXECUTE FUNCTION aggregate_stream_reactions();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE stream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reaction_aggregates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert reactions if they are enrolled in the stream
CREATE POLICY "Users can react to enrolled streams"
ON stream_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stream_enrollments
    WHERE stream_id = stream_reactions.stream_id
    AND user_id = auth.uid()
    AND can_watch_live = true
  )
);

-- Policy: Users can view their own reactions (for analytics/debugging)
CREATE POLICY "Users can view their own reactions"
ON stream_reactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Instructors can view all reactions for their streams
CREATE POLICY "Instructors can view reactions for their streams"
ON stream_reactions
FOR SELECT
TO authenticated
USING (
  stream_id IN (
    SELECT id FROM live_stream_sessions
    WHERE instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Instructors can view reaction aggregates for their streams
CREATE POLICY "Instructors can view reaction aggregates"
ON stream_reaction_aggregates
FOR SELECT
TO authenticated
USING (
  stream_id IN (
    SELECT id FROM live_stream_sessions
    WHERE instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- FUNCTION: Cleanup Old Reactions
-- Optional function to clean up reactions older than 7 days (privacy/storage)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_reactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete reactions older than 7 days
  DELETE FROM stream_reactions
  WHERE created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Note: To schedule this cleanup, add a cron job or call manually
-- Example: SELECT cleanup_old_reactions();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE stream_reactions IS 'Individual reaction events from viewers during live streams';
COMMENT ON TABLE stream_reaction_aggregates IS 'Aggregated reaction counts in 10-second time windows for efficient display';
COMMENT ON FUNCTION check_reaction_rate_limit() IS 'Enforces 5-second cooldown between reactions per user';
COMMENT ON FUNCTION aggregate_stream_reactions() IS 'Automatically aggregates reactions into 10-second windows';
COMMENT ON FUNCTION cleanup_old_reactions() IS 'Deletes reactions older than 7 days for privacy/storage management';
