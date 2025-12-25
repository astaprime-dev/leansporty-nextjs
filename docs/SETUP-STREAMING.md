# Live Streaming Setup Guide

Quick setup guide for deploying the live streaming feature.

## Prerequisites

- Cloudflare account
- Cloudflare Stream enabled
- Supabase project
- Vercel deployment

## Step 1: Cloudflare Setup

1. **Enable Cloudflare Stream**:
   - Go to https://dash.cloudflare.com
   - Navigate to Stream
   - Enable WebRTC (currently in beta)

2. **Get Account ID**:
   - Dashboard → Account → Copy Account ID

3. **Create API Token**:
   - Dashboard → My Profile → API Tokens → Create Token
   - Template: "Edit Cloudflare Stream"
   - Permissions: Stream:Edit
   - Copy the token (only shown once!)

4. **Find Customer Code**:
   - Go to Stream → Any video
   - Look at the URL: `customer-XXXXX.cloudflarestream.com`
   - `XXXXX` is your customer code

## Step 2: Environment Variables

Add to `.env.local` (development) and Vercel (production):

```bash
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=your_customer_code_here

# Instructor Access (generate a secure random string)
INSTRUCTOR_ACCESS_TOKEN=your_secure_random_token_here
```

**Generate secure token**:
```bash
openssl rand -hex 32
```

## Step 3: Database Migration

```bash
# Apply the migration
npx supabase db push

# Or via Supabase dashboard:
# Settings → Database → SQL Editor → Run migration file
```

Migration file: `/supabase/migrations/20250101000000_live_streaming_complete.sql`

## Step 4: Deploy

```bash
# Build and test locally
npm run build
npm start

# Deploy to Vercel
git push origin main
```

## Step 5: Verify

### Test Broadcasting

1. Go to `/instructor/login`
2. Login with Apple
3. Enter instructor access token
4. Create a test stream
5. Click "Start Broadcast"
6. Allow camera/microphone
7. Verify "LIVE" indicator appears
8. Click "Mark as Live"

### Test Viewing

1. Open `/streams` in incognito window
2. Verify stream appears
3. Click "Sign in to Enroll"
4. Sign in with Apple
5. Enroll in stream
6. Click "Watch Live"
7. Verify WHEP player loads and video plays

## Troubleshooting

### "Failed to create stream"

**Check**:
- Cloudflare credentials are correct
- Stream WebRTC is enabled
- API token has correct permissions

**Fix**:
```bash
# Test Cloudflare API connection
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/live_inputs \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### "Unable to parse SDP"

**Cause**: Old code using JSON format
**Fix**: Ensure you're on latest commit with WHIP protocol support

### "405 Method Not Allowed" when watching

**Cause**: Missing WHEP URL in database
**Fix**: Create a new stream (old streams don't have WHEP URLs)

### RLS Policy Violations

**Cause**: Migration not applied
**Fix**: Run migration and verify policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'live_stream_sessions';
```

## Next Steps

1. **Test end-to-end flow** with real stream
2. **Set instructor token** for production
3. **Monitor Cloudflare usage** (billing)
4. **Set up cron jobs** (optional, for cleanup/migration)

## Support

- Documentation: `/docs/live-streaming-documentation.md`
- Instructor Guide: `/docs/instructor-guide.md`
- Cloudflare Docs: https://developers.cloudflare.com/stream/webrtc-beta/
