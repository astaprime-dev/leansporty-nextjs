---
name: secure-playback
description: This skill should be used when implementing or modifying gated video playback — when the user asks to "secure playback", "implement signed URLs", "set requireSignedURLs", "mint a playback token", "add the watermark player", "implement get_playable_uid", "build SecureStreamPlayer", "gate the live stream", or completes the getSignedStreamURL TODO. Encodes the Cloudflare Stream signing + entitlement-gate flow for LeanSporty.
version: 0.1.0
---

# Secure playback (Cloudflare Stream) for LeanSporty

Implements the hard gate: a logged-in, **entitled** user gets a short-lived, watermarked, domain-locked Cloudflare Stream token — and nobody else does. This must exist before any paid content is sold. Applies to web (cookies) and iOS (Bearer).

## The model in five steps

1. Videos are marked **`requireSignedURLs: true`** on Cloudflare → the raw UID won't play. **This is the linchpin** — if it's not set, every other step is bypassed.
2. `POST /api/playback/token` checks entitlement server-side (`get_playable_uid` RPC) and mints a **short-lived signed JWT** only if entitled.
3. The client plays the token URL and overlays the user's email as a **watermark** (deterrent + leak tracer).
4. **`allowedOrigins`** domain-locks the URL to our sites.
5. The **signing key lives only on the server** (Vercel env) — never in the browser or the iOS bundle.

`403` from the token route is the signal to render the paywall.

## Current state to build on

- `lib/cloudflare-stream.ts` already wraps the Cloudflare API (live inputs, recordings, `getStreamPlaybackURL()`). It contains **`getSignedStreamURL()` as a stub that returns the public URL** — replacing it with real signing is the core of this work.
- `requireSignedURLs` is **not yet set** on the 15 existing UIDs → they currently play raw. Setting it is step 0.
- The entitlement gate (`get_playable_uid`) and `entitlements` schema come from the `supabase-migration` skill.

## Build order

### 0. Cloudflare one-time setup (do first — the linchpin)
- Generate a Stream **signing key**: `POST /accounts/$ACCOUNT_ID/stream/keys`. Save `result.id` → `CLOUDFLARE_STREAM_KEY_ID`, `result.pem` (base64) → `CLOUDFLARE_STREAM_KEY_PEM`. **Server-only env; never `NEXT_PUBLIC_`.**
- Set `requireSignedURLs: true` + `allowedOrigins` (`leansporty.com`, `*.leansporty.com`, `localhost:3000`) on **every** existing UID, on new uploads (default), and on **live inputs** so recordings inherit it.
- Verify each asset returns 403 on a raw (unsigned) request.

### 1. Signing in `lib/cloudflare-stream.ts`
Add `jose`. Replace the `getSignedStreamURL` stub with `signStreamToken(uid, {ttlSeconds≈4h})` (RS256, decode the base64 PEM, set `kid`/`exp`/`nbf`/`downloadable:false`) and `getSignedPlaybackURLs(token)` (token replaces the UID in the path). Full code in `references/implementation.md`.

TTL = ~4h comfortably outlives any single workout/class, so mint one token per "play" and never juggle mid-stream refresh.

### 2. The token route `app/api/playback/token/route.ts`
- `export const runtime = 'nodejs'` (RS256 signing).
- Identify the caller: **cookies for web, `Authorization: Bearer` for iOS** (see the `nextjs-supabase-feature` skill's dual-client pattern). `401` if no user.
- Call `supabase.rpc('get_playable_uid', { p_content_id: contentId })` — RLS-aware, so `auth.uid()` is the caller. Null → `403`.
- Sign the returned UID; respond `{ hls, iframe, watermark: user.email, expiresAt }`.
- **Rate-limit ≈60/min per user** and lock CORS to our origins in production.

### 3. `SecureStreamPlayer` (client component)
Fetches a token, renders the Cloudflare iframe, overlays the per-user email watermark, and renders the paywall CTA on `403`. Same component serves free previews and owned content — the gate is entirely server-side. Code in `references/implementation.md`.

### 4. Live streams (WHEP / HLS)
- **HLS live:** identical flow — `requireSignedURLs` on the live input, mint a token for its UID, play `…/manifest/video.m3u8`.
- **WebRTC/WHEP** is **not** a token-in-path model. Gate it at the source: the endpoint that returns the WHEP playback URL must return it **only to entitled users**; treat the URL as a short-lived capability and never render it into HTML for non-entitled users.

## Non-negotiables

Enforce the full checklist in `references/security-checklist.md`. The essentials:
- `requireSignedURLs: true` on **every** asset (verify continuously — one public asset defeats everything).
- Signing key + `CLOUDFLARE_API_TOKEN` server-only; never `NEXT_PUBLIC_`, never in the iOS bundle.
- Entitlement enforced **server-side** via `get_playable_uid`/RLS — never trust the client.
- The watermark is a deterrent and a leak tracer, **not** prevention (screen-recording is an accepted residual risk).

## Free preview nuance

A "free preview" item (`product_items.is_preview = true`) is gated by **authentication, not purchase** — `get_playable_uid` returns its UID to any logged-in caller, but the token is **still signed, watermarked, and domain-locked**. Never serve a preview as a raw UID. Truly-anonymous landing pages use a separate low-stakes marketing trailer, not one of the signed assets.

## Additional resources

- **`references/implementation.md`** — full code: `signStreamToken`, `getSignedPlaybackURLs`, the token route, `SecureStreamPlayer`, and the iOS client snippet.
- **`references/security-checklist.md`** — the do/don't checklist and the staged hardening roadmap (rate-limit → drifting watermark → DRM).
- Companion skills: `supabase-migration` (the `get_playable_uid` gate + `entitlements`), `stripe-commerce` (grants entitlements).
