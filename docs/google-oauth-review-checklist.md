# Google OAuth Consent Screen Review Checklist

## Overview

Google reviews OAuth consent screens to ensure apps are legitimate, transparent, and safe for users. This checklist helps ensure LeanSporty passes the review on the first attempt.

**Review Timeline:** 4-6 weeks (per Google's message)

**Last Updated:** December 25, 2024

---

## Pre-Submission Checklist

### ✅ Required Information

#### 1. App Information

- [x] **App Name:** "LeanSporty" (matches actual brand)
- [x] **App Logo:** Upload professional logo (if not done yet, highly recommended)
- [x] **Application Homepage:** `https://leansporty.com` (must be live and accessible)
- [x] **Application Privacy Policy:** `https://leansporty.com/privacy` (must be live)
- [x] **Application Terms of Service:** `https://leansporty.com/terms` (must be live)

#### 2. Developer Contact Information

- [x] **Developer Contact Email:** `team@leansporty.com`
- [ ] **Verify email is monitored** - Google may send verification emails

#### 3. Authorized Domains

- [x] `leansporty.com`
- [x] `supabase.com`
- [x] `rpizmtynhqtzanirtpab.supabase.co`

#### 4. OAuth Client Configuration

- [x] **Client Type:** Web application
- [x] **Client Name:** "LeanSporty Web"
- [x] **Authorized JavaScript Origins:**
  - `https://leansporty.com`
  - `https://rpizmtynhqtzanirtpab.supabase.co`
  - `http://localhost:3000` (for development)
- [x] **Authorized Redirect URIs:**
  - `https://rpizmtynhqtzanirtpab.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (for development)

---

## Critical Review Points

### 🔍 What Google Reviews

#### 1. Privacy Policy Requirements

**Google checks that your Privacy Policy includes:**

- [ ] **What data is collected**
  - ✅ We collect: email, profile info
  - ✅ Check your iubenda policy includes this

- [ ] **How data is used**
  - ✅ Authentication
  - ✅ Fitness tracking
  - ✅ Check your iubenda policy explains this

- [ ] **How data is shared**
  - ✅ Third-party processors (Google Analytics, etc.)
  - ✅ Check your iubenda policy covers this

- [ ] **User rights**
  - ✅ Right to access data
  - ✅ Right to delete account
  - ✅ Your Privacy Policy should mention these

- [ ] **Contact information**
  - ✅ team@leansporty.com is listed

**Action Required:**
1. Visit `https://leansporty.com/privacy`
2. Verify all above points are covered in the embedded iubenda policy
3. If anything is missing, update iubenda policy

---

#### 2. Terms of Service Requirements

**Google checks that your ToS includes:**

- [x] **Service description**
  - ✅ Described in your Terms page

- [x] **User obligations**
  - ✅ Use restrictions covered

- [x] **Data handling**
  - ✅ Links to Privacy Policy

- [x] **Contact information**
  - ✅ team@leansporty.com listed

**Action Required:**
1. Visit `https://leansporty.com/terms`
2. Verify all sections are complete and professional
3. ✅ Already comprehensive from our implementation

---

#### 3. OAuth Scopes

**Current Scopes Requested:**
- `email` - User's email address
- `profile` - User's basic profile info
- `openid` - OpenID Connect

**Google Review:**
- ✅ **Basic scopes only** - No sensitive/restricted scopes
- ✅ **Justified usage** - Need email for account creation, profile for display name

**Action Required:**
- [x] Verify only basic scopes are requested
- [x] No restricted scopes (Drive, Calendar, etc.)

---

#### 4. App Branding Consistency

**Google checks:**
- [ ] **App name matches** across:
  - OAuth consent screen: "LeanSporty" ✅
  - Website: "LeanSporty" ✅
  - Privacy Policy: References "LeanSporty" ✅
  - Terms of Service: References "LeanSporty" ✅

- [ ] **Logo (if provided):**
  - Professional quality
  - Represents the brand
  - Not copyrighted material
  - Not misleading

**Action Required:**
1. Check app name is consistent everywhere
2. If logo uploaded, ensure it's professional
3. If no logo, consider adding one (not required but helps)

---

#### 5. Domain Verification

**Google verifies you own the domains:**

- [ ] **leansporty.com**
  - Method: Google Search Console verification
  - Status: ⚠️ Check if verified

**Action Required:**
1. Go to https://search.google.com/search-console
2. Add property: `leansporty.com`
3. Verify ownership via:
   - DNS TXT record (recommended)
   - HTML file upload
   - HTML meta tag
4. Wait for verification (5-10 minutes)

---

#### 6. Homepage & Legal Pages Accessibility

**Google's automated crawler checks:**

- [ ] **Homepage loads:** `https://leansporty.com`
  - Must return HTTP 200
  - Must load without errors
  - Should show actual app content

- [ ] **Privacy Policy loads:** `https://leansporty.com/privacy`
  - Must return HTTP 200
  - Must contain actual privacy policy content
  - Must be publicly accessible (no login required)

- [ ] **Terms of Service loads:** `https://leansporty.com/terms`
  - Must return HTTP 200
  - Must contain actual terms content
  - Must be publicly accessible

**Action Required:**
1. Test each URL in incognito mode
2. Verify pages load without errors
3. Verify content is visible
4. Check for any broken links

---

#### 7. HTTPS Requirements

**All production URLs must use HTTPS:**

- [x] Homepage: `https://leansporty.com` ✅
- [x] Privacy: `https://leansporty.com/privacy` ✅
- [x] Terms: `https://leansporty.com/terms` ✅
- [x] Redirect URI: `https://rpizmtynhqtzanirtpab.supabase.co/auth/v1/callback` ✅

**Action Required:**
- [x] All production URLs use HTTPS
- [x] Valid SSL certificates

---

## Common Rejection Reasons

### ❌ Top Reasons Apps Get Rejected

1. **Privacy Policy Issues**
   - Missing required sections
   - Broken link
   - Not accessible
   - Too generic (template not customized)

2. **Domain Verification**
   - Domain not verified in Search Console
   - Homepage doesn't load
   - Domain mismatch

3. **App Name Issues**
   - Misleading name
   - Impersonating another app
   - Trademark violation

4. **Scope Justification**
   - Requesting unnecessary scopes
   - Not explaining why scopes are needed

5. **Legal Pages**
   - Terms of Service missing
   - Privacy Policy missing
   - Pages return 404 or 500 errors

---

## Action Items Before Review

### High Priority (Do Now)

1. **Verify Privacy Policy is complete**
   ```bash
   # Test in browser
   curl -I https://leansporty.com/privacy
   # Should return: HTTP/2 200
   ```

2. **Verify Terms of Service is complete**
   ```bash
   curl -I https://leansporty.com/terms
   # Should return: HTTP/2 200
   ```

3. **Verify Homepage loads**
   ```bash
   curl -I https://leansporty.com
   # Should return: HTTP/2 200
   ```

4. **Check Domain Verification**
   - Go to https://search.google.com/search-console
   - Verify `leansporty.com` is added and verified
   - If not, add it now

5. **Review OAuth Scopes**
   - Go to Google Cloud Console → OAuth consent screen
   - Check "Scopes" section
   - Ensure only `email`, `profile`, `openid` are requested
   - Remove any unnecessary scopes

### Medium Priority (Recommended)

1. **Add App Logo**
   - Upload professional logo to OAuth consent screen
   - Size: 120x120 pixels minimum
   - Format: PNG or JPG
   - Clear, professional representation of brand

2. **Test OAuth Flow End-to-End**
   - Sign out of LeanSporty
   - Click "Sign in with Google"
   - Verify consent screen shows "LeanSporty" name
   - Complete sign-in
   - Verify redirect works correctly

3. **Review Support Email**
   - Ensure team@leansporty.com is monitored
   - Set up auto-reply if needed
   - Google may send test emails

### Low Priority (Nice to Have)

1. **Add App Description**
   - In OAuth consent screen, add clear description
   - Example: "LeanSporty provides live fitness classes and workout tracking to help you stay active and healthy."

2. **Add Demo Video** (if available)
   - Short video showing app functionality
   - Helps reviewers understand the app

---

## Pre-Launch Testing

### Test Your OAuth Flow

1. **Clear browser cookies and cache**

2. **Visit:** `https://leansporty.com`

3. **Click:** "Sign in"

4. **Click:** "Continue with Google"

5. **Verify OAuth Consent Screen Shows:**
   - App name: "LeanSporty"
   - Your logo (if uploaded)
   - Developer: Your developer email
   - Scopes: Email, Profile
   - Privacy Policy link
   - Terms of Service link

6. **Complete sign-in**

7. **Verify:**
   - Redirected to `/activity` page
   - User email shown in header
   - Can access Settings page
   - Can sign out

---

## Domain Verification Guide

### Step-by-Step: Verify leansporty.com in Search Console

#### Method 1: DNS TXT Record (Recommended)

1. **Go to Google Search Console**
   - https://search.google.com/search-console

2. **Add Property**
   - Click "Add property"
   - Select "Domain" (not URL prefix)
   - Enter: `leansporty.com`
   - Click "Continue"

3. **Copy DNS TXT Record**
   - Google provides a TXT record like:
   - `google-site-verification=abcdef123456...`

4. **Add to DNS Provider**
   - Go to your DNS provider (Cloudflare, Namecheap, etc.)
   - Add new TXT record:
     - Type: TXT
     - Name: @ (or leave blank)
     - Value: `google-site-verification=abcdef123456...`
     - TTL: Auto or 3600

5. **Wait and Verify**
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify" in Search Console
   - ✅ Domain is now verified!

#### Method 2: HTML File Upload

1. **Download verification file** from Search Console

2. **Upload to website**
   ```
   https://leansporty.com/google-verification-file.html
   ```

3. **Click "Verify"** in Search Console

#### Method 3: HTML Meta Tag

1. **Copy meta tag** from Search Console

2. **Add to homepage** `<head>` section:
   ```html
   <meta name="google-site-verification" content="..." />
   ```

3. **Deploy changes**

4. **Click "Verify"** in Search Console

---

## Monitoring Review Status

### Where to Check Status

1. **Google Cloud Console**
   - Go to: APIs & Services → OAuth consent screen
   - Check "Publishing status"
   - Check "Verification status"

2. **Email**
   - Monitor team@leansporty.com
   - Google sends updates via email

3. **Review Timeline**
   - Initial review: 4-6 weeks
   - May request additional information
   - Respond promptly to any Google requests

---

## What to Do While Waiting

### During Review (4-6 weeks)

**Your OAuth is still functional:**
- ✅ Users can sign in with Google (with "unverified" warning)
- ✅ All features work normally
- ✅ No action needed from you

**Continue development:**
- Build new features
- Monitor user feedback
- Track sign-up metrics

**Prepare for approval:**
- Plan marketing campaign
- Prepare announcement
- Update user communications

---

## After Approval

### When Google Approves

**You'll receive email notification:**
- Subject: "Your OAuth consent screen has been verified"
- App status changes to "Published"

**Changes for users:**
- ✅ No more "unverified app" warning
- ✅ Clean, professional consent screen
- ✅ Better conversion rates
- ✅ Increased user trust

**Post-Approval Actions:**
1. Test OAuth flow again
2. Verify warning is gone
3. Announce to users (if desired)
4. Monitor sign-up rates

---

## If Review is Rejected

### Common Reasons & Fixes

#### Rejection: "Privacy Policy doesn't meet requirements"

**Fix:**
1. Review Google's feedback email
2. Update iubenda privacy policy
3. Ensure all required sections covered
4. Resubmit for review

#### Rejection: "Domain verification failed"

**Fix:**
1. Complete Google Search Console verification
2. Ensure leansporty.com is verified
3. Wait 24 hours
4. Resubmit for review

#### Rejection: "App name is misleading"

**Fix:**
1. Use exact app name: "LeanSporty"
2. Don't include generic terms like "Official" or "App"
3. Match name across all platforms
4. Resubmit for review

---

## Quick Reference

### Important URLs to Test

```bash
# Homepage
curl -I https://leansporty.com
# Expected: HTTP/2 200

# Privacy Policy
curl -I https://leansporty.com/privacy
# Expected: HTTP/2 200

# Terms of Service
curl -I https://leansporty.com/terms
# Expected: HTTP/2 200

# OAuth Callback
curl -I https://rpizmtynhqtzanirtpab.supabase.co/auth/v1/callback
# Expected: HTTP/2 3xx (redirect is OK)
```

### Key Email Addresses

- **Developer Contact:** team@leansporty.com
- **Support Email:** team@leansporty.com
- **Privacy Inquiries:** team@leansporty.com

### OAuth Configuration

- **App Name:** LeanSporty
- **Scopes:** email, profile, openid
- **Redirect URI:** https://rpizmtynhqtzanirtpab.supabase.co/auth/v1/callback

---

## Checklist Summary

### Must Have (Critical)

- [x] Privacy Policy at /privacy
- [x] Terms of Service at /terms
- [x] Homepage at leansporty.com
- [ ] Domain verified in Search Console
- [x] Valid HTTPS certificates
- [x] Only basic OAuth scopes requested
- [x] App name consistent everywhere
- [ ] Developer email monitored

### Should Have (Important)

- [ ] App logo uploaded (120x120px)
- [ ] App description added
- [ ] OAuth flow tested end-to-end
- [ ] All URLs return HTTP 200
- [ ] Privacy Policy covers all requirements

### Nice to Have (Optional)

- [ ] Demo video
- [ ] Detailed app description
- [ ] Support documentation linked

---

## Contact & Support

**If review is delayed or rejected:**

- **Google OAuth Support:** https://support.google.com/cloud/
- **LeanSporty Support:** team@leansporty.com

**This documentation:**
- File: `/docs/google-oauth-review-checklist.md`
- Last Updated: December 25, 2024

---

## Related Documentation

- [Account Settings & Deletion](./account-settings-deletion.md)
- [Privacy Policy](../app/privacy/page.tsx)
- [Terms of Service](../app/terms/page.tsx)
- [Google OAuth Console](https://console.cloud.google.com/apis/credentials/consent)
- [Google Search Console](https://search.google.com/search-console)
