-- Add INSERT policy for live_stream_sessions
-- Allows authenticated users to create streams (instructor dashboard handles authorization)
CREATE POLICY "Authenticated users can create streams"
  ON live_stream_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for live_stream_sessions
-- Allows authenticated users to update streams (for marking live/ended)
CREATE POLICY "Authenticated users can update streams"
  ON live_stream_sessions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
