# Secure playback — implementation code

## 1. Signing — replace the `getSignedStreamURL` stub in `lib/cloudflare-stream.ts`

```ts
import { SignJWT, importPKCS8 } from 'jose';   // npm i jose

/** Mint a short-lived signed token for a Cloudflare Stream UID.
 *  The video MUST have requireSignedURLs = true for this to matter. */
export async function signStreamToken(
  uid: string,
  opts: { ttlSeconds?: number; accessRules?: unknown[] } = {}
): Promise<string> {
  const keyId  = process.env.CLOUDFLARE_STREAM_KEY_ID;
  const pemB64 = process.env.CLOUDFLARE_STREAM_KEY_PEM;
  if (!keyId || !pemB64) throw new Error('Missing Cloudflare Stream signing key');

  const pem = Buffer.from(pemB64, 'base64').toString('utf-8'); // CF returns base64 PEM
  const privateKey = await importPKCS8(pem, 'RS256');

  const ttl = opts.ttlSeconds ?? 60 * 60 * 4; // 4h > any single session
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({
    sub: uid, kid: keyId, exp: now + ttl, nbf: now - 30, downloadable: false,
    ...(opts.accessRules ? { accessRules: opts.accessRules } : {}),
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .sign(privateKey);
}

/** Build playback URLs where the SIGNED TOKEN replaces the UID in the path. */
export function getSignedPlaybackURLs(token: string) {
  const code = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  const base = `https://customer-${code}.cloudflarestream.com/${token}`;
  return { hls: `${base}/manifest/video.m3u8`, dash: `${base}/manifest/video.mpd`, iframe: `${base}/iframe` };
}
```

`accessRules` (optional) supports geo rules, e.g. allow DE/AT/CH then block: `[{type:'ip.geoip.country',country:['DE','AT','CH'],action:'allow'},{type:'any',action:'block'}]`. Domain locking is done by `allowedOrigins` on the video, not here.

## 2. Token route — `app/api/playback/token/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { signStreamToken, getSignedPlaybackURLs } from '@/lib/cloudflare-stream';

export const runtime = 'nodejs'; // RS256 signing

export async function POST(req: NextRequest) {
  let contentId: string | undefined;
  try { ({ contentId } = await req.json()); } catch {}
  if (!contentId) return NextResponse.json({ error: 'contentId required' }, { status: 400 });

  const auth = req.headers.get('authorization') ?? '';
  let supabase;
  if (auth.startsWith('Bearer ')) {                          // iOS
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } });
  } else {                                                    // web (cookies)
    const store = await cookies();
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: uid, error } = await supabase.rpc('get_playable_uid', { p_content_id: contentId });
  if (error) return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  if (!uid)  return NextResponse.json({ error: 'forbidden' }, { status: 403 }); // → paywall

  const token = await signStreamToken(uid as string);
  return NextResponse.json({
    ...getSignedPlaybackURLs(token),
    watermark: user.email,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  });
}
```

Add per-user rate limiting (≈60/min) and production CORS lock before launch.

## 3. `SecureStreamPlayer` — `components/SecureStreamPlayer.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";

export function SecureStreamPlayer({ contentId, className = "" }:
  { contentId: string; className?: string }) {
  const [src, setSrc] = useState(""); const [mark, setMark] = useState(""); const [denied, setDenied] = useState(false);
  useEffect(() => {
    let off = false;
    (async () => {
      const res = await fetch("/api/playback/token", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentId }),
      }); // same-origin → Supabase cookie sent automatically
      if (!res.ok) { if (!off) setDenied(true); return; }
      const { iframe, watermark } = await res.json();
      if (!off) { setSrc(`${iframe}?controls=true`); setMark(watermark); }
    })();
    return () => { off = true; };
  }, [contentId]);

  if (denied) return <BuyThisChallengeCTA contentId={contentId} />; // your paywall
  if (!src)   return <div className="aspect-video animate-pulse rounded-lg bg-muted" />;
  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }}>
      <iframe src={src} className="absolute inset-0 h-full w-full rounded-lg" style={{ border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3">
        <span className="select-none text-[11px] text-white/30">{mark}</span>
      </div>
    </div>
  );
}
```

Hardening: move the watermark to a random corner every ~20s (anti-crop); add the user id alongside the email.

## 4. iOS client (same route, Bearer auth)

```swift
let access = try await supabase.auth.session.accessToken
var req = URLRequest(url: URL(string: "https://leansporty.com/api/playback/token")!)
req.httpMethod = "POST"
req.setValue("Bearer \(access)", forHTTPHeaderField: "Authorization")
req.setValue("application/json", forHTTPHeaderField: "Content-Type")
req.httpBody = try JSONEncoder().encode(["contentId": contentId.uuidString])
// 200 → play token.hls in AVPlayer + overlay token.watermark; 403 → paywall
```

App Store note: purchases happen on web, so iOS must **not** show in-app "buy" buttons for this content (reader-app pattern). It logs in and plays what the user already owns.
