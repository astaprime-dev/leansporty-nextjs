import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { Clock, Film, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProgramData } from "./data";
import { ProgramGrid } from "@/components/challenge/program-grid";
import { LessonList } from "@/components/programs/lesson-list";
import { CheckoutButton, FinalizingAccess } from "@/components/challenge/cta";
import {
  buildProgramDays,
  completedWorkoutDays,
  formatPrice,
  isDripEnabled,
  programLengthDays,
  totalWorkoutDays,
} from "@/lib/challenge";
import type { ProductConfig } from "@/types/commerce";

export const dynamic = "force-dynamic";

/**
 * Social metadata for shared program links — instructors share these on
 * Instagram/WhatsApp, so the preview card (cover, title, subtitle) IS the ad.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("products")
    .select("title, subtitle, description, cover_image_url, is_active, admin_disabled")
    .eq("slug", slug)
    .eq("kind", "course")
    .maybeSingle();

  if (!p || !p.is_active || p.admin_disabled) {
    return { title: "Program · Lean Sporty" };
  }

  const description =
    p.subtitle ??
    (p.description ? p.description.slice(0, 160) : null) ??
    "A follow-along dance program on Lean Sporty.";

  return {
    title: `${p.title} · Lean Sporty`,
    description,
    openGraph: {
      title: p.title,
      description,
      type: "website",
      ...(p.cover_image_url ? { images: [{ url: p.cover_image_url }] } : {}),
    },
    twitter: {
      card: p.cover_image_url ? "summary_large_image" : "summary",
      title: p.title,
      description,
    },
  };
}

/**
 * Public program page — one route, two states:
 * - not owned → sales page (cover, instructor byline, curriculum, free
 *   preview playable, checkout CTA);
 * - owned → the training view with progress (grid for day-plan programs,
 *   ordered list otherwise).
 * Off-sale / admin-disabled programs 404 for everyone but existing buyers.
 */
export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { slug } = await params;
  const { purchased } = await searchParams;

  const data = await getProgramData(slug);
  if (!data) notFound();

  const { product, items, instructor, owned } = data;
  const config = (product.config ?? {}) as ProductConfig;
  // Days mode needs day_number assignments; until the instructor sets them,
  // fall back to the ordered list so lessons are never invisible.
  const isDays =
    config.structure === "days" && items.some((it) => it.day_number != null);
  const priceLabel = formatPrice(product.price_cents, product.currency);
  const pagePath = `/programs/${slug}`;

  const totalMinutes = Math.round(
    items.reduce((acc, it) => acc + (it.workout?.durationInSeconds ?? 0), 0) / 60
  );

  // Aggregate distinct dance styles across lessons for the header pills.
  const programStyles = Array.from(
    new Set(
      items.flatMap((it) =>
        (it.workout?.subtitle ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    )
  ).slice(0, 8);

  let gridDays = null;
  let done = 0;
  let total = items.length;
  if (isDays) {
    gridDays = buildProgramDays(programLengthDays(config), items, {
      owned,
      completedContentIds: new Set(data.completedContentIds),
      dripEnabled: isDripEnabled(config),
      grantedAt: data.grantedAt,
    });
    total = totalWorkoutDays(gridDays);
    done = completedWorkoutDays(gridDays);
  } else {
    const completedSet = new Set(data.completedContentIds);
    done = items.filter((it) => completedSet.has(it.content_id)).length;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const accessUntil = data.expiresAt
    ? new Date(data.expiresAt).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // "Continue" = first incomplete playable lesson (or the first lesson again).
  const completedSet = new Set(data.completedContentIds);
  const continueLesson = owned
    ? items.find((it) => it.workout && !completedSet.has(it.content_id)) ??
      items.find((it) => it.workout) ??
      null
    : null;
  const watchBasePath = `${pagePath}/watch`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {purchased === "1" && !owned && <FinalizingAccess slug={slug} />}

      <header className="mb-8">
        {!owned && product.cover_image_url && (
          <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50">
            <Image
              src={product.cover_image_url}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl sm:text-4xl font-light text-gray-900">
            {product.title}
          </h1>
          {isDays && <Badge variant="brand">Day-by-day plan</Badge>}
        </div>

        {product.subtitle && (
          <p className="mt-2 text-lg text-gray-600">{product.subtitle}</p>
        )}

        {instructor && (
          <Link
            href={instructor.slug ? `/@${instructor.slug}` : "#"}
            className="mt-4 inline-flex items-center gap-3 group"
          >
            {instructor.photoUrl ? (
              <Image
                src={instructor.photoUrl}
                alt={instructor.displayName ?? "Instructor"}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-500 font-medium">
                {(instructor.displayName ?? "?").charAt(0)}
              </span>
            )}
            <span className="text-sm text-gray-600 group-hover:text-pink-500 transition-colors">
              with{" "}
              <span className="font-medium">
                {instructor.displayName ?? "your instructor"}
              </span>
            </span>
          </Link>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            {items.length} lesson{items.length === 1 ? "" : "s"}
          </span>
          {totalMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {totalMinutes} minutes total
            </span>
          )}
          {data.reviewSummary && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {data.reviewSummary.average}{" "}
              <span className="text-gray-400">
                ({data.reviewSummary.count} review
                {data.reviewSummary.count === 1 ? "" : "s"})
              </span>
            </span>
          )}
        </div>

        {programStyles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {programStyles.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-600 ring-1 ring-pink-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {owned ? (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {done} of {total} lessons complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            {accessUntil && (
              <p className="mt-2 text-xs text-muted-foreground">
                Access until {accessUntil}
              </p>
            )}
            {continueLesson && (
              <Button asChild variant="brand" size="lg" className="mt-4">
                <Link href={`${pagePath}/watch/${continueLesson.content_id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  {done === 0 ? "Start the program" : "Continue"}
                  {continueLesson.workout?.title || continueLesson.item_label
                    ? ` — ${continueLesson.item_label || continueLesson.workout?.title}`
                    : ""}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-6">
            {product.description && (
              <p className="mb-4 whitespace-pre-line text-gray-700">
                {product.description}
              </p>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <CheckoutButton
                productSlug={product.slug}
                isAuthenticated={data.isAuthenticated}
                owned={owned}
                next={pagePath}
                label={`Get the program — ${priceLabel}`}
                returnPath={pagePath}
                ownedHref={pagePath}
                className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:opacity-90"
              />
              <p className="text-sm text-gray-500">
                One-time payment · 12 months of access
                {items.some((it) => it.is_preview) && " · First look free below"}
              </p>
            </div>
          </div>
        )}
      </header>

      {isDays && gridDays ? (
        <ProgramGrid
          days={gridDays}
          priceLabel={priceLabel}
          paywallHref={pagePath}
          revalidatePath={pagePath}
          {...(owned ? { watchBasePath } : {})}
        />
      ) : (
        <LessonList
          items={items}
          owned={owned}
          completedContentIds={data.completedContentIds}
          priceLabel={priceLabel}
          paywallHref={pagePath}
          revalidatePath={pagePath}
          {...(owned ? { watchBasePath } : {})}
        />
      )}
    </div>
  );
}
