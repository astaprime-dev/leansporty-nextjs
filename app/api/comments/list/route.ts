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

    // Fetch comments (without joins to avoid FK issues)
    const { data: comments, error: commentsError } = await supabase
      .from('stream_comments')
      .select('id, stream_id, enrollment_id, user_id, star_rating, comment_text, is_hidden, hidden_at, hidden_by, edited_at, created_at, updated_at')
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

    // Fetch user profiles for comment authors
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, username, profile_photo_url')
      .in('user_id', userIds);

    // Create user profiles map
    const userProfilesMap = new Map(
      userProfiles?.map(up => [up.user_id, up]) || []
    );

    // Fetch replies for these comments
    const commentIds = comments.map(c => c.id);
    const { data: replies, error: repliesError } = await supabase
      .from('stream_comment_replies')
      .select('id, comment_id, stream_id, instructor_id, user_id, reply_text, edited_at, created_at, updated_at')
      .in('comment_id', commentIds)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Fetch replies error:', repliesError);
      throw repliesError;
    }

    // Fetch instructor profiles for reply authors
    const instructorIds = [...new Set((replies || []).map(r => r.instructor_id))];
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id, display_name, profile_photo_url')
      .in('id', instructorIds);

    // Create instructors map
    const instructorsMap = new Map(
      instructors?.map(i => [i.id, i]) || []
    );

    // Combine comments with their replies
    const commentsWithReplies = comments.map(comment => {
      const commentReplies = (replies || [])
        .filter(r => r.comment_id === comment.id)
        .map(reply => ({
          ...reply,
          instructors: instructorsMap.get(reply.instructor_id) || { display_name: 'Instructor', profile_photo_url: null },
        }));

      return {
        ...comment,
        user_profiles: userProfilesMap.get(comment.user_id) || { display_name: 'Unknown User', username: 'unknown', profile_photo_url: null },
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
