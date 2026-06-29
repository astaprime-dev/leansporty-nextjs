# Secure playback — security checklist & hardening roadmap

## Do
- [ ] `requireSignedURLs: true` on **every** video — the 15 originals, all new uploads, and every live recording. Verify continuously; one public asset silently defeats the whole scheme.
- [ ] Signing key (`CLOUDFLARE_STREAM_KEY_ID` + `CLOUDFLARE_STREAM_KEY_PEM`) in server env only. Never `NEXT_PUBLIC_`, never in the iOS bundle.
- [ ] Entitlement enforced server-side via `get_playable_uid` / RLS — never in the client.
- [ ] `allowedOrigins` domain-lock to our domains (+ `localhost:3000` for dev).
- [ ] Service-role key used **only** in the Stripe webhook, with signature verification (see the `stripe-commerce` skill).
- [ ] Rate-limit `/api/playback/token` per user (≈60/min) to stop token farming.
- [ ] Lock CORS on the token route to our origins in production.
- [ ] For live: gate the WHEP URL at the source; never emit it to non-entitled users.

## Don't
- [ ] Don't expose `CLOUDFLARE_API_TOKEN` or the signing key to the browser.
- [ ] Don't leave any video public "for now" — that defeats everything.
- [ ] Don't treat the watermark as prevention — it is a deterrent + tracer.
- [ ] Don't put entitlement logic in the client.
- [ ] Don't render a preview as a raw UID — previews are still signed (auth-gated, not purchase-gated).

## Threat model (what each control defends)
| Threat | Control |
|---|---|
| Sharing a playback URL | signed token expires (hours), tied to one UID |
| Hot-linking / embedding elsewhere | `allowedOrigins` domain lock |
| Non-payers accessing content | server-side entitlement check before minting |
| Casual scraping / "save video" | HLS segmented + signed; no single file |
| Re-uploading leaked copies | per-user email watermark → traceable |

**Explicitly accepted:** a determined user can screen-record — no platform (native iOS included) prevents this. The core product (live cohorts) can't be meaningfully pirated.

## Staged hardening (match effort to stage)
| Phase | When | What | Effort |
|---|---|---|---|
| 0 — MVP | before first paid sale | signing key + `requireSignedURLs` + `allowedOrigins` + token route + email overlay | ~1 day |
| 1 — Harden | at first revenue | rate-limit token route, drifting watermark, geo `accessRules` | hours |
| 2 — DRM | at scale / premium | enable Widevine + FairPlay on Stream; iframe handles licensing (keep `requireSignedURLs`) | ~½ day |
| 3 — Forensic | only if piracy is proven | burned-in per-user watermark via a vendor | project |

Ship Phase 0 — it is enough to start and is the prerequisite for selling any access.
