# Web Apple Sign In Setup

## Issue
Getting error: `"Unsupported provider: missing OAuth secret"` when trying to sign in from web, but iOS app works fine.

## Root Cause
iOS uses native Apple authentication, while **web uses OAuth redirect flow** which requires additional configuration in Apple Developer Console.

## Fix: Add Web Redirect URL

### 1. Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Find your **Services ID** (the one used in Supabase, or create a new one for web)
4. Click **Configure** next to "Sign in with Apple"
5. Add these:
   - **Domain**: `rpizmtynhqtzanirtpab.supabase.co`
   - **Return URL**: `https://rpizmtynhqtzanirtpab.supabase.co/auth/v1/callback`
6. Click **Save**

### 2. For Local Testing (localhost:3000)

Apple requires HTTPS for redirect URLs, so local testing needs a workaround:

**Option A: Use ngrok (recommended)**
```bash
# Install ngrok
brew install ngrok

# Start your Next.js app
npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 3000
```

Then:
1. Copy the `https://` URL from ngrok (e.g., `https://abc123.ngrok.io`)
2. Add to Apple Developer Console:
   - **Domain**: `abc123.ngrok.io`
   - **Return URL**: `https://abc123.ngrok.io/auth/callback`
3. Update your `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```
4. Test using the ngrok URL

**Option B: Test on deployed environment**
- Push your code to Vercel/staging
- Test there instead of localhost

### 3. Verify Supabase

Since iOS works, Supabase should already be configured, but verify:
- Dashboard → Authentication → Providers → **Apple is enabled**

## That's It!

After adding the web redirect URL in Apple Developer Console, wait a few minutes and try signing in again.
