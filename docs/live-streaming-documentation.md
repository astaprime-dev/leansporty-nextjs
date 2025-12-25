# Live Streaming Documentation

**Status**: ✅ **WORKING** - Deployed and tested on production
**Last Updated**: 2025-01-01
**Implementation**: Cloudflare Stream with WHIP/WHEP WebRTC

## Overview

The live streaming feature allows instructors to broadcast live dance workout sessions that users can enroll in and watch. The implementation uses:

- **Cloudflare Stream** for video infrastructure
- **WHIP Protocol** (WebRTC HTTP Ingestion) for browser-based broadcasting
- **WHEP Protocol** (WebRTC HTTP Egress) for low-latency playback
- **Token-based enrollment** system integrated with existing backend
- **7-day replay access** for enrolled users
- **Automatic catalog migration** after 2-3 months

## Key Technologies

### WebRTC Streaming (WHIP/WHEP)

**Critical Requirement**: Cloudflare Stream WebRTC requires WHIP and WHEP to be used together. You **cannot** mix:
- ❌ WHIP ingestion + HLS/DASH playback
- ❌ RTMP ingestion + WHEP playback
- ✅ WHIP ingestion + WHEP playback (only valid combination)

**Libraries Used**:
- `@eyevinn/webrtc-player` - WHEP playback client
- Native WebRTC APIs - WHIP broadcasting

## Architecture

### Broadcasting Flow

1. **Instructor creates stream** → Creates Cloudflare Live Input via API
2. **Cloudflare returns**:
   - WHIP URL (for broadcasting)
   - WHIP token (authentication)
   - WHEP URL (for playback)
3. **Instructor broadcasts** → Browser captures video/audio, sends via WHIP
4. **Cloudflare transcodes** → Real-time WebRTC streaming
5. **Stream auto-records** → Available for 7-day replay

### Viewing Flow

1. **User browses `/streams`** → Sees upcoming/live streams (no auth required)
2. **User enrolls** → Deducts tokens, grants access
3. **User watches**:
   - **Live**: WHEP player with sub-second latency
   - **Replay**: HLS player (recordings use standard playback)

## Database Schema

See `/supabase/migrations/20250101000000_live_streaming_complete.sql` for the complete schema with comments.

### Key Tables

- `live_stream_sessions` - Stream metadata, status, Cloudflare URLs
- `stream_enrollments` - User enrollments and access control
- `stream_chat_messages` - Optional live chat

### Important Columns

- `cloudflare_webrtc_url` - WHIP URL for broadcasting
- `cloudflare_whep_playback_url` - WHEP URL for viewing ⭐ **Required!**
- `cloudflare_playback_id` - Fallback for HLS (recordings only)

## API Endpoints

See `/app/api/instructor/` for implementation.

### Instructor
- `POST /api/instructor/login` - Set instructor token cookie
- `POST /api/instructor/streams/create` - Create stream + Cloudflare Live Input
- `POST /api/instructor/streams/[id]/start` - Mark stream as live
- `POST /api/instructor/streams/[id]/end` - End stream, trigger cleanup

### User (Server Actions)
- `getStreams()` - Get live and upcoming streams
- `getUserEnrollments()` - Get user's enrollments
- `enrollInStream(streamId)` - Enroll and deduct tokens

## Components

### Broadcasting

**`BrowserBroadcast`** - WHIP broadcasting component
- Captures camera/mic via `getUserMedia()`
- Creates WebRTC peer connection
- Sends SDP offer via **WHIP protocol (RFC 9725)**:
  ```typescript
  fetch(whipUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp',
      'Authorization': `Bearer ${token}`,
    },
    body: sdp, // Raw SDP text, not JSON!
  });
  ```
- Receives SDP answer (also plain text)
- Establishes connection
- Shows LIVE indicator

### Viewing

**`WHEPPlayer`** - WHEP playback component
- Uses `@eyevinn/webrtc-player` with `type: 'whep'`
- Sub-second latency
- **Only for live streams**

**`CloudflareStreamPlayer`** - HLS iframe player
- **Only for recordings**, NOT live streams
- Standard latency

**`StreamWatchView`** - Watch page wrapper
- Conditionally renders WHEP or HLS player
- Shows stream info, enrollment status
- Access control

## Environment Variables

```bash
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=your_customer_code

# Instructor Access
INSTRUCTOR_ACCESS_TOKEN=your_secure_token
```

## User Flows

### Instructor

1. Login with Apple → Enter instructor code
2. Create stream → Fill form
3. Broadcast page → "Start Broadcast" → Allow camera/mic
4. Wait for LIVE indicator
5. "Mark as Live" → Users can see stream
6. Teach workout
7. "Stop Broadcast" → "End Stream"

### User

1. Browse `/streams` (no auth)
2. Sign in with Apple (if needed)
3. Enroll → Tokens deducted
4. Watch Live (WHEP) or Replay (HLS within 7 days)

## Troubleshooting

### WHIP Broadcasting

**"Unable to parse SDP"**:
- ✅ Use `Content-Type: application/sdp`
- ✅ Send raw SDP text (not JSON)
- ✅ Include `Authorization: Bearer` header

### WHEP Playback

**"405 Method Not Allowed"**:
- ❌ Don't use HLS/iframe player for live WHIP streams
- ✅ Use WHEP player for live, HLS for recordings

## Testing

- [ ] Create stream → Broadcast → Mark live → End
- [ ] Anonymous browsing works
- [ ] Sign in modal opens
- [ ] Enrollment deducts tokens
- [ ] WHEP player loads for live streams
- [ ] HLS player loads for replays
- [ ] Replays expire after 7 days

## Resources

- [Cloudflare Stream WebRTC](https://developers.cloudflare.com/stream/webrtc-beta/)
- [WHIP RFC 9725](https://www.rfc-editor.org/rfc/rfc9725.html)
- [@eyevinn/webrtc-player](https://github.com/Eyevinn/webrtc-player)
- [Instructor Guide](/docs/instructor-guide.md)
