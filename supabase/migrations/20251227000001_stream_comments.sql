-- ============================================================================
-- MIGRATION: Stream Comments and Replies System
-- Description: Post-session comment system with star ratings, text comments,
--              and instructor replies. Requires 50% live attendance to comment.
-- ============================================================================

-- ============================================================================
-- TABLE: stream_comments
-- User comments/reviews on completed stream sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES stream_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Comment content
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment_text TEXT CHECK (comment_text IS NULL OR LENGTH(comment_text) <= 300),

  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES auth.users(id),

  -- Edit tracking
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One comment per user per stream
  UNIQUE(stream_id, user_id)
);

-- ============================================================================
-- TABLE: stream_comment_replies
-- Instructor replies to user comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES stream_comments(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reply content
  reply_text TEXT NOT NULL CHECK (LENGTH(reply_text) > 0 AND LENGTH(reply_text) <= 200),

  -- Edit tracking
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_comments_stream ON stream_comments(stream_id, created_at DESC);
CREATE INDEX idx_comments_user ON stream_comments(user_id);
CREATE INDEX idx_comments_enrollment ON stream_comments(enrollment_id);
CREATE INDEX idx_comments_visible ON stream_comments(stream_id, is_hidden, created_at DESC)
  WHERE is_hidden = false; -- For public display

CREATE INDEX idx_replies_comment ON stream_comment_replies(comment_id);
CREATE INDEX idx_replies_stream ON stream_comment_replies(stream_id);
CREATE INDEX idx_replies_instructor ON stream_comment_replies(instructor_id);

-- ============================================================================
-- FUNCTION: Validate comment eligibility
-- Checks: 50% attendance (live only), stream ended, within 7-day window
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_comment_eligibility(
  p_enrollment_id UUID,
  p_stream_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_actual_end_time TIMESTAMPTZ;
  v_meets_attendance BOOLEAN;
  v_days_since_end NUMERIC;
BEGIN
  -- Get stream end time
  SELECT actual_end_time INTO v_actual_end_time
  FROM live_stream_sessions
  WHERE id = p_stream_id;

  -- Check stream has ended
  IF v_actual_end_time IS NULL THEN
    RAISE EXCEPTION 'Stream has not ended yet';
  END IF;

  -- Check within 7-day window
  v_days_since_end := EXTRACT(EPOCH FROM (NOW() - v_actual_end_time)) / 86400;
  IF v_days_since_end > 7 THEN
    RAISE EXCEPTION 'Comment window has closed (7 days after stream)';
  END IF;

  -- Check attendance threshold (live only)
  v_meets_attendance := check_attendance_threshold(p_enrollment_id, 50);
  IF NOT v_meets_attendance THEN
    RAISE EXCEPTION 'Must attend at least 50%% of the LIVE stream to comment';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER FUNCTION: Validate before insert
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_validate_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM validate_comment_eligibility(NEW.enrollment_id, NEW.stream_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_comment
  BEFORE INSERT ON stream_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_comment();

-- ============================================================================
-- TRIGGER FUNCTION: Prevent edit after 24 hours
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_check_edit_window()
RETURNS TRIGGER AS $$
DECLARE
  v_hours_since_creation NUMERIC;
BEGIN
  -- Calculate hours since creation
  v_hours_since_creation := EXTRACT(EPOCH FROM (NOW() - OLD.created_at)) / 3600;

  -- Allow update only if within 24 hours
  IF v_hours_since_creation > 24 THEN
    RAISE EXCEPTION 'Comments can only be edited within 24 hours of posting';
  END IF;

  -- Set edited_at timestamp
  NEW.edited_at := NOW();
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_comment
  BEFORE UPDATE ON stream_comments
  FOR EACH ROW
  WHEN (OLD.star_rating IS DISTINCT FROM NEW.star_rating OR
        OLD.comment_text IS DISTINCT FROM NEW.comment_text)
  EXECUTE FUNCTION trigger_check_edit_window();

-- ============================================================================
-- FUNCTION: Calculate average rating for a stream
-- Returns: Average rating rounded to 1 decimal (e.g., 4.3)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_stream_average_rating(p_stream_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(ROUND(AVG(star_rating), 1), 0)
  FROM stream_comments
  WHERE stream_id = p_stream_id
    AND is_hidden = false;
$$ LANGUAGE SQL;

-- ============================================================================
-- FUNCTION: Get comment count for a stream
-- Returns: Number of visible (non-hidden) comments
-- ============================================================================
CREATE OR REPLACE FUNCTION get_stream_comment_count(p_stream_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM stream_comments
  WHERE stream_id = p_stream_id
    AND is_hidden = false;
$$ LANGUAGE SQL;

-- ============================================================================
-- ROW LEVEL SECURITY: stream_comments
-- ============================================================================
ALTER TABLE stream_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-hidden comments (or their own)
CREATE POLICY "Anyone can view visible comments"
  ON stream_comments FOR SELECT
  USING (is_hidden = false OR auth.uid() = user_id);

-- Users can insert their own comments (trigger validates eligibility)
CREATE POLICY "Users can create their own comments"
  ON stream_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments (trigger validates 24hr window)
CREATE POLICY "Users can update their own comments"
  ON stream_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Instructors can view all comments on their streams (including hidden)
CREATE POLICY "Instructors can view all comments on their streams"
  ON stream_comments FOR SELECT
  USING (
    stream_id IN (
      SELECT id FROM live_stream_sessions
      WHERE instructor_id IN (
        SELECT id FROM instructors WHERE user_id = auth.uid()
      )
    )
  );

-- Instructors can moderate (hide/unhide) comments on their streams
CREATE POLICY "Instructors can moderate comments on their streams"
  ON stream_comments FOR UPDATE
  USING (
    stream_id IN (
      SELECT id FROM live_stream_sessions
      WHERE instructor_id IN (
        SELECT id FROM instructors WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- ROW LEVEL SECURITY: stream_comment_replies
-- ============================================================================
ALTER TABLE stream_comment_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view replies
CREATE POLICY "Anyone can view replies"
  ON stream_comment_replies FOR SELECT
  USING (true);

-- Instructors can create replies on their streams
CREATE POLICY "Instructors can reply to comments on their streams"
  ON stream_comment_replies FOR INSERT
  WITH CHECK (
    stream_id IN (
      SELECT id FROM live_stream_sessions
      WHERE instructor_id IN (
        SELECT id FROM instructors WHERE user_id = auth.uid()
      )
    )
    AND auth.uid() = user_id
  );

-- Instructors can update their own replies
CREATE POLICY "Instructors can update their own replies"
  ON stream_comment_replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE stream_comments IS 'User comments/reviews on completed stream sessions';
COMMENT ON TABLE stream_comment_replies IS 'Instructor replies to user comments';
COMMENT ON FUNCTION validate_comment_eligibility(UUID, UUID) IS 'Validates if user can comment (50% live attendance, ended, within 7 days)';
COMMENT ON FUNCTION get_stream_average_rating(UUID) IS 'Calculates average star rating for a stream (visible comments only)';
COMMENT ON FUNCTION get_stream_comment_count(UUID) IS 'Returns count of visible comments for a stream';
