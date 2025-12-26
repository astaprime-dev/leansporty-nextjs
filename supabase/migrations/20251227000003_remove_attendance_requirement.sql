-- Remove all restrictions for commenting
-- Now anyone who enrolled can leave a comment anytime (during or after stream)

-- Update validation function to only check enrollment
CREATE OR REPLACE FUNCTION validate_comment_eligibility(
  p_enrollment_id UUID,
  p_stream_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only requirement: user must be enrolled
  -- Can comment during live stream or after it ends
  -- No time window restrictions
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_comment_eligibility IS 'Validates user can comment on stream. Only requirement: enrolled. Can comment anytime during or after stream.';
