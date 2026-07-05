import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { programHasSales } from "@/lib/programs";
import {
  ProgramManager,
  type ManagedLesson,
  type ManagedProgram,
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
      "content_id, position, day_number, is_preview, item_label, workout:workouts(id, title, durationInSeconds, thumbnailUrl)"
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
    };
  });

  // In-flight uploads (uploading/processing) — instructor-readable via RLS.
  // Passed down so the manager can poll their status; polling is what promotes
  // a ready video into a lesson, so the page resumes it after navigation.
  const { data: pendingRows } = await supabase
    .from("program_uploads")
    .select("cloudflare_uid, title")
    .eq("product_id", product.id)
    .in("status", ["uploading", "processing"]);
  const pendingUploads = (pendingRows ?? []).map((r) => ({
    uid: r.cloudflare_uid,
    title: r.title,
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
      />
    </div>
  );
}
