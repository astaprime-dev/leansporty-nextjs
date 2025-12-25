-- Allow anyone (including unauthenticated users) to view streams
-- This is needed so the /streams page works for discovery
CREATE POLICY "Anyone can view streams"
  ON live_stream_sessions
  FOR SELECT
  TO anon
  USING (true);
