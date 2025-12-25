# Account Settings & Account Deletion

## Overview

LeanSporty provides users with a dedicated account settings page where they can view their account information and permanently delete their account if desired. The implementation balances user privacy rights (GDPR compliance) with business analytics needs by anonymizing workout data rather than completely removing it.

**Last Updated:** December 25, 2024

---

## Features

### Account Information Display
- User email address
- Sign-in provider (Google or Apple)
- Account creation date

### Account Deletion
- One-click account deletion with confirmation
- Smart data handling: removes PII, preserves analytics
- Automatic sign-out and redirection
- Clear communication about what gets deleted vs. preserved

---

## User Flow

### Accessing Account Settings

1. **Sign in** to LeanSporty with Google or Apple
2. **Click "Settings"** in the navigation header (appears only when authenticated)
3. **View account information** on the settings page

### Deleting an Account

1. **Navigate to Settings** page at `/settings`
2. **Scroll to "Danger Zone"** section (red-bordered card)
3. **Click "Delete My Account"** button
4. **Review confirmation dialog** explaining what will happen
5. **Choose:**
   - **Cancel** - No changes made, dialog closes
   - **Yes, delete my account** - Deletion proceeds
6. **Account deleted:**
   - Workout history anonymized
   - Enrollments and chat messages removed
   - Auth account deleted
   - User signed out
   - Redirected to homepage with confirmation message

---

## Data Handling Strategy

### What Gets Deleted

| Data Type | Action | Reason |
|-----------|--------|--------|
| `auth.users` record | **Deleted** | User account removal |
| `stream_enrollments` | **Deleted** (CASCADE) | User-specific enrollment data |
| `stream_chat_messages` | **Deleted** (CASCADE) | User-specific chat data |
| Session cookies | **Cleared** | User signed out |

### What Gets Anonymized

| Data Type | Action | Reason |
|-----------|--------|--------|
| `workout_sessions.user_id` | **Set to NULL** | Preserves workout metrics for analytics while removing PII |

### What Remains Unchanged

| Data Type | Action | Reason |
|-----------|--------|--------|
| `workouts` table | **Unchanged** | Content catalog, not user-specific |
| `live_stream_sessions` | **Unchanged** | Instructor content, not user-specific |

---

## Technical Implementation

### Architecture

**Frontend:**
- Server Component: `/app/settings/page.tsx` (protected route)
- Client Component: `/components/delete-account-button.tsx` (interactive dialog)

**Backend:**
- Server Action: `deleteAccountAction` in `/app/actions.ts`
- Database: Supabase (PostgreSQL with Supabase Auth)

**UI Components:**
- AlertDialog from shadcn/ui for confirmation
- Pink gradient branding matching app design

### File Structure

```
app/
├── settings/
│   └── page.tsx                    # Account settings page (Server Component)
├── actions.ts                       # Server actions (includes deleteAccountAction)

components/
├── delete-account-button.tsx        # Delete confirmation dialog (Client Component)
├── header-nav.tsx                   # Navigation with Settings link
└── ui/
    └── alert-dialog.tsx             # shadcn/ui AlertDialog component

docs/
└── account-settings-deletion.md     # This documentation file
```

---

## Code Implementation Details

### 1. Account Settings Page

**File:** `/app/settings/page.tsx`

**Purpose:** Display user account information with protected route access.

**Key Features:**
- Authentication check (redirects to `/` if not authenticated)
- Fetches user data from Supabase Auth
- Displays email, provider, and account creation date
- Renders DeleteAccountButton component

**Code Snippet:**
```typescript
export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const provider = user.app_metadata?.provider || 'Unknown';
  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // ... render UI
}
```

---

### 2. Delete Account Button

**File:** `/components/delete-account-button.tsx`

**Purpose:** Provide confirmation dialog before account deletion.

**Key Features:**
- Client component (uses React state for loading)
- AlertDialog for confirmation (prevents accidental deletion)
- Clear warning message about permanence
- Loading state during deletion

**Code Snippet:**
```typescript
export function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteAccountAction();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete My Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Confirmation dialog UI */}
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### 3. Delete Account Server Action

**File:** `/app/actions.ts`

**Purpose:** Handle account deletion server-side with proper data cleanup.

**Implementation Steps:**

1. **Authenticate user**
   ```typescript
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();

   if (!user) {
     return encodedRedirect("error", "/", "Not authenticated");
   }
   ```

2. **Anonymize workout sessions**
   ```typescript
   await supabase
     .from('workout_sessions')
     .update({ user_id: null })
     .eq('user_id', user.id);
   ```

3. **Delete user account** (triggers CASCADE deletes)
   ```typescript
   await supabase.rpc('delete_user');
   ```

4. **Sign out and redirect**
   ```typescript
   await supabase.auth.signOut();
   return redirect("/?message=Account successfully deleted");
   ```

**Error Handling:**
- Falls back to sign-out if deletion fails
- Logs errors for debugging
- Shows user-friendly error messages

---

### 4. Navigation Integration

**File:** `/components/header-nav.tsx`

**Change:** Added Settings link to authenticated user navigation.

**Code:**
```typescript
{user && (
  <>
    <Link href="/activity">Activity</Link>
    <Link href="/workouts">Workouts</Link>
    <Link href="/settings">Settings</Link>
  </>
)}
```

---

## Database Schema Relationships

### CASCADE Deletes

The following tables have `ON DELETE CASCADE` foreign keys to `auth.users(id)`:

```sql
-- stream_enrollments
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE

-- stream_chat_messages
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**Effect:** When a user is deleted from `auth.users`, these records are automatically removed.

### Manual Cleanup

The `workout_sessions` table does NOT have CASCADE delete:

```sql
-- workout_sessions
user_id UUID NULL REFERENCES auth.users(id)
```

**Reason:** We want to preserve workout metrics for analytics.

**Solution:** Set `user_id` to NULL before deleting the user:

```typescript
await supabase
  .from('workout_sessions')
  .update({ user_id: null })
  .eq('user_id', user.id);
```

---

## Security & Privacy

### GDPR Compliance

✅ **Right to Access:** Users can view their account information at `/settings`

✅ **Right to Erasure (Right to be Forgotten):**
- Personal identifiable information (email, auth credentials) deleted
- User can no longer access the account
- Workout sessions anonymized (no link to user identity)

✅ **Transparency:**
- Clear communication in UI about what gets deleted
- Clear communication about what gets preserved for analytics

### Authentication Protection

**Route Protection:**
```typescript
if (!user) {
  return redirect("/");
}
```

**Action Protection:**
```typescript
if (!user) {
  return encodedRedirect("error", "/", "Not authenticated");
}
```

Only authenticated users can:
- Access `/settings` page
- Execute `deleteAccountAction`

---

## Testing

### Manual Testing Checklist

#### Account Settings Page
- [ ] Sign in with Google
- [ ] Navigate to `/settings`
- [ ] Verify email displays correctly
- [ ] Verify provider shows "google"
- [ ] Verify account creation date is accurate
- [ ] Sign out and verify redirect to home
- [ ] Access `/settings` while logged out - should redirect to home

#### Account Settings Page (Apple)
- [ ] Sign in with Apple
- [ ] Navigate to `/settings`
- [ ] Verify provider shows "apple"
- [ ] All other fields display correctly

#### Account Deletion Flow
- [ ] Click "Delete My Account" button
- [ ] Verify confirmation dialog appears
- [ ] Read dialog message
- [ ] Click "Cancel" - verify nothing happens
- [ ] Click "Delete My Account" again
- [ ] Click "Yes, delete my account"
- [ ] Verify loading state shows ("Deleting...")
- [ ] Verify redirect to homepage
- [ ] Verify success message appears
- [ ] Try to sign in again with same provider - should create new account

#### Database Verification
After deleting a test account:
- [ ] Check `auth.users` - user record should be gone
- [ ] Check `workout_sessions` - old records should have `user_id = NULL`
- [ ] Check `stream_enrollments` - old enrollments should be deleted
- [ ] Check `stream_chat_messages` - old chat messages should be deleted

#### Error Handling
- [ ] Test with network disconnected (should show error)
- [ ] Test fallback behavior if deletion fails
- [ ] Verify user is signed out even if deletion partially fails

---

## User Interface Design

### Settings Page Layout

```
┌─────────────────────────────────────────┐
│         Account Settings                │
│    (pink gradient heading)              │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Account Information           │    │
│  │                                │    │
│  │  Email: user@example.com       │    │
│  │  Sign-in Provider: google      │    │
│  │  Account Created: Dec 25, 2024 │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  ⚠️ Danger Zone                 │    │
│  │  (red border)                  │    │
│  │                                │    │
│  │  Warning text about deletion...│    │
│  │                                │    │
│  │  [Delete My Account] (red btn) │    │
│  └────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Confirmation Dialog

```
┌─────────────────────────────────────────┐
│  Are you absolutely sure?               │
│                                         │
│  This action cannot be undone. This     │
│  will permanently delete your account   │
│  and remove your access to LeanSporty.  │
│  Your workout history will be preserved │
│  for analytics purposes.                │
│                                         │
│         [Cancel]  [Yes, delete ⇒]       │
└─────────────────────────────────────────┘
```

### Visual Design Principles

**Account Information:**
- White background with subtle border
- Gray labels, black text
- Ample spacing for readability

**Danger Zone:**
- Red border (`border-red-200`)
- Red heading (`text-red-600`)
- Red destructive button
- Clear visual separation from safe actions

**Confirmation Dialog:**
- Clear, direct language
- Explains consequences
- Mentions analytics preservation
- Red confirm button for visual warning

---

## Future Enhancements

### Potential Additions

1. **Account Data Export**
   - Download all user data before deletion
   - GDPR "Right to Data Portability"
   - Export format: JSON or CSV

2. **Account Deactivation**
   - Temporary account suspension
   - User can reactivate later
   - Alternative to permanent deletion

3. **Deletion Confirmation Email**
   - Send email after successful deletion
   - Confirm action was completed
   - Provide support contact if accidental

4. **Scheduled Deletion**
   - Grace period (e.g., 7 days)
   - User can cancel within grace period
   - Auto-delete after period expires

5. **Enhanced Analytics Preservation**
   - Hash user_id instead of NULL
   - Maintain relational integrity
   - Still prevent user identification

6. **Admin Dashboard**
   - View deletion requests
   - Audit trail of deletions
   - Compliance reporting

---

## API Reference

### Server Actions

#### `deleteAccountAction()`

**Purpose:** Delete the current authenticated user's account.

**Authentication:** Required (checks `supabase.auth.getUser()`)

**Parameters:** None (uses current session)

**Returns:**
- Success: Redirect to `/?message=Account successfully deleted`
- Fallback: Redirect to `/?message=Account removal initiated`
- Error: Redirect to `/settings?error=Failed to delete account data`

**Side Effects:**
1. Sets `workout_sessions.user_id` to NULL for user's records
2. Deletes user from `auth.users` (triggers CASCADE deletes)
3. Signs out user (clears session)

**Example Usage:**
```typescript
import { deleteAccountAction } from "@/app/actions";

// In a form or button handler
await deleteAccountAction();
```

---

## Troubleshooting

### Common Issues

#### Issue: "Failed to delete account data" error

**Cause:** Database permission issue or connection failure

**Solution:**
1. Check Supabase connection status
2. Verify RLS policies allow user to update their own records
3. Check server logs for specific error

#### Issue: User not redirected after deletion

**Cause:** Redirect middleware interference

**Solution:**
1. Check middleware.ts configuration
2. Verify OAuth callback handling
3. Test with different browsers

#### Issue: Workout sessions not anonymized

**Cause:** Database query failed silently

**Solution:**
1. Check `workout_sessions` table exists
2. Verify `user_id` column is nullable
3. Check server logs for Supabase errors

#### Issue: CASCADE deletes not working

**Cause:** Foreign key constraints not set up correctly

**Solution:**
1. Run migration: `supabase/migrations/20250101000000_live_streaming_complete.sql`
2. Verify `ON DELETE CASCADE` on foreign keys
3. Check Supabase dashboard → Database → Tables

---

## Migration Notes

### Database Changes Required

**None required** - Uses existing schema with ON DELETE CASCADE constraints.

### Environment Variables

**None required** - Uses existing Supabase configuration.

### Deployment Checklist

- [x] Code deployed to production
- [ ] Test account deletion flow in production
- [ ] Verify database CASCADE deletes work
- [ ] Monitor error logs for any issues
- [ ] Update privacy policy if needed (mention data retention for analytics)

---

## Support & Maintenance

### Monitoring

**Key Metrics to Track:**
- Number of account deletions per month
- Success rate of deletion operations
- Time to complete deletion
- Errors during deletion process

**Logging:**
```typescript
console.error('Error anonymizing workout sessions:', sessionsError);
console.error('Error deleting user:', deleteError);
console.error('Account deletion error:', error);
```

### User Support

**If user reports deletion issues:**

1. **Verify deletion status:**
   - Check if user still exists in `auth.users`
   - Check if workout sessions were anonymized
   - Check if enrollments were removed

2. **Manual cleanup (if needed):**
   ```sql
   -- Anonymize workout sessions
   UPDATE workout_sessions
   SET user_id = NULL
   WHERE user_id = '<user-uuid>';

   -- Delete enrollments
   DELETE FROM stream_enrollments
   WHERE user_id = '<user-uuid>';

   -- Delete chat messages
   DELETE FROM stream_chat_messages
   WHERE user_id = '<user-uuid>';

   -- Delete user
   -- Use Supabase dashboard Auth section
   ```

3. **Contact:**
   - Email: team@leansporty.com
   - Document the issue in support ticketing system

---

## Related Documentation

- [Apple Sign-In Implementation](./apple-signin-implementation.md)
- [Supabase Apple OAuth Setup](./supabase-apple-oauth-setup.md)
- [Privacy Policy](../app/privacy/page.tsx)
- [Terms of Service](../app/terms/page.tsx)

---

## Changelog

### December 25, 2024 - Initial Implementation
- Created account settings page at `/settings`
- Implemented account deletion with data anonymization
- Added confirmation dialog for destructive action
- Integrated Settings link into navigation
- Added comprehensive documentation

---

## Credits

**Developed for:** LeanSporty (Astaprime Sp. z o.o.)

**Technologies Used:**
- Next.js 16.1.1 (App Router)
- Supabase (Auth & Database)
- shadcn/ui (UI Components)
- Tailwind CSS (Styling)

**Contact:** team@leansporty.com
