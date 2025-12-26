/**
 * Stream Comment System Types
 */

export interface StreamComment {
  id: string;
  stream_id: string;
  enrollment_id: string;
  user_id: string;
  star_rating: number; // 1-5
  comment_text: string | null;
  is_hidden: boolean;
  hidden_at: string | null;
  hidden_by: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamCommentReply {
  id: string;
  comment_id: string;
  stream_id: string;
  instructor_id: string;
  user_id: string;
  reply_text: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data for display
export interface CommentWithUser extends StreamComment {
  user_profiles: {
    display_name: string;
    username: string;
    profile_photo_url: string | null;
  };
  replies: CommentReply[];
}

export interface CommentReply extends StreamCommentReply {
  instructors: {
    display_name: string;
    profile_photo_url: string | null;
  };
}

// API request/response types
export interface CreateCommentRequest {
  streamId: string;
  starRating: number;
  commentText?: string;
}

export interface UpdateCommentRequest {
  starRating?: number;
  commentText?: string;
}

export interface CreateReplyRequest {
  replyText: string;
}

export interface ModerateCommentRequest {
  isHidden: boolean;
}

export interface CommentEligibility {
  eligible: boolean;
  reason?: 'not_enrolled' | 'stream_not_found' | 'stream_not_ended' | 'window_closed' | 'insufficient_attendance';
  message?: string;
  attendancePercent?: number;
  hasExistingComment?: boolean;
  canEdit?: boolean;
  commentId?: string;
}

export interface CommentsListResponse {
  success: boolean;
  comments: CommentWithUser[];
  hasMore: boolean;
}

export interface CommentStatsResponse {
  averageRating: number;
  totalComments: number;
}
