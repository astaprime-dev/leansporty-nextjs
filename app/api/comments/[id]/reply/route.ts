import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CreateReplyRequest } from '@/types/comments';

/**
 * POST /api/comments/[id]/reply
 * Instructor replies to a comment on their stream
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get instructor profile
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Only instructors can reply to comments' },
        { status: 403 }
      );
    }

    const body: CreateReplyRequest = await request.json();
    const { replyText } = body;

    // Validation
    if (!replyText || replyText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      );
    }

    if (replyText.length > 200) {
      return NextResponse.json(
        { error: 'Reply text must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Get comment details (to verify stream ownership and get user_id)
    const { data: comment, error: commentError } = await supabase
      .from('stream_comments')
      .select('stream_id, user_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify instructor owns the stream
    const { data: stream, error: streamError } = await supabase
      .from('live_stream_sessions')
      .select('instructor_id')
      .eq('id', comment.stream_id)
      .eq('instructor_id', instructor.id)
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'You can only reply to comments on your own streams' },
        { status: 403 }
      );
    }

    // Insert reply (RLS policy validates stream ownership)
    const { data: reply, error: replyError } = await supabase
      .from('stream_comment_replies')
      .insert({
        comment_id: commentId,
        stream_id: comment.stream_id,
        instructor_id: instructor.id,
        user_id: user.id,
        reply_text: replyText.trim(),
      })
      .select()
      .single();

    if (replyError) {
      console.error('Create reply error:', replyError);
      throw replyError;
    }

    return NextResponse.json({
      success: true,
      reply,
    });

  } catch (error: any) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reply' },
      { status: 500 }
    );
  }
}
