// Cloudflare Stream API Service
// Handles live streaming with WebRTC (browser-based) and video playback

import { SignJWT, importPKCS8 } from 'jose';
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
  rtmpsUrl?: string;
  rtmpsStreamKey?: string;
}> {
  const result = await callCloudflareAPI<CloudflareStreamLiveInput>('/stream/live_inputs', {
    method: 'POST',
    body: JSON.stringify({
      meta: { name: streamName },
      recording: {
        mode: 'automatic', // Automatically record for replay
        timeoutSeconds: 3600, // Reconnection timeout
      },
    }),
  });

  console.log('Cloudflare live input created with recording config:', {
    uid: result.uid,
    recordingMode: result.recording?.mode,
    recordingTimeout: result.recording?.timeoutSeconds,
    hasRTMPS: !!result.rtmps,
  });

  return {
    streamId: result.uid,
    webrtcUrl: result.webRTC.url,
    webrtcToken: result.webRTC.streamKey,
    playbackId: result.uid, // Same as stream ID for live inputs
    whepPlaybackUrl: result.webRTCPlayback?.url || '', // WHEP URL for playback
    rtmpsUrl: result.rtmps?.url,
    rtmpsStreamKey: result.rtmps?.streamKey,
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
 * Mint a short-lived, signed playback token for a Cloudflare Stream UID.
 *
 * The video MUST have `requireSignedURLs = true` set on Cloudflare for this to
 * matter — otherwise the raw UID plays without any token and the gate is bypassed.
 * Signing happens server-side only; the key never reaches the client.
 *
 * SECURE_PLAYBACK_SPEC §3 / E1.3.
 */
export async function signStreamToken(
  uid: string,
  opts: { ttlSeconds?: number; accessRules?: unknown[] } = {}
): Promise<string> {
  const keyId = process.env.CLOUDFLARE_STREAM_KEY_ID;
  const pemB64 = process.env.CLOUDFLARE_STREAM_KEY_PEM;
  if (!keyId || !pemB64) {
    throw new Error('Missing Cloudflare Stream signing key (CLOUDFLARE_STREAM_KEY_ID / CLOUDFLARE_STREAM_KEY_PEM)');
  }

  const pem = Buffer.from(pemB64, 'base64').toString('utf-8'); // CF returns the PEM base64-encoded
  const privateKey = await importPKCS8(pem, 'RS256');

  const ttl = opts.ttlSeconds ?? 60 * 60 * 4; // 4h comfortably outlives any single session
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({
    sub: uid,
    kid: keyId,
    exp: now + ttl,
    nbf: now - 30,
    downloadable: false,
    ...(opts.accessRules ? { accessRules: opts.accessRules } : {}),
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .sign(privateKey);
}

/**
 * Build playback URLs where the SIGNED TOKEN replaces the UID in the path.
 * Pair with `signStreamToken()`. Domain locking is done by `allowedOrigins` on
 * the video, not here.
 */
export function getSignedPlaybackURLs(token: string): {
  hls: string;
  dash: string;
  iframe: string;
} {
  const code = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;

  if (!code) {
    throw new Error('Missing NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE');
  }

  const base = `https://customer-${code}.cloudflarestream.com/${token}`;
  return {
    hls: `${base}/manifest/video.m3u8`,
    dash: `${base}/manifest/video.mpd`,
    iframe: `${base}/iframe`,
  };
}
