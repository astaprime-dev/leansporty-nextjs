'use client';

import { useState, useEffect } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { CommentEligibility } from '@/types/comments';

interface CommentFormProps {
  streamId: string;
  onSuccess?: () => void;
}

/**
 * Comment Form Component
 * Allows users to submit or edit comments on streams
 * Checks eligibility (50% live attendance) before allowing submission
 */
export function CommentForm({ streamId, onSuccess }: CommentFormProps) {
  const [starRating, setStarRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [eligibility, setEligibility] = useState<CommentEligibility | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  // Check eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setIsCheckingEligibility(true);
        const response = await fetch(
          `/api/comments/check-eligibility?streamId=${streamId}`
        );
        const data: CommentEligibility = await response.json();
        setEligibility(data);

        // If user has existing comment, pre-fill the form
        if (data.hasExistingComment && data.commentId) {
          // Optionally load existing comment for editing
          // For now, just show that they already commented
        }
      } catch (err) {
        console.error('Failed to check eligibility:', err);
        setError('Failed to check comment eligibility');
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [streamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (starRating === 0) {
      setError('Please select a star rating');
      return;
    }

    if (commentText.length > 300) {
      setError('Comment must be 300 characters or less');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          starRating,
          commentText: commentText.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      setSuccess(true);
      setStarRating(0);
      setCommentText('');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isCheckingEligibility) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">Checking eligibility...</p>
      </div>
    );
  }

  // Not eligible - show reason
  if (eligibility && !eligibility.eligible) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Cannot Leave Comment</h3>
            <p className="text-sm text-yellow-800">{eligibility.message}</p>
            {eligibility.attendancePercent !== undefined && (
              <p className="text-sm text-yellow-700 mt-2">
                You attended {eligibility.attendancePercent}% of the live stream.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Already commented - show status
  if (eligibility?.hasExistingComment && !eligibility.canEdit) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Comment Submitted</h3>
            <p className="text-sm text-blue-800">
              You've already left a comment on this stream. Comments can only be edited within 24 hours of posting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Eligible to comment or edit
  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  Comment posted successfully! Thank you for your feedback.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="star-rating" className="text-base font-semibold mb-2 block">
          Rate this stream *
        </Label>
        <StarRating
          value={starRating}
          onChange={setStarRating}
          size="lg"
          className="mb-1"
        />
        {starRating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {starRating} {starRating === 1 ? 'star' : 'stars'}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="comment-text" className="text-base font-semibold mb-2 block">
          Your comment (optional)
        </Label>
        <textarea
          id="comment-text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Share your thoughts about this stream..."
          maxLength={300}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            {commentText.length}/300 characters
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || starRating === 0}
        className="w-full"
      >
        {isLoading ? 'Submitting...' : 'Post Comment'}
      </Button>
    </form>
  );
}
