import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UpdateCommentRequest } from '@/types/comments';

/**
 * PATCH /api/comments/[id]/update
 * Updates a user's own comment (within 24 hour window)
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

    const body: UpdateCommentRequest = await request.json();
    const { starRating, commentText } = body;

    // Validation
    if (starRating && (starRating < 1 || starRating > 5)) {
      return NextResponse.json(
        { error: 'Star rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (commentText !== undefined && commentText !== null && commentText.length > 300) {
      return NextResponse.json(
        { error: 'Comment text must be 300 characters or less' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (starRating !== undefined) updateData.star_rating = starRating;
    if (commentText !== undefined) updateData.comment_text = commentText;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update comment (RLS + trigger validate ownership and 24hr window)
    const { data: comment, error: updateError } = await supabase
      .from('stream_comments')
      .update(updateData)
      .eq('id', commentId)
      .eq('user_id', user.id) // Ensure ownership
      .select()
      .single();

    if (updateError) {
      if (updateError.message.includes('24 hours')) {
        return NextResponse.json(
          { error: 'Comments can only be edited within 24 hours of posting' },
          { status: 403 }
        );
      }
      if (updateError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Comment not found or you do not have permission to edit it' },
          { status: 404 }
        );
      }
      console.error('Update comment error:', updateError);
      throw updateError;
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });

  } catch (error: any) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}
