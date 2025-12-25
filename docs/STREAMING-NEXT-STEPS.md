# Live Streaming - Next Steps & Implementation Plan

**Created**: 2025-01-01
**Status**: Core streaming is ✅ WORKING. Token integration and automation pending.

---

## 🎯 Current Status Summary

### ✅ What's Working (Production Ready)

1. **Broadcasting (WHIP Protocol)**:
   - Instructors can broadcast from browser (no OBS needed)
   - WebRTC via Cloudflare Stream
   - File: `/components/instructor/browser-broadcast.tsx`
   - Uses WHIP protocol (RFC 9725)

2. **Viewing (WHEP Protocol)**:
   - Users can watch live streams with sub-second latency
   - File: `/components/whep-player.tsx`
   - Uses `@eyevinn/webrtc-player` library
   - WHEP protocol for playback

3. **Database Schema**:
   - All tables created: `live_stream_sessions`, `stream_enrollments`, `stream_chat_messages`
   - RLS policies configured
   - Migration: `/supabase/migrations/20250101000000_live_streaming_complete.sql`

4. **User Flow**:
   - Browse streams: `/streams` (public, no auth required)
   - Enroll in streams: Apple sign-in modal integration
   - Watch live: `/streams/[id]/watch` (WHEP player)
   - Watch replays: HLS player (7-day access)

5. **Instructor Dashboard**:
   - Login: `/instructor/login` (Supabase auth + instructor token)
   - Create stream: `/instructor/streams/create`
   - Broadcast: `/instructor/streams/[id]/broadcast`
   - Mark as Live / End Stream buttons

6. **Authentication**:
   - Public browsing (anonymous)
   - Enrollment requires Supabase auth
   - Instructor dashboard: Supabase auth + instructor token cookie
   - Layout protection: `/app/instructor/(dashboard)/layout.tsx`

### ⚠️ What's NOT Implemented (Critical Gap)

**TOKEN INTEGRATION** - Currently a stub!

**File**: `/app/actions.ts` lines 335-337
```typescript
export const enrollInStream = async (streamId: string) => {
  // ... validation code ...

  // TODO: Call existing token deduction API here
  // For now, this is a placeholder
  // In production, this should:
  // 1. Check user's token balance
  // 2. Deduct tokens (stream.price_in_tokens)
  // 3. Create transaction record
  // 4. Return success/error
```

**Impact**: Users can "enroll" without actually paying tokens. This is a **critical blocker** for production use with paying customers.

### 📋 What's Partially Implemented

1. **Instructor Streams List** (`/app/instructor/(dashboard)/streams/page.tsx`):
   - Page exists and displays streams
   - Could use better filtering, stats, actions

2. **Token Balance Widget** (`/components/token-balance.tsx`):
   - Component exists
   - Needs integration with actual token balance API

### ❌ What's Not Implemented

1. **Background Jobs** (cron):
   - Recording cleanup (delete after 7 days)
   - Catalog migration (move to workouts after 2-3 months)

2. **Optional Features**:
   - Live chat
   - Calendar downloads (.ics)
   - Stream thumbnails
   - Email notifications
   - Analytics dashboard

---

## 🔑 Critical Context for Implementation

### Token System Architecture

**Existing System** (Backend + iOS):
- Token balance tracked on backend
- Purchase flow via iOS app
- Transaction history stored
- API endpoints exist (exact URLs TBD)

**What We Need to Integrate**:
1. **Get Balance API**: Fetch user's current token balance
2. **Deduct Tokens API**: Deduct tokens when user enrolls
3. **Create Transaction**: Record stream enrollment in transaction history

**Expected API Format** (to be confirmed):
```typescript
// GET balance
GET /api/tokens/balance
Response: { balance: number }

// POST deduct
POST /api/tokens/deduct
Body: { amount: number, reason: string, metadata: { streamId: string } }
Response: { success: boolean, newBalance: number, transactionId: string }
```

### Database Schema

**live_stream_sessions**:
- `cloudflare_webrtc_url` - WHIP URL for broadcasting
- `cloudflare_whep_playback_url` - WHEP URL for viewing ⭐ Required!
- `cloudflare_playback_id` - HLS playback (recordings only)
- `status` - 'scheduled' | 'live' | 'ended' | 'cancelled'
- `recording_expires_at` - Auto-set when stream ends (actual_end_time + 7 days)
- `migration_scheduled_at` - Auto-set when stream ends (actual_end_time + 2 months)

**stream_enrollments**:
- `tokens_paid` - Amount paid for enrollment
- `replay_access_expires_at` - When replay access expires
- `can_watch_live`, `can_watch_replay` - Access flags

**Triggers**:
- `trigger_set_migration_schedule` - Sets expiry dates when stream ends
- `trigger_update_live_streams_updated_at` - Updates timestamp

### Key Files

**Actions** (`/app/actions.ts`):
- `getStreams()` - Returns live and upcoming streams
- `getUserEnrollments()` - Returns user's enrollments
- `checkStreamEnrollment(streamId)` - Check if user enrolled
- `enrollInStream(streamId)` - ⚠️ NEEDS TOKEN INTEGRATION

**API Routes**:
- `/app/api/instructor/streams/create/route.ts` - Creates stream + Cloudflare Live Input
- `/app/api/instructor/streams/[id]/start/route.ts` - Marks stream as live
- `/app/api/instructor/streams/[id]/end/route.ts` - Ends stream, triggers expiry

**Components**:
- `/components/instructor/browser-broadcast.tsx` - WHIP broadcasting
- `/components/whep-player.tsx` - WHEP playback
- `/components/stream-watch-view.tsx` - Watch page wrapper
- `/components/stream-card.tsx` - Stream list item
- `/components/token-balance.tsx` - Token balance display

**Cloudflare Service** (`/lib/cloudflare-stream.ts`):
- `createLiveInput()` - Returns WHIP URL, WHEP URL, stream ID
- `getLiveInputDetails()` - Get stream status
- `getStreamRecordings()` - Get recordings after stream ends

### Environment Variables

```bash
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=...

# Instructor Access
INSTRUCTOR_ACCESS_TOKEN=...

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📝 Implementation Plan

### Phase 1: Token Integration (CRITICAL - Week 1)

**Goal**: Users actually pay tokens when enrolling

**Tasks**:

1. **Identify Existing Token API** (1 hour)
   - [ ] Find backend token balance endpoint
   - [ ] Find token deduction endpoint
   - [ ] Document API request/response format
   - [ ] Test with Postman/curl

2. **Implement Token Balance Display** (2 hours)
   - [ ] Update `/components/token-balance.tsx`
   - [ ] Call balance API from `/app/streams/page.tsx`
   - [ ] Display balance on streams page
   - [ ] Add "Buy Tokens" link to iOS purchase flow

3. **Implement Token Deduction** (4 hours)
   - [ ] Update `enrollInStream()` in `/app/actions.ts`
   - [ ] Check token balance before enrollment
   - [ ] Call deduction API with stream metadata
   - [ ] Handle insufficient balance error
   - [ ] Create enrollment record on success
   - [ ] Return detailed error messages

4. **Update Stream Enrollments** (2 hours)
   - [ ] Store transaction ID in `stream_enrollments`
   - [ ] Link enrollment to token transaction
   - [ ] Add `token_transaction_id` column (migration)

5. **Testing** (2 hours)
   - [ ] Test enrollment with sufficient balance
   - [ ] Test enrollment with insufficient balance
   - [ ] Test balance display updates
   - [ ] Test duplicate enrollment prevention
   - [ ] Verify transaction history

**Files to Modify**:
- `/app/actions.ts` - enrollInStream()
- `/components/token-balance.tsx` - Display balance
- `/app/streams/page.tsx` - Fetch balance
- `/supabase/migrations/` - Add token_transaction_id column

**Success Criteria**:
- ✅ Tokens deducted when user enrolls
- ✅ Balance displayed on streams page
- ✅ Error shown if insufficient tokens
- ✅ Transaction recorded in backend

---

### Phase 2: Instructor Streams List Enhancement (Week 2)

**Goal**: Better stream management for instructors

**Tasks**:

1. **Stats Display** (3 hours)
   - [ ] Show enrollments count per stream
   - [ ] Calculate revenue (enrollments × price)
   - [ ] Display peak viewers (from max_viewers)
   - [ ] Add status badges (scheduled/live/ended)

2. **Filtering & Sorting** (2 hours)
   - [ ] Filter by status (all/scheduled/live/ended)
   - [ ] Sort by date (upcoming first, then past)
   - [ ] Search by title

3. **Quick Actions** (2 hours)
   - [ ] "Go to Broadcast" button
   - [ ] "View Analytics" link (future)
   - [ ] "Delete Stream" (with confirmation)
   - [ ] "Duplicate Stream" (pre-fill form)

**Files to Modify**:
- `/app/instructor/(dashboard)/streams/page.tsx`
- `/components/instructor/stream-list-card.tsx` (new)

**Success Criteria**:
- ✅ Instructor sees all streams with stats
- ✅ Can filter by status
- ✅ Quick access to broadcast page

---

### Phase 3: Background Jobs (Week 3)

**Goal**: Automate recording cleanup and catalog migration

**Tasks**:

1. **Recording Cleanup Cron** (4 hours)
   - [ ] Create `/app/api/cron/cleanup-recordings/route.ts`
   - [ ] Query streams where `recording_expires_at < NOW()`
   - [ ] Delete video from Cloudflare using `deleteVideo()`
   - [ ] Update `recording_available = false`
   - [ ] Log cleanup actions
   - [ ] Add error handling

2. **Catalog Migration Cron** (5 hours)
   - [ ] Create `/app/api/cron/migrate-streams-to-workouts/route.ts`
   - [ ] Query streams where `migration_scheduled_at < NOW()` AND `migrated_to_workout_id IS NULL`
   - [ ] Create workout in `workouts` table
   - [ ] Copy: title, description, thumbnail, duration, video ID
   - [ ] Update `migrated_to_workout_id`
   - [ ] Log migrations
   - [ ] Handle errors (don't migrate twice)

3. **Vercel Cron Config** (1 hour)
   - [ ] Create or update `/vercel.json`
   - [ ] Add cron schedules
   - [ ] Test cron endpoints manually
   - [ ] Deploy and verify execution

**Files to Create**:
- `/app/api/cron/cleanup-recordings/route.ts`
- `/app/api/cron/migrate-streams-to-workouts/route.ts`
- `/vercel.json` (or update existing)

**Vercel Cron Config**:
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

**Success Criteria**:
- ✅ Recordings auto-delete after 7 days
- ✅ Popular streams auto-migrate to catalog after 2-3 months
- ✅ Cron jobs run daily without errors

---

### Phase 4: Polish & Optional Features (Week 4+)

**Priority: Lower (implement as needed)**

#### A. Stream Thumbnails

**Tasks**:
- [ ] Auto-capture thumbnail from broadcast
- [ ] Upload custom thumbnail (instructor)
- [ ] Default placeholder image
- [ ] Display on stream cards

**Files**:
- `/app/api/instructor/streams/[id]/thumbnail/route.ts`
- `/components/instructor/thumbnail-upload.tsx`

#### B. Calendar Downloads (.ics)

**Tasks**:
- [ ] Create `/lib/ics-generator.ts`
- [ ] Generate .ics file with stream details
- [ ] "Add to Calendar" button on stream cards
- [ ] Include watch URL in calendar event

**Files**:
- `/lib/ics-generator.ts`
- `/components/stream-card.tsx` (add button)

#### C. Live Chat (Optional)

**Tasks**:
- [ ] Enable Supabase Realtime
- [ ] Create `/components/stream-chat.tsx`
- [ ] Subscribe to `stream_chat_messages` inserts
- [ ] Display messages during live streams
- [ ] Send message input (enrolled users only)
- [ ] Moderation: Delete messages

**Files**:
- `/components/stream-chat.tsx`
- `/components/stream-watch-view.tsx` (integrate chat)

**Complexity**: Medium
**Decision**: Defer until requested

#### D. Email Notifications

**Tasks**:
- [ ] Set up email service (Resend, SendGrid)
- [ ] "Stream starting in 15 minutes" notification
- [ ] "New stream from favorite instructor" notification
- [ ] "Replay expiring soon" notification

**Files**:
- `/lib/email.ts`
- `/app/api/notifications/stream-starting/route.ts`

**Complexity**: Medium
**Decision**: Defer until user base grows

#### E. Analytics Dashboard

**Tasks**:
- [ ] Track viewer metrics (join/leave times)
- [ ] Average watch duration
- [ ] Peak concurrent viewers
- [ ] Revenue per stream
- [ ] Popular time slots

**Files**:
- `/app/instructor/(dashboard)/streams/[id]/analytics/page.tsx`
- `/components/instructor/stream-analytics.tsx`

**Complexity**: High
**Decision**: Defer to v2

---

## 🚀 Quick Start Guide for Next Session

### 1. Context Refresh

Read these files first:
- `/docs/README.md` - Documentation index
- `/docs/live-streaming-documentation.md` - Technical reference
- This file - Implementation plan

### 2. Verify Current State

```bash
# Check latest commits
git log --oneline -10

# Verify database migration applied
npx supabase db pull

# Check environment variables
cat .env.local | grep CLOUDFLARE
cat .env.local | grep INSTRUCTOR
```

### 3. Start with Token Integration

**Priority 1**: Fix token deduction in `/app/actions.ts`

**Steps**:
1. Find existing token API endpoints (ask user or search codebase)
2. Test endpoints with curl/Postman
3. Implement balance check
4. Implement token deduction
5. Update UI to show balance

**Testing**:
```bash
# Test token deduction API
curl -X POST https://api.example.com/tokens/deduct \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"amount": 10, "reason": "Stream enrollment", "metadata": {"streamId": "123"}}'
```

### 4. Run Tests

```bash
# Build
npm run build

# Test locally
npm run dev

# Open pages:
# - http://localhost:3000/streams (public)
# - http://localhost:3000/instructor/login (instructor)
```

---

## 📊 Progress Tracking

### Phase 1: Token Integration
- [ ] Identify token API endpoints
- [ ] Implement balance display
- [ ] Implement token deduction
- [ ] Add transaction linking
- [ ] Test end-to-end

### Phase 2: Instructor List
- [ ] Add stats display
- [ ] Add filtering/sorting
- [ ] Add quick actions
- [ ] Test UI/UX

### Phase 3: Background Jobs
- [ ] Recording cleanup cron
- [ ] Catalog migration cron
- [ ] Vercel config
- [ ] Deploy & verify

### Phase 4: Optional
- [ ] Stream thumbnails
- [ ] Calendar downloads
- [ ] Live chat
- [ ] Email notifications
- [ ] Analytics dashboard

---

## 🔍 Debugging Tips

### WHIP/WHEP Issues

**Problem**: "Unable to parse SDP"
- Check: `Content-Type: application/sdp` (not JSON)
- Check: Send raw SDP text in body
- Check: Include `Authorization: Bearer` header

**Problem**: "405 Method Not Allowed"
- Don't use HLS player for WHIP streams
- Use WHEP player for live, HLS for recordings

### Token Issues

**Problem**: Balance not showing
- Check: Token API endpoint is correct
- Check: User authentication token is valid
- Check: CORS headers if API is external

**Problem**: Enrollment succeeds but tokens not deducted
- Check: `enrollInStream()` actually calls deduction API
- Check: Error handling doesn't swallow errors
- Check: Transaction record created

### RLS Issues

**Problem**: "Row violates RLS policy"
- Check: User is authenticated via Supabase
- Check: Policy allows the operation
- Check: Migration applied (`npx supabase db pull`)

---

## 📚 Resources

**Documentation**:
- [Cloudflare Stream WebRTC](https://developers.cloudflare.com/stream/webrtc-beta/)
- [WHIP RFC 9725](https://www.rfc-editor.org/rfc/rfc9725.html)
- [@eyevinn/webrtc-player](https://github.com/Eyevinn/webrtc-player)

**Internal Docs**:
- `/docs/README.md` - Index
- `/docs/live-streaming-documentation.md` - Technical reference
- `/docs/SETUP-STREAMING.md` - Setup guide
- `/docs/instructor-guide.md` - Non-technical guide

**Key Files**:
- `/supabase/migrations/20250101000000_live_streaming_complete.sql`
- `/lib/cloudflare-stream.ts`
- `/app/actions.ts`
- `/components/instructor/browser-broadcast.tsx`
- `/components/whep-player.tsx`

---

**Last Updated**: 2025-01-01
**Next Review**: After Phase 1 completion
