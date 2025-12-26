-- Fix RLS policy for stream reactions
-- Allow authenticated users to react to live streams (simplified for testing)

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can react to enrolled streams" ON stream_reactions;

-- Create a more permissive policy for development/testing
-- Option 1: Allow all authenticated users to react to any stream
-- (Use this for development/testing)
CREATE POLICY "Authenticated users can react"
ON stream_reactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Option 2: Only allow reactions to live streams (more restrictive)
-- Uncomment this and comment out Option 1 above if you want stricter control
/*
CREATE POLICY "Users can react to live streams"
ON stream_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM live_stream_sessions
    WHERE id = stream_reactions.stream_id
    AND status = 'live'
  )
);
*/

-- Option 3: Original policy (requires enrollment) - for production use
-- Uncomment this and comment out Option 1 if you want to require enrollment
/*
CREATE POLICY "Users can react to enrolled streams"
ON stream_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stream_enrollments
    WHERE stream_id = stream_reactions.stream_id
    AND user_id = auth.uid()
    AND can_watch_live = true
  )
);
*/
