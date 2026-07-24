import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CHALLENGE_SLUG, formatPrice, mergeCanonicalItems } from "@/lib/challenge";
import { getProgramData } from "../../data";
import { WatchView, type WatchLessonFeedback } from "@/components/programs/watch-view";

export const dynamic = "force-dynamic";

// Gated, thin content — the sales page is the canonical, indexable page.
export const metadata = {
  robots: { index: false, follow: false },
};

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
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { slug, lessonId } = await params;
  const { purchased } = await searchParams;

  const data = await getProgramData(slug);
  if (!data) notFound();

  const item = data.items.find((it) => it.content_id === lessonId);
  if (!item) notFound();

  // Preview lessons play for EVERYONE (including anonymous) — the watch page
  // doubles as the sales demo: Day 1 plays, the rail shows the locked rest,
  // and the unlock CTA sits under the player. The token route enforces the
  // same rule server-side.
  const playable = data.owned || data.isOwnerInstructor || item.is_preview;
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

  // The challenge always presents its full canonical 3×5 structure — the rail
  // tells the same 15-session story as the sales page, with not-yet-uploaded
  // days shown as "coming soon" rather than silently missing.
  const items =
    slug === CHALLENGE_SLUG
      ? mergeCanonicalItems(data.items, data.product.id).map((it) =>
          it.workout ? it : { ...it, item_label: `Day ${it.day_number}` }
        )
      : data.items;

  return (
    <WatchView
      slug={slug}
      productId={data.product.id}
      programTitle={data.product.title}
      instructorName={data.instructor?.displayName ?? null}
      items={items}
      currentContentId={lessonId}
      owned={data.owned}
      isOwnerInstructor={data.isOwnerInstructor}
      isAuthenticated={data.isAuthenticated}
      priceLabel={formatPrice(data.product.price_cents, data.product.currency)}
      completedContentIds={data.completedContentIds}
      myReview={data.myReview}
      myFeedback={myFeedback}
      resumeSeconds={resumeSeconds}
      justPurchased={purchased === "1" && data.owned}
    />
  );
}
