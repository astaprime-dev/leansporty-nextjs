#!/usr/bin/env node
// =============================================================================
// Cloudflare Stream secure-playback setup (E0.2 — the linchpin).
// Lists assets, generates a signing key, and flips requireSignedURLs +
// allowedOrigins on your VOD UIDs so raw UIDs stop playing.
//
// Run with Node's env-file loader so it reads your existing creds:
//   node --env-file=.env.local scripts/cloudflare-stream-setup.mjs <command>
//
// Commands:
//   list                 List every Stream video: uid, name, status, signed?  (READ-ONLY)
//   keys                 List existing signing keys                            (READ-ONLY)
//   keys:create          Create a signing key; prints KEY_ID + base64 PEM      (creates a key)
//   secure [uid...]      Set requireSignedURLs + allowedOrigins. No uids = ALL
//                        videos. DRY-RUN unless you pass --yes.
//   verify [uid...]      Assert requireSignedURLs=true and that the raw HLS
//                        URL returns 403 (needs *_CUSTOMER_CODE).             (READ-ONLY)
//
// Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (required);
//      NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE (for `verify`).
// =============================================================================

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CUSTOMER_CODE = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
const BASE = "https://api.cloudflare.com/client/v4";
const ALLOWED_ORIGINS = ["leansporty.com", "*.leansporty.com", "localhost:3000"];

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!ACCOUNT || !TOKEN) {
  die(
    "Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN.\n" +
      "  Run with: node --env-file=.env.local scripts/cloudflare-stream-setup.mjs <command>"
  );
}

async function cf(path, opts = {}) {
  const res = await fetch(`${BASE}/accounts/${ACCOUNT}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    throw new Error(
      `Cloudflare API ${path} failed: ${JSON.stringify(json.errors || json)}`
    );
  }
  return json.result;
}

async function listVideos() {
  // Stream lists up to 1000 per call; fine for a 15-asset catalog.
  return (await cf(`/stream?limit=1000`)) || [];
}

function fmtRow(v) {
  const signed = v.requireSignedURLs ? "🔒 signed" : "🔓 PUBLIC";
  const state = v.status?.state ?? "?";
  const name = v.meta?.name ?? "(no name)";
  return `  ${v.uid}  ${signed.padEnd(9)}  ${state.padEnd(10)}  ${name}`;
}

async function cmdList() {
  const vids = await listVideos();
  console.log(`\n${vids.length} Stream video(s):\n`);
  for (const v of vids) console.log(fmtRow(v));
  const open = vids.filter((v) => !v.requireSignedURLs);
  console.log(
    `\n${open.length} of ${vids.length} are PUBLIC (play from the raw UID).` +
      (open.length ? "  Run `secure --yes` to lock them.\n" : "  ✓ all locked.\n")
  );
}

async function cmdKeys() {
  const keys = await cf(`/stream/keys`);
  console.log(`\n${(keys || []).length} signing key(s):`);
  for (const k of keys || []) console.log(`  ${k.id}  created ${k.created}`);
  console.log("");
}

async function cmdKeysCreate() {
  const k = await cf(`/stream/keys`, { method: "POST" });
  console.log("\n✓ Signing key created. Add these to server env (NEVER NEXT_PUBLIC_):\n");
  console.log(`CLOUDFLARE_STREAM_KEY_ID=${k.id}`);
  console.log(`CLOUDFLARE_STREAM_KEY_PEM=${k.pem}`); // already base64; the app decodes it
  console.log("");
}

async function cmdSecure(uids, apply) {
  let targets = uids;
  if (targets.length === 0) {
    targets = (await listVideos()).map((v) => v.uid);
  }
  if (targets.length === 0) return console.log("No videos to secure.");

  console.log(
    `\n${apply ? "Securing" : "[DRY-RUN] Would secure"} ${targets.length} video(s) ` +
      `with requireSignedURLs=true, allowedOrigins=${JSON.stringify(ALLOWED_ORIGINS)}\n`
  );

  if (!apply) {
    for (const uid of targets) console.log(`  would update ${uid}`);
    console.log("\nRe-run with --yes to apply.\n");
    return;
  }

  let ok = 0;
  for (const uid of targets) {
    try {
      await cf(`/stream/${uid}`, {
        method: "POST",
        body: JSON.stringify({
          uid,
          requireSignedURLs: true,
          allowedOrigins: ALLOWED_ORIGINS,
        }),
      });
      console.log(`  ✓ ${uid}`);
      ok += 1;
    } catch (e) {
      console.log(`  ✗ ${uid} — ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${targets.length} secured. Run \`verify\` to confirm.\n`);
}

async function cmdVerify(uids) {
  let vids = await listVideos();
  if (uids.length) vids = vids.filter((v) => uids.includes(v.uid));

  let pass = 0;
  for (const v of vids) {
    const flagOk = v.requireSignedURLs === true;
    let rawBlocked = null;
    if (CUSTOMER_CODE) {
      try {
        const res = await fetch(
          `https://customer-${CUSTOMER_CODE}.cloudflarestream.com/${v.uid}/manifest/video.m3u8`
        );
        rawBlocked = res.status === 403;
      } catch {
        rawBlocked = null;
      }
    }
    const ok = flagOk && (rawBlocked === null || rawBlocked === true);
    if (ok) pass += 1;
    console.log(
      `  ${ok ? "✓" : "✗"} ${v.uid}  signed=${flagOk}` +
        (rawBlocked === null ? "" : `  rawReturns403=${rawBlocked}`)
    );
  }
  console.log(`\n${pass}/${vids.length} fully locked.\n`);
  if (!CUSTOMER_CODE)
    console.log(
      "(Set NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE to also test the raw-URL 403.)\n"
    );
}

const [cmd, ...rest] = process.argv.slice(2);
const apply = rest.includes("--yes");
const uids = rest.filter((a) => !a.startsWith("--"));

const run = {
  list: cmdList,
  keys: cmdKeys,
  "keys:create": cmdKeysCreate,
  secure: () => cmdSecure(uids, apply),
  verify: () => cmdVerify(uids),
}[cmd];

if (!run) {
  console.log(
    "Usage: node --env-file=.env.local scripts/cloudflare-stream-setup.mjs " +
      "<list|keys|keys:create|secure [uid...] [--yes]|verify [uid...]>"
  );
  process.exit(cmd ? 1 : 0);
}

run().catch((e) => die(e.message));
