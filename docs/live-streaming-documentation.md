# Live Streaming Feature Documentation

Complete technical documentation for the LeanSporty live streaming feature built with Cloudflare Stream.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [User Flow](#user-flow)
5. [Instructor Flow](#instructor-flow)
6. [API Endpoints](#api-endpoints)
7. [Components](#components)
8. [Services & Utilities](#services--utilities)
9. [Automated Jobs](#automated-jobs)
10. [Code Examples](#code-examples)

---

## Overview

The live streaming feature allows instructors to broadcast live dance workout sessions that users can enroll in and watch. Key features:

- **Browser-based streaming** - Instructors stream directly from browser using WebRTC (no OBS needed)
- **Token-based enrollment** - Users spend tokens to enroll in streams
- **Live + Replay access** - Watch live or access 7-day replays after enrollment
- **Calendar integration** - Download .ics files to add streams to calendar
- **Automatic lifecycle** - Recordings auto-delete after 7 days, migrate to catalog after 2-3 months
- **Cloudflare Stream** - All video infrastructure powered by Cloudflare

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────────────────────────────────────────────────────┤
│  /streams                - Browse live & upcoming streams    │
│  /streams/[id]/watch     - Watch live stream or replay      │
│  /instructor/login       - Instructor authentication        │
│  /instructor/streams     - Instructor dashboard             │
│  /instructor/streams/create - Create new stream             │
│  /instructor/streams/[id]/broadcast - Broadcast interface   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Server Actions                          │
├─────────────────────────────────────────────────────────────┤
│  getStreams()            - Fetch live & upcoming streams     │
│  getUserEnrollments()    - Get user's enrollments           │
│  checkStreamEnrollment() - Verify enrollment & access       │
│  enrollInStream()        - Enroll in stream (deduct tokens) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
├─────────────────────────────────────────────────────────────┤
│  POST /api/instructor/login                                  │
│  POST /api/instructor/streams/create                         │
│  POST /api/instructor/streams/[id]/start                     │
│  POST /api/instructor/streams/[id]/end                       │
│  GET  /api/cron/cleanup-recordings (daily 2 AM UTC)         │
│  GET  /api/cron/migrate-streams-to-workouts (daily 3 AM)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare Stream API   - Video infrastructure             │
│  Supabase               - Database & authentication          │
│  WebRTC                 - Real-time browser streaming        │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `live_stream_sessions`

Stores all live stream information.

```sql
CREATE TABLE live_stream_sessions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_name VARCHAR(255),

  -- Scheduling
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_duration_seconds INTEGER DEFAULT 3600,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,

  -- Status: 'scheduled', 'live', 'ended', 'cancelled'
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',

  -- Pricing
  price_in_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cloudflare Stream Integration
  cloudflare_stream_id VARCHAR(255),        -- Live input ID
  cloudflare_webrtc_url TEXT,               -- WebRTC connection URL
  cloudflare_webrtc_token TEXT,             -- WebRTC auth token
  cloudflare_playback_id VARCHAR(255),      -- For watching stream

  -- Recording Management
  recording_available BOOLEAN DEFAULT false,
  recording_expires_at TIMESTAMPTZ,         -- Auto-set to +7 days
  recording_cloudflare_video_id VARCHAR(255),

  -- Catalog Migration
  migrated_to_workout_id UUID REFERENCES workouts(id),
  migration_scheduled_at TIMESTAMPTZ,       -- Auto-set to +2 months

  -- Metadata
  thumbnail_url TEXT,
  max_viewers INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `status` - Current state: scheduled → live → ended
- `cloudflare_webrtc_url` - Used by instructor to broadcast
- `cloudflare_playback_id` - Used by users to watch
- `recording_expires_at` - Auto-set when stream ends (+7 days)
- `migration_scheduled_at` - Auto-set when stream ends (+2 months)

### Table: `stream_enrollments`

Tracks which users enrolled in which streams.

```sql
CREATE TABLE stream_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES live_stream_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  tokens_paid INTEGER NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),

  -- Access Control
  can_watch_live BOOLEAN DEFAULT true,
  can_watch_replay BOOLEAN DEFAULT true,
  replay_access_expires_at TIMESTAMPTZ,

  -- Tracking
  watched_live BOOLEAN DEFAULT false,
  watched_replay BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMPTZ,

  UNIQUE(stream_id, user_id)
);
```

**Key Fields:**
- `tokens_paid` - How many tokens user spent to enroll
- `replay_access_expires_at` - When replay access expires (7 days)
- `watched_live/watched_replay` - Analytics tracking

### Table: `stream_chat_messages` (Optional)

For future live chat functionality.

```sql
CREATE TABLE stream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES live_stream_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);
```

### Database Triggers

**Auto-set expiry dates when stream ends:**

```sql
CREATE OR REPLACE FUNCTION set_migration_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_end_time IS NOT NULL AND OLD.actual_end_time IS NULL THEN
    NEW.migration_scheduled_at := NEW.actual_end_time + INTERVAL '2 months';
    NEW.recording_expires_at := NEW.actual_end_time + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_migration_schedule
  BEFORE UPDATE ON live_stream_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_migration_schedule();
```

---

## User Flow

### 1. Browse Streams (`/streams`)

**Page:** `/app/streams/page.tsx`
**Component:** `/components/streams-view.tsx`

```typescript
// Server Component - fetches data
export default async function StreamsPage() {
  const [streams, enrollments] = await Promise.all([
    getStreams(),
    getUserEnrollments(),
  ]);

  return (
    <StreamsView
      liveStreams={streams.liveStreams}
      upcomingStreams={streams.upcomingStreams}
      enrollments={enrollments}
    />
  );
}
```

**Features:**
- Shows LIVE streams with animated 🔴 badge
- Shows upcoming scheduled streams
- Displays enrollment status
- Shows token balance
- Calendar download button

### 2. Enroll in Stream

**Component:** `/components/stream-card.tsx`

```typescript
const handleEnroll = async () => {
  const result = await enrollInStream(stream.id);
  if (result.success) {
    router.refresh();
  } else {
    alert(result.error);
  }
};
```

**Flow:**
1. User clicks "Enroll Now" on stream card
2. `enrollInStream()` server action called
3. Token deduction performed (TODO: integrate with existing API)
4. Enrollment record created in database
5. Page refreshes to show new enrollment status

### 3. Watch Stream (`/streams/[id]/watch`)

**Page:** `/app/streams/[id]/watch/page.tsx`
**Component:** `/components/stream-watch-view.tsx`

**Access Control:**
```typescript
// Check if user is enrolled
const enrollment = await checkStreamEnrollment(streamId);
if (!enrollment) redirect('/streams');

// Check if stream is accessible
const canWatch =
  stream.status === 'live' ||
  (stream.recording_available && replayExpires && now < replayExpires);
if (!canWatch) redirect('/streams');
```

**Features:**
- Cloudflare Stream player (iframe-based)
- Live badge when stream is active
- Replay expiry countdown
- Stream details (title, description, stats)

### 4. Download Calendar

**Component:** `/components/stream-card.tsx`
**Service:** `/lib/ics-generator.ts`

```typescript
const handleDownloadCalendar = () => {
  const icsContent = generateICS(stream, watchUrl);
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${stream.title}.ics`;
  link.click();
};
```

Generates standard .ics file with:
- Event title, description
- Start/end time
- Location (watch URL)
- 1-hour reminder alarm

---

## Instructor Flow

### 1. Login (`/instructor/login`)

**Page:** `/app/instructor/login/page.tsx`
**API:** `/app/api/instructor/login/route.ts`

Simple cookie-based authentication:
```typescript
// User enters INSTRUCTOR_ACCESS_TOKEN
// API verifies and sets cookie
cookies().set('instructor_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

**Protected Layout:** `/app/instructor/layout.tsx`
```typescript
const instructorToken = cookieStore.get('instructor_token');
if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
  redirect('/instructor/login');
}
```

### 2. Dashboard (`/instructor/streams`)

**Page:** `/app/instructor/streams/page.tsx`

Displays:
- Scheduled streams
- Live streams
- Past streams
- Create new stream button

### 3. Create Stream (`/instructor/streams/create`)

**Page:** `/app/instructor/streams/create/page.tsx`
**API:** `/app/api/instructor/streams/create/route.ts`

**Form fields:**
- Title
- Description
- Instructor name
- Scheduled date/time
- Duration (minutes)
- Price (tokens)
- Thumbnail URL (optional)

**Backend flow:**
```typescript
// 1. Create Cloudflare live input
const cloudflare = await createLiveInput(data.title);

// 2. Insert stream into database
const { data: stream } = await supabase
  .from('live_stream_sessions')
  .insert({
    title: data.title,
    cloudflare_webrtc_url: cloudflare.webrtcUrl,
    cloudflare_webrtc_token: cloudflare.webrtcToken,
    cloudflare_playback_id: cloudflare.playbackId,
    // ... other fields
  });

// 3. Redirect to broadcast page
redirect(`/instructor/streams/${stream.id}/broadcast`);
```

### 4. Broadcast (`/instructor/streams/[id]/broadcast`)

**Page:** `/app/instructor/streams/[id]/broadcast/page.tsx`
**Component:** `/components/instructor/browser-broadcast.tsx`

**Browser-based WebRTC streaming:**

```typescript
const startBroadcast = async () => {
  // 1. Request camera/microphone access
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: { echoCancellation: true, noiseSuppression: true },
  });

  // 2. Create WebRTC peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
  });

  // 3. Add media tracks
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });

  // 4. Create offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // 5. Send offer to Cloudflare
  const response = await fetch(webrtcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sdp: offer.sdp,
      streamKey: webrtcToken,
    }),
  });

  // 6. Set remote description
  const answer = await response.json();
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription({ type: 'answer', sdp: answer.sdp })
  );
};
```

**Features:**
- Camera/microphone preview
- Start/Stop broadcast buttons
- Connection status indicator
- Mark as Live button
- End Stream button
- Stream statistics (enrollments, revenue)

### 5. Stream Management

**Mark as Live:**
`POST /api/instructor/streams/[id]/start`
```typescript
await supabase
  .from('live_stream_sessions')
  .update({
    status: 'live',
    actual_start_time: new Date().toISOString(),
  })
  .eq('id', streamId);
```

**End Stream:**
`POST /api/instructor/streams/[id]/end`
```typescript
await supabase
  .from('live_stream_sessions')
  .update({
    status: 'ended',
    actual_end_time: new Date().toISOString(),
    recording_available: true,
  })
  .eq('id', streamId);
// Trigger automatically sets expiry dates
```

---

## API Endpoints

### Instructor Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/instructor/login` | POST | Authenticate instructor | None |
| `/api/instructor/streams/create` | POST | Create new stream | Cookie |
| `/api/instructor/streams/[id]/start` | POST | Mark stream as live | Cookie |
| `/api/instructor/streams/[id]/end` | POST | End stream | Cookie |

**Authentication:**
```typescript
const cookieStore = await cookies();
const instructorToken = cookieStore.get('instructor_token');

if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Cron Job Endpoints

| Endpoint | Method | Schedule | Purpose |
|----------|--------|----------|---------|
| `/api/cron/cleanup-recordings` | GET | Daily 2 AM | Delete 7-day expired recordings |
| `/api/cron/migrate-streams-to-workouts` | GET | Daily 3 AM | Migrate old streams to catalog |

**Authentication:**
```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Components

### User Components

#### `/components/streams-view.tsx`
Main streams page layout with live and upcoming sections.

**Props:**
```typescript
interface StreamsViewProps {
  liveStreams: LiveStreamSession[];
  upcomingStreams: LiveStreamSession[];
  enrollments: StreamEnrollment[];
}
```

**Features:**
- Token balance widget
- LIVE NOW section with animated badge
- Upcoming streams grid
- Empty states

#### `/components/stream-card.tsx`
Individual stream card component.

**Props:**
```typescript
interface StreamCardProps {
  stream: LiveStreamSession;
  enrollment?: StreamEnrollment;
  isLive?: boolean;
}
```

**Features:**
- Thumbnail with live badge overlay
- Stream details (title, date, duration, price)
- Enrollment button or watch button
- Calendar download
- Enrollment count

#### `/components/stream-watch-view.tsx`
Watch page for viewing live streams or replays.

**Props:**
```typescript
interface StreamWatchViewProps {
  stream: LiveStreamSession;
  enrollment: StreamEnrollment;
  isLive: boolean;
}
```

**Features:**
- Cloudflare Stream player
- Live indicator
- Replay expiry notice
- Stream metadata

#### `/components/CloudflareStreamPlayer.tsx`
Iframe-based video player for Cloudflare Stream.

**Props:**
```typescript
interface CloudflareStreamPlayerProps {
  playbackId: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
}
```

**Usage:**
```typescript
<CloudflareStreamPlayer
  playbackId={stream.cloudflare_playback_id}
  controls={true}
  autoplay={isLive}
/>
```

### Instructor Components

#### `/components/instructor/browser-broadcast.tsx`
WebRTC browser-based streaming component.

**Props:**
```typescript
interface BrowserBroadcastProps {
  webrtcUrl: string;
  webrtcToken?: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}
```

**Features:**
- Camera/mic selection
- Local preview
- Start/stop broadcast
- Connection state management
- Error handling

#### `/components/instructor/broadcast-management-view.tsx`
Full broadcast control panel.

**Props:**
```typescript
interface BroadcastManagementViewProps {
  stream: LiveStreamSession;
}
```

**Features:**
- Browser broadcast component
- Stream details display
- Mark as Live button
- End Stream button
- Statistics (enrollments, revenue, viewers)
- WebRTC connection info
- Setup instructions

---

## Services & Utilities

### `/lib/cloudflare-stream.ts`

Cloudflare Stream API service layer.

**Key Functions:**

```typescript
// Create live input for streaming
createLiveInput(streamName: string): Promise<{
  streamId: string;
  webrtcUrl: string;
  webrtcToken?: string;
  playbackId: string;
}>

// Get live input details
getLiveInputDetails(streamId: string): Promise<CloudflareStreamLiveInput>

// Get stream status (viewer count, etc.)
getLiveStreamStatus(streamId: string): Promise<CloudflareStreamLiveStatus>

// Delete live input
deleteLiveInput(streamId: string): Promise<boolean>

// Get recordings for a stream
getStreamRecordings(streamId: string): Promise<CloudflareStreamVideo[]>

// Get video details
getVideoDetails(videoId: string): Promise<CloudflareStreamVideo>

// Delete video (for cleanup)
deleteVideo(videoId: string): Promise<boolean>

// Get playback URLs
getStreamPlaybackURL(playbackId: string): {
  hls: string;
  dash: string;
  iframe: string;
}

// Get iframe embed URL with options
getIframeEmbedURL(playbackId: string, options): string

// Generate signed URL (future feature)
getSignedStreamURL(playbackId: string, expiresIn: number): string
```

**Environment Variables Required:**
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE`

### `/lib/ics-generator.ts`

Calendar file (.ics) generator.

**Function:**
```typescript
generateICS(stream: LiveStreamSession, watchUrl: string): string
```

**Generates:**
- iCalendar format (.ics)
- Event with title, description, location
- Start/end times
- 1-hour reminder alarm

**Usage:**
```typescript
const icsContent = generateICS(stream, watchUrl);
const blob = new Blob([icsContent], { type: 'text/calendar' });
// Download as file
```

### `/app/actions.ts`

Server actions for data fetching and mutations.

**Functions:**

```typescript
// Get live and upcoming streams
getStreams(): Promise<{
  liveStreams: LiveStreamSession[];
  upcomingStreams: LiveStreamSession[];
}>

// Get user's enrollments
getUserEnrollments(): Promise<StreamEnrollment[]>

// Check if user is enrolled in specific stream
checkStreamEnrollment(streamId: string): Promise<StreamEnrollment | null>

// Enroll in stream (TODO: integrate token deduction)
enrollInStream(streamId: string): Promise<{
  success: boolean;
  error?: string;
}>
```

---

## Automated Jobs

### Recording Cleanup (7-Day Expiry)

**File:** `/app/api/cron/cleanup-recordings/route.ts`
**Schedule:** Daily at 2:00 AM UTC
**Vercel Config:** `vercel.json`

**Process:**
1. Find streams where `recording_expires_at < NOW()`
2. Delete video from Cloudflare using `deleteVideo()`
3. Update database: `recording_available = false`
4. Log results

**Manual Trigger:**
```bash
curl -X GET https://leansporty.com/api/cron/cleanup-recordings \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Catalog Migration (2-3 Months)

**File:** `/app/api/cron/migrate-streams-to-workouts/route.ts`
**Schedule:** Daily at 3:00 AM UTC
**Vercel Config:** `vercel.json`

**Process:**
1. Find streams where `migration_scheduled_at < NOW()`
2. Create workout entry in `workouts` table
3. Copy: title, description, duration, video ID, thumbnail
4. Link: `migrated_to_workout_id`
5. Log results

**Manual Trigger:**
```bash
curl -X GET https://leansporty.com/api/cron/migrate-streams-to-workouts \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Vercel Configuration

**File:** `/vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-recordings",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/migrate-streams-to-workouts",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Deployment:**
1. Add `CRON_SECRET` to Vercel environment variables
2. Deploy to Vercel
3. Cron jobs automatically scheduled
4. Monitor in Vercel dashboard → Functions → Cron

---

## Code Examples

### Example 1: Create and Broadcast Stream

```typescript
// 1. Instructor creates stream
const stream = await fetch('/api/instructor/streams/create', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Morning Dance Workout',
    description: 'High-energy dance cardio session',
    scheduledStartTime: '2025-01-15T10:00:00Z',
    durationMinutes: 60,
    priceInTokens: 50,
  }),
});

// 2. Start WebRTC broadcast
const broadcast = new BrowserBroadcast({
  webrtcUrl: stream.cloudflare_webrtc_url,
  webrtcToken: stream.cloudflare_webrtc_token,
});
await broadcast.start();

// 3. Mark as live
await fetch(`/api/instructor/streams/${stream.id}/start`, {
  method: 'POST',
});

// 4. End stream when done
await broadcast.stop();
await fetch(`/api/instructor/streams/${stream.id}/end`, {
  method: 'POST',
});
```

### Example 2: User Enrolls and Watches

```typescript
// 1. User enrolls in stream
const result = await enrollInStream(streamId);
if (!result.success) {
  alert(result.error);
  return;
}

// 2. Navigate to watch page
router.push(`/streams/${streamId}/watch`);

// 3. Watch page loads CloudflareStreamPlayer
<CloudflareStreamPlayer
  playbackId={stream.cloudflare_playback_id}
  autoplay={stream.status === 'live'}
  controls={true}
/>
```

### Example 3: Download Calendar Event

```typescript
import { generateICS } from '@/lib/ics-generator';

const handleDownloadCalendar = () => {
  const watchUrl = `https://leansporty.com/streams/${stream.id}/watch`;
  const icsContent = generateICS(stream, watchUrl);

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${stream.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  link.click();

  URL.revokeObjectURL(url);
};
```

### Example 4: Query Streams with RLS

```typescript
// Get live streams (public)
const { data: liveStreams } = await supabase
  .from('live_stream_sessions')
  .select('*')
  .eq('status', 'live')
  .order('actual_start_time', { ascending: false });

// Get user's enrollments (filtered by RLS)
const { data: enrollments } = await supabase
  .from('stream_enrollments')
  .select(`
    *,
    stream:live_stream_sessions(*)
  `)
  .eq('user_id', userId);

// Check access before showing player
const { data: enrollment } = await supabase
  .from('stream_enrollments')
  .select('*')
  .eq('stream_id', streamId)
  .eq('user_id', userId)
  .single();

if (!enrollment) {
  // User not enrolled - redirect
  redirect('/streams');
}
```

---

## Environment Variables

### Required Variables

```bash
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=              # From Cloudflare dashboard
CLOUDFLARE_API_TOKEN=               # API token with Stream Edit permission
CLOUDFLARE_STREAM_CUSTOMER_CODE=    # From Stream embed URLs
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=  # Same as above (public)

# Instructor Access
INSTRUCTOR_ACCESS_TOKEN=            # Random 64-char hex (openssl rand -hex 32)

# Cron Jobs
CRON_SECRET=                        # Random 64-char hex (openssl rand -hex 32)
```

### Supabase (Already Configured)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Testing Checklist

### User Flow Testing

- [ ] Browse `/streams` - see live and upcoming streams
- [ ] Enroll in stream - token deduction works
- [ ] Watch live stream - player loads and plays
- [ ] Download calendar - .ics file downloads correctly
- [ ] Access replay - watch within 7 days of stream end
- [ ] Replay expiry - access denied after 7 days

### Instructor Flow Testing

- [ ] Login at `/instructor/login`
- [ ] Create stream - form submission works
- [ ] Start broadcast - camera/mic access granted
- [ ] WebRTC connection - stream goes live on Cloudflare
- [ ] Mark as Live - status updates correctly
- [ ] End stream - recording becomes available
- [ ] View statistics - enrollments and revenue display

### Automated Jobs Testing

- [ ] Cleanup cron - deletes 7-day old recordings
- [ ] Migration cron - migrates 2-month old streams
- [ ] Vercel cron - jobs execute on schedule
- [ ] Error handling - failed jobs logged correctly

### Security Testing

- [ ] Unauthenticated users - cannot access instructor pages
- [ ] Unenrolled users - cannot watch streams
- [ ] Expired replays - access properly blocked
- [ ] Cron endpoints - require CRON_SECRET
- [ ] API tokens - never exposed in client code

---

## TODO & Future Enhancements

### Critical TODO

**Token Deduction Integration** (`/app/actions.ts:335-337`)

Currently a placeholder:
```typescript
// TODO: Call existing token deduction API here
// Example: await deductTokens(user.id, stream.price_in_tokens, streamId);
```

**Needs:**
- Call to existing token backend API
- Transaction record with stream ID reference
- Error handling for insufficient tokens

### Future Enhancements

1. **Live Chat** (tables already created)
   - Supabase Realtime integration
   - Message moderation
   - Emoji reactions

2. **Stream Analytics**
   - Viewer count tracking
   - Watch time statistics
   - Engagement metrics

3. **Advanced Features**
   - Multi-camera angles
   - Screen sharing
   - Co-instructor support
   - Stream scheduling UI

4. **Video Quality**
   - Adaptive bitrate streaming
   - Quality selector
   - Low-latency mode

5. **Notifications**
   - Email reminders before stream
   - Push notifications when stream goes live
   - Replay available notifications

---

## Troubleshooting

### WebRTC Connection Issues

**Problem:** Broadcast won't connect
**Solutions:**
- Check STUN server accessibility
- Verify WebRTC URL and token
- Test in different browser
- Check firewall/network restrictions

### Video Player Not Loading

**Problem:** Player shows error or blank screen
**Solutions:**
- Verify `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE` is set
- Check playback ID is correct
- Ensure stream is live or recording available
- Check browser console for errors

### Cron Jobs Not Running

**Problem:** Recordings not being cleaned up
**Solutions:**
- Verify `CRON_SECRET` in Vercel env vars
- Check Vercel Functions logs
- Ensure `vercel.json` is committed
- Test endpoints manually with curl

### Enrollment Issues

**Problem:** Enrollment fails or doesn't save
**Solutions:**
- Check user is authenticated
- Verify token deduction integration
- Check database constraints
- Review server action errors

---

## Performance Considerations

### Video Delivery

- Cloudflare CDN ensures fast global delivery
- Adaptive bitrate for various connection speeds
- Low-latency streaming (< 10 seconds delay)

### Database Queries

- Indexes on `status`, `scheduled_start_time`
- RLS policies for secure access
- Efficient joins for enrollments

### Caching

- Static pages cached at CDN edge
- Server actions revalidate on mutation
- Client-side state management

---

## Cost Estimation

### Cloudflare Stream Pricing

**Example: 10 streams/month**
- Storage: 10 × 60 min = 600 minutes → ~$3/month
- Delivery: 10 × 100 viewers × 60 min = 60,000 minutes → ~$60/month
- **Total: ~$63/month**

**Cost Optimization:**
- 7-day replay deletion reduces storage costs
- Migration to catalog preserves popular content
- Pay-as-you-go model scales with usage

### Vercel Hosting

- Cron jobs: 2 daily jobs (included in Pro plan)
- Serverless functions: Minimal usage
- Bandwidth: Covered by Cloudflare CDN

---

## Support & Resources

### Documentation

- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

### Files Reference

- Setup: `/docs/live-streaming-setup.md`
- Requirements: `/docs/live-streaming-requirements.md`
- Migration: `/supabase/migrations/20250101000000_live_streaming.sql`

---

**Last Updated:** 2025-01-01
**Version:** 1.0.0
**Status:** Production Ready (pending token integration)
