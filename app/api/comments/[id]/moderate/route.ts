import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ModerateCommentRequest } from '@/types/comments';

/**
 * PATCH /api/comments/[id]/moderate
 * Instructor hides or unhides a comment on their stream
 */
export async function PATCH(
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
        { error: 'Only instructors can moderate comments' },
        { status: 403 }
      );
    }

    const body: ModerateCommentRequest = await request.json();
    const { isHidden } = body;

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'isHidden must be a boolean' },
        { status: 400 }
      );
    }

    // Defense-in-depth ownership check (S0.4.5): don't rely on RLS alone. The comment
    // carries the instructor_id of the stream it belongs to; it must match the caller.
    const { data: target } = await supabase
      .from('stream_comments')
      .select('instructor_id')
      .eq('id', commentId)
      .single();

    if (!target) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (target.instructor_id !== instructor.id) {
      return NextResponse.json(
        { error: 'You do not have permission to moderate this comment' },
        { status: 403 }
      );
    }

    // Update comment (RLS policy also validates stream ownership)
    const { data: comment, error: updateError } = await supabase
      .from('stream_comments')
      .update({
        is_hidden: isHidden,
        hidden_at: isHidden ? new Date().toISOString() : null,
        hidden_by: isHidden ? user.id : null,
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Moderate comment error:', updateError);
      throw updateError;
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to moderate it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });

  } catch (error: any) {
    console.error('Moderate comment error:', error);
    return NextResponse.json(
      { error: 'Failed to moderate comment' },
      { status: 500 }
    );
  }
}
