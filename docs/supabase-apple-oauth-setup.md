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

### 2. For Local Development with HTTPS

Apple requires HTTPS, so you need to set up local SSL certificates:

#### Step 1: Create Self-Signed Certificate

```bash
# Create a directory for certificates
mkdir -p .certs
cd .certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost-cert.pem -days 365 -nodes -subj "/CN=localhost"

cd ..
```

#### Step 2: Create Custom Server Script

Create `server.js` in your project root:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./.certs/localhost-key.pem'),
  cert: fs.readFileSync('./.certs/localhost-cert.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

#### Step 3: Update package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:https": "node server.js",
    "build": "next build",
    "start": "next start"
  }
}
```

#### Step 4: Run with HTTPS

```bash
npm run dev:https
```

#### Step 5: Trust the Certificate (macOS)

```bash
# Add certificate to keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .certs/localhost-cert.pem
```

Or manually:
1. Open Keychain Access
2. Drag `localhost-cert.pem` into "System" keychain
3. Double-click the certificate → Trust → "Always Trust"

#### Step 6: Add to Apple Developer Console

1. **Domain**: `localhost`
2. **Return URL**: `https://localhost:3000/auth/callback`

**Note:** Restart your browser after trusting the certificate.

### 3. Verify Supabase

Since iOS works, Supabase should already be configured, but verify:
- Dashboard → Authentication → Providers → **Apple is enabled**

## That's It!

After adding the web redirect URL in Apple Developer Console, wait a few minutes and try signing in again.
