-- Add WHEP playback URL for WebRTC live streaming
-- WHEP (WebRTC HTTP Egress Protocol) is required for viewing WHIP streams
ALTER TABLE live_stream_sessions
ADD COLUMN cloudflare_whep_playback_url TEXT;

COMMENT ON COLUMN live_stream_sessions.cloudflare_whep_playback_url IS 'WHEP URL for WebRTC playback (required for WHIP live streams)';
