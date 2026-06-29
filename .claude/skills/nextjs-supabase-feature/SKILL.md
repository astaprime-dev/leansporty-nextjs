---
name: nextjs-supabase-feature
description: This skill should be used when building any feature in the leansporty.com web app — when the user asks to "add a page", "add an API route", "create a server action", "add a component", "build a feature", "fetch data from Supabase", or asks "which Supabase client should I use". Encodes the App Router + Supabase + shadcn conventions and the critical trust-level rules for this codebase.
version: 0.1.0
---

# Building features in leansporty.com

Guidance for adding pages, route handlers, server actions, and components to the LeanSporty web app (Next.js 16 App Router, React 19, TypeScript, Tailwind, shadcn/ui, `@supabase/ssr`, Vercel). The goal is to match existing patterns so features are consistent and secure.

## The one rule that matters most: pick the right Supabase client

There are **four** ways to reach Supabase, separated by trust level. Choosing wrong is a security bug. See `references/supabase-clients.md` for full code and import paths.

| Context | Client | Enforces RLS? | Use for |
|---|---|---|---|
| Server Component / route handler acting **as the user** | `createClient()` from `@/utils/supabase/server` | ✅ yes | reads/writes the logged-in user is allowed to do |
| Browser/client component | `createClient()` from `@/utils/supabase/client` | ✅ yes | client-side reads, realtime |
| Middleware (session refresh) | `@/utils/supabase/middleware` | ✅ yes | already wired in `middleware.ts`; do not duplicate |
| **Privileged** server-only work | inline `createClient(URL, SUPABASE_SERVICE_ROLE_KEY)` | ❌ **bypasses RLS** | webhooks, admin grants — see `lib/instructor-roles.ts` |

**Never** use the service-role key in any code path reachable by the client (no `NEXT_PUBLIC_` prefix; never import it into a client component). The service-role client is the writer of last resort — currently used only in `lib/instructor-roles.ts`, and (when built) the Stripe webhook. Default to the RLS-aware server client and let policies do the gating.

## Where things live

- **Pages & routes:** `app/` (App Router). Route groups: `(auth-pages)/` (auth screens), `app/instructor/(dashboard)/` (instructor console). Public profile is `app/[username]/` — adding a top-level route segment can shadow it, so check first.
- **API route handlers:** `app/api/<area>/<name>/route.ts`. Existing areas: `comments/`, `instructor/`, `admin/`, `streams/`, `upload/`, `cron/`. Add commerce under `app/api/{checkout,stripe,playback}/`.
- **Server actions:** colocated in `app/actions.ts` (auth, enrollment, stream queries live here). Add new mutations here or in a feature-scoped `actions.ts`.
- **Shared logic:** `lib/` (Cloudflare wrappers, instructor roles, utils). **UI primitives:** `components/ui/` (shadcn). Feature components: `components/` and `components/<feature>/`.
- **Types:** `types/` (one file per domain: `streaming.ts`, `comments.ts`, etc.). Add a matching file for new domains (e.g. `types/commerce.ts`).
- **Path alias:** `@/*` → repo root. Import as `@/lib/...`, `@/utils/supabase/server`, `@/components/ui/button`.

## Conventions to match

- **Database columns are snake_case** (`user_id`, `created_at`, `price_in_tokens`); Supabase returns them as-is. Do not impose camelCase mappers — follow the surrounding model types.
- **Joins across `auth.users` FKs fail in PostgREST nested selects.** The codebase fetches separately and merges with a `Map` (see `app/actions.ts` `getStreams()` and `docs/DATABASE_ARCHITECTURE.md`). Reuse that pattern; do not add an `!inner` join expecting it to work.
- **Identity = `user_profiles`** (always present, auto-created on signup). An instructor additionally has an `instructors` row (slug only). To show full instructor data, query both and merge.
- **shadcn/ui:** add primitives with the shadcn MCP tools (search/view/get-add-command) rather than hand-rolling. `components.json` is configured.
- **Auth gating in a page:** call the server client's `auth.getUser()`; redirect when null (pattern in `app/settings/page.tsx`, `app/streams/[id]/watch/page.tsx`). RLS is the real backstop; the redirect is UX.
- **Access control going forward:** gate paid content on **entitlements**, not on a free `stream_enrollments` row (see the `secure-playback` and `stripe-commerce` skills). The historical token model is deprecated.

## Workflow for a new feature

1. Decide server vs client component (default: Server Component; add `"use client"` only for interactivity).
2. Pick the Supabase client by the table above.
3. For data the user owns, rely on RLS + the server client. For privileged writes, isolate them in a server-only route with the service-role client and re-check authorization explicitly.
4. Build UI from `components/ui/` primitives; keep feature components in `components/<feature>/`. **Match the design system — don't hand-roll:** notices → `@/components/ui/alert` (`<Alert variant>`), empty states → `@/components/empty-state`, primary CTAs → `<Button variant="brand">`, status chips → `@/components/ui/badge`. Use the canonical heading classes (page title `font-display text-3xl sm:text-4xl font-light text-gray-900`; section h2 `text-2xl font-semibold text-gray-900`; card h3 `text-lg font-semibold text-gray-900`). Full rules + the per-page alignment checklist: `.claude/skills/visual-design-review/references/design-system.md`.
5. Add/extend a `types/` file for new tables.
6. Run locally: `npm run dev`, or **`npm run dev:https`** when the feature touches OAuth/Apple sign-in (needs certs in `.certs/` via `./setup-https.sh`).

## Reality checks

- **No test runner and no lint script** are configured. Verify by running the app (use the `/run` or `/verify` skills) and exercising the flow; do not assume `npm test` exists.
- **`SUPABASE_SERVICE_ROLE_KEY` is referenced in code but absent from `.env.local`** — privileged paths fail until it is set in the environment.
- `middleware.ts` already refreshes the session on every request; new features get an up-to-date session for free.

## Additional resources

- **`references/supabase-clients.md`** — exact import paths, construction code for all four clients, and the cookie-bound vs Bearer patterns (web vs iOS callers).
- Companion skills: `secure-playback` (gated video), `stripe-commerce` (payments/entitlements), `supabase-migration` (schema). The product specs (`WEB_PRODUCT_REQUIREMENTS.md`, `CHALLENGE_PRODUCTIZATION_SPEC.md`) live in the monorepo root if present.
