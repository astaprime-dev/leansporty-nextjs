// Cloudflare Stream API Service
// Handles live streaming with WebRTC (browser-based) and video playback

import {
  CloudflareAPIResponse,
  CloudflareStreamLiveInput,
  CloudflareStreamLiveStatus,
  CloudflareStreamVideo,
} from '@/types/streaming';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Make authenticated API call to Cloudflare
 */
async function callCloudflareAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials in environment variables');
  }

  const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: CloudflareAPIResponse<T> = await response.json();

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || 'Unknown Cloudflare API error';
    throw new Error(`Cloudflare API error: ${errorMessage}`);
  }

  return data.result;
}

/**
 * Create a new live input for streaming
 * Configured for WebRTC (browser-based streaming)
 */
export async function createLiveInput(streamName: string): Promise<{
  streamId: string;
  webrtcUrl: string;
  webrtcToken?: string;
  playbackId: string;
  whepPlaybackUrl: string;
}> {
  const result = await callCloudflareAPI<CloudflareStreamLiveInput>('/stream/live_inputs', {
    method: 'POST',
    body: JSON.stringify({
      meta: { name: streamName },
      recording: {
        mode: 'automatic', // Automatically record for 7-day replay
        timeoutSeconds: 3600, // Stop recording after 1 hour of inactivity
        requireSignedURLs: false, // Public playback for enrolled users
      },
      // Enable WebRTC for browser streaming
      defaultCreator: null,
    }),
  });

  console.log('Cloudflare live input created with recording config:', {
    uid: result.uid,
    recordingMode: result.recording?.mode,
    recordingTimeout: result.recording?.timeoutSeconds,
  });

  return {
    streamId: result.uid,
    webrtcUrl: result.webRTC.url,
    webrtcToken: result.webRTC.streamKey,
    playbackId: result.uid, // Same as stream ID for live inputs
    whepPlaybackUrl: result.webRTCPlayback?.url || '', // WHEP URL for playback
  };
}

/**
 * Get live input details and current status
 */
export async function getLiveInputDetails(streamId: string): Promise<CloudflareStreamLiveInput> {
  return await callCloudflareAPI<CloudflareStreamLiveInput>(
    `/stream/live_inputs/${streamId}`
  );
}

/**
 * Get live stream status (connected, viewer count, etc.)
 */
export async function getLiveStreamStatus(streamId: string): Promise<CloudflareStreamLiveStatus> {
  return await callCloudflareAPI<CloudflareStreamLiveStatus>(
    `/stream/live_inputs/${streamId}/status`
  );
}

/**
 * Delete a live input (cleanup)
 */
export async function deleteLiveInput(streamId: string): Promise<boolean> {
  try {
    await callCloudflareAPI(`/stream/live_inputs/${streamId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Error deleting live input:', error);
    return false;
  }
}

/**
 * Get recordings for a live input
 * After a live stream ends, recordings become available as regular videos
 */
export async function getStreamRecordings(streamId: string): Promise<CloudflareStreamVideo[]> {
  // Use the correct endpoint for live input recordings
  const videos = await callCloudflareAPI<CloudflareStreamVideo[]>(
    `/stream/live_inputs/${streamId}/videos`
  );

  // Filter for ready recordings only
  return videos.filter((video) => video.status.state === 'ready');
}

/**
 * Get video details by ID
 */
export async function getVideoDetails(videoId: string): Promise<CloudflareStreamVideo> {
  return await callCloudflareAPI<CloudflareStreamVideo>(`/stream/${videoId}`);
}

/**
 * Delete a video (for 7-day replay cleanup)
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    await callCloudflareAPI(`/stream/${videoId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

/**
 * Get public playback URL for HLS streaming
 * Works for both live streams and recorded videos
 */
export function getStreamPlaybackURL(playbackId: string): {
  hls: string;
  dash: string;
  iframe: string;
} {
  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;

  if (!customerCode) {
    throw new Error('Missing NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE');
  }

  const baseUrl = `https://customer-${customerCode}.cloudflarestream.com/${playbackId}`;

  return {
    hls: `${baseUrl}/manifest/video.m3u8`,
    dash: `${baseUrl}/manifest/video.mpd`,
    iframe: `${baseUrl}/iframe`,
  };
}

/**
 * Get iframe embed URL with parameters
 */
export function getIframeEmbedURL(
  playbackId: string,
  options: {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    preload?: boolean;
  } = {}
): string {
  const {
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    preload = true,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? 'true' : 'false',
    muted: muted ? 'true' : 'false',
    loop: loop ? 'true' : 'false',
    controls: controls ? 'true' : 'false',
    preload: preload ? 'true' : 'false',
  });

  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  return `https://customer-${customerCode}.cloudflarestream.com/${playbackId}/iframe?${params.toString()}`;
}

/**
 * Generate signed URL for private streams (future enhancement)
 * Currently not needed as streams are public to enrolled users
 */
export function getSignedStreamURL(
  playbackId: string,
  expiresIn: number = 3600
): string {
  // For now, return public URL
  // TODO: Implement signing when needed for additional security
  return getStreamPlaybackURL(playbackId).hls;
}
