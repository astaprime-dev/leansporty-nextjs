import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { signStreamToken, getSignedPlaybackURLs } from '@/lib/cloudflare-stream';

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
 *  401 → not signed in
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
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (rateLimited(user.id)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  // Entitlement check + UID fetch in one RLS-aware call (auth.uid() = this user).
  const { data: uid, error } = await supabase.rpc('get_playable_uid', {
    p_content_id: contentId,
  });
  if (error) {
    console.error('get_playable_uid failed:', error);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  }
  if (!uid) {
    // Not entitled and not a free preview → paywall.
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const token = await signStreamToken(uid as string);
  return NextResponse.json({
    ...getSignedPlaybackURLs(token),
    watermark: user.email,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  });
}
