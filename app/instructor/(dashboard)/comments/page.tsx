import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function InstructorCommentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get instructor profile
  const { data: instructor } = await supabase
    .from('instructors')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single();

  if (!instructor) {
    redirect('/');
  }

  // Get all comments on instructor's streams
  const { data: comments } = await supabase
    .from('stream_comments')
    .select(`
      id,
      star_rating,
      comment_text,
      created_at,
      is_hidden,
      stream_id,
      live_stream_sessions!inner(title, instructor_id),
      user_profiles!inner(display_name, username)
    `)
    .eq('live_stream_sessions.instructor_id', instructor.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const totalComments = comments?.length || 0;
  const visibleComments = comments?.filter(c => !c.is_hidden).length || 0;

  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4 py-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Comment Management</h1>
        <p className="text-gray-600">
          View and manage comments on your streams
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Comments</p>
          <p className="text-2xl font-bold">{totalComments}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Visible Comments</p>
          <p className="text-2xl font-bold">{visibleComments}</p>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {!comments || comments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white border rounded-lg p-6 ${
                comment.is_hidden ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {comment.live_stream_sessions.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    by {comment.user_profiles.display_name} (@{comment.user_profiles.username})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    {'★'.repeat(comment.star_rating)}
                  </span>
                  {comment.is_hidden && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Hidden</span>
                  )}
                </div>
              </div>

              {comment.comment_text && (
                <p className="text-gray-700 mb-3">{comment.comment_text}</p>
              )}

              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>

              <div className="mt-4 text-sm text-gray-600">
                <a
                  href={`/streams/${comment.stream_id}/watch`}
                  className="text-pink-600 hover:underline"
                >
                  View on stream page →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
