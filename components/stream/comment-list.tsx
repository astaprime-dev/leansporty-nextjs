'use client';

import { useState, useEffect } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommentWithUser, CommentsListResponse } from '@/types/comments';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface CommentListProps {
  streamId: string;
  averageRating?: number;
  totalComments?: number;
}

/**
 * Comment List Component
 * Displays paginated list of comments with replies
 * Shows rating summary and load more functionality
 */
export function CommentList({ streamId, averageRating = 0, totalComments = 0 }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadComments = async (currentOffset: number = 0) => {
    setIsLoading(true);

    try {
      const limit = currentOffset === 0 ? 10 : 20;
      const response = await fetch(
        `/api/comments/list?streamId=${streamId}&offset=${currentOffset}&limit=${limit}`
      );
      const data: CommentsListResponse = await response.json();

      if (data.success) {
        if (currentOffset === 0) {
          setComments(data.comments);
        } else {
          setComments((prev) => [...prev, ...data.comments]);
        }
        setHasMore(data.hasMore);
        setOffset(currentOffset + data.comments.length);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments(0);
  }, [streamId]);

  const handleLoadMore = () => {
    loadComments(offset);
  };

  // No comments yet
  if (!isLoading && comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No comments yet. Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {totalComments > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </div>
              <StarRating value={Math.round(averageRating)} readonly size="sm" />
            </div>
            <div className="border-l border-pink-200 pl-6">
              <p className="text-2xl font-semibold text-gray-900">{totalComments}</p>
              <p className="text-sm text-gray-600">
                {totalComments === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {isLoading && offset === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 scroll-mt-4"
            >
              {/* Comment Header */}
              <div className="flex items-start gap-4 mb-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {comment.user_profiles.profile_photo_url ? (
                    <img
                      src={comment.user_profiles.profile_photo_url}
                      alt={comment.user_profiles.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-semibold text-sm">
                        {comment.user_profiles.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info & Rating */}
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {comment.user_profiles.display_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        @{comment.user_profiles.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <StarRating value={comment.star_rating} readonly size="sm" />
                      <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                        {formatRelativeTime(comment.created_at)}
                        {comment.edited_at && (
                          <span className="ml-1 text-gray-400">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment Text */}
              {comment.comment_text && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {comment.comment_text}
                </p>
              )}

              {/* Instructor Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4 mt-4 pl-4 border-l-2 border-pink-200">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-pink-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {/* Instructor Avatar */}
                        <div className="flex-shrink-0">
                          {reply.instructors.profile_photo_url ? (
                            <img
                              src={reply.instructors.profile_photo_url}
                              alt={reply.instructors.display_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                              <span className="text-pink-700 font-semibold text-xs">
                                {reply.instructors.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Reply Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {reply.instructors.display_name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-pink-200 text-pink-800 px-2 py-0.5"
                            >
                              Instructor
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{reply.reply_text}</p>
                          <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                            {formatRelativeTime(reply.created_at)}
                            {reply.edited_at && (
                              <span className="ml-1 text-gray-400">(edited)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading ? 'Loading...' : 'Load More Comments'}
          </Button>
        </div>
      )}
    </div>
  );
}
