# Supabase clients — exact usage

Four ways to reach Supabase in this codebase. Import paths and construction patterns below.

## 1. Server client (RLS-aware, acts as the user) — the default

`utils/supabase/server.ts`. Cookie-bound; use in Server Components, route handlers, and server actions that should act on behalf of the logged-in user.

```ts
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();              // note: await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");                            // UX gate; RLS is the real backstop
  const { data } = await supabase.from("entitlements").select("*"); // RLS limits to own rows
}
```

## 2. Browser client (RLS-aware) — for client components

`utils/supabase/client.ts`. Use inside `"use client"` components for client-side reads and realtime subscriptions.

```ts
"use client";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();                       // no await
```

## 3. Middleware client — already wired

`utils/supabase/middleware.ts`, invoked from `middleware.ts` via `updateSession()`. It refreshes the auth session on every request. Do not re-implement; new code inherits a fresh session.

## 4. Service-role client (BYPASSES RLS) — privileged, server-only

No helper; constructed inline with the service-role key. Currently the only legitimate use is `lib/instructor-roles.ts`; the Stripe webhook will be the second. Use only when there is no user session (webhooks) or when an operation legitimately must transcend RLS (admin role grants) — and re-check authorization in code.

```ts
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,              // server-only; never NEXT_PUBLIC_
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

**Rules:** never import this into a client component; never expose the key to the browser; keep these calls inside route handlers / server actions with explicit auth checks.

## Identifying the caller in a dual-client endpoint (web cookies vs iOS Bearer)

The playback-token route must accept both web (cookies) and iOS (`Authorization: Bearer <supabase access token>`). Pattern:

```ts
const auth = req.headers.get("authorization") ?? "";
let supabase;
if (auth.startsWith("Bearer ")) {
  supabase = createClient(                              // anon key + caller's bearer token
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } }
  );
} else {
  const store = await cookies();
  supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
  );
}
const { data: { user } } = await supabase.auth.getUser();
```

Both paths stay RLS-aware (anon key + the caller's identity), so `auth.uid()` inside RLS policies and `security definer` RPCs resolves to the real user.

## The fetch-and-merge pattern (PostgREST join limitation)

Nested selects that cross an `auth.users` foreign key fail. Fetch separately, merge with a `Map`:

```ts
const { data: comments } = await supabase.from("stream_comments")
  .select("id, star_rating, comment_text, user_id").eq("instructor_id", id);
const userIds = comments.map(c => c.user_id);
const { data: profiles } = await supabase.from("user_profiles")
  .select("user_id, display_name, profile_photo_url").in("user_id", userIds);
const byUser = new Map(profiles.map(p => [p.user_id, p]));
const merged = comments.map(c => ({ ...c, profile: byUser.get(c.user_id) }));
```
