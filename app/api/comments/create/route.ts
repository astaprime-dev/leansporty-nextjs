import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CreateCommentRequest } from '@/types/comments';

/**
 * POST /api/comments/create
 * Creates a new comment on a stream
 * Requires: User authentication, enrollment, 50% live attendance, stream ended
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: CreateCommentRequest = await request.json();
    const { streamId, starRating, commentText } = body;

    // Validation
    if (!streamId || !starRating) {
      return NextResponse.json(
        { error: 'Stream ID and star rating are required' },
        { status: 400 }
      );
    }

    if (starRating < 1 || starRating > 5) {
      return NextResponse.json(
        { error: 'Star rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (commentText && commentText.length > 300) {
      return NextResponse.json(
        { error: 'Comment text must be 300 characters or less' },
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
      return NextResponse.json(
        { error: 'You must be enrolled in this stream to comment' },
        { status: 403 }
      );
    }

    // Get stream to fetch instructor_id
    const { data: stream, error: streamError } = await supabase
      .from('live_stream_sessions')
      .select('instructor_id')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Insert comment (database trigger validates eligibility: 50% attendance, stream ended, 7-day window)
    const { data: comment, error: commentError } = await supabase
      .from('stream_comments')
      .insert({
        stream_id: streamId,
        enrollment_id: enrollment.id,
        user_id: user.id,
        instructor_id: stream.instructor_id,
        star_rating: starRating,
        comment_text: commentText || null,
      })
      .select()
      .single();

    if (commentError) {
      // Parse database error messages from triggers
      if (commentError.message.includes('attend at least 50%')) {
        return NextResponse.json(
          { error: 'You must attend at least 50% of the LIVE stream to leave a comment' },
          { status: 403 }
        );
      }
      if (commentError.message.includes('Comment window has closed')) {
        return NextResponse.json(
          { error: 'Comments can only be posted within 7 days after the stream ends' },
          { status: 403 }
        );
      }
      if (commentError.message.includes('Stream has not ended')) {
        return NextResponse.json(
          { error: 'You can only comment after the stream has ended' },
          { status: 403 }
        );
      }
      if (commentError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'You have already commented on this stream' },
          { status: 409 }
        );
      }

      console.error('Create comment error:', commentError);
      throw commentError;
    }

    return NextResponse.json({
      success: true,
      comment,
    });

  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}
