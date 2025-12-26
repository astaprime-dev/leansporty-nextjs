-- Migration: Active Viewer Count
-- Adds function to count currently active viewers on a stream

/**
 * Get count of currently active viewers for a stream
 * A viewer is considered active if they have a heartbeat within the last 60 seconds
 */
CREATE OR REPLACE FUNCTION get_active_viewer_count(p_stream_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.stream_watch_sessions
  WHERE stream_id = p_stream_id
    AND ended_at IS NULL
    AND last_heartbeat_at > NOW() - INTERVAL '60 seconds';
$$ LANGUAGE SQL STABLE;

/**
 * Get list of active viewers (user IDs and watch data only)
 * User profile details should be fetched separately via Supabase client
 */
CREATE OR REPLACE FUNCTION get_active_viewers(p_stream_id UUID)
RETURNS TABLE (
  user_id UUID,
  started_watching_at TIMESTAMPTZ,
  watch_duration_seconds INTEGER
) AS $$
  SELECT DISTINCT ON (user_id)
    user_id,
    started_at as started_watching_at,
    total_watch_seconds as watch_duration_seconds
  FROM public.stream_watch_sessions
  WHERE stream_id = p_stream_id
    AND ended_at IS NULL
    AND last_heartbeat_at > NOW() - INTERVAL '60 seconds'
  ORDER BY user_id, started_at DESC;
$$ LANGUAGE SQL STABLE;

-- Index to optimize viewer count queries
CREATE INDEX IF NOT EXISTS idx_watch_sessions_active
  ON public.stream_watch_sessions(stream_id, last_heartbeat_at)
  WHERE ended_at IS NULL;
