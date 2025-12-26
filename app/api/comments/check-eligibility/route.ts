import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CommentEligibility } from '@/types/comments';

/**
 * GET /api/comments/check-eligibility?streamId=xxx
 * Checks if user is eligible to comment on a stream
 * Returns detailed eligibility status and reasons
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('streamId');

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      );
    }

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('stream_enrollments')
      .select('id')
      .eq('stream_id', streamId)
      .eq('user_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      const response: CommentEligibility = {
        eligible: false,
        reason: 'not_enrolled',
        message: 'You must be enrolled in this stream',
      };
      return NextResponse.json(response);
    }

    // ALL RESTRICTIONS REMOVED - If enrolled, can comment anytime!

    // Check if already commented
    const { data: existingComment } = await supabase
      .from('stream_comments')
      .select('id, created_at')
      .eq('stream_id', streamId)
      .eq('user_id', user.id)
      .single();

    if (existingComment) {
      // Check if within 24hr edit window
      const hoursSinceComment = (Date.now() - new Date(existingComment.created_at).getTime()) / (1000 * 60 * 60);
      const canEdit = hoursSinceComment <= 24;

      const response: CommentEligibility = {
        eligible: true,
        hasExistingComment: true,
        canEdit,
        commentId: existingComment.id,
      };
      return NextResponse.json(response);
    }

    // Eligible to comment
    const response: CommentEligibility = {
      eligible: true,
      hasExistingComment: false,
    };
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Check eligibility error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
