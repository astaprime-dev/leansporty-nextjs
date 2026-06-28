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
import { cn } from "@/lib/utils";
import { SecureStreamPlayer } from "@/components/SecureStreamPlayer";
import { setWorkoutComplete } from "@/app/challenge/actions";
import { formatDuration, nextActionableDay } from "@/lib/challenge";
import type { ProgramDay } from "@/types/commerce";

interface ProgramGridProps {
  days: ProgramDay[];
  priceLabel: string;
}

interface OpenState {
  contentId: string;
  title: string;
  completed: boolean;
}

export function ProgramGrid({ days, priceLabel }: ProgramGridProps) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenState | null>(null);
  const [isPending, startTransition] = useTransition();

  const startCta = nextActionableDay(days);

  function openDay(day: ProgramDay) {
    if (!day.item?.workout) return;
    if (day.state === "locked") {
      router.push("/challenge");
      return;
    }
    if (day.state === "locked-until" || day.state === "rest") return;
    setOpen({
      contentId: day.item.content_id,
      title:
        day.item.item_label ||
        day.item.workout.title ||
        `Day ${day.dayNumber}`,
      completed: day.state === "completed",
    });
  }

  function toggleComplete() {
    if (!open) return;
    const next = !open.completed;
    startTransition(async () => {
      await setWorkoutComplete(open.contentId, next);
      setOpen(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {startCta?.item?.workout && (
        <Button
          className="self-start bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white"
          onClick={() => openDay(startCta)}
        >
          <Play className="mr-2 h-4 w-4" />
          {startCta.state === "preview-free"
            ? "Try Day 1 free"
            : days.some((d) => d.state === "completed")
              ? `Continue — Day ${startCta.dayNumber}`
              : `Start Day ${startCta.dayNumber}`}
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {days.map((day) => (
          <DayCard
            key={day.dayNumber}
            day={day}
            priceLabel={priceLabel}
            onOpen={() => openDay(day)}
          />
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="flex flex-col gap-4">
              <SecureStreamPlayer
                contentId={open.contentId}
                paywallHref="/challenge"
              />
              <Button
                variant={open.completed ? "outline" : "default"}
                onClick={toggleComplete}
                disabled={isPending}
                className={
                  open.completed
                    ? ""
                    : "bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white"
                }
              >
                {open.completed ? "Mark as not done" : "Mark complete"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayCard({
  day,
  priceLabel,
  onOpen,
}: {
  day: ProgramDay;
  priceLabel: string;
  onOpen: () => void;
}) {
  const { item, state } = day;
  const workout = item?.workout ?? null;
  const duration = formatDuration(workout?.durationInSeconds);
  const clickable =
    state === "available" ||
    state === "completed" ||
    state === "preview-free" ||
    state === "locked";

  if (state === "rest") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
        <span className="text-xs font-medium text-gray-400">
          Day {day.dayNumber}
        </span>
        <span className="text-sm text-gray-400">Rest day</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={clickable ? onOpen : undefined}
      disabled={!clickable}
      className={cn(
        "group relative flex aspect-video flex-col justify-end overflow-hidden rounded-xl border text-left transition-all",
        clickable
          ? "border-pink-100 hover:border-pink-300 hover:shadow-md"
          : "cursor-default border-gray-100"
      )}
    >
      {/* thumbnail */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50">
        {workout?.thumbnailUrl ? (
          <Image
            src={workout.thumbnailUrl}
            alt={workout.title ?? `Day ${day.dayNumber}`}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className={cn(
              "object-cover transition",
              (state === "locked" || state === "locked-until") &&
                "opacity-40 grayscale"
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-8 w-8 text-pink-300" />
          </div>
        )}
      </div>

      {/* top-right badge */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {state === "preview-free" && (
          <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            Free
          </span>
        )}
        {state === "completed" && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="h-4 w-4" />
          </span>
        )}
        {(state === "locked" || state === "locked-until") && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
        {(state === "available") && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-pink-600 opacity-0 transition group-hover:opacity-100">
            <Play className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* caption */}
      <div className="relative z-10 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/80">
          Day {day.dayNumber}
        </p>
        <p className="line-clamp-1 text-xs font-semibold text-white">
          {item?.item_label || workout?.title || "Session"}
        </p>
        <p className="text-[10px] text-white/80">
          {state === "locked"
            ? `Unlock ${priceLabel}`
            : state === "locked-until"
              ? `Unlocks Day ${day.unlocksOnDay}`
              : duration
                ? `${duration} min`
                : "Follow-along session"}
        </p>
      </div>
    </button>
  );
}
