import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Share card for /teach — this link gets DM'd to prospective instructors, so
// the preview must state the deal, not show a logo square. Rendered at build
// time; photo is the stock dancer (not Anastasiia — her photos stay on the
// home/challenge cards).
export const alt = "Teach on Lean Sporty — keep 80% of every sale after VAT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const photo = await readFile(
    join(process.cwd(), "public", "og-teach-photo.jpg")
  );
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

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
            padding: "0 56px 0 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#111827",
              marginBottom: 28,
            }}
          >
            Lean&nbsp;
            <span style={{ color: "#ec4899", fontWeight: 600 }}>Sporty</span>
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            Teach dance & fitness online
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              background: "linear-gradient(90deg, #ec4899, #fb7185)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 28,
            }}
          >
            Keep 80% of every sale after VAT
          </div>
          <div style={{ fontSize: 26, color: "#4b5563", lineHeight: 1.4 }}>
            Live classes & your own programs. No monthly fee — you teach, we
            run everything else.
          </div>
        </div>

        {/* Photo panel */}
        <img
          src={photoSrc}
          width={470}
          height={630}
          style={{ objectFit: "cover", objectPosition: "50% 30%" }}
        />
      </div>
    ),
    size
  );
}
