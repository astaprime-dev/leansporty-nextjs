-- ============================================================================
-- MIGRATION: Stream Attendance Tracking
-- Description: Track user watch duration for live streams to validate
--              50% attendance requirement for comments
-- ============================================================================

-- ============================================================================
-- TABLE: stream_watch_sessions
-- Tracks individual watch sessions with duration metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES stream_enrollments(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Watch session type
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('live', 'replay')),

  -- Duration tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ, -- Set when user leaves or session times out

  -- Calculated duration (in seconds)
  total_watch_seconds INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_watch_sessions_enrollment ON stream_watch_sessions(enrollment_id);
CREATE INDEX idx_watch_sessions_stream ON stream_watch_sessions(stream_id);
CREATE INDEX idx_watch_sessions_user ON stream_watch_sessions(user_id);
CREATE INDEX idx_watch_sessions_active ON stream_watch_sessions(ended_at)
  WHERE ended_at IS NULL; -- For finding active sessions

-- ============================================================================
-- FUNCTION: Calculate total watch duration for an enrollment (live only)
-- Returns: Total seconds watched for live sessions only
-- ============================================================================
CREATE OR REPLACE FUNCTION get_total_watch_duration(p_enrollment_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(total_watch_seconds), 0)::INTEGER
  FROM stream_watch_sessions
  WHERE enrollment_id = p_enrollment_id
    AND session_type = 'live'; -- Only count live attendance for commenting
$$ LANGUAGE SQL;

-- ============================================================================
-- FUNCTION: Check if user meets attendance threshold
-- Returns: boolean (true if >= threshold percent attended)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_attendance_threshold(
  p_enrollment_id UUID,
  p_threshold_percent INTEGER DEFAULT 50
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_watch_seconds INTEGER;
  v_stream_duration_seconds INTEGER;
  v_stream_id UUID;
  v_actual_start TIMESTAMPTZ;
  v_actual_end TIMESTAMPTZ;
  v_scheduled_duration INTEGER;
  v_attendance_percent NUMERIC;
BEGIN
  -- Get enrollment's stream_id
  SELECT stream_id INTO v_stream_id
  FROM stream_enrollments
  WHERE id = p_enrollment_id;

  IF v_stream_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get stream timing information
  SELECT
    actual_start_time,
    actual_end_time,
    scheduled_duration_seconds
  INTO v_actual_start, v_actual_end, v_scheduled_duration
  FROM live_stream_sessions
  WHERE id = v_stream_id;

  -- Calculate actual stream duration
  IF v_actual_start IS NOT NULL AND v_actual_end IS NOT NULL THEN
    -- Use actual duration if stream has ended
    v_stream_duration_seconds := EXTRACT(EPOCH FROM (v_actual_end - v_actual_start))::INTEGER;
  ELSE
    -- Fallback to scheduled duration
    v_stream_duration_seconds := v_scheduled_duration;
  END IF;

  -- Get total watch duration (live only)
  v_total_watch_seconds := get_total_watch_duration(p_enrollment_id);

  -- Calculate attendance percentage
  IF v_stream_duration_seconds > 0 THEN
    v_attendance_percent := (v_total_watch_seconds::NUMERIC / v_stream_duration_seconds::NUMERIC) * 100;
    RETURN v_attendance_percent >= p_threshold_percent;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Auto-close stale sessions (no heartbeat for 2+ minutes)
-- Returns: Number of sessions closed
-- ============================================================================
CREATE OR REPLACE FUNCTION close_stale_watch_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH stale_sessions AS (
    SELECT id, started_at, last_heartbeat_at
    FROM stream_watch_sessions
    WHERE ended_at IS NULL
      AND last_heartbeat_at < NOW() - INTERVAL '2 minutes'
  )
  UPDATE stream_watch_sessions s
  SET
    ended_at = st.last_heartbeat_at + INTERVAL '30 seconds', -- Assume last valid interval
    total_watch_seconds = GREATEST(
      EXTRACT(EPOCH FROM (st.last_heartbeat_at + INTERVAL '30 seconds' - st.started_at))::INTEGER,
      total_watch_seconds
    ),
    updated_at = NOW()
  FROM stale_sessions st
  WHERE s.id = st.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Increment watch duration (called by heartbeat)
-- Returns: New total watch seconds
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_watch_duration(
  p_session_id UUID,
  p_increment_seconds INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE stream_watch_sessions
  SET
    total_watch_seconds = total_watch_seconds + p_increment_seconds,
    last_heartbeat_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING total_watch_seconds INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE stream_watch_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own watch sessions
CREATE POLICY "Users can view own watch sessions"
  ON stream_watch_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own watch sessions
CREATE POLICY "Users can create own watch sessions"
  ON stream_watch_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own active sessions (for heartbeats)
CREATE POLICY "Users can update own active sessions"
  ON stream_watch_sessions FOR UPDATE
  USING (auth.uid() = user_id AND ended_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Instructors can view watch sessions for their streams
CREATE POLICY "Instructors can view watch sessions for their streams"
  ON stream_watch_sessions FOR SELECT
  USING (
    stream_id IN (
      SELECT id FROM live_stream_sessions
      WHERE instructor_id IN (
        SELECT id FROM instructors WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE stream_watch_sessions IS 'Tracks individual watch sessions with duration for attendance validation';
COMMENT ON FUNCTION get_total_watch_duration(UUID) IS 'Calculates total watch duration for an enrollment (live only)';
COMMENT ON FUNCTION check_attendance_threshold(UUID, INTEGER) IS 'Returns true if user has attended >= threshold percent';
COMMENT ON FUNCTION close_stale_watch_sessions() IS 'Auto-closes sessions without heartbeat for 2+ minutes';
COMMENT ON FUNCTION increment_watch_duration(UUID, INTEGER) IS 'Increments watch duration for a session (called by heartbeat)';
