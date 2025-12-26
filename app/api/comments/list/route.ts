import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CommentsListResponse } from '@/types/comments';

/**
 * GET /api/comments/list?streamId=xxx&offset=0&limit=10
 * Fetches paginated comments for a stream with user profiles and replies
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const streamId = searchParams.get('streamId');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      );
    }

    // Fetch comments with user profiles
    const { data: comments, error: commentsError } = await supabase
      .from('stream_comments')
      .select(`
        id,
        stream_id,
        enrollment_id,
        user_id,
        star_rating,
        comment_text,
        is_hidden,
        hidden_at,
        hidden_by,
        edited_at,
        created_at,
        updated_at,
        user_profiles(display_name, username, profile_photo_url)
      `)
      .eq('stream_id', streamId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error('Fetch comments error:', commentsError);
      throw commentsError;
    }

    if (!comments || comments.length === 0) {
      const response: CommentsListResponse = {
        success: true,
        comments: [],
        hasMore: false,
      };
      return NextResponse.json(response);
    }

    // Fetch replies for these comments
    const commentIds = comments.map(c => c.id);
    const { data: replies, error: repliesError } = await supabase
      .from('stream_comment_replies')
      .select(`
        id,
        comment_id,
        stream_id,
        instructor_id,
        user_id,
        reply_text,
        edited_at,
        created_at,
        updated_at,
        instructors(display_name, profile_photo_url)
      `)
      .in('comment_id', commentIds)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Fetch replies error:', repliesError);
      throw repliesError;
    }

    // Combine comments with their replies
    const commentsWithReplies = comments.map(comment => {
      // Supabase returns joined data as arrays, extract single objects
      const commentReplies = (replies || [])
        .filter(r => r.comment_id === comment.id)
        .map(reply => ({
          ...reply,
          instructors: Array.isArray(reply.instructors) ? reply.instructors[0] : reply.instructors,
        }));

      return {
        ...comment,
        user_profiles: Array.isArray(comment.user_profiles)
          ? (comment.user_profiles[0] || { display_name: 'Unknown User', username: 'unknown', profile_photo_url: null })
          : (comment.user_profiles || { display_name: 'Unknown User', username: 'unknown', profile_photo_url: null }),
        replies: commentReplies,
      };
    });

    const response: CommentsListResponse = {
      success: true,
      comments: commentsWithReplies,
      hasMore: comments.length === limit,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('List comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
