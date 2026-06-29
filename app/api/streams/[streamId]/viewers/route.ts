import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/streams/[streamId]/viewers
 * Returns current active viewer count and optionally viewer details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const { streamId } = await params;
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    const supabase = await createClient();

    // Get viewer count
    const { data: count, error: countError } = await supabase.rpc(
      'get_active_viewer_count',
      { p_stream_id: streamId }
    );

    if (countError) {
      console.error('Failed to get viewer count:', countError);
      throw countError;
    }

    const response: any = {
      success: true,
      streamId,
      activeViewers: count || 0,
      timestamp: new Date().toISOString(),
    };

    // Viewer identities (who is watching) are disclosed ONLY to the stream's
    // owning instructor — not to anonymous callers or other users.
    let isOwner = false;
    if (includeDetails) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: streamRow } = await supabase
          .from('live_stream_sessions')
          .select('instructor_id')
          .eq('id', streamId)
          .maybeSingle();
        if (streamRow?.instructor_id) {
          const { data: instructorProfile } = await supabase
            .from('instructors')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          isOwner = !!instructorProfile && instructorProfile.id === streamRow.instructor_id;
        }
      }
    }

    // If the owning instructor requests details, include the viewer list
    if (includeDetails && isOwner) {
      // Get active viewer IDs and watch data from database function
      const { data: activeViewers, error: viewersError } = await supabase.rpc(
        'get_active_viewers',
        { p_stream_id: streamId }
      );

      if (viewersError) {
        console.error('Failed to get viewer details:', viewersError);
      } else if (activeViewers && activeViewers.length > 0) {
        // Fetch user profile details for active viewers
        const userIds = activeViewers.map((v: any) => v.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, username, profile_photo_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Failed to get user profiles:', profilesError);
          // Return viewer data without profile details
          response.viewers = activeViewers;
        } else {
          // Merge watch data with profile data
          response.viewers = activeViewers.map((viewer: any) => {
            const profile = profiles?.find((p) => p.user_id === viewer.user_id);
            return {
              user_id: viewer.user_id,
              display_name: profile?.display_name || 'Unknown User',
              username: profile?.username || 'unknown',
              profile_photo_url: profile?.profile_photo_url || null,
              started_watching_at: viewer.started_watching_at,
              watch_duration_seconds: viewer.watch_duration_seconds,
            };
          });
        }
      } else {
        response.viewers = [];
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Viewer Count API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get viewer count',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
