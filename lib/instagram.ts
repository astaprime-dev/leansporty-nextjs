/**
 * Instagram Business Discovery — the official way to read a public professional
 * account's bio and follower count.
 *
 * Why this exists: scraping instagram.com server-side returns a login wall (no
 * og:description, title just "Instagram"), so a prospect found by the Places
 * sweep arrives with nothing but a handle. Without a bio the ICP scorer has
 * almost nothing to judge, and without a follower count it cannot check the
 * "roughly 5k–50k with real engagement" criterion at all — individual
 * instructors were landing at "probably, but unverifiable" and being dropped.
 *
 * Business Discovery is a field on OUR own IG user node: we ask Meta about
 * another account by username and get back its public professional profile.
 *
 * Limits worth knowing before trusting the output:
 *  - Both ends must be professional accounts. If she is on a personal account,
 *    Meta returns an error and we simply learn nothing — that is not a signal
 *    about her, so never treat it as a rejection.
 *  - It returns the bio and the counts, not engagement. "Real engagement" still
 *    needs a human (or the browser lane) to eyeball.
 *
 * Setup (one-time, founder): a Meta app with the Instagram Graph API product,
 * @leansporty linked to a Facebook Page, then a long-lived token.
 *   IG_GRAPH_TOKEN — long-lived access token
 *   IG_USER_ID     — the Instagram-scoped id of our own professional account
 * Absent either, every call returns null and callers fall back to whatever
 * context the discovering lane collected.
 */

const GRAPH_VERSION = "v21.0";

export type InstagramProfile = {
  handle: string;
  name: string | null;
  biography: string | null;
  followers: number | null;
  mediaCount: number | null;
  website: string | null;
};

export function instagramConfigured(): boolean {
  return Boolean(process.env.IG_GRAPH_TOKEN && process.env.IG_USER_ID);
}

/**
 * Look up one public professional account. Returns null when the API is not
 * configured, the account is personal/private/missing, or Meta errors — all of
 * which mean "no information", never "not a fit".
 */
export async function businessDiscovery(
  handle: string
): Promise<InstagramProfile | null> {
  const token = process.env.IG_GRAPH_TOKEN;
  const userId = process.env.IG_USER_ID;
  if (!token || !userId) return null;

  // The username is interpolated into a Graph field expression, so allow only
  // the characters a real handle can contain — no parentheses, no braces.
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) return null;

  const fields = `business_discovery.username(${handle}){username,name,biography,followers_count,media_count,website}`;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(
    userId
  )}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const data = (await res.json()) as {
      business_discovery?: {
        username?: string;
        name?: string;
        biography?: string;
        followers_count?: number;
        media_count?: number;
        website?: string;
      };
      error?: { message?: string; code?: number };
    };

    if (!res.ok || data.error || !data.business_discovery) {
      // Code 110 / "does not exist" is the normal answer for a personal
      // account. Log the rest so a broken token is visible rather than silent.
      if (data.error && data.error.code !== 110) {
        console.warn(
          `business_discovery(${handle}) failed:`,
          data.error.message ?? res.status
        );
      }
      return null;
    }

    const d = data.business_discovery;
    return {
      handle: d.username ?? handle,
      name: d.name ?? null,
      biography: d.biography ?? null,
      followers: typeof d.followers_count === "number" ? d.followers_count : null,
      mediaCount: typeof d.media_count === "number" ? d.media_count : null,
      website: d.website ?? null,
    };
  } catch (e) {
    console.warn(`business_discovery(${handle}) threw:`, e);
    return null;
  }
}
