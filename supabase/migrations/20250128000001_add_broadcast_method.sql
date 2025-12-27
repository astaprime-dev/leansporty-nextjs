-- Add broadcast_method to track which streaming protocol is being used
-- This allows us to show the correct player (WHEP for WebRTC, HLS for RTMPS)

ALTER TABLE live_stream_sessions
  ADD COLUMN IF NOT EXISTS broadcast_method VARCHAR(20);

COMMENT ON COLUMN live_stream_sessions.broadcast_method IS 'Streaming protocol being used: webrtc or rtmps. Null means not yet determined.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_stream_sessions_broadcast_method
  ON live_stream_sessions(broadcast_method);
