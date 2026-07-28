// Cloudflare Stream API Service
// Handles live streaming with WebRTC (browser-based) and video playback

import { createPrivateKey } from 'crypto';
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
    // Sub-pixel letterboxing paints white (invisible on studio footage),
    // not the player's default black.
    letterboxColor: '#ffffff',
  });

  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  return `https://customer-${customerCode}.cloudflarestream.com/${playbackId}/iframe?${params.toString()}`;
}

/**
 * Origins allowed to play our videos (mirrors scripts/cloudflare-stream-setup.mjs).
 */
const ALLOWED_ORIGINS = ['leansporty.com', '*.leansporty.com', 'localhost:3000'];

/**
 * Mint a one-time tus upload URL for a direct creator upload (instructor
 * program lessons). The browser then uploads straight to Cloudflare with
 * tus-js-client — the file never passes through our servers.
 *
 * Security/cost properties are locked in AT CREATION and cannot be changed by
 * the uploader:
 * - `requiresignedurls`: the video only ever plays via signStreamToken().
 * - `maxdurationseconds`: Cloudflare rejects longer videos (the one cap an
 *   instructor can't game client-side).
 * - `allowedorigins`: domain lock, same set as the setup script.
 *
 * Uses raw fetch, not callCloudflareAPI: the response body is empty — the
 * upload URL comes back in the `Location` header and the video UID in
 * `stream-media-id`.
 */
export async function createDirectUploadTus(opts: {
  uploadLengthBytes: number;
  maxDurationSeconds: number;
  creator: string; // instructor id, stored on the video for attribution
  name: string;
}): Promise<{ uploadUrl: string; uid: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials in environment variables');
  }

  // Upload-Metadata values are base64-encoded per the tus spec; a key with no
  // value (requiresignedurls) means boolean true.
  const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');
  const uploadMetadata = [
    `name ${b64(opts.name)}`,
    'requiresignedurls',
    `maxdurationseconds ${b64(String(opts.maxDurationSeconds))}`,
    `allowedorigins ${b64(ALLOWED_ORIGINS.join(','))}`,
  ].join(',');

  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream?direct_user=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(opts.uploadLengthBytes),
        'Upload-Creator': opts.creator,
        'Upload-Metadata': uploadMetadata,
      },
    }
  );

  const uploadUrl = response.headers.get('location');
  const uid = response.headers.get('stream-media-id');
  if (!response.ok || !uploadUrl || !uid) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Cloudflare direct upload creation failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  return { uploadUrl, uid };
}

/**
 * Ask Cloudflare to pull a video from a URL server-side ("upload via link") —
 * nothing passes through our servers or the instructor's machine. Same
 * settings as direct uploads: signed playback, duration cap, allowed origins.
 * The download+encode progress surfaces through the normal status polling.
 */
export async function copyStreamFromUrl(opts: {
  url: string;
  maxDurationSeconds: number;
  creator: string;
  name: string;
}): Promise<{ uid: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials in environment variables');
  }

  const response = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: opts.url,
      meta: { name: opts.name },
      creator: opts.creator,
      requireSignedURLs: true,
      allowedOrigins: ALLOWED_ORIGINS,
      maxDurationSeconds: opts.maxDurationSeconds,
    }),
  });

  const data = await response.json().catch(() => null);
  const uid = data?.result?.uid;
  if (!response.ok || !uid) {
    throw new Error(
      `Cloudflare copy-from-url failed (${response.status}): ${JSON.stringify(data?.errors ?? '').slice(0, 300)}`
    );
  }

  return { uid };
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
  // Cloudflare issues PKCS#1 ("BEGIN RSA PRIVATE KEY"); jose's importPKCS8
  // only takes PKCS#8. Node's createPrivateKey accepts both, and jose accepts
  // the resulting KeyObject (this lib is server-only, nodejs runtime).
  const privateKey = pem.includes('BEGIN RSA PRIVATE KEY')
    ? createPrivateKey(pem)
    : await importPKCS8(pem, 'RS256');

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

/**
 * Which picture heights (1080, 720, …) can actually be played right now.
 *
 * `readyToStream` only promises that SOME rendition exists — Cloudflare keeps
 * encoding the higher ones afterwards, which is why a just-uploaded video can
 * look soft and then improve on its own. The details API doesn't expose the
 * ladder, but the HLS master playlist lists every variant that exists, so
 * that's what we read.
 *
 * Best-effort: returns [] if the manifest can't be read. Pass the HLS URL —
 * signed (from getSignedPlaybackURLs) or public (getStreamPlaybackURL).
 */
export async function getAvailableHeights(hlsUrl: string): Promise<number[]> {
  try {
    const res = await fetch(hlsUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    const manifest = await res.text();
    const pattern = /RESOLUTION=\d+x(\d+)/g;
    const heights: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(manifest)) !== null) {
      const height = Number(match[1]);
      if (!heights.includes(height)) heights.push(height);
    }
    return heights.sort((a, b) => b - a);
  } catch {
    return [];
  }
}
