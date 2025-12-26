-- Remove 50% attendance requirement for commenting
-- Now anyone who enrolled can leave a comment (regardless of watch time)

-- Update validation function to remove attendance check
CREATE OR REPLACE FUNCTION validate_comment_eligibility(
  p_enrollment_id UUID,
  p_stream_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_actual_end_time TIMESTAMPTZ;
  v_days_since_end NUMERIC;
BEGIN
  -- Get stream end time
  SELECT actual_end_time INTO v_actual_end_time
  FROM public.live_stream_sessions
  WHERE id = p_stream_id;

  -- Check stream has ended
  IF v_actual_end_time IS NULL THEN
    RAISE EXCEPTION 'Stream has not ended yet';
  END IF;

  -- Calculate days since stream ended
  v_days_since_end := EXTRACT(EPOCH FROM (NOW() - v_actual_end_time)) / 86400;

  -- Check within 7-day comment window
  IF v_days_since_end > 7 THEN
    RAISE EXCEPTION 'Comment window has closed (7 days after stream)';
  END IF;

  -- Attendance check REMOVED - if enrolled, can comment!

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_comment_eligibility IS 'Validates user can comment on stream. Requirements: stream ended, within 7-day window, enrolled. NO attendance requirement.';
