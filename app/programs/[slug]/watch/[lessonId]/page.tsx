import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProgramData } from "../../data";
import { WatchView, type WatchLessonFeedback } from "@/components/programs/watch-view";

export const dynamic = "force-dynamic";

/**
 * The watch experience for one lesson: player + playlist rail. Deep-linkable
 * (post-purchase email, "Continue" buttons). Access rule per lesson: buyers
 * and the program's instructor watch everything; signed-in visitors can watch
 * the free preview; everyone else is routed to the program page (recovery,
 * never a dead-end) — actual video access is enforced server-side by the
 * playback-token route regardless.
 */
export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  const data = await getProgramData(slug);
  if (!data) notFound();

  const item = data.items.find((it) => it.content_id === lessonId);
  if (!item) notFound();

  const playable =
    data.owned || data.isOwnerInstructor || (item.is_preview && data.isAuthenticated);
  if (!playable) {
    redirect(`/programs/${slug}`);
  }

  // The caller's private feedback + saved playback position (RLS: own rows).
  let myFeedback: WatchLessonFeedback = null;
  let resumeSeconds = 0;
  if (data.owned) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const [{ data: fb }, { data: prog }] = await Promise.all([
        supabase
          .from("program_lesson_feedback")
          .select("sentiment, comment_text")
          .eq("product_id", data.product.id)
          .eq("content_id", lessonId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("workout_progress")
          .select("last_position_seconds, completed_at")
          .eq("user_id", user.id)
          .eq("workout_id", lessonId)
          .maybeSingle(),
      ]);
      myFeedback = (fb as WatchLessonFeedback) ?? null;
      // Resume only mid-lesson: skip trivial positions, and don't resume a
      // lesson already completed (rewatching starts fresh).
      const pos = prog?.last_position_seconds ?? 0;
      const duration = item.workout?.durationInSeconds ?? 0;
      if (!prog?.completed_at && pos >= 30 && (duration === 0 || pos < duration - 20)) {
        resumeSeconds = pos;
      }
    }
  }

  return (
    <WatchView
      slug={slug}
      productId={data.product.id}
      programTitle={data.product.title}
      instructorName={data.instructor?.displayName ?? null}
      items={data.items}
      currentContentId={lessonId}
      owned={data.owned}
      isOwnerInstructor={data.isOwnerInstructor}
      completedContentIds={data.completedContentIds}
      myReview={data.myReview}
      myFeedback={myFeedback}
      resumeSeconds={resumeSeconds}
    />
  );
}
