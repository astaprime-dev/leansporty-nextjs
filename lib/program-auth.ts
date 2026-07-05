import { createClient } from "@/utils/supabase/server";

/**
 * Shared guard for the instructor programs API: authenticated user → their
 * instructors row → a program (kind='course') they own. Reads with the
 * cookie-bound RLS client; mutations in the calling route then use the
 * service-role client (products has no user write policies).
 */
export type OwnedProgram = {
  userId: string;
  instructorId: string;
  program: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    cover_image_url: string | null;
    price_cents: number;
    currency: string;
    is_active: boolean;
    admin_disabled: boolean;
    published_at: string | null;
    config: Record<string, unknown> | null;
  };
};

export type ProgramAuthResult =
  | { ok: true; ctx: OwnedProgram }
  | { ok: false; status: 401 | 403 | 404; error: string };

export async function getOwnedProgram(programId: string): Promise<ProgramAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) return { ok: false, status: 403, error: "Not an instructor" };

  const { data: program } = await supabase
    .from("products")
    .select(
      "id, slug, title, subtitle, description, cover_image_url, price_cents, currency, is_active, admin_disabled, published_at, config, instructor_id, kind"
    )
    .eq("id", programId)
    .eq("kind", "course")
    .maybeSingle();
  if (!program || program.instructor_id !== instructor.id) {
    return { ok: false, status: 404, error: "Program not found" };
  }

  return {
    ok: true,
    ctx: { userId: user.id, instructorId: instructor.id, program },
  };
}

/** Auth + instructor lookup only (for routes not scoped to one program). */
export async function getInstructorContext(): Promise<
  | { ok: true; userId: string; instructorId: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) return { ok: false, status: 403, error: "Not an instructor" };

  return { ok: true, userId: user.id, instructorId: instructor.id };
}
