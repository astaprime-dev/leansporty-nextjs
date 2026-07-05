import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  signStreamToken,
  getSignedPlaybackURLs,
  getStreamPlaybackURL,
} from '@/lib/cloudflare-stream';
import { getServiceRoleClient } from '@/lib/stripe';

// RS256 signing requires the Node.js runtime (not Edge).
export const runtime = 'nodejs';

/**
 * Best-effort per-user rate limiter (≈60/min). In-memory, so it is per-serverless
 * instance and resets on cold start — a deterrent against token farming, not a hard
 * guarantee. A durable limiter (Upstash/Redis) is the Phase-1 hardening follow-up.
 */
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = hits.get(userId);
  if (!entry || now > entry.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/**
 * POST /api/playback/token  { contentId }
 *
 * Mints a short-lived, signed, watermarked Cloudflare playback token — but only
 * after the entitlement gate (`get_playable_uid`) confirms the caller may watch.
 * Web sends Supabase cookies; iOS sends `Authorization: Bearer <access token>`.
 *
 * Anonymous callers are served FREE-PREVIEW lessons only (the watch page acts
 * as the sales demo — Day 1 plays for everyone, the rest paywalls), rate
 * limited by IP.
 *
 *  401 → not signed in AND not free-preview content
 *  403 → signed in but not entitled (the signal to render the paywall)
 *  200 → { hls, dash, iframe, watermark, expiresAt }
 */
export async function POST(req: NextRequest) {
  let contentId: string | undefined;
  try {
    ({ contentId } = await req.json());
  } catch {
    /* ignore — handled below */
  }
  if (!contentId) {
    return NextResponse.json({ error: 'contentId required' }, { status: 400 });
  }

  // Identify the caller. iOS → Bearer; web → cookies.
  const authHeader = req.headers.get('authorization') ?? '';
  let supabase;
  if (authHeader.startsWith('Bearer ')) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
  } else {
    const store = await cookies();
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let uid: string | null = null;
  let watermark: string;

  if (user) {
    if (rateLimited(user.id)) {
      return NextResponse.json({ error: 'rate limited' }, { status: 429 });
    }

    // Entitlement check + UID fetch in one RLS-aware call (auth.uid() = this user).
    const { data, error } = await supabase.rpc('get_playable_uid', {
      p_content_id: contentId,
    });
    if (error) {
      console.error('get_playable_uid failed:', error);
      return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
    }
    if (!data) {
      // Not entitled and not a free preview → paywall.
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    uid = data as string;
    watermark = user.email ?? '';
  } else {
    // Anonymous: free-preview lessons of live products only. get_playable_uid
    // is granted to authenticated users, so this path checks via service role.
    const ip =
      (req.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim() || 'anon';
    if (rateLimited(`ip:${ip}`)) {
      return NextResponse.json({ error: 'rate limited' }, { status: 429 });
    }

    const db = getServiceRoleClient();
    const { data: rows } = await db
      .from('product_items')
      .select(
        'is_preview, product:products(is_active, admin_disabled), workout:workouts(cloudflare_uid)'
      )
      .eq('content_id', contentId)
      .eq('is_preview', true);
    const previewRow = (rows ?? []).find((r) => {
      const p = Array.isArray(r.product) ? r.product[0] : r.product;
      return p?.is_active && !p?.admin_disabled;
    });
    const workout = previewRow
      ? Array.isArray(previewRow.workout)
        ? previewRow.workout[0]
        : previewRow.workout
      : null;
    if (!workout?.cloudflare_uid) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    uid = workout.cloudflare_uid;
    watermark = 'Free preview';
  }

  // The entitlement gate above has already passed. Now produce a playback URL.
  const haveSigningKey =
    !!process.env.CLOUDFLARE_STREAM_KEY_ID &&
    !!process.env.CLOUDFLARE_STREAM_KEY_PEM;

  if (!haveSigningKey) {
    // TEMPORARY soft-launch mode: no signing key configured. Serve the PUBLIC
    // (unsigned) URL so the entitled-playback flow works against unsecured
    // videos. The app-level entitlement gate still applies, but the asset is
    // NOT locked at the CDN — a raw URL still plays. Must NOT be used for a
    // paid launch: create a signing key + requireSignedURLs and drop the flag.
    if (process.env.ALLOW_UNSIGNED_PLAYBACK === 'true') {
      console.warn(
        `[playback] ALLOW_UNSIGNED_PLAYBACK active — serving PUBLIC url for ${uid}. ` +
          `Content is NOT protected at the CDN. Configure the Stream signing key before paid launch.`
      );
      return NextResponse.json({
        ...getStreamPlaybackURL(uid as string),
        watermark,
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
        insecure: true,
      });
    }
    console.error(
      'Playback signing key missing and ALLOW_UNSIGNED_PLAYBACK not set — refusing to serve.'
    );
    return NextResponse.json({ error: 'playback not configured' }, { status: 500 });
  }

  const token = await signStreamToken(uid as string);
  return NextResponse.json({
    ...getSignedPlaybackURLs(token),
    watermark,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  });
}
