# Live Streaming Setup Guide

Complete guide to setting up Cloudflare Stream for live streaming functionality.

---

## Step 1: Enable Cloudflare Stream

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Log in with your Cloudflare account

2. **Navigate to Stream**
   - In the left sidebar, scroll down to find **"Stream"**
   - Click on **"Stream"**

3. **Enable Stream** (if not already enabled)
   - You'll see a button to **"Enable Stream"**
   - Click it and accept the pricing terms
   - Cloudflare Stream is pay-as-you-go (very affordable for live streaming)

---

## Step 2: Get Your Account ID

1. **In the Cloudflare Dashboard**, you can find your Account ID in two ways:

   **Option A: From the right sidebar**
   - Look at the right side of any page in the dashboard
   - You'll see **"Account ID"** listed
   - Click the copy icon to copy it
   - Format looks like: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

   **Option B: From the URL**
   - Look at your browser URL bar
   - It will look like: `https://dash.cloudflare.com/1a2b3c4d5e.../...`
   - The long string after `dash.cloudflare.com/` is your Account ID

2. **Save this for later** - you'll need it for `CLOUDFLARE_ACCOUNT_ID`

---

## Step 3: Get Your Customer Code (Stream Subdomain)

1. **Go to Stream in the left sidebar**

2. **Click on "Live Inputs" or "Videos" tab**

3. **Look for the embed code or playback URL**
   - If you have existing videos/inputs, click on one
   - Look for the **"Embed Code"** or **"Share"** button
   - You'll see a URL like:
     ```
     https://customer-abc123xyz.cloudflarestream.com/...
     ```
   - The part after `customer-` and before `.cloudflarestream.com` is your customer code
   - In this example: `abc123xyz`

4. **If you have NO videos yet:**
   - The customer code is usually shown in the Stream dashboard
   - OR you can create a test live input:
     - Click **"Create"** → **"Live Input"**
     - After creating, click on it
     - Look at the playback URL - your customer code will be there

5. **Save this customer code** - you'll need it for both:
   - `CLOUDFLARE_STREAM_CUSTOMER_CODE`
   - `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE`

---

## Step 4: Create API Token

1. **Click your profile icon** (top right corner)

2. **Select "My Profile"**

3. **Click on "API Tokens" tab**

4. **Click "Create Token"** button

5. **Click "Create Custom Token"**

6. **Configure the token:**

   **Token name:**
   ```
   LeanSporty Stream
   ```

   **Permissions:**
   - Click **"+ Add more"**
   - Select:
     - **Account** (from first dropdown)
     - **Stream** (from second dropdown)
     - **Edit** (from third dropdown)

   **Account Resources:**
   - Include → **Your Account Name** (select your account)

   **Client IP Address Filtering:** (optional)
   - Leave blank for now (you can restrict later for security)

   **TTL (Time to Live):** (optional)
   - Leave as default (never expires) or set an expiry date

7. **Click "Continue to summary"**

8. **Review and click "Create Token"**

9. **⚠️ CRITICAL: Copy the token immediately!**
   - You'll see a screen with your API token
   - **This is shown ONLY ONCE**
   - Click the copy button to copy it
   - Save it securely - you'll need it for `CLOUDFLARE_API_TOKEN`
   - If you lose it, you'll have to create a new token

---

## Step 5: Generate Instructor Access Token

This is a secure random string for instructor authentication (not from Cloudflare).

**Option 1: Using Terminal (Mac/Linux)**
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Online Generator**
- Use a password generator for a 64+ character random string
- Example: https://www.random.org/strings/
- Settings: 64 characters, alphanumeric

**Save this token** - you'll need it for `INSTRUCTOR_ACCESS_TOKEN`

---

## Step 6: Add Environment Variables

Open your `.env.local` file and add:

```bash
# ============================================
# CLOUDFLARE STREAM
# ============================================

# From Step 2: Your Account ID
CLOUDFLARE_ACCOUNT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

# From Step 4: Your API Token (keep this secret!)
CLOUDFLARE_API_TOKEN=your_api_token_from_step_4

# From Step 3: Your customer code
CLOUDFLARE_STREAM_CUSTOMER_CODE=abc123xyz

# Same as above (needed for client-side video player)
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=abc123xyz

# ============================================
# INSTRUCTOR ACCESS
# ============================================

# From Step 5: Your random instructor token
INSTRUCTOR_ACCESS_TOKEN=your_random_token_from_step_5

# ============================================
# CRON JOBS (for automated cleanup and migration)
# ============================================

# Generate a random secret for cron job authentication
# Use the same method as Step 5 (openssl rand -hex 32)
CRON_SECRET=your_random_cron_secret_here
```

**Important Notes:**
- Replace all the example values with your actual values
- Don't commit `.env.local` to git (it's already in `.gitignore`)
- The `NEXT_PUBLIC_` prefix makes the customer code available in the browser (needed for video player)

---

## Step 7: Database Migration

Apply the database migration to create the streaming tables:

```bash
# Navigate to your project directory
cd /path/to/leansporty.com

# Apply migration
npx supabase db push
```

**Expected output:**
```
Applying migration 20250101000000_live_streaming.sql...
Migration applied successfully!
```

**Verify tables were created:**
```bash
npx supabase db diff
```

You should see no differences (meaning migration applied cleanly).

---

## Step 8: Restart Development Server

```bash
# Stop your current dev server (Ctrl+C if running)

# Start fresh with new environment variables
npm run dev
```

---

## ✅ Verification Checklist

Before continuing, verify:

- [ ] Cloudflare Stream is enabled in dashboard
- [ ] You have your Account ID (from Step 2)
- [ ] You have your Customer Code (from Step 3)
- [ ] You have your API Token (from Step 4)
- [ ] You generated Instructor Access Token (from Step 5)
- [ ] All variables added to `.env.local`
- [ ] Database migration ran successfully
- [ ] Dev server restarted

---

## 🧪 Test Your Setup (Optional)

Create this test file to verify everything works:

**File: `app/api/test-cloudflare/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;

  // Test Cloudflare API
  let apiWorks = false;
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );
    apiWorks = response.ok;
  } catch (error) {
    apiWorks = false;
  }

  return NextResponse.json({
    configured: {
      accountId: !!accountId,
      apiToken: !!apiToken,
      customerCode: !!customerCode,
    },
    apiTest: {
      cloudflareApiWorks: apiWorks,
    },
    preview: {
      accountId: accountId ? accountId.substring(0, 8) + '...' : 'missing',
      customerCode: customerCode || 'missing',
    },
  });
}
```

**Visit:** http://localhost:3000/api/test-cloudflare

**Expected Response:**
```json
{
  "configured": {
    "accountId": true,
    "apiToken": true,
    "customerCode": true
  },
  "apiTest": {
    "cloudflareApiWorks": true
  },
  "preview": {
    "accountId": "1a2b3c4d...",
    "customerCode": "abc123xyz"
  }
}
```

**⚠️ Delete this test file after verifying!** (Don't deploy to production)

---

## 🎉 You're Ready!

Once all checks pass, you're ready to continue building the UI components!

---

## 🔧 Troubleshooting

### "Account ID not found"
- Make sure you copied the full Account ID (32 characters)
- Check there are no extra spaces

### "API Token unauthorized"
- Verify token has **Stream → Edit** permissions
- Make sure you selected the correct account in "Account Resources"
- Try creating a new token

### "Customer code not working"
- Make sure it's just the code (e.g., `abc123xyz`), not the full URL
- No `customer-` prefix or `.cloudflarestream.com` suffix

### "Database migration failed"
- Check you have Supabase CLI installed: `npx supabase --version`
- Make sure you're connected to the right project: `npx supabase link`
- Try running migration manually in Supabase dashboard SQL editor

---

## 💰 Cloudflare Stream Pricing Reference

**Current pricing (pay-as-you-go):**
- Storage: ~$5/month per 1,000 minutes stored
- Streaming: ~$1 per 1,000 minutes delivered
- Live inputs: No additional charge

**Example calculation for 10 streams/month:**
- 10 streams × 60 min each = 600 minutes stored
- 10 streams × 100 viewers × 60 min = 60,000 minutes delivered
- **Estimated cost**: $60-70/month

The 7-day auto-deletion of replays keeps storage costs minimal!

---

## 🤖 Automated Background Jobs

Two cron jobs handle automatic maintenance:

### 1. Recording Cleanup (7-day expiry)
**File:** `/app/api/cron/cleanup-recordings/route.ts`
**Schedule:** Daily at 2:00 AM UTC
**Purpose:** Deletes recordings that are older than 7 days to save storage costs

### 2. Catalog Migration (2-3 months)
**File:** `/app/api/cron/migrate-streams-to-workouts/route.ts`
**Schedule:** Daily at 3:00 AM UTC
**Purpose:** Migrates old streams to the permanent workout catalog

### Testing Cron Jobs Locally

You can test the cron endpoints manually:

```bash
# Generate a CRON_SECRET first (if you haven't already)
openssl rand -hex 32

# Add it to .env.local as CRON_SECRET=your_generated_value

# Test cleanup endpoint
curl -X GET http://localhost:3000/api/cron/cleanup-recordings \
  -H "Authorization: Bearer your_cron_secret_here"

# Test migration endpoint
curl -X GET http://localhost:3000/api/cron/migrate-streams-to-workouts \
  -H "Authorization: Bearer your_cron_secret_here"
```

**Expected Response (when no streams need processing):**
```json
{
  "success": true,
  "message": "No expired recordings to clean up",
  "cleaned": 0
}
```

### Deploying Cron Jobs to Vercel

1. **Ensure `vercel.json` exists** (already created with the project):
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

2. **Add CRON_SECRET to Vercel Environment Variables:**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add: `CRON_SECRET` with the same value from `.env.local`
   - Make sure it's available for **Production**, **Preview**, and **Development**

3. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add live streaming with automated cron jobs"
   git push
   ```

4. **Verify Cron Jobs in Vercel:**
   - Go to your project in Vercel dashboard
   - Click **Deployments** → select your latest deployment
   - Click **Functions** tab
   - Look for cron jobs listed with their schedules

5. **Monitor Cron Execution:**
   - Go to **Deployments** → **Functions** → **Cron**
   - View execution logs and success/failure status
   - Cron jobs will run automatically on schedule

### Cron Schedule Explained

- `0 2 * * *` = Every day at 2:00 AM UTC
- `0 3 * * *` = Every day at 3:00 AM UTC

**Why these times?**
- Low traffic hours (2-3 AM UTC)
- Cleanup runs first (2 AM) to free up storage
- Migration runs second (3 AM) to move mature content to catalog

### Manual Cron Triggers (Production)

For testing in production, you can manually trigger cron jobs:

```bash
# Use your production URL
curl -X GET https://leansporty.com/api/cron/cleanup-recordings \
  -H "Authorization: Bearer $CRON_SECRET"
```

**⚠️ Important:** Never expose your `CRON_SECRET` in client-side code or commit it to git!
