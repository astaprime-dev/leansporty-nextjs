# Implementation Plan: Apple Sign In for LeanSporty Web

## Overview
Replace email/password authentication with Apple Sign In to match the iOS app. Users will sign in with Apple OAuth, sharing the same Supabase accounts as the iOS Swift app.

## Context
- Supabase is already fully integrated with Apple OAuth provider configured (used by iOS app)
- Current auth uses email/password with sign-in, sign-up, and forgot password flows
- After successful login, users redirect to `/workouts` page
- Pink-themed UI using shadcn/ui components

## Implementation Steps

### 0. Save Implementation Plan
**Create:** `docs/apple-signin-implementation.md`

Create a `docs` folder in the project root and save this implementation plan there for future reference. This ensures the plan is version controlled and accessible to the team.

```bash
mkdir -p docs
# Save this plan to docs/apple-signin-implementation.md
```

### 1. Add Apple Sign In Server Action
**File:** `app/actions.ts`

Add new server action to initiate Apple OAuth flow:

```typescript
export const signInWithAppleAction = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect(data.url);
};
```

### 2. Replace Sign-In Page with Apple Sign In
**File:** `app/(auth-pages)/sign-in/page.tsx`

Replace entire email/password form with clean Apple Sign In UI:
- Remove email/password inputs and labels
- Remove "Sign up" and "Forgot Password" links
- Add Apple Sign In button (black, matches Apple branding)
- Keep FormMessage for error display
- Maintain pink gradient branding on title
- Center layout with legal disclaimer

### 3. Update Sign-Up Page to Redirect
**File:** `app/(auth-pages)/sign-up/page.tsx`

Since Apple OAuth handles both sign-in and sign-up automatically:
```typescript
import { redirect } from "next/navigation";
export default async function Signup() {
  redirect("/sign-in");
}
```

### 4. Update Callback Route Default Redirect
**File:** `app/auth/callback/route.ts`

Change default redirect from `/protected` to `/workouts` (line 23):
```typescript
return NextResponse.redirect(`${origin}/workouts`);
```

Add error handling for failed OAuth exchanges:
```typescript
if (code) {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }
}
```

### 5. Clean Up Unused Auth Actions
**File:** `app/actions.ts`

Remove or comment out (for potential legacy users):
- `signUpAction` - No longer needed with OAuth
- `signInAction` - Replaced by `signInWithAppleAction`
- `forgotPasswordAction` - Apple handles account recovery
- `resetPasswordAction` - Not applicable with OAuth

Keep:
- `signOutAction` - Still needed for logout

### 6. Remove Forgot Password Page
**File:** `app/(auth-pages)/forgot-password/page.tsx`

Delete this page entirely or redirect to `/sign-in` since Apple OAuth handles password recovery.

### 7. Environment Variables

**Local Development (`npm run dev`):**
Already configured! Your `.env.local` file has the required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No changes needed for local development.

**Vercel Deployment:**
Add these environment variables in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://rpizmtynhqtzanirtpab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key-from-.env.local]
```

**Steps:**
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` (copy value from `.env.local`)
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` (copy value from `.env.local`)
4. Apply to Production, Preview, and Development environments
5. Redeploy the app after adding variables

**Note:** No Apple-specific environment variables needed - Apple OAuth is configured in Supabase dashboard, not in app environment.

## Critical Files to Modify

1. `/Users/antonbondarenko/dev/LeanSporty/leansporty.com/app/actions.ts` - Add `signInWithAppleAction`, remove unused actions
2. `/Users/antonbondarenko/dev/LeanSporty/leansporty.com/app/(auth-pages)/sign-in/page.tsx` - Replace with Apple Sign In UI
3. `/Users/antonbondarenko/dev/LeanSporty/leansporty.com/app/(auth-pages)/sign-up/page.tsx` - Redirect to sign-in
4. `/Users/antonbondarenko/dev/LeanSporty/leansporty.com/app/auth/callback/route.ts` - Update redirect to `/workouts`, add error handling
5. `/Users/antonbondarenko/dev/LeanSporty/leansporty.com/app/(auth-pages)/forgot-password/page.tsx` - Delete or redirect

## Testing Checklist

- [ ] New user clicks "Continue with Apple" → Apple consent → Callback → `/workouts`
- [ ] Returning user clicks "Continue with Apple" → Quick verification → `/workouts`
- [ ] Unauthenticated user tries to access `/workouts` → Redirects to `/sign-in`
- [ ] User cancels at Apple screen → Returns to sign-in page
- [ ] Sign out works correctly → Redirects to `/sign-in`
- [ ] Mobile Safari popup blockers don't interfere with OAuth flow
- [ ] Vercel deployment has correct environment variables

## Design Notes

- Apple button: Black background with white text (Apple brand guidelines)
- Page title: Pink gradient (`from-pink-500 to-rose-400`) to match brand
- Legal disclaimer: Light pink background (`bg-pink-50/50`, `border-pink-100`)
- Centered, minimal layout matching existing auth pages
- Uses lucide-react Apple icon

## User Flow After Implementation

1. User visits `/` (homepage)
2. Clicks navigation to login or is prompted to authenticate
3. Lands on `/sign-in` with single "Continue with Apple" button
4. Clicks button → Redirects to Apple consent screen
5. Approves → Redirects to `/auth/callback` → Exchanges code → Redirects to `/workouts`
6. User sees their workouts and progress (shared with iOS app)
