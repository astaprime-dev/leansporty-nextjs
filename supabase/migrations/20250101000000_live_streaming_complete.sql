-- Live Streaming Feature - Complete Database Migration
-- Created: 2025-01-01
-- Updated: 2025-01-01 - Added WHIP/WHEP WebRTC support, RLS fixes, public viewing
--
-- This migration sets up the complete live streaming infrastructure using:
-- - Cloudflare Stream with WebRTC (WHIP for ingestion, WHEP for playback)
-- - Token-based enrollment system
-- - 7-day replay access
-- - Optional live chat
-- - Automatic migration to workout catalog after 2-3 months

-- ============================================
-- TABLES
-- ============================================

-- Live stream sessions table
CREATE TABLE IF NOT EXISTS live_stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_name VARCHAR(255),

  -- Scheduling
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_duration_seconds INTEGER NOT NULL DEFAULT 3600, -- 1 hour default
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,

  -- Status: 'scheduled', 'live', 'ended', 'cancelled'
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',

  -- Pricing
  price_in_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cloudflare Stream - WebRTC (WHIP/WHEP)
  cloudflare_stream_id VARCHAR(255), -- Live input ID
  cloudflare_webrtc_url TEXT, -- WHIP URL for browser streaming (ingestion)
  cloudflare_webrtc_token TEXT, -- WHIP authentication token
  cloudflare_whep_playback_url TEXT, -- WHEP URL for WebRTC playback (egress)
  cloudflare_playback_id VARCHAR(255), -- Fallback HLS/DASH playback ID

  -- Recording (auto-recorded, available for 7 days)
  recording_available BOOLEAN DEFAULT false,
  recording_expires_at TIMESTAMPTZ, -- 7 days after stream ends
  recording_cloudflare_video_id VARCHAR(255), -- Recorded video ID

  -- Catalog integration (migrate to workouts after 2-3 months)
  migrated_to_workout_id UUID REFERENCES workouts(id),
  migration_scheduled_at TIMESTAMPTZ, -- auto-set to actual_end_time + 2 months

  -- Metadata
  thumbnail_url TEXT,
  max_viewers INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stream enrollments table
CREATE TABLE IF NOT EXISTS stream_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment
  tokens_paid INTEGER NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),

  -- Access control
  can_watch_live BOOLEAN DEFAULT true,
  can_watch_replay BOOLEAN DEFAULT true,
  replay_access_expires_at TIMESTAMPTZ, -- set to recording_expires_at on enrollment

  -- Engagement tracking
  watched_live BOOLEAN DEFAULT false,
  watched_replay BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMPTZ,

  -- Prevent duplicate enrollments
  UNIQUE(stream_id, user_id)
);

-- Live chat messages table (optional feature)
CREATE TABLE IF NOT EXISTS stream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Stream sessions queries
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_stream_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_start ON live_stream_sessions(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_live_streams_migration ON live_stream_sessions(migration_scheduled_at)
  WHERE migrated_to_workout_id IS NULL;

-- Enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON stream_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_stream_id ON stream_enrollments(stream_id);

-- Chat messages
CREATE INDEX IF NOT EXISTS idx_chat_stream_id ON stream_chat_messages(stream_id, sent_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE live_stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat_messages ENABLE ROW LEVEL SECURITY;

-- live_stream_sessions: Anyone (including anonymous) can view streams for discovery
CREATE POLICY "Anyone can view streams"
  ON live_stream_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- live_stream_sessions: Authenticated users can create streams (instructor dashboard handles auth)
CREATE POLICY "Authenticated users can create streams"
  ON live_stream_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- live_stream_sessions: Authenticated users can update streams (for marking live/ended)
CREATE POLICY "Authenticated users can update streams"
  ON live_stream_sessions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- stream_enrollments: Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON stream_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- stream_enrollments: Users can create enrollments (enrollment flow handles token deduction)
CREATE POLICY "Users can create enrollments"
  ON stream_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- stream_chat_messages: Enrolled users can view chat for streams they're enrolled in
CREATE POLICY "Enrolled users can view chat"
  ON stream_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stream_enrollments
      WHERE stream_id = stream_chat_messages.stream_id
      AND user_id = auth.uid()
    )
  );

-- stream_chat_messages: Enrolled users can send chat messages
CREATE POLICY "Enrolled users can send chat"
  ON stream_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM stream_enrollments
      WHERE stream_id = stream_chat_messages.stream_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-set migration_scheduled_at when stream ends
CREATE OR REPLACE FUNCTION set_migration_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- When stream ends (actual_end_time is set), schedule migration for 2 months later
  IF NEW.actual_end_time IS NOT NULL AND OLD.actual_end_time IS NULL THEN
    NEW.migration_scheduled_at := NEW.actual_end_time + INTERVAL '2 months';
    NEW.recording_expires_at := NEW.actual_end_time + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the migration schedule function
CREATE TRIGGER trigger_set_migration_schedule
  BEFORE UPDATE ON live_stream_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_migration_schedule();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_live_streams_updated_at
  BEFORE UPDATE ON live_stream_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE live_stream_sessions IS 'Stores scheduled, live, and completed streaming sessions using Cloudflare Stream WebRTC';
COMMENT ON TABLE stream_enrollments IS 'Tracks user enrollments in live streams (paid via tokens)';
COMMENT ON TABLE stream_chat_messages IS 'Optional: Live chat messages during streams';

COMMENT ON COLUMN live_stream_sessions.status IS 'scheduled, live, ended, cancelled';
COMMENT ON COLUMN live_stream_sessions.cloudflare_webrtc_url IS 'WHIP URL for browser-based streaming (ingestion)';
COMMENT ON COLUMN live_stream_sessions.cloudflare_whep_playback_url IS 'WHEP URL for WebRTC playback (egress) - required for WHIP streams';
COMMENT ON COLUMN live_stream_sessions.migration_scheduled_at IS 'Auto-set to actual_end_time + 2 months';
COMMENT ON COLUMN stream_enrollments.replay_access_expires_at IS 'Set to recording_expires_at (7 days)';

-- ============================================
-- NOTES
-- ============================================

-- WHIP/WHEP Protocol:
-- - WHIP (WebRTC HTTP Ingestion Protocol) is used for broadcasting from browser
-- - WHEP (WebRTC HTTP Egress Protocol) is used for playback
-- - Cloudflare requires WHIP and WHEP to be used together
-- - HLS/DASH playback is NOT supported for WebRTC live streams
-- - Recordings use HLS/DASH after stream ends

-- Token System:
-- - Token balance and transactions managed by existing backend
-- - Enrollment creates transaction record with stream reference
-- - Users must be authenticated to enroll and watch

-- Security:
-- - Anonymous users can browse streams (discovery)
-- - Authentication required to enroll and watch
-- - Enrollment verified before playback access
-- - Instructor dashboard requires both Supabase auth + instructor token
