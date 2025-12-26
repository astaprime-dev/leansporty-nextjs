-- ============================================================================
-- Complete Comments & Live Viewer System
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS increment_watch_duration(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_total_watch_duration(UUID);
DROP FUNCTION IF EXISTS check_attendance_threshold(UUID, INTEGER);
DROP FUNCTION IF EXISTS close_stale_watch_sessions();
DROP FUNCTION IF EXISTS validate_comment_eligibility(UUID, UUID);
DROP FUNCTION IF EXISTS trigger_validate_comment();
DROP FUNCTION IF EXISTS trigger_check_edit_window();
DROP FUNCTION IF EXISTS trigger_update_timestamp();
DROP FUNCTION IF EXISTS get_stream_average_rating(UUID);
DROP FUNCTION IF EXISTS get_stream_comment_count(UUID);
DROP FUNCTION IF EXISTS get_active_viewer_count(UUID);
DROP FUNCTION IF EXISTS get_active_viewers(UUID);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Watch sessions table
CREATE TABLE IF NOT EXISTS stream_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES stream_enrollments(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('live', 'replay')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_watch_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS stream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES stream_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment_text TEXT CHECK (comment_text IS NULL OR LENGTH(comment_text) <= 300),
  is_hidden BOOLEAN DEFAULT false,
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

-- Replies table  
CREATE TABLE IF NOT EXISTS stream_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES stream_comments(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL CHECK (LENGTH(reply_text) > 0 AND LENGTH(reply_text) <= 200),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_watch_sessions_enrollment ON stream_watch_sessions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_stream ON stream_watch_sessions(stream_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_active ON stream_watch_sessions(stream_id, last_heartbeat_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_stream ON stream_comments(stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_visible ON stream_comments(stream_id, is_hidden, created_at DESC) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_replies_comment ON stream_comment_replies(comment_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE FUNCTION increment_watch_duration(p_session_id UUID, p_increment_seconds INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE stream_watch_sessions
  SET last_heartbeat_at = NOW(), total_watch_seconds = total_watch_seconds + p_increment_seconds, updated_at = NOW()
  WHERE id = p_session_id AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_total_watch_duration(p_enrollment_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(total_watch_seconds), 0)::INTEGER FROM stream_watch_sessions WHERE enrollment_id = p_enrollment_id AND session_type = 'live';
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_active_viewer_count(p_stream_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER FROM stream_watch_sessions WHERE stream_id = p_stream_id AND ended_at IS NULL AND last_heartbeat_at > NOW() - INTERVAL '60 seconds';
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_active_viewers(p_stream_id UUID)
RETURNS TABLE (user_id UUID, started_watching_at TIMESTAMPTZ, watch_duration_seconds INTEGER) AS $$
  SELECT DISTINCT ON (user_id) user_id, started_at, total_watch_seconds FROM stream_watch_sessions WHERE stream_id = p_stream_id AND ended_at IS NULL AND last_heartbeat_at > NOW() - INTERVAL '60 seconds' ORDER BY user_id, started_at DESC;
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_stream_average_rating(p_stream_id UUID)
RETURNS NUMERIC AS $$
  SELECT ROUND(AVG(star_rating), 1) FROM stream_comments WHERE stream_id = p_stream_id AND is_hidden = false;
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_stream_comment_count(p_stream_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM stream_comments WHERE stream_id = p_stream_id AND is_hidden = false;
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION validate_comment_eligibility(p_enrollment_id UUID, p_stream_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true; -- Only requirement: enrolled. Can comment anytime.
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trigger_validate_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM validate_comment_eligibility(NEW.enrollment_id, NEW.stream_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trigger_check_edit_window()
RETURNS TRIGGER AS $$
BEGIN
  IF EXTRACT(EPOCH FROM (NOW() - OLD.created_at)) / 3600 > 24 THEN
    RAISE EXCEPTION 'Comments can only be edited within 24 hours';
  END IF;
  NEW.edited_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS before_insert_comment ON stream_comments;
CREATE TRIGGER before_insert_comment BEFORE INSERT ON stream_comments FOR EACH ROW EXECUTE FUNCTION trigger_validate_comment();

DROP TRIGGER IF EXISTS before_update_comment ON stream_comments;
CREATE TRIGGER before_update_comment BEFORE UPDATE ON stream_comments FOR EACH ROW WHEN (OLD.star_rating IS DISTINCT FROM NEW.star_rating OR OLD.comment_text IS DISTINCT FROM NEW.comment_text) EXECUTE FUNCTION trigger_check_edit_window();

DROP TRIGGER IF EXISTS update_comments_timestamp ON stream_comments;
CREATE TRIGGER update_comments_timestamp BEFORE UPDATE ON stream_comments FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_replies_timestamp ON stream_comment_replies;
CREATE TRIGGER update_replies_timestamp BEFORE UPDATE ON stream_comment_replies FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE stream_watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_comment_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watch sessions" ON stream_watch_sessions;
CREATE POLICY "Users can view own watch sessions" ON stream_watch_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own watch sessions" ON stream_watch_sessions;
CREATE POLICY "Users can create own watch sessions" ON stream_watch_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own active sessions" ON stream_watch_sessions;
CREATE POLICY "Users can update own active sessions" ON stream_watch_sessions FOR UPDATE USING (auth.uid() = user_id AND ended_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view visible comments" ON stream_comments;
CREATE POLICY "Anyone can view visible comments" ON stream_comments FOR SELECT USING (is_hidden = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own comments" ON stream_comments;
CREATE POLICY "Users can create their own comments" ON stream_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON stream_comments;
CREATE POLICY "Users can update their own comments" ON stream_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can moderate comments on their streams" ON stream_comments;
CREATE POLICY "Instructors can moderate comments on their streams" ON stream_comments FOR UPDATE USING (stream_id IN (SELECT id FROM live_stream_sessions WHERE instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "Anyone can view replies" ON stream_comment_replies;
CREATE POLICY "Anyone can view replies" ON stream_comment_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors can reply to comments on their streams" ON stream_comment_replies;
CREATE POLICY "Instructors can reply to comments on their streams" ON stream_comment_replies FOR INSERT WITH CHECK (stream_id IN (SELECT id FROM live_stream_sessions WHERE instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())) AND auth.uid() = user_id);
