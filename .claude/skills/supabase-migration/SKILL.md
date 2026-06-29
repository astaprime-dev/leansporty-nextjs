---
name: supabase-migration
description: This skill should be used when changing the LeanSporty database — when the user asks to "create a migration", "add a table", "add a column", "write a SQL migration", "add an RLS policy", "create a database function or trigger", "add the entitlements/products schema", or modify the Supabase schema. Encodes the migration conventions, the four-table user model, and RLS/RPC patterns for this repo.
version: 0.1.0
---

# Supabase migrations for LeanSporty

Guidance for authoring schema changes in `leansporty.com/supabase/migrations/`. The same Supabase project backs both the web app and the iOS app, so a schema change can affect both clients — check the blast radius before writing.

## Critical constraints (read before any change)

- **`profiles` is owned by iOS — DO NOT MODIFY.** It holds fitness data (`weight_kg`, keyed by `auth.users.id`). It is distinct from `user_profiles`. Changing it can break the iOS app. (See `docs/DATABASE_ARCHITECTURE.md`.)
- **Identity lives in `user_profiles`** (1:1 with `auth.users`, auto-created by trigger on signup). An instructor adds a separate `instructors` row (slug only). Never add display fields back onto `instructors`.
- **The four-table user model** (`user_profiles` identity · `profiles` iOS tracking · `instructors` slug · `stream_comments` reviews) is intentional. Add new concerns as new tables, not by overloading these.

## Authoring a migration

1. **File location & naming:** create `supabase/migrations/<timestamp>_<description>.sql`. The repo uses `YYYYMMDDHHMMSS_snake_description.sql` (e.g. `20260628120000_payments_and_entitlements.sql`). Use a timestamp strictly greater than the latest existing file so ordering holds.
2. **Make it idempotent** where practical: `create table if not exists`, `add column if not exists`, `create index if not exists`, `create or replace function`. Migrations are sometimes re-run by hand.
3. **Enable RLS on every new table** and write explicit policies. A table without RLS is open. Default to "read own / write own" via `auth.uid() = user_id`; public catalog data can be `for select using (true)`.
4. **Indexes:** add for every foreign key and every column used in a `where`/`order by` hot path (the existing tables index `user_id`, `status`, `scheduled_start_time`, etc.).
5. **`updated_at`:** reuse the existing `update_updated_at_column()` trigger pattern if the table needs it.
6. **Mirror cross-client impact** in `docs/DATABASE_ARCHITECTURE.md` when the change touches identity, instructors, or anything iOS reads.

See `references/patterns.md` for copy-paste templates (RLS, `security definer` RPC, triggers) and the full **payments & entitlements** migration that Phase 1 needs.

## The entitlement gate pattern (used for paid content)

Access to paid video is granted by a `security definer` SQL function that returns the Cloudflare UID **only if** the caller holds a live entitlement. This keeps the gate in the database, not the client:

```sql
create or replace function public.get_playable_uid(p_content_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select w.cloudflare_uid from public.workouts w
  where w.id = p_content_id
    and exists ( select 1 from public.entitlements e
      join public.product_items pi on pi.product_id = e.product_id
      where e.user_id = auth.uid() and pi.content_id = w.id
        and (e.expires_at is null or e.expires_at > now()) );
$$;
revoke all on function public.get_playable_uid(uuid) from public;
grant execute on function public.get_playable_uid(uuid) to authenticated;
```
Always `revoke from public` then `grant execute to authenticated` on a `security definer` function — otherwise it is callable anonymously. (The full preview-aware version is in `references/patterns.md`.)

## Applying a migration

Confirm the project's deploy method before running anything (no `supabase/config.toml` may be committed):
- **If the Supabase CLI is linked:** `supabase migration new <name>` to scaffold, then `supabase db push` to apply. Keep the generated file in `supabase/migrations/` and commit it.
- **If applied via the dashboard:** paste the SQL into the Supabase SQL Editor, run it, and **still commit the file** to `supabase/migrations/` so history stays complete.
- Never apply a destructive change (drop/alter type) without confirming it against live data and the iOS dependency first.

## Schema reference

`references/schema-map.md` is the consolidated current schema (every table, key columns, RLS, functions, triggers) as audited — use it to know what exists before adding. Grep it for a table name rather than re-reading every migration.

## Additional resources

- **`references/schema-map.md`** — consolidated current schema (tables, columns, RLS, functions, triggers).
- **`references/patterns.md`** — RLS / RPC / trigger templates and the full Phase-1 entitlements migration.
- Companion: the `stripe-commerce` skill (writes `entitlements`), the `secure-playback` skill (consumes `get_playable_uid`).
