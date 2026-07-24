import HeroDance from "@/components/hero-dance";

// The homepage share card must sell, not show the logo square.
export const metadata = {
  title: "Lean Sporty — dance yourself fit at home",
  description:
    "Short, feel-good dance workouts for women — no gym, no equipment, no experience needed. Led by a real choreographer. Day 1 is free to try.",
  openGraph: {
    title: "Lean Sporty — dance yourself fit at home",
    description:
      "Short, feel-good dance workouts for women — no equipment, beginner-friendly. Day 1 is free to try.",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Anastasiia, the Lean Sporty instructor, dancing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};
import { LeadCaptureForm } from "@/components/lead-capture-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CHALLENGE_SLUG, DEFAULT_PRICE_CENTS, formatPrice } from "@/lib/challenge";

export default async function Home() {
  // Auth + ownership state so the hero CTAs act directly (checkout / Day 1)
  // instead of hopping to /challenge, which repeats the same two buttons.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let owned = false;
  let priceCents = DEFAULT_PRICE_CENTS;
  let tryDayHref = "/challenge";

  // Only pitch live classes when there is actually something to join —
  // an empty /streams page undermines the whole story.
  const { count: liveClassCount } = await supabase
    .from("live_stream_sessions")
    .select("id", { count: "exact", head: true })
    .in("status", ["live", "scheduled"]);
  const { data: product } = await supabase
    .from("products")
    .select("id, price_cents")
    .eq("slug", CHALLENGE_SLUG)
    .eq("is_active", true)
    .maybeSingle();
  if (product) {
    priceCents = product.price_cents;

    // "Try Day 1 free" deep-links into the watch page (plays for everyone;
    // the rail + unlock CTA do the selling there).
    const { data: preview } = await supabase
      .from("product_items")
      .select("content_id")
      .eq("product_id", product.id)
      .eq("is_preview", true)
      .limit(1)
      .maybeSingle();
    if (preview) {
      tryDayHref = `/programs/${CHALLENGE_SLUG}/watch/${preview.content_id}`;
    }

    if (user) {
      const { data: ent } = await supabase
        .from("entitlements")
        .select("id")
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      owned = !!ent;
    }
  }

  // Buyers land straight in their training (the daily-habit ergonomic);
  // signed-in prospects still get the full marketing page.
  if (owned) redirect("/my-program");

  return (
    <div className="w-full">
      <HeroDance
        isAuthenticated={!!user}
        owned={owned}
        priceLabel={formatPrice(priceCents)}
        tryDayHref={tryDayHref}
        showLiveClasses={!!liveClassCount}
      />
      <section className="border-t border-pink-100/70 bg-pink-50/40 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <LeadCaptureForm source="homepage" />
        </div>
      </section>
    </div>
  );
}
