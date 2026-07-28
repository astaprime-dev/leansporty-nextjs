import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { programHasSales } from "@/lib/programs";
import {
  ProgramManager,
  type ManagedLesson,
  type ManagedProgram,
  type LessonReplacement,
} from "@/components/instructor/program-manager";
import type { ProductConfig } from "@/types/commerce";

export const dynamic = "force-dynamic";

/**
 * Manage hub for one program. Server component: verifies ownership, loads the
 * program + lessons + in-flight uploads, and hands everything to the client
 * ProgramManager. Mutations go through /api/instructor/programs/*.
 */
export default async function ManageProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, slug, title, subtitle, description, cover_image_url, price_cents, currency, is_active, admin_disabled, config, instructor_id, kind"
    )
    .eq("id", id)
    .eq("kind", "course")
    .maybeSingle();
  if (!product || product.instructor_id !== instructor.id) notFound();

  const { data: rawItems } = await supabase
    .from("product_items")
    .select(
      "content_id, position, day_number, is_preview, item_label, workout:workouts(id, title, durationInSeconds, thumbnailUrl, subtitle, calories, description)"
    )
    .eq("product_id", product.id)
    .order("position", { ascending: true });

  const lessons: ManagedLesson[] = (rawItems ?? []).map((r) => {
    const w = Array.isArray(r.workout) ? r.workout[0] : r.workout;
    return {
      contentId: r.content_id,
      position: r.position,
      dayNumber: r.day_number,
      isPreview: r.is_preview,
      itemLabel: r.item_label,
      title: w?.title ?? null,
      durationInSeconds: w?.durationInSeconds ?? null,
      thumbnailUrl: w?.thumbnailUrl ?? null,
      styles: w?.subtitle ?? null,
      calories: w?.calories ?? null,
      description: w?.description ?? null,
    };
  });

  // In-flight uploads (uploading/processing) — instructor-readable via RLS.
  // Passed down so the manager can poll their status; polling is what promotes
  // a ready video into a lesson, so the page resumes it after navigation.
  // Replacements are excluded: they belong to a lesson that already exists.
  const { data: pendingRows } = await supabase
    .from("program_uploads")
    .select("cloudflare_uid, title, status")
    .eq("product_id", product.id)
    .in("status", ["uploading", "processing"])
    .is("replaces_workout_id", null);
  const pendingUploads = (pendingRows ?? []).map((r) => ({
    uid: r.cloudflare_uid,
    title: r.title,
    status: r.status as "uploading" | "processing",
  }));

  // New videos staged for existing lessons, at any stage — including 'applied',
  // where the lesson is already using the new video but the old one is kept
  // until the instructor discards it.
  const { data: replacementRows } = await supabase
    .from("program_uploads")
    .select("cloudflare_uid, status, replaces_workout_id")
    .eq("product_id", product.id)
    .not("replaces_workout_id", "is", null);
  const replacements: LessonReplacement[] = (replacementRows ?? []).map((r) => ({
    uid: r.cloudflare_uid,
    contentId: r.replaces_workout_id as string,
    status: r.status as LessonReplacement["status"],
  }));

  const hasSales = await programHasSales(product.id);

  const config = (product.config ?? {}) as ProductConfig;
  const program: ManagedProgram = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    priceCents: product.price_cents,
    currency: product.currency,
    isActive: product.is_active,
    adminDisabled: product.admin_disabled,
    structure: config.structure === "days" ? "days" : "list",
    programLengthDays: config.program_length_days ?? null,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/instructor/programs"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Programs
      </Link>

      <h1 className="text-3xl font-display font-light text-gray-900 mb-8 break-words">
        {product.title}
      </h1>

      <ProgramManager
        program={program}
        lessons={lessons}
        hasSales={hasSales}
        pendingUploads={pendingUploads}
        replacements={replacements}
      />

      <StudentFeedback productId={product.id} lessons={lessons} />
    </div>
  );
}

/**
 * Private per-lesson feedback from buyers (program_lesson_feedback — RLS lets
 * the owning instructor read it). Aggregated per lesson + the latest notes.
 */
async function StudentFeedback({
  productId,
  lessons,
}: {
  productId: string;
  lessons: ManagedLesson[];
}) {
  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from("program_lesson_feedback")
    .select("content_id, sentiment, comment_text, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!feedback || feedback.length === 0) return null;

  const titleByContent = new Map(
    lessons.map((l) => [l.contentId, l.itemLabel || l.title || "Untitled lesson"])
  );
  const byLesson = new Map<string, { up: number; down: number }>();
  for (const f of feedback) {
    const s = byLesson.get(f.content_id) ?? { up: 0, down: 0 };
    if (f.sentiment === "up") s.up += 1;
    else s.down += 1;
    byLesson.set(f.content_id, s);
  }
  const notes = feedback.filter((f) => f.comment_text).slice(0, 8);

  return (
    <section className="mt-6 rounded-2xl border border-pink-100 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Student feedback</h2>
      <p className="text-sm text-gray-400 mb-4">
        Private — only you can see this.
      </p>

      <ul className="space-y-1 text-sm">
        {Array.from(byLesson.entries()).map(([contentId, s]) => (
          <li key={contentId} className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-gray-700">
              {titleByContent.get(contentId) ?? "Removed lesson"}
            </span>
            <span className="shrink-0 text-green-600">👍 {s.up}</span>
            <span className="shrink-0 text-gray-400">👎 {s.down}</span>
          </li>
        ))}
      </ul>

      {notes.length > 0 && (
        <div className="mt-4 border-t border-pink-50 pt-4 space-y-3">
          {notes.map((f, i) => (
            <div key={i} className="text-sm">
              <p className="text-gray-700">&ldquo;{f.comment_text}&rdquo;</p>
              <p className="text-xs text-gray-400">
                {titleByContent.get(f.content_id) ?? "Removed lesson"} ·{" "}
                {new Date(f.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
