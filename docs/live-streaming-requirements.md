# Live Streaming Feature - Requirements

## Overview
Enable live-streamed dance workouts where instructors can broadcast live sessions, and users can enroll, watch live, and access recordings.

---

## User Stories

### As a Regular User

#### Discovery & Browsing
- I can view a dedicated **Streams** page showing upcoming and live sessions
- I can see upcoming streams with:
  - Stream title and description
  - Instructor name
  - Date and time
  - Duration
  - Price in tokens
  - Number of enrolled participants
  - Thumbnail image
- I can see which streams are **LIVE NOW** with a prominent indicator
- I can distinguish between streams I'm enrolled in vs. not enrolled in

#### Enrollment
- I can enroll in an upcoming stream by spending tokens
- I cannot enroll if I have insufficient tokens
- I cannot enroll in the same stream twice
- After enrollment, I can see my enrolled status on the stream card
- I receive a confirmation after successful enrollment

#### Calendar Integration
- I can download a calendar file (.ics) for any upcoming stream
- The calendar file includes:
  - Stream title and description
  - Start time and duration
  - Direct link to watch the stream
- The calendar file works with Apple Calendar, Google Calendar, Outlook, etc.

#### Watching Live Streams
- When a stream goes live, I can see it marked as "LIVE NOW"
- If I'm enrolled, I can click to watch the live stream
- The stream plays in a video player with standard controls
- I can see stream information while watching (title, instructor, description)
- If I'm not enrolled, I cannot access the stream

#### Watching Replays
- After a stream ends, I can watch the replay if I was enrolled
- Replays are available for **7 days** after the stream ends
- I can see when replay access will expire
- After 7 days, I can no longer access the replay
- I receive a notice if replay access is expiring soon

#### Long-term Access
- After **2-3 months**, past streams appear in the regular workout catalog
- These become available as on-demand workouts for all users
- I can see which workouts originated as live streams

---

### As an Instructor

#### Authentication
- I can access instructor features via a special URL
- I authenticate with a simple access token
- I don't need a separate instructor account (single instructor system)

#### Scheduling Streams
- I can create a new live stream announcement with:
  - **Title** (required)
  - **Description** (optional)
  - **Instructor name** (required)
  - **Date and time** (required)
  - **Duration in minutes** (required)
  - **Price in tokens** (required, can be 0 for free)
  - **Thumbnail image** (optional)
- I can schedule streams **weeks in advance**
- After creating a stream, I receive streaming credentials

#### Broadcasting
- I receive **RTMPS streaming credentials**:
  - RTMPS server URL
  - Stream key (secure)
- I can use any standard streaming software (OBS, Streamlabs, etc.)
- The setup process is **YouTube-simple** (copy/paste credentials into OBS)
- I can see setup instructions for OBS

#### Stream Management
- I can see a list of my scheduled streams
- I can view stream details and streaming credentials anytime
- I can manually mark a stream as "Live" when I start broadcasting
- I can manually end a stream when done
- I cannot delete or edit a stream after users have enrolled (to protect user purchases)

#### Analytics & Monitoring
- During/after a stream, I can see:
  - Total enrollments
  - Total revenue (in tokens)
  - Peak concurrent viewers (if available)
  - Stream status (scheduled/live/ended)

---

## Functional Requirements

### Stream Lifecycle

#### 1. Scheduled State
- Stream is created and visible to users
- Users can enroll and pay tokens
- Stream shows countdown to start time
- Users can download calendar file
- Instructor can access streaming credentials

#### 2. Live State
- Instructor starts broadcasting via RTMPS
- Stream status changes to "Live"
- "LIVE NOW" indicator appears on streams page
- Enrolled users can watch in real-time
- Non-enrolled users cannot access
- Cloudflare automatically records the stream

#### 3. Ended State
- Instructor stops broadcasting
- Stream status changes to "Ended"
- Recording becomes available within minutes
- 7-day replay timer starts
- Enrolled users can watch replay

#### 4. Expired Replay State
- 7 days after stream ended
- Replay is no longer accessible
- Recording is deleted from Cloudflare
- Stream remains in "Ended" state but unplayable

#### 5. Catalog Migration State
- 2-3 months after stream ended
- Stream recording is converted to a regular workout
- Appears in the workout catalog
- Available to all users (not just enrolled)
- Link to original stream is preserved

---

### Video Streaming Technology

#### Live Streaming
- Uses **Cloudflare Stream** (not Mux)
- Instructor broadcasts via **RTMPS** protocol
- Users watch via **HLS/DASH** adaptive streaming
- Automatic recording during broadcast
- Low latency (under 10 seconds ideal)

#### Replay Streaming
- Recordings stored on Cloudflare Stream
- Same HLS/DASH playback as live
- Automatic 7-day expiration
- Enrolled users only

#### Catalog Workouts
- Migrated recordings stored permanently
- Same playback as existing workouts
- Available to all authenticated users

---

### Access Control

#### Live Stream Access
- **Enrolled users**: Can watch live
- **Non-enrolled users**: Cannot access, see enrollment prompt
- **Unauthenticated users**: Redirected to sign in

#### Replay Access
- **Enrolled users**: Can watch for 7 days
- **Non-enrolled users**: Cannot access
- **After 7 days**: No one can access (until catalog migration)

#### Catalog Workout Access
- **All authenticated users**: Can watch
- **Same access model** as existing workouts

---

### User Interface Requirements

#### Streams Page (`/streams`)
- **Header**: "Live Streams" title, token balance widget
- **LIVE NOW section**:
  - Only shown if there are live streams
  - Animated "LIVE" badge (red dot, pulsing)
  - Streams sorted by start time (most recent first)
- **Upcoming Streams section**:
  - All scheduled streams (not yet started)
  - Sorted by start time (soonest first)
  - Shows date/time countdown
- **Empty states**:
  - If no live streams: section hidden
  - If no upcoming streams: "No upcoming streams scheduled yet" message
- **Stream Cards**:
  - Large card layout (similar to workouts page)
  - Thumbnail image
  - Title, description, instructor name
  - Date, time, duration
  - Enrollment count
  - Price in tokens
  - Enrollment status
  - Action buttons:
    - "Enroll Now" (if not enrolled)
    - "Watch Live" (if enrolled and live)
    - "View Details" (if enrolled and upcoming)
    - "Add to Calendar" (always visible for upcoming)

#### Watch Page (`/streams/[id]/watch`)
- **Video player**: Full-width, responsive (16:9 aspect ratio)
- **Stream info**: Title, instructor, description below player
- **Live indicator**: If currently live
- **Replay expiry notice**: If watching replay, show expiration date
- **Stats**: Enrollment count, etc.
- **Chat** (optional): Live chat sidebar if implemented

#### Instructor Broadcast Page (`/instructor/streams/[id]/broadcast`)
- **Stream details**: Title, description, status
- **Streaming credentials**: RTMPS URL and key (copyable)
- **Setup instructions**: Step-by-step for OBS
- **Stream controls**: "Mark as Live" and "End Stream" buttons
- **Analytics**: Enrollments, revenue, viewers
- **Status indicator**: Current stream status

---

### Notifications & Reminders

#### Calendar Download
- **Priority**: High (must have for MVP)
- Users can download .ics file from stream card
- Calendar file includes all stream details
- Works with all major calendar apps
- No server-side scheduling required

#### Email Reminders
- **Priority**: Low (future enhancement)
- Could send reminder emails (24h, 1h before)
- Requires email service integration
- Defer to post-MVP

#### Push Notifications (iOS)
- **Priority**: Low (future enhancement)
- Could send push when stream goes live
- Requires mobile app changes
- Defer to post-MVP

---

### Optional Features

#### Live Chat
- **Complexity**: Medium
- **Technology**: Supabase Realtime
- **Features**:
  - Enrolled users can send messages during live stream
  - Messages appear in real-time for all viewers
  - Basic text messages only (no emojis, images, etc.)
  - Simple moderation (delete message capability)
- **Decision**: Implement if time allows, otherwise defer to v2
- **UX**: Chat sidebar on watch page (desktop) or bottom sheet (mobile)

#### Reactions/Emojis
- **Complexity**: Low
- **Features**:
  - Users can send emoji reactions during stream
  - Floating animations on video
- **Decision**: Defer to v2

#### Q&A Mode
- **Complexity**: High
- **Features**:
  - Users can submit questions
  - Instructor sees questions and can respond
- **Decision**: Defer to v2

---

## Edge Cases & Error Handling

### User Scenarios
- User tries to enroll with insufficient tokens → Show error, link to buy tokens
- User tries to enroll twice → Show "already enrolled" message
- User tries to watch without enrollment → Show enrollment prompt with price
- User tries to access expired replay → Show "replay expired" message
- Stream recording fails → Show error, offer refund option (manual process)
- User loses internet during stream → Standard video player reconnection behavior

### Instructor Scenarios
- Instructor starts streaming before clicking "Mark as Live" → Status can be updated anytime
- Instructor forgets to click "End Stream" → Auto-end after 1 hour of inactivity
- Instructor wants to cancel a stream → Manual process, refund enrolled users
- Streaming credentials don't work → Regenerate credentials (manual process)
- Multiple streams scheduled at same time → Allowed (single instructor can only broadcast one)

### System Scenarios
- Cloudflare Stream API is down → Show error, retry later
- Recording fails to save → Log error, manual intervention required
- Cron job fails to run → Jobs are idempotent, will catch up on next run
- User timezone confusion → Always show times in user's local timezone
- Stream runs longer than scheduled duration → Recording continues until instructor ends

---

## Data Retention & Privacy

### Stream Recordings
- **Live recordings**: Stored on Cloudflare Stream
- **7-day replays**: Deleted after expiration
- **Catalog workouts**: Stored permanently
- **User data**: Enrollment records kept indefinitely (for history)

### User Privacy
- User watch history is private
- Enrollment counts are public (aggregate only)
- Chat messages (if implemented) are public to enrolled users
- No personal information exposed in streams

---

## Performance Requirements

### Video Streaming
- **Live latency**: Under 10 seconds ideal, 30 seconds acceptable
- **Replay start time**: Under 3 seconds
- **Video quality**: Adaptive bitrate (360p to 1080p based on connection)
- **Concurrent viewers**: Support at least 100 simultaneous viewers per stream

### Page Load
- Streams page loads under 2 seconds
- Watch page loads under 3 seconds
- Video player starts buffering immediately

### Background Jobs
- Recording cleanup runs daily at 2 AM
- Catalog migration runs daily at 3 AM
- Jobs complete within 5 minutes

---

## Success Metrics

### User Engagement
- Number of stream enrollments per week
- Live attendance rate (enrolled vs. actually watched live)
- Replay view rate (enrolled users who watch replay)
- Average watch time (live and replay)
- Calendar download rate

### Instructor Success
- Number of streams scheduled per month
- Average enrollments per stream
- Average revenue per stream (in tokens)
- Stream completion rate (scheduled vs. successfully broadcasted)

### System Health
- Stream uptime (% of streams that broadcast successfully)
- Recording success rate (% of streams that save successfully)
- Replay availability (% uptime for 7-day window)
- API error rate (Cloudflare, Stripe, Supabase)

---

## Future Enhancements (Post-MVP)

### User Features
- Email/push notifications for stream reminders
- Favorite instructors
- Stream series/packages (bundle pricing)
- Gift enrollments to other users
- Stream ratings/reviews

### Instructor Features
- Multi-instructor support with role-based access
- Stream analytics dashboard
- Scheduling templates
- Bulk stream creation
- Stream editing (before enrollments)

### Platform Features
- Live chat with moderation tools
- Q&A mode for interactive sessions
- Polls during streams
- Screen sharing capability
- Multi-camera switching
- Stream co-hosts

### Monetization
- Subscription passes (unlimited streams per month)
- Early-bird pricing (cheaper if enrolled early)
- Dynamic pricing based on demand
- Instructor revenue sharing

---

## Out of Scope (Explicitly NOT Included)

### Not Implementing
- ❌ Email/SMS notifications (for MVP)
- ❌ iOS push notifications (for MVP)
- ❌ Stream recording downloads (users cannot download)
- ❌ DRM/encryption (Cloudflare handles basic security)
- ❌ Multi-instructor role system (single instructor only)
- ❌ Stream editing after creation
- ❌ Refund system (manual process if needed)
- ❌ Advanced analytics (Google Analytics integration)
- ❌ Social sharing (share stream links)
- ❌ Waitlists for streams
- ❌ Capacity limits per stream

---

## Dependencies

### External Services
- **Cloudflare Stream**: Video hosting, RTMPS ingestion, HLS/DASH delivery
- **Supabase**: Database, authentication, real-time (for chat)
- **Stripe**: Payment processing (already integrated for tokens)
- **Vercel**: Hosting, cron jobs

### Existing Features
- **Token system**: Already implemented on backend + iOS
- **User authentication**: Apple OAuth via Supabase
- **Workout catalog**: Existing structure for migrated streams

---

## Technical Constraints

### Browser Support
- Modern browsers only (Chrome, Safari, Firefox, Edge)
- No IE11 support
- Mobile browsers (iOS Safari, Android Chrome)

### Video Formats
- **Live**: HLS/DASH adaptive streaming
- **Replay**: Same as live
- **Codecs**: H.264 video, AAC audio (standard)

### Instructor Setup
- Requires desktop/laptop for streaming (OBS)
- Stable internet connection (at least 5 Mbps upload)
- Basic technical knowledge (copy/paste URLs)

### Scaling
- Initial capacity: 100 concurrent viewers per stream
- Can scale up with Cloudflare pricing tiers
- Database designed for unlimited streams/enrollments

---

## Questions for Clarification

1. **Stream pricing**: Should there be a minimum/maximum price in tokens?
2. **Free streams**: Are free streams allowed (price = 0)?
3. **Refund policy**: What happens if instructor cancels a stream?
4. **Stream editing**: Can instructor edit title/description after enrollments?
5. **Thumbnail uploads**: Where should instructor upload thumbnails? (Cloudflare Images?)
6. **Multiple instructors**: Future plan or always single instructor?
7. **Stream duration limits**: Is there a maximum stream length?
8. **Catalog migration timing**: Exact timing (2 months vs. 3 months)?

---

## Acceptance Criteria

### MVP Ready When:
- ✅ Users can browse upcoming and live streams
- ✅ Users can enroll in streams with tokens
- ✅ Users can download calendar files
- ✅ Users can watch live streams
- ✅ Users can watch 7-day replays
- ✅ Instructor can schedule streams
- ✅ Instructor can broadcast via RTMPS
- ✅ Instructor can see enrollments/revenue
- ✅ Replays auto-expire after 7 days
- ✅ Streams auto-migrate to catalog after 2-3 months
- ✅ All pages match design system (pink/rose gradients)
- ✅ Mobile responsive on all pages
- ✅ Error handling for common scenarios
- ✅ Background jobs run reliably

### Nice to Have for MVP:
- Live chat (if not too complex)
- Peak viewer count tracking
- Stream preview/thumbnail generation
- Email confirmations for enrollments

---

## Next Steps

1. **Review & approve** this requirements document
2. **Answer clarification questions** above
3. **Create technical implementation plan** based on requirements
4. **Begin Phase 1**: Database schema and foundation
