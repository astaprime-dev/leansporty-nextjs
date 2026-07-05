"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Lock, Play, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SecureStreamPlayer } from "@/components/SecureStreamPlayer";
import { setWorkoutComplete } from "@/app/challenge/actions";
import { formatDuration } from "@/lib/challenge";
import type { ProductItem } from "@/types/commerce";

/**
 * Lesson thumbnail with graceful failure: direct-upload lessons have
 * requireSignedURLs on, so their auto-thumbnail 404s — fall back to the
 * gradient + sparkle instead of a broken image (per-lesson images are a
 * fast-follow).
 */
function LessonThumb({
  src,
  alt,
  dimmed,
}: {
  src: string;
  alt: string;
  dimmed: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Sparkles className="h-5 w-5 text-pink-300" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="112px"
      className={cn("object-cover", dimmed && "opacity-40 grayscale")}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * List-mode program lessons (the non-calendar sibling of the challenge
 * ProgramGrid): ordered rows, same Dialog + SecureStreamPlayer + mark-complete
 * pattern. States per lesson: owned → available/completed; not owned →
 * free preview (playable) or locked (shows the price).
 */
export function LessonList({
  items,
  owned,
  completedContentIds,
  priceLabel,
  paywallHref,
  revalidatePath,
}: {
  items: ProductItem[];
  owned: boolean;
  completedContentIds: string[];
  priceLabel: string;
  paywallHref: string;
  revalidatePath: string;
}) {
  const router = useRouter();
  const completed = new Set(completedContentIds);
  const [open, setOpen] = useState<{
    contentId: string;
    title: string;
    completed: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function openLesson(item: ProductItem, index: number) {
    if (!item.workout) return;
    const playable = owned || item.is_preview;
    if (!playable) {
      router.push(paywallHref);
      return;
    }
    setOpen({
      contentId: item.content_id,
      title: item.item_label || item.workout.title || `Lesson ${index + 1}`,
      completed: completed.has(item.content_id),
    });
  }

  function toggleComplete() {
    if (!open) return;
    const next = !open.completed;
    startTransition(async () => {
      await setWorkoutComplete(open.contentId, next, revalidatePath);
      setOpen(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const workout = item.workout;
        const isCompleted = completed.has(item.content_id);
        const playable = !!workout && (owned || item.is_preview);
        const locked = !!workout && !playable;

        return (
          <button
            key={item.content_id}
            type="button"
            onClick={() => openLesson(item, i)}
            disabled={!workout}
            className={cn(
              "group flex items-center gap-4 rounded-xl border p-3 text-left transition-all",
              playable || locked
                ? "border-pink-100 bg-white hover:border-pink-300 hover:shadow-md"
                : "cursor-default border-gray-100 bg-gray-50"
            )}
          >
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-pink-50 to-rose-50">
              {workout?.thumbnailUrl ? (
                <LessonThumb
                  src={workout.thumbnailUrl}
                  alt={workout.title ?? `Lesson ${i + 1}`}
                  dimmed={locked}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-5 w-5 text-pink-300" />
                </div>
              )}
              {playable && (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-pink-600">
                    <Play className="h-4 w-4" />
                  </span>
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Lesson {i + 1}
              </p>
              <p className="truncate font-medium text-gray-900">
                {item.item_label || workout?.title || "Session"}
              </p>
              <p className="text-sm text-gray-500">
                {locked
                  ? `Unlock for ${priceLabel}`
                  : formatDuration(workout?.durationInSeconds) || "Follow-along session"}
              </p>
            </div>

            <div className="shrink-0">
              {item.is_preview && !owned && (
                <Badge variant="free" className="px-2 py-0.5 text-[10px]">
                  Free
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="free" className="h-6 w-6 justify-center p-0">
                  <Check className="h-4 w-4" />
                </Badge>
              )}
              {locked && (
                <Badge variant="lock" className="h-6 w-6 justify-center p-0">
                  <Lock className="h-3.5 w-3.5" />
                </Badge>
              )}
            </div>
          </button>
        );
      })}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="flex flex-col gap-4">
              <SecureStreamPlayer
                contentId={open.contentId}
                paywallHref={paywallHref}
              />
              {owned && (
                <Button
                  variant={open.completed ? "brandOutline" : "brand"}
                  onClick={toggleComplete}
                  disabled={isPending}
                >
                  {open.completed ? "Mark as not done" : "Mark complete"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
