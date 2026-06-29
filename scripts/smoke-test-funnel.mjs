/**
 * Funnel smoke test — guards the cold-buyer path that was silently broken for
 * ~6 months (the SECURITY DEFINER search_path bug that killed all new signups).
 *
 * Run (needs the REAL service-role key, not the local placeholder):
 *   node --env-file=.env.local scripts/smoke-test-funnel.mjs
 * or in CI with env vars set. Exits non-zero on any failure.
 *
 * What it covers (headless, backend chain):
 *   T1  new-user creation succeeds  ← the exact regression. If ANY auth.users
 *       signup trigger throws (profile/wallet/voucher), createUser errors here.
 *   T2  user_profiles auto-provisioned with a valid username
 *   T3  entitlement gate (get_playable_uid): non-entitled → blocked, Day-1
 *       preview → plays, and after a grant the paid content unlocks
 * It then deletes the test user (cascades profile/wallet/voucher/entitlement).
 *
 * NOT covered (need a browser / real email): the Stripe Checkout UI and the
 * magic-link email click. Those stay a manual check or a future Playwright E2E.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHALLENGE_SLUG = process.env.SMOKE_CHALLENGE_SLUG ?? "21-day-dance-challenge";

if (!url || !anonKey || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let pass = 0;
const failed = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { failed.push(n); console.error(`  ✗ ${n}${d ? `\n      ${d}` : ""}`); };
const assert = (cond, n, d) => (cond ? ok(n) : bad(n, d));

const email = `smoke-${Date.now()}@example.com`;
let userId = null;

try {
  // T1 — the regression: a fresh signup must succeed. A throw in ANY of the
  // three auth.users triggers (auto_create_user_profile / credit.init_wallet /
  // credit.issue_signup_voucher) aborts the insert and surfaces here.
  console.log("\n[T1] New-user creation (regression guard for the signup bug)");
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, email_confirm: true });
  assert(!cErr && !!created?.user?.id, "createUser succeeds — all signup triggers pass", cErr?.message);
  userId = created?.user?.id ?? null;
  if (!userId) throw new Error("no user id returned — cannot continue");

  // T2 — profile auto-provisioned (the table the trigger writes)
  console.log("\n[T2] Profile auto-provisioned");
  const { data: prof } = await admin
    .from("user_profiles")
    .select("user_id, username, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  assert(prof?.user_id === userId, "user_profiles row auto-created", "no row found");
  assert(!!prof?.username && /^[a-z0-9-]+$/.test(prof.username), "username generated + valid", `username=${prof?.username}`);

  // Resolve the challenge product + a preview and a paid content (with a real UID)
  const { data: product } = await admin.from("products").select("id").eq("slug", CHALLENGE_SLUG).maybeSingle();
  assert(!!product?.id, `challenge product '${CHALLENGE_SLUG}' exists`, "missing — seed not applied?");

  let previewContent = null, paidContent = null;
  if (product?.id) {
    const { data: items } = await admin
      .from("product_items").select("content_id, is_preview").eq("product_id", product.id);
    const ids = (items ?? []).map((i) => i.content_id);
    const { data: works } = await admin
      .from("workouts").select("id, cloudflare_uid")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const uid = new Map((works ?? []).map((w) => [w.id, w.cloudflare_uid]));
    previewContent = (items ?? []).find((i) => i.is_preview && uid.get(i.content_id)) ?? null;
    paidContent = (items ?? []).find((i) => !i.is_preview && uid.get(i.content_id)) ?? null;
  }

  // T3 — entitlement gate. Mint a real user session (no email needed) so
  // get_playable_uid runs as this user (auth.uid()).
  console.log("\n[T3] Entitlement gate (get_playable_uid)");
  const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link?.properties?.hashed_token;
  const userClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  let authed = false;
  if (tokenHash) {
    const { data: sess, error: vErr } = await userClient.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    authed = !!sess?.session && !vErr;
  }
  assert(authed, "minted a user session for gate checks", lErr?.message ?? "verifyOtp failed");

  if (authed && paidContent) {
    const { data: before } = await userClient.rpc("get_playable_uid", { p_content_id: paidContent.content_id });
    assert(before === null, "non-entitled user is BLOCKED from paid content", `expected null, got ${before}`);
  } else {
    bad("paid-content gate (pre-grant)", "no session or no paid content with a cloudflare_uid");
  }

  if (authed && previewContent) {
    const { data: prev } = await userClient.rpc("get_playable_uid", { p_content_id: previewContent.content_id });
    assert(!!prev, "Day-1 preview plays without purchase", `expected a uid, got ${prev}`);
  } else {
    console.log("  - skip: no preview content with a cloudflare_uid");
  }

  if (product?.id && paidContent) {
    const { error: gErr } = await admin.from("entitlements")
      .upsert({ user_id: userId, product_id: product.id, source: "comp", expires_at: null }, { onConflict: "user_id,product_id" });
    assert(!gErr, "entitlement granted (simulates the Stripe webhook)", gErr?.message);
    if (authed && !gErr) {
      const { data: after } = await userClient.rpc("get_playable_uid", { p_content_id: paidContent.content_id });
      assert(!!after, "entitled user can now play paid content", `expected a uid, got ${after}`);
    }
  }
} catch (e) {
  bad("unexpected error", e?.message ?? String(e));
} finally {
  if (userId) {
    const { error: dErr } = await admin.auth.admin.deleteUser(userId);
    console.log(`\n[cleanup] delete ${email}: ${dErr ? "FAILED " + dErr.message : "ok"}`);
  }
}

console.log(`\n${failed.length === 0 ? "PASS ✅" : "FAIL ❌"} — ${pass} passed, ${failed.length} failed${failed.length ? ": " + failed.join(", ") : ""}`);
process.exit(failed.length === 0 ? 0 : 1);
