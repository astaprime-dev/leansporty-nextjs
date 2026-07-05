import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getChallengeData } from "@/app/challenge/data";
import { ProgramGrid } from "@/components/challenge/program-grid";
import { FinalizingAccess } from "@/components/challenge/cta";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import {
  CHALLENGE_SLUG,
  buildProgramDays,
  completedWorkoutDays,
  formatPrice,
  isDripEnabled,
  mergeCanonicalItems,
  programLengthDays,
  totalWorkoutDays,
} from "@/lib/challenge";

export const dynamic = "force-dynamic";

export default async function MyProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { purchased } = await searchParams;

  // Auth required. Anonymous deep-link → the public landing (which carries the
  // sign-in CTAs that resume into My Program). CHALLENGE §9.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/challenge");

  const data = await getChallengeData();

  // Instructor programs the user owns (kind='course') — linked below so this
  // page stays the single "my training" entry point.
  const { data: ownedProgramEnts } = await supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", user.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  const ownedProductIds = (ownedProgramEnts ?? []).map((e) => e.product_id);
  const { data: ownedPrograms } = ownedProductIds.length
    ? await supabase
        .from("products")
        .select("id, slug, title, subtitle, cover_image_url")
        .eq("kind", "course")
        .in("id", ownedProductIds)
    : { data: null };

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Your program is being prepared"
          description="Check back shortly — your sessions will appear here."
        />
      </div>
    );
  }

  const { product, owned, expiresAt } = data;
  const accessUntil = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const totalDays = programLengthDays(product.config);
  const priceLabel = formatPrice(product.price_cents, product.currency);

  const days = buildProgramDays(
    totalDays,
    mergeCanonicalItems(data.items, product.id),
    {
      owned,
      completedContentIds: new Set(data.completedContentIds),
      dripEnabled: isDripEnabled(product.config),
      grantedAt: data.grantedAt,
    }
  );

  const total = totalWorkoutDays(days);
  const done = completedWorkoutDays(days);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Post-checkout: poll for the async webhook grant so no paywall flashes. */}
      {purchased === "1" && !owned && <FinalizingAccess slug={CHALLENGE_SLUG} />}

      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-light text-gray-900">{product.title}</h1>
        {owned ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {done} of {total} sessions complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {done === 0
                ? "Ready when you are — start with Day 1."
                : done >= total
                  ? "You finished the challenge — amazing work! 🎉"
                  : "Keep the momentum going — your next session is ready."}
            </p>
            {accessUntil && (
              <p className="mt-1 text-xs text-muted-foreground">
                Access until {accessUntil}
              </p>
            )}
            {done >= total && total > 0 && (
              <Button asChild variant="brandOutline" className="mt-4">
                <Link href="/streams">
                  What&apos;s next? Join a live class →
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Alert variant="info" className="mt-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Day 1 is free to try. Unlock all sessions with a full year of access.
              </p>
              <Button asChild variant="brand">
                <Link href="/challenge">Unlock the full challenge — {priceLabel}</Link>
              </Button>
            </div>
          </Alert>
        )}
      </header>

      <ProgramGrid days={days} priceLabel={priceLabel} />

      {ownedPrograms && ownedPrograms.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-light text-gray-900">
            Your programs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedPrograms.map((p) => (
              <Link
                key={p.id}
                href={`/programs/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-pink-100 bg-white transition-all hover:border-pink-300 hover:shadow-md"
              >
                <div className="relative aspect-video bg-gradient-to-br from-pink-50 to-rose-50">
                  {p.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-pink-500">
                    {p.title}
                  </h3>
                  {p.subtitle && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {p.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
