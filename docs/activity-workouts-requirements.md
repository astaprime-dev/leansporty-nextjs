# Product Requirements Document: Activity & Workouts Pages

**Product:** LeanSporty Web Application
**Version:** 1.0
**Last Updated:** December 25, 2025
**Owner:** Product Team

---

## Table of Contents
1. [Overview](#overview)
2. [Activity Page Requirements](#activity-page-requirements)
3. [Workouts Page Requirements](#workouts-page-requirements)
4. [Technical Requirements](#technical-requirements)
5. [Success Metrics](#success-metrics)

---

## Overview

### Purpose
The Activity and Workouts pages serve as the core user experience for authenticated users on the LeanSporty web platform. These pages enable users to track their fitness progress and discover new dance workouts, creating engagement and retention.

### Target Users
- Women aged 25-45 interested in dance-based fitness
- Users who have completed Apple sign-in authentication
- Both beginners and experienced fitness enthusiasts

### Goals
- Provide clear visibility into workout history and progress
- Encourage continued engagement through progress tracking
- Enable easy discovery and selection of dance workouts
- Maintain brand consistency with mobile app experience

---

## Activity Page Requirements

### User Story
**As a** logged-in LeanSporty user
**I want to** view my workout history and progress statistics
**So that** I can track my fitness journey and stay motivated

### Page URL
`/activity`

### Access Control
- **Authentication Required:** Yes
- **Redirect if unauthenticated:** User redirected to home page (/)
- **Default landing page:** Yes (users redirected here after login)

### Features & Functionality

#### 1. Page Header
- **Title:** "Activity" (4xl font, bold)
- **Subtitle:** "Your workout history and progress"
- **Style:** Muted foreground color for subtitle

#### 2. Month Navigation
**Location:** Below page header, above stats cards

**Components:**
- Previous month button (left)
- Current month/year display (center)
- Next month button (right)

**Behavior:**
- Previous button: Navigate to previous month (no limit)
- Next button: Navigate to next month (disabled for future months)
- Month display: Format as "Month Year" (e.g., "December 2024")
- Default view: Current month

**Visual Design:**
- Outline variant buttons with chevron icons
- Center-aligned month display (xl font, semibold)
- Buttons disabled state when applicable

#### 3. Summary Statistics Cards
**Location:** Below month navigation, above workout table

**Layout:**
- 3-column grid on desktop (md+)
- Single column on mobile
- Equal gap spacing between cards

**Card 1: Total Workouts**
- Label: "Total Workouts" (small, muted)
- Value: Count of workouts in selected month (3xl, bold)
- Background: Muted background with rounded corners

**Card 2: Total Duration**
- Label: "Total Duration" (small, muted)
- Value: Sum of all workout durations in MM:SS or HH:MM:SS format (3xl, bold)
- Background: Muted background with rounded corners

**Card 3: Total Calories**
- Label: "Total Calories" (small, muted)
- Value: Sum of calories burned + " kcal" suffix (3xl, bold)
- Background: Muted background with rounded corners

**Calculation Logic:**
- Statistics recalculate based on selected month
- Only completed workouts in the selected month are counted
- Real-time updates as month changes

#### 4. Workout History Table
**Location:** Below summary cards

**Columns:**
1. **Date** - Workout completion date (format: "Mon DD, YYYY")
2. **Workout** - Name of the workout (bold font)
3. **Duration** - Workout duration in MM:SS format
4. **Calories Burned** - Calories + "kcal" suffix

**Table Styling:**
- Full width with responsive overflow
- Border between header and rows
- Border between each row
- Hover effect: Light background color on row hover
- Smooth transitions on hover

**Data Sorting:**
- Default: Most recent workouts first (descending by date)
- Filter: Only workouts from selected month

**Empty State:**
- Message: "No workout sessions in [Month Year]."
- Sub-message: "Start your first workout to see your activity here!"
- Centered alignment with padding

#### 5. Data Source
**Database Table:** `workout_sessions`

**Required Joins:**
- Join with `workouts` table to get workout names

**Fields Used:**
- `workout_date` - For filtering and display
- `duration_seconds` - For duration display and total calculation
- `calories_burned` - For calories display and total calculation
- `workouts.title` - For workout name display

**Filters:**
- `user_id` matches authenticated user
- `workout_date` within selected month

### Acceptance Criteria

✅ **AC1:** Page loads successfully for authenticated users
✅ **AC2:** Unauthenticated users are redirected to home page
✅ **AC3:** Month navigation works correctly (previous/next)
✅ **AC4:** Next month button is disabled for future months
✅ **AC5:** Summary cards show correct totals for selected month
✅ **AC6:** Workout table displays all sessions from selected month
✅ **AC7:** Durations are formatted correctly (MM:SS or HH:MM:SS)
✅ **AC8:** Empty state displays when no workouts in selected month
✅ **AC9:** Table rows have hover effects
✅ **AC10:** Page is responsive on mobile and desktop

---

## Workouts Page Requirements

### User Story
**As a** logged-in LeanSporty user
**I want to** browse available dance workouts
**So that** I can discover and select workouts to perform

### Page URL
`/workouts`

### Access Control
- **Authentication Required:** Yes
- **Redirect if unauthenticated:** User redirected to home page (/)

### Features & Functionality

#### 1. Page Header
**Title:** "Latest Dance Workouts"
- Font: 5xl, bold
- Style: Pink-to-rose gradient (bg-gradient-to-r from-pink-500 to-rose-400)
- Text clipping for gradient effect

**Subtitle:** "Choose a workout to get started"
- Style: Muted foreground color

#### 2. Workout Cards List
**Layout:**
- Single column layout (full width)
- Vertical stack with gap spacing
- Card-based design for each workout

**Card Structure (Desktop):**
```
┌─────────────────────────────────────────────────┐
│  [Thumbnail]  │  Title                          │
│  [Image    ]  │  Subtitle                       │
│  [15:00    ]  │  Description                    │
│               │  🔥 calories  💫 moves          │
│               │  ⭐ Featured (if applicable)    │
└─────────────────────────────────────────────────┘
```

**Card Structure (Mobile):**
```
┌─────────────────────────┐
│    [Thumbnail Image]    │
│        [15:00]          │
├─────────────────────────┤
│  Title                  │
│  Subtitle               │
│  Description            │
│  🔥 calories 💫 moves  │
│  ⭐ Featured           │
└─────────────────────────┘
```

#### 3. Workout Card Components

**A. Thumbnail Section**
- **Desktop:** Fixed width (256px), auto height
- **Mobile:** Full width, fixed height (192px)
- **Background:** Pink-to-rose gradient fallback
- **Image:** Full object-cover if thumbnailUrl exists
- **Fallback:** Dance emoji (💃) if no thumbnail
- **Image Source:** Cloudflare-hosted images (imagedelivery.net)

**B. Duration Badge**
- **Position:** Absolute, bottom-left of thumbnail
- **Style:** Pink-to-rose gradient background, white text
- **Format:** MM:SS (e.g., "15:00", "10:09")
- **Font:** Semibold
- **Shadow:** Drop shadow for visibility

**C. Content Section**
- **Padding:** 24px (1.5rem)
- **Vertical center alignment**

**D. Title**
- **Font:** 2xl, bold
- **Color:** Dark gray (default), pink on hover
- **Transition:** Smooth color change
- **Fallback:** "Untitled Workout" if title is null

**E. Subtitle**
- **Display:** Only if subtitle exists
- **Font:** Large, gray-600
- **Example:** "Hip-hop, Dance Floor, Afro House, House"

**F. Description**
- **Display:** Only if description exists and not default "workout" value
- **Font:** Regular, gray-500
- **Purpose:** Additional workout details

**G. Stats Row**
- **Layout:** Horizontal flex with gap
- **Responsive:** Wraps on smaller screens

**Calories Display:**
- **Icon:** 🔥 (fire emoji)
- **Format:** "[value] cal"
- **Condition:** Only display if calories > 0

**Moves Display:**
- **Icon:** 💫 (sparkles emoji)
- **Format:** "[value] moves"
- **Condition:** Only display if moves > 0

**H. Featured Badge**
- **Display:** Only if workout.featured === true
- **Style:** Pink-to-rose gradient pill badge
- **Text:** "⭐ Featured"
- **Position:** Below stats, margin top

#### 4. Card Interactions

**Hover Effects:**
- Border color: Changes from pink-100 to pink-300
- Shadow: Elevates with pink-tinted shadow
- Title color: Changes to pink-500
- Gradient overlay: Fades in (pink-50 to transparent)
- All transitions: 300ms duration

**Base Styling:**
- Background: White
- Border: 1px solid pink-100
- Border radius: Large (rounded-2xl)
- Shadow: Subtle base shadow
- Overflow: Hidden

#### 5. Empty State
**Trigger:** No workouts in database

**Display:**
- Centered text with padding
- Primary message: "No workouts available yet."
- Secondary message: "Check back soon for new dance workouts!"
- Message styling: Muted foreground colors

#### 6. Data Source
**Database Table:** `workouts`

**Fields Used:**
- `id` - Unique identifier (key)
- `title` - Workout name
- `thumbnailUrl` - Image URL from Cloudflare
- `durationInSeconds` - Duration in seconds (int8)
- `subtitle` - Workout style/tags
- `description` - Workout details
- `calories` - Estimated calories burned (int2)
- `moves` - Number of dance moves (int2)
- `featured` - Featured workout flag (boolean)
- `created_at` - For sorting

**Fields NOT Used (App-Only):**
- `videoUrl` - Video playback URL (mobile app exclusive)

**Sorting:**
- Default: Newest workouts first (ORDER BY created_at DESC)

### Acceptance Criteria

✅ **AC1:** Page loads successfully for authenticated users
✅ **AC2:** All workouts from database are displayed
✅ **AC3:** Workout cards show correct data (title, subtitle, duration, etc.)
✅ **AC4:** Duration is formatted correctly from seconds to MM:SS
✅ **AC5:** Thumbnail images load from Cloudflare
✅ **AC6:** Fallback emoji shows when no thumbnail exists
✅ **AC7:** Stats (calories, moves) only show when > 0
✅ **AC8:** Featured badge only appears for featured workouts
✅ **AC9:** Hover effects work smoothly on all cards
✅ **AC10:** Layout is responsive (stacks on mobile, horizontal on desktop)
✅ **AC11:** Empty state displays when no workouts exist
✅ **AC12:** Video URLs are NOT displayed on web interface

---

## Technical Requirements

### Authentication
- **Method:** Apple Sign-In (OAuth)
- **Session Management:** Supabase server-side session
- **Protected Routes:** Both `/activity` and `/workouts` require authentication
- **Middleware:** Redirect unauthenticated users to home page

### Database
**Platform:** Supabase (PostgreSQL)

**Tables:**
1. **workout_sessions**
   - Stores user workout completion data
   - Linked to authenticated user via `user_id`
   - Linked to workout via `workout_id`

2. **workouts**
   - Stores available workout content
   - Public data (same for all users)
   - Managed by admin/CMS

**Query Optimization:**
- Use Supabase joins for efficient data fetching
- Server-side filtering by user_id and date ranges
- Proper indexing on frequently queried fields

### Image Handling
**CDN:** Cloudflare Images
- **Domain:** imagedelivery.net
- **Next.js Config:** Remote patterns configured for Cloudflare domains
- **Component:** Next.js Image with optimization
- **Fallback:** Emoji when image unavailable

### Performance
- **Rendering:** Server-side rendering (SSR) for initial page load
- **Client-side:** React state management for month navigation
- **Caching:** Leverage Next.js automatic caching
- **Image Optimization:** Next.js Image component with proper sizing

### Responsive Design
**Breakpoints:**
- Mobile: < 640px (sm)
- Desktop: ≥ 640px (sm) and ≥ 768px (md)

**Grid System:**
- Activity stats: 1 column (mobile) → 3 columns (md+)
- Workout cards: Always single column (optimized for readability)

### Styling
**Framework:** Tailwind CSS

**Color Palette:**
- Primary: Pink-500 to Rose-400 gradient
- Background: White, muted backgrounds
- Text: Gray-800 (headings), Gray-600 (body), Gray-500 (secondary)
- Borders: Pink-100 to Pink-300
- Shadows: Pink-200 tinted shadows

**Typography:**
- Font family: Geist Sans
- Headings: Bold, larger sizes (2xl-5xl)
- Body: Regular, readable sizes (base-lg)
- Labels: Small, muted for metadata

---

## Navigation Integration

### Header Navigation
**Authenticated Users See:**
- Activity (link to `/activity`)
- Workouts (link to `/workouts`)
- User email + Sign Out button
- Download App CTA

**Link Styling:**
- Small font, light weight
- Gray-600 default color
- Pink-500 hover color
- Smooth color transitions

### Post-Login Flow
1. User signs in with Apple
2. Auth callback processes
3. Redirect to `/activity` (default landing)
4. User can navigate to `/workouts` via header

### Post-Logout Flow
1. User clicks Sign Out
2. Session cleared
3. Redirect to home page (`/`)
4. Sign-in modal available in header

---

## Success Metrics

### Engagement Metrics
- Daily/Weekly Active Users (DAU/WAU)
- Average sessions per user per month
- Average workouts completed per user per month
- Time spent on Activity page
- Time spent on Workouts page

### Retention Metrics
- 7-day retention rate
- 30-day retention rate
- Return visit frequency

### Feature Usage
- % of users viewing Activity page
- % of users viewing Workouts page
- Average month navigation interactions
- Workout card hover/interaction rate

### Technical Metrics
- Page load time (target: < 2s)
- Time to Interactive (TTI)
- Image load performance
- Error rate (target: < 0.1%)

---

## Future Enhancements (Out of Scope for v1.0)

### Activity Page
- [ ] Export workout history to CSV/PDF
- [ ] Filter by workout type
- [ ] Search workout history
- [ ] Charts and visualizations (weekly/monthly trends)
- [ ] Achievements and milestones
- [ ] Share progress on social media

### Workouts Page
- [ ] Filter by difficulty level
- [ ] Filter by duration
- [ ] Filter by style/genre
- [ ] Search workouts
- [ ] Favorite/bookmark workouts
- [ ] Workout preview videos (teaser clips)
- [ ] Workout playlists/programs
- [ ] User reviews and ratings

### Cross-Feature
- [ ] Start workout from web (video playback)
- [ ] Sync workout progress from mobile app
- [ ] Community features (leaderboards, challenges)
- [ ] Personalized workout recommendations

---

## Appendix

### Glossary
- **Workout Session:** A completed instance of a user performing a workout
- **Workout:** A piece of content (dance video) available in the library
- **Featured Workout:** Highlighted workout chosen by content team
- **Activity:** User's historical workout data and statistics

### Related Documents
- `apple-signin-implementation.md` - Authentication setup guide
- Technical architecture documentation (TBD)
- Brand guidelines (TBD)

### Changelog
- **v1.0 (Dec 25, 2025):** Initial requirements document created
