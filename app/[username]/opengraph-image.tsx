import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

/**
 * Share card for instructor profiles — the profile link is the instructor's
 * main sharing artifact, so the preview must show HER (photo, name, page
 * address), not the platform logo. Unknown slugs and plain users get a brand
 * card; every failure path must still render (a thrown error here means
 * scrapers see a broken image).
 *
 * Bare anon client: no cookies exist in this rendering context, and both
 * `instructors` and `user_profiles` have public SELECT policies.
 */

export const alt = "Instructor on Lean Sporty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PINK = "#ec4899";
const INK = "#111827";

function looksLikeAssetPath(slug: string): boolean {
  return /\.[a-z0-9]{1,5}$/i.test(slug);
}

async function loadProfile(slug: string): Promise<{
  displayName: string;
  photoSrc: string | null;
} | null> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: instructor } = await db
      .from("instructors")
      .select("user_id")
      .eq("slug", slug)
      .maybeSingle();
    if (!instructor) return null;

    const { data: profile } = await db
      .from("user_profiles")
      .select("display_name, profile_photo_url")
      .eq("user_id", instructor.user_id)
      .maybeSingle();
    if (!profile?.display_name) return null;

    let photoSrc: string | null = null;
    if (profile.profile_photo_url) {
      try {
        const res = await fetch(profile.profile_photo_url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          // Oversized originals would blow up the card render — skip, keep initial.
          if (buf.byteLength <= 8_000_000) {
            const type = res.headers.get("content-type") ?? "image/jpeg";
            photoSrc = `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
          }
        }
      } catch {
        // Unreachable photo → initial fallback below.
      }
    }

    return { displayName: profile.display_name, photoSrc };
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const slug = decodeURIComponent(username);
  const profile = looksLikeAssetPath(slug) ? null : await loadProfile(slug);

  if (!profile) {
    // Brand fallback for plain users / unknown slugs.
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #fff 0%, #fdf2f8 100%)",
          }}
        >
          <div style={{ display: "flex", fontSize: 64, color: INK }}>
            Lean&nbsp;
            <span style={{ color: PINK, fontWeight: 600 }}>Sporty</span>
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 30, color: "#4b5563" }}>
            Dance yourself fit at home
          </div>
        </div>
      ),
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #fff 0%, #fdf2f8 100%)",
        }}
      >
        {/* Text panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 48px 0 64px",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: INK, marginBottom: 28 }}>
            Lean&nbsp;
            <span style={{ color: PINK, fontWeight: 600 }}>Sporty</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            {profile.displayName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#4b5563",
              marginBottom: 24,
            }}
          >
            Live dance & fitness classes
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: PINK,
            }}
          >
            leansporty.com/@{slug}
          </div>
        </div>

        {/* Photo panel — profile photo, or a big initial on brand gradient */}
        {profile.photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoSrc}
            width={470}
            height={630}
            style={{ objectFit: "cover", objectPosition: "50% 25%" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 470,
              height: 630,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #ec4899 0%, #fb7185 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 240,
                height: 240,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.25)",
                fontSize: 130,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    ),
    size
  );
}
