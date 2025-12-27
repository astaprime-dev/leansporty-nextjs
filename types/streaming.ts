// Live Streaming TypeScript Types

export interface Instructor {
  id: string;
  slug: string;
  // Note: display_name and profile_photo_url have been moved to user_profiles table.
  // Join with user_profiles to get these fields.
}

export interface LiveStreamSession {
  id: string;

  // Basic Info
  title: string;
  description: string | null;
  instructor_id: string;
  instructor_name: string | null; // Deprecated, use instructor relation
  instructor?: Instructor; // Joined instructor data

  // Scheduling
  scheduled_start_time: string; // ISO 8601 timestamp
  scheduled_duration_seconds: number;
  actual_start_time: string | null;
  actual_end_time: string | null;

  // Status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';

  // Pricing
  price_in_tokens: number;

  // Cloudflare Stream
  cloudflare_stream_id: string | null;
  cloudflare_webrtc_url: string | null; // WHIP URL for browser streaming (ingestion)
  cloudflare_webrtc_token: string | null;
  cloudflare_playback_id: string | null;
  cloudflare_whep_playback_url: string | null; // WHEP URL for WebRTC playback (egress)

  // Recording
  recording_available: boolean;
  recording_expires_at: string | null;
  recording_cloudflare_video_id: string | null;

  // Catalog migration
  migrated_to_workout_id: string | null;
  migration_scheduled_at: string | null;

  // Metadata
  thumbnail_url: string | null;
  max_viewers: number;
  total_enrollments: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StreamEnrollment {
  id: string;
  stream_id: string;
  user_id: string;

  // Payment
  tokens_paid: number;
  enrolled_at: string;

  // Access control
  can_watch_live: boolean;
  can_watch_replay: boolean;
  replay_access_expires_at: string | null;

  // Engagement tracking
  watched_live: boolean;
  watched_replay: boolean;
  last_watched_at: string | null;
}

export interface StreamChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  sent_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

// Extended type with enrollment info for UI
export interface LiveStreamWithEnrollment extends LiveStreamSession {
  user_enrolled: boolean;
  user_enrollment?: StreamEnrollment;
}

// Cloudflare Stream API Response Types

export interface CloudflareStreamLiveInput {
  uid: string;

  // WebRTC connection info (for browser streaming - WHIP ingestion)
  webRTC: {
    url: string;
    streamKey?: string;
  };

  // WebRTC playback info (for viewing - WHEP egress)
  webRTCPlayback?: {
    url: string;
  };

  // RTMPS info (for OBS - optional/future)
  rtmps?: {
    url: string;
    streamKey: string;
  };

  // SRT info (alternative protocol)
  srt?: {
    url: string;
    streamId: string;
  };

  // Recording settings
  recording: {
    mode: 'automatic' | 'off';
    timeoutSeconds: number;
    requireSignedURLs?: boolean;
  };

  // Metadata
  meta: {
    name: string;
  };

  // Creation timestamp
  created: string;
  modified: string;
}

export interface CloudflareStreamLiveStatus {
  uid: string;
  status: {
    state: 'connected' | 'disconnected' | 'reconnecting';
    current?: {
      startedAt: string;
      viewerCount: number;
      durationSeconds: number;
    };
  };
}

export interface CloudflareStreamVideo {
  uid: string;
  thumbnail: string;
  thumbnailTimestampPct: number;
  readyToStream: boolean;
  status: {
    state: 'ready' | 'inprogress' | 'error' | 'queued';
    pctComplete?: number;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  meta: {
    name?: string;
    [key: string]: any;
  };
  created: string;
  modified: string;
  size: number;
  preview: string;
  allowedOrigins: string[];
  requireSignedURLs: boolean;
  uploaded: string;
  uploadExpiry: string | null;
  maxSizeBytes: number;
  maxDurationSeconds: number;
  duration: number;
  input: {
    width: number;
    height: number;
  };
  playback: {
    hls: string;
    dash: string;
  };
  watermark?: {
    uid: string;
  };
}

// Cloudflare API response wrapper
export interface CloudflareAPIResponse<T> {
  result: T;
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];
}

// WebRTC Connection State (for browser streaming UI)
export interface WebRTCConnectionState {
  state: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: string;
  startedAt?: Date;
  durationSeconds?: number;
}
