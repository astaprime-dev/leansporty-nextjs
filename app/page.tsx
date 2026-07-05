import HeroDance from "@/components/hero-dance";
import { LeadCaptureForm } from "@/components/lead-capture-form";
import { createClient } from "@/utils/supabase/server";
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

  return (
    <div className="w-full">
      <HeroDance
        isAuthenticated={!!user}
        owned={owned}
        priceLabel={formatPrice(priceCents)}
        tryDayHref={tryDayHref}
      />
      <section className="border-t border-pink-100/70 bg-pink-50/40 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <LeadCaptureForm source="homepage" />
        </div>
      </section>
    </div>
  );
}
