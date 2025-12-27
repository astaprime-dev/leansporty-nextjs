# Database Architecture

## Overview

LeanSporty uses a **four-table user architecture** that separates concerns between identity, fitness tracking, instructor-specific data, and user-generated content.

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.users                               │
│                    (Supabase Auth)                              │
└─────────────────────────────────────────────────────────────────┘
         │                │                │                │
         │ (1:1)          │ (1:0..1)       │ (1:0..1)      │ (1:many)
         │ MANDATORY      │ OPTIONAL       │ OPTIONAL      │
         ▼                ▼                ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│user_profiles │  │  profiles   │  │ instructors  │  │stream_comments│
│              │  │             │  │              │  │              │
│ IDENTITY     │  │  TRACKING   │  │  INSTRUCTOR  │  │   REVIEWS    │
│ Everyone     │  │  Optional   │  │   Optional   │  │    Many      │
└──────────────┘  └─────────────┘  └──────────────┘  └──────────────┘
```

---

## Table 1: `user_profiles`

**Purpose:** Universal identity for all users - display names, avatars, bios, social links

**Relationship:** 1:1 with `auth.users` (MANDATORY - auto-created on signup)

### Schema

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity (required)
  display_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,

  -- Profile (optional)
  bio TEXT,
  profile_photo_url TEXT,
  location VARCHAR(255),

  -- Social (optional)
  instagram_handle VARCHAR(255),
  website_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT user_profiles_username_format CHECK (username ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

### Used By
- Comments (display names for comment authors)
- Viewer lists (show who's watching streams)
- Public profile pages (`/@username`)
- Settings page
- Instructor public profiles (for display data)

### Auto-Creation
Every new user gets a `user_profiles` entry automatically via database trigger:

```sql
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_profile();
```

---

## Table 2: `profiles`

**Purpose:** Customer fitness tracking data (iOS app)

**Relationship:** 1:0..1 with `auth.users` (OPTIONAL)

### Schema

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- = auth.users.id
  weight_kg NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Used By
- iOS app (weight tracking)
- Future: fitness goals, body measurements, etc.

### Important
**DO NOT MODIFY** - iOS app depends on this structure. This table exists independently of the web platform.

---

## Table 3: `instructors`

**Purpose:** Instructor-specific data (minimal - just the slug)

**Relationship:** 1:0..1 with `auth.users` (OPTIONAL)

### Schema

```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instructors_slug ON instructors(slug);
CREATE INDEX idx_instructors_user_id ON instructors(user_id);
```

### Used By
- Instructor pages (`/@slug` routes)
- Gallery items (`instructor_gallery_items.instructor_id`)
- Stream ownership (`live_stream_sessions.instructor_id`)
- Comment replies (`stream_comment_replies.instructor_id`)
- Comment attribution (`stream_comments.instructor_id`)

### Important
Instructors have **TWO** entries:
1. `user_profiles` entry (for display_name, bio, photo, social links)
2. `instructors` entry (for slug and instructor-specific relationships)

To get full instructor data, **JOIN both tables**:

```typescript
// Get instructor profile
const { data: instructor } = await supabase
  .from("instructors")
  .select("id, slug, user_id")
  .eq("slug", "jane-doe")
  .single();

const { data: profile } = await supabase
  .from("user_profiles")
  .select("display_name, bio, profile_photo_url, instagram_handle, website_url")
  .eq("user_id", instructor.user_id)
  .single();

const fullInstructor = { ...instructor, ...profile };
```

### Migration History
Originally `instructors` had duplicate fields (`display_name`, `bio`, `profile_photo_url`, etc.). These were migrated to `user_profiles` in December 2024 to establish a single source of truth for identity data.

**Migration**: `20251227_cleanup_instructors_table.sql`

---

## Table 4: `stream_comments`

**Purpose:** User reviews/feedback on streams

**Relationship:** 1:many with `auth.users`

### Schema

```sql
CREATE TABLE stream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_stream_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES stream_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,

  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment_text TEXT CHECK (length(comment_text) <= 300),
  is_hidden BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT stream_comments_stream_id_user_id_key UNIQUE (stream_id, user_id)
);

CREATE INDEX idx_comments_instructor ON stream_comments(instructor_id, created_at DESC);
CREATE INDEX idx_comments_stream ON stream_comments(stream_id);
```

### Used By
- Stream watch pages (show reviews)
- Instructor broadcast pages (manage comments)
- Instructor public profiles (showcase reviews)

### Important - Instructor ID
Comments store `instructor_id` to enable showcasing reviews on instructor public profiles without requiring JOIN through streams table.

**Fetching instructor reviews:**

```typescript
// Get comments for an instructor's profile
const { data: comments } = await supabase
  .from("stream_comments")
  .select("id, star_rating, comment_text, created_at, user_id")
  .eq("instructor_id", instructorId)
  .eq("is_hidden", false)
  .order("created_at", { ascending: false });

// Then fetch commenter profiles separately
const userIds = comments.map(c => c.user_id);
const { data: profiles } = await supabase
  .from("user_profiles")
  .select("user_id, display_name, profile_photo_url")
  .in("user_id", userIds);

// Merge in code
const profileMap = new Map(profiles.map(p => [p.user_id, p]));
const commentsWithProfiles = comments.map(c => ({
  ...c,
  user_profiles: profileMap.get(c.user_id)
}));
```

**Migration**: `20251227_add_instructor_to_comments.sql`

---

## Common Patterns

### Pattern 1: Create New User (Auto)

**Trigger handles this automatically:**

```sql
-- Triggered on auth.users INSERT
INSERT INTO user_profiles (user_id, display_name, username)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
  generate_unique_username()
);
```

### Pattern 2: Promote User to Instructor

```typescript
// 1. user_profiles entry already exists (auto-created)

// 2. Update display data in user_profiles
await supabase
  .from('user_profiles')
  .update({
    display_name: "Jane Doe",
    bio: "Yoga instructor",
    profile_photo_url: "https://...",
    instagram_handle: "janedoeyoga",
  })
  .eq('user_id', userId);

// 3. Create instructors entry with slug
await supabase
  .from('instructors')
  .insert({
    user_id: userId,
    slug: "jane-doe"
  });
```

### Pattern 3: Display User Anywhere

```typescript
// Single query - works for ALL users (instructors and non-instructors)
const { data: profile } = await supabase
  .from('user_profiles')
  .select('display_name, profile_photo_url')
  .eq('user_id', userId)
  .single();

// profile.display_name - ALWAYS available
// profile.profile_photo_url - may be null
```

### Pattern 4: Update Instructor Profile

```typescript
// Update BOTH tables
await supabase
  .from('user_profiles')
  .update({
    display_name: newName,
    bio: newBio,
    // ... other display fields
  })
  .eq('user_id', userId);

await supabase
  .from('instructors')
  .update({ slug: newSlug })
  .eq('user_id', userId);
```

### Pattern 5: Get Streams with Instructor Info

```typescript
// 1. Fetch streams with instructor IDs
const { data: streams } = await supabase
  .from('live_stream_sessions')
  .select(`
    *,
    instructor:instructors(id, slug, user_id)
  `)
  .eq('status', 'live');

// 2. Fetch instructor profiles separately
const instructorUserIds = streams.map(s => s.instructor.user_id);
const { data: profiles } = await supabase
  .from('user_profiles')
  .select('user_id, display_name, profile_photo_url')
  .in('user_id', instructorUserIds);

// 3. Merge in code
const profileMap = new Map(profiles.map(p => [p.user_id, p]));
const streamsWithInstructors = streams.map(s => ({
  ...s,
  instructor: {
    ...s.instructor,
    display_name: profileMap.get(s.instructor.user_id)?.display_name,
    profile_photo_url: profileMap.get(s.instructor.user_id)?.profile_photo_url,
  }
}));
```

**Why not nested joins?** Supabase PostgREST requires explicit foreign key constraints for nested selects. Since `stream_comments.user_id` and `instructors.user_id` both reference `auth.users.id` (not `user_profiles.user_id`), we fetch and merge separately.

---

## Design Decisions

### Why Four Tables?

**✅ Clear separation of concerns**
- Identity (`user_profiles`) - everyone has this
- Tracking (`profiles`) - optional for iOS users
- Instructor (`instructors`) - optional for instructors only
- Content (`stream_comments`) - many per user

**✅ No breaking changes**
- iOS app untouched (`profiles.weight_kg` stays)
- Instructor gallery untouched (still references `instructors.id`)
- Streams untouched (still reference `instructors.id`)

**✅ Scalable**
- Easy to add fields to any table
- Clear where each field belongs
- No god-table anti-pattern

**✅ Mandatory identity**
- Every user MUST have `user_profiles` entry
- No more "Unknown User"
- Auto-created on signup

### Why Separate Fetch + Merge Pattern?

**Problem:** Supabase nested selects require explicit foreign key constraints:
```typescript
// This FAILS without FK from stream_comments.user_id to user_profiles
.select('*, user_profiles!inner(display_name)')
```

**Solution:** Fetch separately and merge in code:
```typescript
// 1. Fetch comments
const comments = await getComments();

// 2. Fetch profiles
const profiles = await getUserProfiles(userIds);

// 3. Merge using Map (O(n) performance)
const merged = comments.map(c => ({
  ...c,
  user_profiles: profileMap.get(c.user_id)
}));
```

**Benefits:**
- No dependency on FK constraints
- Works with any relationship structure
- More explicit and maintainable
- Same performance (2 queries vs 1 JOIN in database)

---

## Migration Timeline

### December 27, 2024

1. **`20251227_create_user_profiles.sql`**
   - Created `user_profiles` table
   - Added auto-creation trigger for new signups
   - Migrated existing instructor data
   - Backfilled all auth.users with profiles

2. **`20251227_add_instructor_to_comments.sql`**
   - Added `instructor_id` column to `stream_comments`
   - Backfilled from `live_stream_sessions.instructor_id`
   - Added index for instructor profile queries

3. **`20251227_remove_birthday_column.sql`**
   - Removed unused `birthday` field from `user_profiles`

4. **`20251227_cleanup_instructors_table.sql`**
   - Removed duplicate fields from `instructors` table:
     - `display_name` → moved to `user_profiles`
     - `bio` → moved to `user_profiles`
     - `profile_photo_url` → moved to `user_profiles`
     - `instagram_handle` → moved to `user_profiles`
     - `website_url` → moved to `user_profiles`
   - **Final structure:** `id`, `user_id`, `slug`, `created_at`, `updated_at`

---

## Critical Files Reference

### Identity Queries
- `app/[username]/page.tsx` - Public profile pages (JOIN instructors + user_profiles)
- `app/settings/page.tsx` - User settings (load user_profiles)
- `components/user-profile-form.tsx` - Profile editing

### Instructor Management
- `lib/instructor-roles.ts` - Grant/revoke instructor role
- `components/instructor/profile-form.tsx` - Instructor profile editing (saves to BOTH tables)
- `app/instructor/(dashboard)/profile/page.tsx` - Load instructor profile (from BOTH tables)

### Stream Display
- `app/actions.ts` - `getStreams()` function (fetch + merge pattern)
- `components/stream-card.tsx` - Display instructor info
- `app/streams/[id]/watch/page.tsx` - Stream watch page

### Comments
- `app/api/comments/create/route.ts` - Create comment (populates instructor_id)
- `app/api/comments/list/route.ts` - List comments (fetch + merge user_profiles)
- `components/stream/comment-list.tsx` - Display comments with user info

---

## Troubleshooting

### "Unknown User" in comments
**Cause:** Query is not fetching `user_profiles` for commenters
**Fix:** Use fetch + merge pattern (see Pattern 5 above)

### Missing instructor display_name/photo
**Cause:** Code is querying `instructors` table for display fields (removed in cleanup)
**Fix:** JOIN with `user_profiles` on `instructors.user_id`

### Profile not auto-created on signup
**Cause:** Trigger may not be installed
**Fix:** Run migration `20251227_create_user_profiles.sql` again

### Supabase nested select fails
**Cause:** Missing foreign key constraint or incorrect FK name
**Fix:** Use separate queries + merge pattern instead

---

## Future Considerations

### Potential Additions

**user_profiles:**
- `timezone` - User's timezone for scheduling
- `language` - Preferred language
- `notification_preferences` - JSONB field

**profiles (fitness tracking):**
- `fitness_goals` - TEXT
- `body_measurements` - JSONB
- `activity_level` - ENUM

**instructors:**
- `certification_urls` - TEXT[] (array of certification links)
- `specialties` - TEXT[] (yoga, pilates, HIIT, etc.)
- `hourly_rate` - NUMERIC (for 1:1 sessions)

### Not Recommended

❌ **DO NOT** add display fields to `instructors` table
- Use `user_profiles` for ALL identity data
- Single source of truth prevents inconsistencies

❌ **DO NOT** merge tables back into a single `profiles` table
- Separation of concerns is intentional
- iOS app compatibility requires separate `profiles` table

---

## Summary

**One Source of Truth:** `user_profiles` contains ALL user identity data

**Instructors = Regular Users + Special Attributes:**
- All instructors have `user_profiles` (display data)
- Some users have `instructors` entry (slug + relationships)

**Fetch + Merge Pattern:** When Supabase joins fail, fetch separately and merge in code

**Auto-Creation:** Every signup creates `user_profiles` automatically

**Clean Architecture:** Four tables, each with single clear purpose
