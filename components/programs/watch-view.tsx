"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Clock,
  Flame,
  Footprints,
  Lock,
  Play,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";
import { SecureStreamPlayer } from "@/components/SecureStreamPlayer";
import { PurchaseCelebration } from "@/components/purchase-celebration";
import { CheckoutButton } from "@/components/challenge/cta";
import { savePlaybackPosition, setWorkoutComplete } from "@/app/challenge/actions";
import { trackEvent } from "@/lib/analytics";
import { submitLessonFeedback, submitProgramReview } from "@/app/programs/actions";
import { formatDuration } from "@/lib/challenge";
import type { ProductItem } from "@/types/commerce";

export type WatchLessonFeedback = {
  sentiment: "up" | "down";
  comment_text: string | null;
} | null;

/**
 * The watch experience: player + playlist rail.
 * - Mobile: the player sticks to the top of the viewport so the video never
 *   scrolls away mid-workout; everything below is one-thumb reachable.
 * - Desktop: player left (2/3), playlist right with progress; the current
 *   lesson is highlighted, locked lessons tease the rest of the program.
 * - One primary action: "Mark complete & continue" (progress + next lesson
 *   in a single tap).
 * - Feedback where motivation peaks: private thumbs to the instructor per
 *   lesson, public star review for the program.
 */
export function WatchView({
  slug,
  productId,
  programTitle,
  instructorName,
  items,
  currentContentId,
  owned,
  isOwnerInstructor,
  isAuthenticated,
  priceLabel,
  completedContentIds,
  myReview,
  myFeedback,
  resumeSeconds = 0,
  justPurchased = false,
}: {
  slug: string;
  productId: string;
  programTitle: string;
  instructorName: string | null;
  items: ProductItem[];
  currentContentId: string;
  owned: boolean;
  isOwnerInstructor: boolean;
  isAuthenticated: boolean;
  priceLabel: string;
  completedContentIds: string[];
  myReview: { rating: number; comment_text: string | null } | null;
  myFeedback: WatchLessonFeedback;
  /** Saved playback position to resume from (0 = start fresh). */
  resumeSeconds?: number;
  /** Arrived from a successful checkout — celebrate before the player. */
  justPurchased?: boolean;
}) {
  const router = useRouter();
  const programPath = `/programs/${slug}`;
  const watchPath = (contentId: string) => `${programPath}/watch/${contentId}`;

  const completed = useMemo(() => new Set(completedContentIds), [completedContentIds]);
  const currentIndex = items.findIndex((it) => it.content_id === currentContentId);
  const current = items[currentIndex];
  const isCompleted = completed.has(currentContentId);

  const nextPlayable = useMemo(() => {
    for (let i = currentIndex + 1; i < items.length; i++) {
      const it = items[i];
      if (it.workout && (owned || isOwnerInstructor || it.is_preview)) return it;
    }
    return null;
  }, [items, currentIndex, owned, isOwnerInstructor]);

  const [isPending, startTransition] = useTransition();

  function completeAndContinue() {
    startTransition(async () => {
      if (!isCompleted) {
        await setWorkoutComplete(currentContentId, true, watchPath(currentContentId));
      }
      if (nextPlayable) {
        router.push(watchPath(nextPlayable.content_id));
      } else {
        router.refresh();
      }
    });
  }

  // ---- Resume position ("Start over" re-keys the player) ----
  const [startAt, setStartAt] = useState(resumeSeconds);

  // Funnel: distinguishes buyers training vs prospects sampling the preview
  // (pageviews alone can't tell them apart).
  useEffect(() => {
    trackEvent("watch_view", {
      program: slug,
      owned: owned ? "yes" : "no",
    });
  }, [slug, currentContentId, owned]);

  // ---- Periodic position saves (owned only; every ~15s of playback) ----
  const lastSavedRef = useRef(0);
  function handleTimeUpdate(seconds: number) {
    if (!owned || seconds < 5) return;
    if (Math.abs(seconds - lastSavedRef.current) >= 15) {
      lastSavedRef.current = seconds;
      void savePlaybackPosition(currentContentId, seconds);
    }
  }

  // ---- Video finished: auto-complete + "Up next" countdown ----
  const [endedState, setEndedState] = useState<"none" | "countdown" | "done">("none");
  const [countdown, setCountdown] = useState(5);
  function handleEnded() {
    if (owned && !isCompleted) {
      void setWorkoutComplete(currentContentId, true, watchPath(currentContentId));
    }
    if (owned) void savePlaybackPosition(currentContentId, 0);
    if (nextPlayable && (owned || isOwnerInstructor)) {
      setCountdown(5);
      setEndedState("countdown");
    } else {
      setEndedState("done");
      router.refresh();
    }
  }

  useEffect(() => {
    if (endedState !== "countdown") return;
    if (countdown <= 0) {
      router.push(watchPath(nextPlayable!.content_id));
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endedState, countdown]);

  const doneCount = items.filter((it) => completed.has(it.content_id)).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  // `subtitle` holds comma-separated dance styles → render as tags.
  const styleTags = (current?.workout?.subtitle ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="py-3">
        <Link
          href={programPath}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {programTitle}
        </Link>
      </div>

      {justPurchased && (
        <PurchaseCelebration
          heading="You're in — welcome! 🎉"
          message="Payment confirmed. The whole program is unlocked — enjoy every session."
          clearPath={watchPath(currentContentId)}
        />
      )}

      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Player column */}
        <div className="lg:col-span-2">
          {/* Sticky on mobile so the video survives scrolling; static on desktop. */}
          {/* bg-white, not bg-black: sub-pixel iframe rounding lets this
              background peek through as a hairline at the player's edge —
              white is invisible on the white-studio footage. */}
          <div className="sticky top-0 z-30 -mx-4 bg-white sm:mx-0 sm:rounded-2xl sm:overflow-hidden lg:static">
            <div className="relative">
              <SecureStreamPlayer
                key={`${currentContentId}:${startAt}`}
                contentId={currentContentId}
                paywallHref={programPath}
                startTime={startAt}
                posterUrl={current?.workout?.thumbnailUrl ?? undefined}
                autoplay
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
              />
              {/* Non-owners who just finished the free lesson get the pitch at
                  the emotional peak — not a silently paused player. */}
              {endedState === "done" && !owned && !isOwnerInstructor && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                  <p className="text-sm text-white/70">
                    That was {current?.workout?.title || "the free lesson"} —
                    the real thing.
                  </p>
                  <p className="max-w-md text-lg font-semibold text-white">
                    Keep the feeling going — the rest of the program is waiting.
                  </p>
                  <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
                    <CheckoutButton
                      productSlug={slug}
                      isAuthenticated={isAuthenticated}
                      owned={false}
                      next={watchPath(currentContentId)}
                      returnPath={watchPath(currentContentId)}
                      ownedHref={watchPath(currentContentId)}
                      label={`Unlock the full program — ${priceLabel}`}
                      className="h-11 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 font-semibold text-white hover:from-pink-600 hover:to-rose-500"
                    />
                    <Button
                      variant="outline"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10"
                      onClick={() => window.location.reload()}
                    >
                      Watch again
                    </Button>
                  </div>
                </div>
              )}
              {endedState === "countdown" && nextPlayable && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                  <p className="text-sm text-white/70">Up next</p>
                  <p className="max-w-md text-lg font-semibold text-white">
                    {nextPlayable.item_label ||
                      nextPlayable.workout?.title ||
                      "Next lesson"}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      variant="brand"
                      onClick={() => router.push(watchPath(nextPlayable.content_id))}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Play now ({countdown})
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10"
                      onClick={() => {
                        setEndedState("done");
                        router.refresh();
                      }}
                    >
                      Stay here
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {startAt > 0 && endedState === "none" && (
            <p className="mt-2 text-sm text-gray-500">
              Resuming from {formatDuration(startAt)} ·{" "}
              <button
                type="button"
                className="text-pink-500 hover:text-pink-600 transition-colors"
                onClick={() => setStartAt(0)}
              >
                Start over
              </button>
            </p>
          )}

          {/* Title left, primary action right — button centers against the
              whole header block (deliberate, no cap-height alignment games) */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {current?.item_label || current?.workout?.title || "Lesson"}
                </h1>
                {isCompleted && (
                  <Badge variant="free" className="shrink-0">
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Done
                  </Badge>
                )}
              </div>
              {/* Facts line */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                <span>
                  Lesson {currentIndex + 1} of {items.length}
                </span>
                {!!current?.workout?.durationInSeconds && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-pink-400" />
                    {formatDuration(current.workout.durationInSeconds)}
                  </span>
                )}
                {!!current?.workout?.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-pink-400" />~
                    {current.workout.calories} kcal
                  </span>
                )}
                {!!current?.workout?.moves && (
                  <span className="flex items-center gap-1">
                    <Footprints className="h-4 w-4 text-pink-400" />
                    {current.workout.moves} moves
                  </span>
                )}
              </div>
              {/* Style tags on their own row */}
              {styleTags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-600 ring-1 ring-pink-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {(owned || isOwnerInstructor) && (
              <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={completeAndContinue}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending
                    ? "Saving…"
                    : isCompleted
                      ? nextPlayable
                        ? "Play next lesson"
                        : "Watch again anytime"
                      : nextPlayable
                        ? "Mark complete & continue"
                        : "Mark complete"}
                </Button>
                {isCompleted && (
                  <button
                    type="button"
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() =>
                      startTransition(async () => {
                        await setWorkoutComplete(
                          currentContentId,
                          false,
                          watchPath(currentContentId)
                        );
                        router.refresh();
                      })
                    }
                    disabled={isPending}
                  >
                    Mark as not done
                  </button>
                )}
              </div>
            )}
          </div>

          {!owned && !isOwnerInstructor && (
            <div className="mt-4 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <CheckoutButton
                  productSlug={slug}
                  isAuthenticated={isAuthenticated}
                  owned={false}
                  next={watchPath(currentContentId)}
                  returnPath={watchPath(currentContentId)}
                  ownedHref={watchPath(currentContentId)}
                  label={`Unlock the full program — ${priceLabel}`}
                  className="h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-8 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
                />
                <p className="text-sm text-gray-600">
                  This lesson is free. One payment · 1 year of access · not a
                  subscription.
                </p>
              </div>
            </div>
          )}

          {current?.workout?.description && (
            <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
              {current.workout.description}
            </p>
          )}

          {owned && current && (
            <LessonFeedback
              key={currentContentId}
              productId={productId}
              contentId={currentContentId}
              instructorName={instructorName}
              initial={myFeedback}
              revalidate={watchPath(currentContentId)}
            />
          )}
        </div>

        {/* Playlist rail */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">In this program</h2>
              <span className="text-sm text-gray-500">
                {doneCount}/{items.length}
              </span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ol className="space-y-1">
              {items.map((it, i) => {
                const isCurrent = it.content_id === currentContentId;
                const done = completed.has(it.content_id);
                const comingSoon = it.content_id.startsWith("coming-soon-");
                const playable =
                  !!it.workout && (owned || isOwnerInstructor || it.is_preview);

                const inner = (
                  <>
                    <span className="w-5 shrink-0 text-center text-xs text-gray-400">
                      {isCurrent ? (
                        <Play className="mx-auto h-3.5 w-3.5 text-pink-500" />
                      ) : comingSoon ? null : ( // "12 · Day 16" reads as two numberings
                        i + 1
                      )}
                    </span>
                    <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-pink-50 to-rose-50">
                      {it.workout?.thumbnailUrl ? (
                        <Image
                          src={it.workout.thumbnailUrl}
                          alt=""
                          fill
                          sizes="80px"
                          className={cn("object-cover", !playable && "opacity-40 grayscale")}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-pink-300" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm",
                          isCurrent ? "font-semibold text-gray-900" : "text-gray-700"
                        )}
                      >
                        {it.item_label || it.workout?.title || `Lesson ${i + 1}`}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {comingSoon
                          ? "Coming soon"
                          : formatDuration(it.workout?.durationInSeconds)}
                      </span>
                    </span>
                    <span className="shrink-0">
                      {done ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : comingSoon ? (
                        <Clock className="h-3.5 w-3.5 text-gray-300" />
                      ) : !playable ? (
                        <Lock className="h-3.5 w-3.5 text-gray-300" />
                      ) : null}
                    </span>
                  </>
                );

                const rowClass = cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                  isCurrent
                    ? "bg-pink-50 ring-1 ring-pink-200"
                    : "hover:bg-pink-50/60"
                );

                return (
                  <li key={it.content_id}>
                    {playable ? (
                      <Link href={watchPath(it.content_id)} className={rowClass}>
                        {inner}
                      </Link>
                    ) : comingSoon ? (
                      <div className={cn(rowClass, "opacity-60")}>{inner}</div>
                    ) : (
                      <Link
                        href={programPath}
                        className={cn(rowClass, "opacity-70")}
                        title="Unlock the full program"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Program-level rating lives with the program-level column */}
            {owned && (
              <ProgramReview
                productId={productId}
                programTitle={programTitle}
                initial={myReview}
                revalidate={watchPath(currentContentId)}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Private per-lesson feedback to the instructor                       */
/* ------------------------------------------------------------------ */

function LessonFeedback({
  productId,
  contentId,
  instructorName,
  initial,
  revalidate,
}: {
  productId: string;
  contentId: string;
  instructorName: string | null;
  initial: WatchLessonFeedback;
  revalidate: string;
}) {
  const [sentiment, setSentiment] = useState<"up" | "down" | null>(
    initial?.sentiment ?? null
  );
  const [note, setNote] = useState(initial?.comment_text ?? "");
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save(nextSentiment: "up" | "down", nextNote: string) {
    startTransition(async () => {
      const res = await submitLessonFeedback(
        productId,
        contentId,
        nextSentiment,
        nextNote,
        revalidate
      );
      if (res.success) {
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="mt-6 border-t border-pink-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-700">
          How was this lesson?{" "}
          <span className="text-gray-400">
            (only {instructorName ?? "your instructor"} sees this)
          </span>
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setSentiment("up");
              save("up", note);
            }}
            className={cn(
              sentiment === "up" ? "text-green-600 bg-green-50" : "text-gray-400"
            )}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setSentiment("down");
              save("down", note);
            }}
            className={cn(
              sentiment === "down" ? "text-red-500 bg-red-50" : "text-gray-400"
            )}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
        {sentiment && !showNote && (
          <button
            type="button"
            className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
            onClick={() => setShowNote(true)}
          >
            {note ? "Edit your note" : "Add a note"}
          </button>
        )}
        {saved && <span className="text-sm text-green-600">Sent.</span>}
      </div>

      {sentiment && showNote && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Loved the pace — the last combo was hard to follow."
            rows={2}
            maxLength={1000}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              save(sentiment, note);
              setShowNote(false);
            }}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public program review                                               */
/* ------------------------------------------------------------------ */

function ProgramReview({
  productId,
  programTitle,
  initial,
  revalidate,
}: {
  productId: string;
  programTitle: string;
  initial: { rating: number; comment_text: string | null } | null;
  revalidate: string;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment_text ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save(nextRating: number, nextComment: string) {
    startTransition(async () => {
      const res = await submitProgramReview(productId, nextRating, nextComment, revalidate);
      if (res.success) {
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-pink-100 pt-4">
      <p className="text-sm text-gray-700">Rate this program</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <StarRating
          value={rating}
          onChange={(v) => {
            setRating(v);
            save(v, comment);
          }}
          size="md"
        />
        {rating > 0 && !expanded && (
          <button
            type="button"
            className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
            onClick={() => setExpanded(true)}
          >
            {comment ? "Edit your review" : "Write a review"}
          </button>
        )}
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
      <p className="mt-1 text-xs text-gray-400">Shown on the program page.</p>

      {rating > 0 && expanded && (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? What results did you notice?"
            rows={3}
            maxLength={2000}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              save(rating, comment);
              setExpanded(false);
            }}
            className="self-start"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
