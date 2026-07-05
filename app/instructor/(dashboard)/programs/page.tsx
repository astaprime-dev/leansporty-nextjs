import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Film, Plus, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { CopyLinkButton } from "@/components/instructor/copy-link-button";
import { createClient } from "@/utils/supabase/server";
import { formatPrice } from "@/lib/challenge";
import type { ProductConfig } from "@/types/commerce";

export const dynamic = "force-dynamic";

/**
 * Instructor Studio → Programs: every program (draft + published) with cover,
 * content stats (lessons, total minutes) and money stats (price, sold,
 * earned). Reads with the RLS client — products/product_items are publicly
 * readable and instructor_payouts are readable by their owner.
 */
export default async function InstructorProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/instructor/programs");

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) redirect("/instructor/profile");

  const { data: programs } = await supabase
    .from("products")
    .select(
      "id, slug, title, subtitle, cover_image_url, price_cents, currency, is_active, admin_disabled, published_at, created_at, config"
    )
    .eq("kind", "course")
    .eq("instructor_id", instructor.id)
    .order("created_at", { ascending: false });

  const list = programs ?? [];
  const ids = list.map((p) => p.id);

  // Lessons + duration per program.
  const lessonStats = new Map<string, { count: number; seconds: number }>();
  if (ids.length > 0) {
    const { data: items } = await supabase
      .from("product_items")
      .select("product_id, workout:workouts(durationInSeconds)")
      .in("product_id", ids);
    for (const it of items ?? []) {
      const w = Array.isArray(it.workout) ? it.workout[0] : it.workout;
      const s = lessonStats.get(it.product_id) ?? { count: 0, seconds: 0 };
      s.count += 1;
      s.seconds += w?.durationInSeconds ?? 0;
      lessonStats.set(it.product_id, s);
    }
  }

  // Sales + earnings per program (own rows via RLS).
  const salesStats = new Map<string, { sold: number; earnedCents: number }>();
  const { data: payouts } = await supabase
    .from("instructor_payouts")
    .select("product_id, instructor_share_cents")
    .eq("instructor_id", instructor.id);
  for (const p of payouts ?? []) {
    if (!p.product_id) continue;
    const s = salesStats.get(p.product_id) ?? { sold: 0, earnedCents: 0 };
    s.sold += 1;
    s.earnedCents += p.instructor_share_cents ?? 0;
    salesStats.set(p.product_id, s);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">
            Programs
          </h1>
          <p className="text-gray-600 mt-1">
            Video programs your students can buy and follow anytime
          </p>
        </div>
        <Link href="/instructor/programs/create" className="shrink-0">
          <Button variant="brand" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Program
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No programs yet"
          description="Turn your videos and class recordings into a program your students can buy anytime."
          action={
            <Link href="/instructor/programs/create">
              <Button variant="brand">Create Your First Program</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {list.map((p) => {
            const stats = lessonStats.get(p.id) ?? { count: 0, seconds: 0 };
            const sales = salesStats.get(p.id) ?? { sold: 0, earnedCents: 0 };
            const minutes = Math.round(stats.seconds / 60);
            const config = (p.config ?? {}) as ProductConfig;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 hover:border-pink-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Cover */}
                  <Link
                    href={`/instructor/programs/${p.id}`}
                    className="relative aspect-video w-full sm:w-48 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-rose-50"
                  >
                    {p.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Film className="h-6 w-6 text-pink-300" />
                      </span>
                    )}
                  </Link>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                      <Link
                        href={`/instructor/programs/${p.id}`}
                        className="group/title min-w-0"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 break-words transition-colors group-hover/title:text-pink-500">
                          {p.title}
                        </h3>
                      </Link>
                      <Badge
                        variant={
                          p.admin_disabled
                            ? "destructive"
                            : p.is_active
                            ? "brand"
                            : "secondary"
                        }
                        className="shrink-0"
                      >
                        {p.admin_disabled
                          ? "DISABLED"
                          : p.is_active
                          ? "PUBLISHED"
                          : "DRAFT"}
                      </Badge>
                    </div>

                    {p.subtitle && (
                      <p className="text-gray-600 mb-2 break-words">{p.subtitle}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="font-medium text-gray-900">
                        {formatPrice(p.price_cents, p.currency)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Film className="w-4 h-4" />
                        {stats.count} lesson{stats.count === 1 ? "" : "s"}
                      </span>
                      {minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {minutes} min
                        </span>
                      )}
                      <span className="text-gray-400">
                        {config.structure === "days"
                          ? `Day plan · ${config.program_length_days ?? "?"} days`
                          : "Lesson list"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        {sales.sold} sold
                      </span>
                      {sales.earnedCents > 0 && (
                        <span className="flex items-center gap-1 font-medium text-green-700">
                          <TrendingUp className="w-4 h-4" />
                          {formatPrice(sales.earnedCents, p.currency)} earned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 sm:w-36 sm:items-stretch">
                    <Link
                      href={`/instructor/programs/${p.id}`}
                      className="flex-1 sm:flex-initial"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Link>
                    {p.is_active && !p.admin_disabled && (
                      <>
                        <CopyLinkButton
                          path={`/programs/${p.slug}`}
                          label="Copy link"
                          className="flex-1 sm:flex-initial"
                        />
                        <Link
                          href={`/programs/${p.slug}`}
                          target="_blank"
                          className="flex-1 sm:flex-initial"
                        >
                          <Button variant="ghost" size="sm" className="w-full">
                            View Page
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
