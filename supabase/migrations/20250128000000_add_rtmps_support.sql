-- Add RTMPS support for advanced instructors who want to use OBS
-- This allows streaming via RTMPS (which supports recording) while keeping WebRTC as default

ALTER TABLE live_stream_sessions
  ADD COLUMN IF NOT EXISTS cloudflare_rtmps_url TEXT,
  ADD COLUMN IF NOT EXISTS cloudflare_rtmps_stream_key TEXT;

COMMENT ON COLUMN live_stream_sessions.cloudflare_rtmps_url IS 'RTMPS URL for OBS streaming (optional, for advanced users)';
COMMENT ON COLUMN live_stream_sessions.cloudflare_rtmps_stream_key IS 'RTMPS stream key for OBS (optional, for advanced users)';
