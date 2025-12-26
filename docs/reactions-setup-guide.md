# Live Stream Reactions - Setup Guide

## Quick Start

### 1. Prerequisites
- Next.js 14+ project
- Supabase project configured
- Existing live streaming system
- User authentication set up

### 2. Installation

```bash
# Install Chart.js dependencies
npm install chart.js react-chartjs-2

# Verify installation
npm list chart.js react-chartjs-2
```

### 3. Database Setup

Run the migration in your Supabase project:

**Option A: Supabase CLI**
```bash
supabase db push
```

**Option B: Supabase Dashboard**
1. Go to SQL Editor in Supabase Dashboard
2. Open `supabase/migrations/20251226_stream_reactions.sql`
3. Copy and paste the entire SQL file
4. Click "Run"

**Option C: Manual Verification**
```sql
-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('stream_reactions', 'stream_reaction_aggregates');

-- Verify triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name IN ('trigger_check_reaction_rate_limit', 'trigger_aggregate_reactions');

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('stream_reactions', 'stream_reaction_aggregates');
```

### 4. Component Integration

#### Viewer Side (Add Reaction Buttons)

Edit your stream watch page:

```tsx
// app/streams/[id]/watch/page.tsx or your watch component
import { ReactionButtons } from '@/components/stream/reaction-buttons';

export function StreamWatchView({ stream, isLive }) {
  return (
    <div className="relative">
      {/* Your video player */}
      <VideoPlayer />

      {/* Add reaction buttons */}
      <ReactionButtons streamId={stream.id} isLive={isLive} />
    </div>
  );
}
```

#### Instructor Side (Add Reaction Display)

Edit your broadcast management page:

```tsx
// components/instructor/broadcast-management-view.tsx
import { ReactionDisplay } from '@/components/instructor/reaction-display';

export function BroadcastManagementView({ stream }) {
  return (
    <div className="relative">
      {/* Your broadcast component */}
      <BrowserBroadcast />

      {/* Add reaction display */}
      <ReactionDisplay
        streamId={stream.id}
        isLive={stream.status === 'live'}
      />
    </div>
  );
}
```

#### Analytics Page

Create or edit stream detail page:

```tsx
// app/instructor/streams/[id]/page.tsx
import { StreamAnalytics } from '@/components/instructor/stream-analytics';

export default function StreamDetailPage({ params }) {
  const { stream } = await getStream(params.id);

  return (
    <div>
      {/* Stream info */}

      {/* Show analytics for ended streams */}
      {stream.status === 'ended' && (
        <StreamAnalytics streamId={stream.id} />
      )}
    </div>
  );
}
```

### 5. Environment Variables

Ensure these are set (should already exist for Supabase):

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 6. Testing

#### Test Viewer Reactions
1. Create a test stream as instructor
2. Start broadcast and mark as "Live"
3. Open stream in different browser/incognito as enrolled viewer
4. Click reaction buttons
5. Verify cooldown timer appears
6. Try clicking rapidly to test rate limiting

#### Test Instructor Display
1. With stream live and reactions being sent
2. Verify bubbles float up on instructor screen
3. Send 3+ same reactions to test aggregation
4. Send technical reactions (⚠️ or 🔇) to test alerts
5. Verify beep sound plays
6. Test dismissing alerts

#### Test Analytics
1. Send various reactions during test stream
2. End the stream
3. Navigate to stream detail page
4. Verify analytics display:
   - Total count
   - Breakdown percentages
   - Timeline graph
   - Technical issues (if any)

## Configuration Options

### Reaction Button Customization

Edit `/types/reactions.ts` to modify buttons:

```typescript
export const REACTION_BUTTONS: ReactionButtonConfig[] = [
  {
    type: 'love_it',
    emoji: '👍',  // Change emoji
    label: 'Love it!',  // Change label
    color: 'green',  // Change color: 'green' | 'yellow' | 'red'
    isTechnical: false,
  },
  // ... other reactions
];
```

### Cooldown Duration

Edit database function to change cooldown:

```sql
-- In migration file or via SQL editor
CREATE OR REPLACE FUNCTION check_reaction_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM stream_reactions
    WHERE user_id = NEW.user_id
    AND stream_id = NEW.stream_id
    AND created_at > NOW() - INTERVAL '5 seconds'  -- Change this
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 5 seconds between reactions.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Also update client-side in `/hooks/use-stream-reactions.ts`:

```typescript
// Update cooldown time
setCooldownRemaining(5);  // Change this number

// And the countdown interval matches
```

### Aggregation Window

Edit database function to change aggregation window:

```sql
-- Change from 10 seconds to desired window
CREATE OR REPLACE FUNCTION aggregate_stream_reactions()
RETURNS TRIGGER AS $$
DECLARE
  window_start TIMESTAMPTZ;
BEGIN
  -- Change the divisor (10) to your desired window in seconds
  window_start := DATE_TRUNC('minute', NEW.created_at) +
                  (FLOOR(EXTRACT(EPOCH FROM NEW.created_at - DATE_TRUNC('minute', NEW.created_at)) / 10) * 10 || ' seconds')::INTERVAL;
  -- ... rest of function
END;
$$ LANGUAGE plpgsql;
```

### Bubble Animation Duration

Edit `/tailwind.config.ts`:

```typescript
animation: {
  "float-up": "float-up 3.5s ease-out forwards",  // Change 3.5s
}
```

Also update cleanup interval in `/components/instructor/reaction-display.tsx`:

```typescript
// Match animation duration
const isRecent = now - event.timestamp < 5000;  // 5000ms = 5 seconds
```

### Alert Sound Settings

Edit `/hooks/use-stream-reactions.ts`:

```typescript
export function playAlertSound() {
  // Change frequency (pitch)
  oscillator.frequency.value = 800;  // Hz (higher = higher pitch)

  // Change duration
  oscillator.stop(audioContext.currentTime + 0.2);  // seconds

  // Change volume
  gainNode.gain.linearRampToValueAtTime(0.3, ...);  // 0.0 to 1.0
}
```

## Deployment

### Build Checklist
1. ✅ Migration applied to production database
2. ✅ Environment variables set in deployment platform
3. ✅ Supabase Realtime enabled for production project
4. ✅ RLS policies active
5. ✅ Chart.js dependencies in package.json

### Deploy to Vercel

```bash
# Build locally to check for errors
npm run build

# If successful, deploy
git push origin main  # Auto-deploys if connected to Vercel
```

### Verify Production Deployment

1. **Database**: Check Supabase dashboard for tables and triggers
2. **Realtime**: Ensure Realtime API is enabled in Supabase settings
3. **Frontend**: Test reaction flow in production
4. **Analytics**: Verify Chart.js loads correctly

## Troubleshooting Setup

### Migration Fails

**Error: "relation already exists"**
```sql
-- Drop existing tables if needed (⚠️ deletes data)
DROP TABLE IF EXISTS stream_reaction_aggregates CASCADE;
DROP TABLE IF EXISTS stream_reactions CASCADE;

-- Then re-run migration
```

**Error: "function already exists"**
```sql
-- Drop existing functions
DROP FUNCTION IF EXISTS check_reaction_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS aggregate_stream_reactions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_reactions() CASCADE;

-- Then re-run migration
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use specific versions
npm install chart.js@4.4.1 react-chartjs-2@5.2.0
```

### TypeScript Errors

```bash
# Regenerate types from Supabase
npx supabase gen types typescript --local > types/database.types.ts

# Or manually add to types/streaming.ts if needed
```

### Realtime Not Working

**Check Supabase Realtime settings:**
1. Go to Supabase Dashboard → Database → Replication
2. Ensure `stream_reaction_aggregates` has Realtime enabled
3. Verify RLS policies allow SELECT for instructors

**Test Realtime manually:**
```typescript
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'stream_reaction_aggregates'
  }, (payload) => console.log(payload))
  .subscribe();
```

### Chart.js Not Rendering

**Common issues:**
- Missing Chart.js registration (check `/components/instructor/stream-analytics.tsx`)
- Canvas element not rendering (check browser console)
- Data format incorrect (verify timeline data structure)

**Debug:**
```typescript
// Add to StreamAnalytics component
console.log('Chart data:', chartData);
console.log('Chart options:', chartOptions);
```

## Performance Optimization

### Database Indexes

Already included in migration, but verify:

```sql
-- Check indexes exist
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename IN ('stream_reactions', 'stream_reaction_aggregates')
ORDER BY tablename, indexname;
```

### Cleanup Old Data

Schedule periodic cleanup (optional):

```sql
-- Create cron job in Supabase (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-old-reactions',
  '0 3 * * *',  -- Daily at 3 AM
  $$SELECT cleanup_old_reactions()$$
);
```

Or use Vercel Cron:

```typescript
// api/cron/cleanup-reactions/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data, error } = await supabase.rpc('cleanup_old_reactions');
  return Response.json({ deleted: data });
}
```

### Connection Pooling

For high traffic, consider Supabase connection pooling:

```typescript
// utils/supabase/client.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,  // Limit events for performance
      },
    },
  }
);
```

## Support

### Common Questions

**Q: Can viewers see each other's reactions?**
A: No, reactions are only visible to the instructor.

**Q: How long are reactions stored?**
A: Indefinitely by default, or 7 days if you enable the cleanup function.

**Q: Can I add more reaction types?**
A: Yes, edit the database CHECK constraint, TypeScript types, and button config.

**Q: Does this work with replays?**
A: No, reactions only work during live streams. Analytics are available after.

**Q: What happens if the instructor loses connection?**
A: Reactions are stored in the database, so when reconnected, new reactions will appear. Past reactions during disconnection won't be visible.

### Getting Help

1. Check `/docs/live-stream-reactions.md` for detailed documentation
2. Review browser console for error messages
3. Check Supabase logs in dashboard
4. Verify database tables and triggers exist
5. Test with minimal setup (single viewer, single instructor)

## Next Steps

After setup is complete:

1. ✅ Run test stream with reactions
2. ✅ Verify analytics work
3. ✅ Train instructors on reaction system
4. ✅ Add reaction usage to viewer onboarding
5. ✅ Monitor performance in production
6. ✅ Gather feedback from instructors and viewers
7. ✅ Consider Phase 4 enhancements (settings, polls, etc.)
