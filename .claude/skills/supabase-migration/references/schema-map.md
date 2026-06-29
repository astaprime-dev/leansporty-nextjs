# LeanSporty schema map (current, as audited)

Consolidated from `supabase/migrations/`. Grep for a table name before adding anything. "→" = foreign key.

## Identity & instructors
- **`user_profiles`** — universal identity, **1:1 with `auth.users` (auto-created by `auto_create_user_profile()` trigger on signup)**. Cols: `id`, `user_id`→auth.users (unique), `display_name` (not null), `username` (unique, not null, `^[a-z0-9-]+$`), `bio`, `profile_photo_url`, `location`, `instagram_handle`, `website_url`, timestamps. RLS: public select; update/delete own. Indexes: `username`, `user_id`.
- **`profiles`** — **iOS-owned, DO NOT MODIFY.** `id` = auth.users.id, `weight_kg`, timestamps.
- **`instructors`** — `id`, `user_id`→auth.users (unique), `slug` (unique, not null), timestamps. Display fields were removed (now in `user_profiles`). RLS: public select; update own.
- **`instructor_gallery_items`** — `id`, `instructor_id`→instructors (cascade), `media_type` (image|video), `cloudflare_image_id`, `cloudflare_url`, `display_order` (0–7, max 8/instructor), `caption`, timestamps. Unique `(instructor_id, display_order)`.

## Live streaming
- **`live_stream_sessions`** — `id`, `title`, `description`, `instructor_id`→instructors (not null), `scheduled_start_time`, `scheduled_duration_seconds`, `actual_start_time`, `actual_end_time`, `status` (scheduled|live|ended|cancelled), `broadcast_method` (webrtc|rtmps|null), `price_in_tokens` (int — **deprecated model**), CF cols (`cloudflare_stream_id`, `cloudflare_webrtc_url`, `cloudflare_webrtc_token`, `cloudflare_whep_playback_url`, `cloudflare_playback_id`, `cloudflare_rtmps_url`, `cloudflare_rtmps_stream_key`), recording (`recording_available`, `recording_expires_at`, `recording_cloudflare_video_id`), migration (`migrated_to_workout_id`→workouts, `migration_scheduled_at`), `thumbnail_url`, `max_viewers`, `total_enrollments`, timestamps. RLS: public select; authenticated insert/update. Triggers: `set_migration_schedule()` (sets `migration_scheduled_at = actual_end_time + 2 months`, `recording_expires_at = +7 days`), `update_updated_at_column()`.
  - ⚠️ **Pipeline defect (DEF-1):** `cleanup-recordings` deletes at +7d but `migrate-streams-to-workouts` promotes at +2mo and needs `recording_available=true` → recordings vanish before promotion. Fix when touching the library/VOD flow: retain promoted recordings; apply the 7-day TTL only to un-promoted ones.
- **`stream_enrollments`** — `id`, `stream_id`→stream, `user_id`→auth.users, `tokens_paid` (int), `enrolled_at`, `can_watch_live`, `can_watch_replay`, `replay_access_expires_at` (+7d), `watched_live`, `watched_replay`, `last_watched_at`. Unique `(stream_id, user_id)`. RLS: view/create own. **Repurpose as cohort roster created by an entitlement grant — not a free user insert (DEF-3).**
- **`stream_watch_sessions`** — `id`, `enrollment_id`, `stream_id`, `user_id`, `session_type` (live|replay), `started_at`, `last_heartbeat_at`, `ended_at`, `total_watch_seconds`. Functions: `increment_watch_duration()`, `get_active_viewer_count()`, `get_active_viewers()`.

## Community
- **`stream_comments`** — `id`, `stream_id`, `enrollment_id`, `user_id`, `instructor_id`→instructors (not null), `star_rating` (1–5), `comment_text` (≤300), `is_hidden`, `hidden_at`, `hidden_by`, `edited_at`, timestamps. Unique `(stream_id, user_id)`. RLS: public select non-hidden; create/update own; instructors moderate own streams. Triggers validate eligibility, enforce 24h edit window. Funcs: `get_stream_average_rating()`, `get_stream_comment_count()`.
- **`stream_comment_replies`** — `id`, `comment_id`, `stream_id`, `instructor_id`, `user_id`, `reply_text` (1–200), timestamps. RLS: public select; only the stream's instructor may reply.
- **`stream_reactions`** — `id`, `stream_id`, `user_id` (nullable), `reaction_type` (love_it|feeling_burn|need_slower|cant_see|no_audio), `created_at`. Trigger: 5s per-user rate limit; aggregates into `stream_reaction_aggregates` (10s windows). `cleanup_old_reactions()` (>7d).

## Catalog
- **`workouts`** — catalog (shared with iOS; written by `migrate-streams-to-workouts` cron). Known cols include `id`, `title`, `description`, duration, `thumbnail_url`, `mux_playback_id` (**legacy CF id holder — migrate to `cloudflare_uid`**), `category` (default 'dance'), `difficulty` (default 'intermediate'), `is_free` (default false), plus catalog fields read by the web (`featured`, `calories`, `moves`). **Verify exact column names against the live schema before writing against it.**

## Absent (to be built)
`products`, `product_items`, `entitlements`, `get_playable_uid()`, `cohorts`, subscriptions, `affiliates`/`referral_codes`/`commissions`, `connect_accounts`/`instructor_payouts`, `leads`. No credits/vouchers/wallet tables on web (iOS-only).
