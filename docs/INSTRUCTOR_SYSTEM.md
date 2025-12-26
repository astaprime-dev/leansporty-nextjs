# Instructor System Documentation

## Overview

The Lean Sporty platform features a comprehensive instructor system that allows certified instructors to create and manage live streaming fitness sessions. Instructors have premium visual styling, dedicated dashboards, and public profile pages.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Database Schema](#database-schema)
3. [Profile Systems](#profile-systems)
4. [Visual Differentiation](#visual-differentiation)
5. [Instructor Dashboard](#instructor-dashboard)
6. [Live Streaming](#live-streaming)
7. [Public Profiles](#public-profiles)
8. [Mobile Responsiveness](#mobile-responsiveness)

---

## Authentication & Authorization

### Invite-Based System

Instructors gain access through an invite-only token system:

- **Initial Access**: Instructors must enter the `INSTRUCTOR_ACCESS_TOKEN` (from `.env`) on the `/instructor/login` page
- **Token Storage**: Token is stored in cookies for session persistence
- **Profile Creation**: After token validation, instructors create their profile at `/instructor/profile`
- **Role Verification**: Once profile exists, authorization is based on profile existence, not token

### Authentication Flow

```
1. User logs in with OAuth (Google/Apple) → Regular user access
2. User navigates to /instructor/login (footer link)
3. User enters instructor access token
4. Token validated → cookie set
5. Redirect to /instructor (dashboard)
6. If no profile → redirect to /instructor/profile
7. Create profile → Full instructor access granted
```

### Authorization Checks

```typescript
// Check if user has instructor profile
const { data: instructorProfile } = await supabase
  .from("instructors")
  .select("id")
  .eq("user_id", user.id)
  .single();

const isInstructor = !!instructorProfile;
```

**Key Locations:**
- `app/instructor/(dashboard)/layout.tsx` - Route protection
- `app/api/instructor/*/route.ts` - API endpoint protection
- `components/header-nav.tsx` - Navigation visibility
- `components/header-auth.tsx` - Avatar styling

---

## Database Schema

### Instructors Table

```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  instagram_handle TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
-- Public can view all instructors
CREATE POLICY "Instructors are viewable by everyone"
  ON instructors FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own instructor profile"
  ON instructors FOR UPDATE
  USING (auth.uid() = user_id);
```

### User Profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  location TEXT,
  birthday DATE,
  instagram_handle TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Similar RLS policies as instructors
```

### Key Differences

| Feature | Instructors | User Profiles |
|---------|-------------|---------------|
| URL slug | `slug` | `username` |
| Public access | `/instructor` routes | `/settings` only |
| Profile URL | `/@slug` | `/@username` |
| Extra fields | - | `location`, `birthday` |
| Visual style | Premium (gradient rings) | Standard |

---

## Profile Systems

### Instructor Profiles

**Creation:** `/instructor/profile`
**Management:** Same page for editing
**Public View:** `/@{slug}`

**Features:**
- Display name (required)
- Auto-generated slug (editable)
- Bio text
- Profile photo URL
- Social links (Instagram, Website)
- Shows upcoming/past streams on public page

**Slug Generation:**
```typescript
// Auto-generates from display name
const slug = displayName
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-');
```

### User Profiles

**Creation/Management:** `/settings` (Public Profile section)
**Public View:** `/@{username}`

**Features:**
- Display name (required)
- Username (required, unique)
- Bio text
- Profile photo URL
- Location
- Birthday
- Social links (Instagram, Website)

### URL Rewrites

```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/@:username',
      destination: '/:username',
    },
  ];
}
```

**Resolution Order:**
1. Check `instructors` table for matching `slug`
2. If not found, check `user_profiles` for matching `username`
3. If neither found, return 404

---

## Visual Differentiation

Instructors have premium visual styling throughout the platform to distinguish them from regular users.

### 1. Gradient Ring Around Avatars

**Profile Pages:**
```tsx
<div className="relative p-1 rounded-full bg-gradient-to-br from-pink-500 via-rose-400 to-pink-500 animate-pulse">
  <Avatar className="h-32 w-32 ring-4 ring-white">
    {/* Avatar content */}
  </Avatar>
</div>
```

**Header Menu:**
```tsx
<div className="relative p-0.5 rounded-full bg-gradient-to-br from-pink-500 via-rose-400 to-pink-500">
  <Avatar className="h-9 w-9 ring-2 ring-white">
    {/* Avatar content */}
  </Avatar>
</div>
```

**Effect:** Animated pulsing gradient border (pink → rose → pink)

### 2. Enhanced Profile Page Background

```tsx
<div className={`min-h-screen ${isInstructor
  ? 'bg-gradient-to-b from-pink-100/40 via-rose-50/30 to-white'
  : 'bg-gradient-to-b from-pink-50/30 to-white'
}`}>
```

**Effect:** Richer, more vibrant gradient background for instructor profiles

### 3. Premium Card Styling

**Profile Header Card:**
```tsx
<div className={`bg-white rounded-2xl border shadow-sm p-8 mb-8 ${isInstructor
  ? 'border-pink-200 shadow-pink-100/50 shadow-lg relative overflow-hidden'
  : 'border-pink-100'
}`}>
  {isInstructor && (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-transparent to-rose-50/60 pointer-events-none" />
  )}
  {/* Card content */}
</div>
```

**Stream Cards:**
```tsx
<div className="bg-white rounded-xl border border-pink-200 hover:border-pink-400 shadow-md hover:shadow-lg hover:shadow-pink-200/50 transition-all p-6 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-pink-50/40 via-transparent to-rose-50/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
  {/* Card content */}
</div>
```

**Effects:**
- Stronger border colors
- Enhanced shadows with pink tint
- Subtle glow overlay
- Premium hover effects

### Visual Indicators Summary

| Location | Regular User | Instructor |
|----------|--------------|------------|
| Profile avatar | Standard | Gradient ring (pulsing) |
| Header avatar | Standard hover | Gradient ring |
| Profile background | Light pink/white | Richer pink gradient |
| Profile card | Simple border | Enhanced shadow + glow |
| Stream cards | Standard | Premium with hover glow |
| Badge | None | "INSTRUCTOR" badge |

---

## Instructor Dashboard

**URL:** `/instructor` (default landing page for instructors)

### Dashboard Features

**Statistics Cards:**
- 📅 Scheduled streams count
- 🔴 Live streams count
- 👥 Total enrollments across all streams
- 💰 Total tokens earned

**Quick Actions:**
- Create New Stream (prominent gradient CTA)
- View Public Profile (opens in new tab)

**Upcoming Streams:**
- Next 3 scheduled/live streams
- Quick links to broadcast page
- Shows enrollment count and token price

**Recent Enrollments:**
- Last 5 enrollments across all streams
- Shows user name and stream title
- Enrollment date

**Profile Completion:**
- Alert if profile incomplete (<100%)
- Prompts to add photo, bio, or social links
- Shows completion percentage

### Navigation

**Main Header:** (visible site-wide)
- Bold "Instructor Dashboard" link

**Dashboard Header:** (visible in `/instructor/*` routes)
- Dashboard
- My Streams
- Create Stream
- My Profile
- View Site (button)

---

## Live Streaming

### Stream Management

**Create Stream:** `/instructor/streams/create`
**View All Streams:** `/instructor/streams`
**Broadcast Page:** `/instructor/streams/{id}/broadcast`

### Stream Properties

```typescript
interface LiveStreamSession {
  id: string;
  instructor_id: string;
  instructor_name: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  scheduled_start_time: string;
  scheduled_duration_seconds: number;
  price_in_tokens: number;
  status: 'scheduled' | 'live' | 'ended';
  total_enrollments: number;
  recording_available: boolean;
  // ... other fields
}
```

### Stream Workflow

1. **Create** → Set title, description, schedule, price
2. **Scheduled** → Shows on instructor profile & streams page
3. **Go Live** → Status changes to "live", appears in "LIVE NOW" section
4. **End Stream** → Status changes to "ended", recording available
5. **Archive** → Appears in instructor's past streams

### Public Streams Page

**URL:** `/streams`

**Sections:**
- 🔴 **LIVE NOW** - Currently streaming sessions (animated red dot)
- 📅 **Upcoming Streams** - Scheduled future sessions

**Stream Card Features:**
- Instructor name with link to profile
- Date, time, duration
- Enrollment count
- Token price
- Calendar download (.ics)
- Enroll/Watch buttons

---

## Public Profiles

### Instructor Profiles (`/@{slug}`)

**Header Section:**
- Large avatar with gradient ring
- Display name with "INSTRUCTOR" badge
- Username/slug
- Bio
- Social links (Instagram, Website)
- Premium background gradient

**Upcoming Streams:**
- All scheduled and live streams
- Click to view stream details
- Shows status badges (LIVE, SCHEDULED)

**Past Classes:**
- Recently ended streams (last 6)
- Shows date conducted
- No enrollment/viewing options

### User Profiles (`/@{username}`)

**Header Section:**
- Standard avatar (no gradient ring)
- Display name
- Username
- Bio
- Location & birthday (if provided)
- Social links

**No Streams Section:**
- Users don't have streaming capabilities
- Profile focuses on personal information

---

## Mobile Responsiveness

### Header Adaptations

**Desktop (≥768px):**
```tsx
<div className="hidden md:flex items-center gap-3 lg:gap-6">
  <Link href="/streams">Streams</Link>
  <Link href="/workouts">Workouts</Link>
  <Link href="/activity">Activity</Link>
  <Link href="/instructor">Instructor Dashboard</Link>
</div>
```

**Mobile (<768px):**
- Navigation links hidden
- Hamburger menu icon (☰) displayed
- Slide-out menu panel from right

### Mobile Menu

**Features:**
- Backdrop overlay with blur
- Side panel (264px width)
- All navigation links
- Instructor Dashboard (if applicable)
- Download App button (bottom of menu)
- Tap to close / backdrop click to dismiss

**Implementation:**
```tsx
// components/mobile-menu.tsx
{isOpen && (
  <>
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
    <div className="fixed top-16 right-0 w-64 bg-white border-l z-50">
      {/* Menu items */}
    </div>
  </>
)}
```

### Responsive Sizing

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header height | 64px | 80px |
| Logo size | text-xl | text-2xl |
| Navigation gap | gap-2 | gap-4 to gap-8 |
| Padding | px-4 | px-6 |
| Footer links | Stacked | Horizontal |
| Profile avatar | 96px | 128px |

---

## Design System

### Color Palette

**Primary Gradient:**
```css
from-pink-500 to-rose-400
```

**Background Gradients:**
- Regular: `from-pink-50/30 to-white`
- Instructor: `from-pink-100/40 via-rose-50/30 to-white`

**Border Colors:**
- Regular: `border-pink-100`
- Instructor: `border-pink-200`
- Hover: `border-pink-300` or `border-pink-400`

### Icons

All functional icons use **lucide-react** SVG icons (no emojis):

**Home Page:**
- Sparkles, Zap, Music, Clock, TrendingUp, Home (Why Lean Sporty)
- Video, Users, Star, Calendar (Live Classes)

**Workouts Page:**
- Smartphone (iOS notice)
- Sparkles (workout placeholder)
- Flame (calories)
- Zap (moves)
- Star (featured badge)

**Streams:**
- Video (stream placeholder)
- Calendar, Clock, Users, Coins (stream info)
- Check (enrolled badge)
- Download (calendar download)

**Standard Styling:**
```tsx
<Icon className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
```

### Typography

**Headings:**
- Page titles: `text-4xl` to `text-5xl`, gradient text
- Section titles: `text-2xl` to `text-3xl`
- Card titles: `text-xl` to `text-2xl`

**Body:**
- Main text: `text-base`, `text-gray-600`
- Secondary: `text-sm`, `text-gray-500`
- Light weight for elegant feel

---

## API Routes

### Authentication Required

All `/api/instructor/*` routes check for:
1. Valid authenticated user
2. Instructor profile exists

```typescript
// Example from route.ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const { data: instructorProfile } = await supabase
  .from("instructors")
  .select("id")
  .eq("user_id", user.id)
  .single();

if (!instructorProfile) {
  return NextResponse.json({ error: "Not an instructor" }, { status: 403 });
}
```

### Endpoints

- `POST /api/instructor/streams/create` - Create new stream
- `POST /api/instructor/streams/{id}/start` - Start stream (set to live)
- `POST /api/instructor/streams/{id}/end` - End stream
- `POST /api/instructor/profile` - Create/update instructor profile

---

## Configuration

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Instructor Access
INSTRUCTOR_ACCESS_TOKEN=your_secure_token_here
```

### Next.js Config

```typescript
// next.config.ts
export default {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
  },
  async rewrites() {
    return [
      { source: '/@:username', destination: '/:username' },
    ];
  },
};
```

### Robots.txt

```
# Block instructor routes from search engines
Disallow: /instructor/
```

---

## Key Components

### Instructor-Specific

- `app/instructor/(dashboard)/layout.tsx` - Protected layout
- `app/instructor/page.tsx` - Dashboard
- `app/instructor/profile/page.tsx` - Profile management
- `app/instructor/streams/` - Stream management pages
- `components/instructor/profile-form.tsx` - Profile form

### Profile Components

- `app/[username]/page.tsx` - Universal public profile page
- `components/user-profile-form.tsx` - User profile form
- `components/user-menu.tsx` - Header avatar dropdown

### Streaming Components

- `components/streams-view.tsx` - Public streams listing
- `components/stream-card.tsx` - Individual stream card
- `app/streams/page.tsx` - Public streams page

### Mobile Components

- `components/mobile-menu.tsx` - Client-side menu
- `components/mobile-menu-wrapper.tsx` - Server-side wrapper
- `components/header-nav.tsx` - Responsive navigation

---

## Best Practices

### Adding New Instructor Features

1. **Check authorization** in page/route
2. **Use instructor styling** (gradient rings, premium cards)
3. **Update navigation** if needed (dashboard header)
4. **Consider mobile** responsiveness
5. **Add to documentation**

### Profile Updates

1. **Validate uniqueness** (slugs, usernames)
2. **Update RLS policies** if needed
3. **Clear client cache** after updates
4. **Show success feedback**

### Styling Guidelines

**DO:**
- Use gradient rings for instructor avatars
- Apply premium card effects for instructor content
- Use lucide-react icons (consistent with design)
- Follow responsive breakpoints (md:, lg:)

**DON'T:**
- Use emojis for functional indicators
- Mix instructor/user styling
- Forget mobile adaptations
- Hardcode instructor checks (use `isInstructor` pattern)

---

## Troubleshooting

### Common Issues

**Issue:** Instructor can't access dashboard
- **Check:** Profile exists in `instructors` table
- **Check:** `instructor_token` cookie is set
- **Fix:** Re-enter token at `/instructor/login`

**Issue:** Profile page shows 404
- **Check:** Slug/username exists and is correct
- **Check:** RLS policies allow public viewing
- **Fix:** Verify database entry and policies

**Issue:** Gradient ring not showing
- **Check:** `isInstructor` prop passed correctly
- **Check:** Tailwind classes not purged
- **Fix:** Verify component receives prop

**Issue:** Mobile menu not opening
- **Check:** JavaScript enabled
- **Check:** Component is client-side (`"use client"`)
- **Fix:** Check browser console for errors

---

## Future Enhancements

### Potential Features

- [ ] Instructor analytics dashboard
- [ ] Stream recordings library
- [ ] Advanced scheduling (recurring streams)
- [ ] Co-instructor support
- [ ] Student/instructor messaging
- [ ] Rating & review system
- [ ] Instructor earnings page
- [ ] Stream categories/tags
- [ ] Advanced search/filtering
- [ ] Email notifications for streams

### Technical Improvements

- [ ] Implement actual live streaming (Cloudflare Stream)
- [ ] Add real-time chat during streams
- [ ] Optimize profile photo uploads
- [ ] Add profile verification system
- [ ] Implement token payment processing
- [ ] Add automated testing
- [ ] Performance monitoring
- [ ] SEO optimization for profiles

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) *(create if needed)*
- [Streaming Implementation](./STREAMING_GUIDE.md) *(exists in project)*
- [API Documentation](./API_DOCS.md) *(create if needed)*
- [Component Library](./COMPONENTS.md) *(create if needed)*

---

**Last Updated:** December 2024
**Maintained By:** Development Team
**Version:** 1.0
