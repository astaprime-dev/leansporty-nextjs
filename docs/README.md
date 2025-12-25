# Documentation Index

## Live Streaming Feature

**Status**: ✅ Production Ready

### Quick Start
- **[Setup Guide](SETUP-STREAMING.md)** - Deploy streaming in 5 steps
- **[Instructor Guide](instructor-guide.md)** - Non-technical guide for dance instructors

### Technical Documentation
- **[Live Streaming Documentation](live-streaming-documentation.md)** - Complete technical reference
- **[Requirements](live-streaming-requirements.md)** - Original feature requirements
- **[Migration](../supabase/migrations/20250101000000_live_streaming_complete.sql)** - Database schema

### Key Technologies
- Cloudflare Stream (WebRTC)
- WHIP Protocol (RFC 9725) - Broadcasting
- WHEP Protocol - Playback
- @eyevinn/webrtc-player
- Supabase (Auth + Database)

### Architecture Summary

```
┌─────────────┐    WHIP     ┌──────────────┐    WHEP    ┌─────────┐
│ Instructor  │─────────────>│  Cloudflare  │───────────>│  Users  │
│  (Browser)  │              │    Stream    │            │(Browser)│
└─────────────┘              └──────────────┘            └─────────┘
                                    │
                                    v
                             Auto-Record (7 days)
                                    │
                                    v
                             HLS Playback (Replays)
```

### Important Notes

⚠️ **WHIP + WHEP Required**: Cloudflare Stream WebRTC requires both protocols together. You cannot mix WHIP with HLS playback.

✅ **Working Implementation**:
- Live broadcasting from browser (no OBS needed)
- Sub-second latency for viewers
- Automatic recording with 7-day replay
- Token-based enrollment system
- Public stream discovery
- Authenticated viewing

### File Locations

**Components**:
- `/components/instructor/browser-broadcast.tsx` - WHIP broadcaster
- `/components/whep-player.tsx` - WHEP playback
- `/components/stream-watch-view.tsx` - Watch page

**API**:
- `/app/api/instructor/streams/create/route.ts` - Create stream
- `/app/api/instructor/streams/[id]/start/route.ts` - Mark live
- `/app/api/instructor/streams/[id]/end/route.ts` - End stream

**Pages**:
- `/app/streams/page.tsx` - Browse streams
- `/app/streams/[id]/watch/page.tsx` - Watch stream
- `/app/instructor/(dashboard)/streams/create/page.tsx` - Create form
- `/app/instructor/(dashboard)/streams/[id]/broadcast/page.tsx` - Broadcast

**Database**:
- `/supabase/migrations/20250101000000_live_streaming_complete.sql` - Complete schema

### Resources

- [Cloudflare Stream WebRTC](https://developers.cloudflare.com/stream/webrtc-beta/)
- [WHIP RFC 9725](https://www.rfc-editor.org/rfc/rfc9725.html)
- [@eyevinn/webrtc-player](https://github.com/Eyevinn/webrtc-player)

---

Last Updated: 2025-01-01
