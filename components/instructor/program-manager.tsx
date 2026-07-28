"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Film,
  Loader2,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { EarnPreview } from "@/components/instructor/earn-preview";
import { ProgramUploader } from "@/components/instructor/program-uploader";
import { ShareKit } from "@/components/instructor/share-kit";
import { formatDuration, formatPrice } from "@/lib/challenge";

export type ManagedLesson = {
  contentId: string;
  position: number;
  dayNumber: number | null;
  isPreview: boolean;
  itemLabel: string | null;
  title: string | null;
  durationInSeconds: number | null;
  thumbnailUrl: string | null;
  /** Comma-separated dance styles (workouts.subtitle). */
  styles: string | null;
  calories: number | null;
  description: string | null;
};

export type ManagedProgram = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageUrl: string | null;
  priceCents: number;
  currency: string;
  isActive: boolean;
  adminDisabled: boolean;
  structure: "list" | "days";
  programLengthDays: number | null;
};

type Recording = {
  id: string;
  title: string | null;
  durationInSeconds: number | null;
};

/**
 * Lesson image with graceful failure (signed-only auto-thumbnails 404).
 * Keyed by src at the call site so the failed state resets when the image
 * changes — this is what makes a fresh upload appear instantly.
 */
function ThumbImg({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex h-full w-full items-center justify-center">
        <Film className="h-4 w-4 text-pink-300" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

/**
 * Manage hub for one program. Desktop: two columns — details + publish on the
 * left (details are read-only until "Edit"), lessons on the right (the main
 * working area). All mutations go through the programs API and end with
 * router.refresh() so the server-rendered state stays the truth.
 */
export function ProgramManager({
  program,
  lessons,
  hasSales,
  pendingUploads,
}: {
  program: ManagedProgram;
  lessons: ManagedLesson[];
  hasSales: boolean;
  /** Uploads still uploading/processing; polling them here is what promotes
   *  a ready video into a lesson, so it must survive page navigation. */
  pendingUploads: { uid: string; title: string; status: "uploading" | "processing" }[];
}) {
  const router = useRouter();
  const base = `/api/instructor/programs/${program.id}`;

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Cloudflare encoding progress per pending upload uid (0–100).
  const [pendingPct, setPendingPct] = useState<Record<string, number>>({});

  // Resume ready-polling for uploads that were started earlier (possibly in a
  // closed tab). The status route is what promotes a processed video into a
  // lesson, so this keeps "you can leave this page" true.
  useEffect(() => {
    if (pendingUploads.length === 0) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      for (const u of pendingUploads) {
        try {
          const res = await fetch(`/api/instructor/programs/lessons/${u.uid}/status`);
          const data = await res.json();
          if (!cancelled && (data.status === "ready" || data.status === "error")) {
            router.refresh();
            return;
          }
          if (!cancelled && data.status === "processing" && data.pctComplete != null) {
            const pct = Math.min(100, Math.round(Number(data.pctComplete)));
            setPendingPct((prev) => ({ ...prev, [u.uid]: pct }));
          }
        } catch {
          /* transient — retry next tick */
        }
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pendingUploads, router]);

  async function run(action: string, fn: () => Promise<unknown>) {
    setError(null);
    setBusyAction(action);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {program.adminDisabled && (
        <Alert variant="warning">
          This program was disabled by LeanSporty and is hidden from students.
          Please contact us.
        </Alert>
      )}

      <div className="grid items-start gap-6 md:grid-cols-5">
        {/* Left: details (read-only until Edit) + publish */}
        <div className="space-y-6 md:col-span-2">
          <DetailsCard
            program={program}
            hasSales={hasSales}
            busyAction={busyAction}
            setError={setError}
          />
          <PublishCard
            program={program}
            lessonCount={lessons.length}
            hasSales={hasSales}
            busyAction={busyAction}
            run={run}
            base={base}
            onDeleted={() => router.push("/instructor/programs")}
          />
        </div>

        {/* Right: lessons — the main working area */}
        <div className="md:col-span-3">
          <LessonsCard
            program={program}
            lessons={lessons}
            hasSales={hasSales}
            pendingUploads={pendingUploads}
            pendingPct={pendingPct}
            busyAction={busyAction}
            run={run}
            base={base}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Details                                                             */
/* ------------------------------------------------------------------ */

function DetailsCard({
  program,
  hasSales,
  busyAction,
  setError,
}: {
  program: ManagedProgram;
  hasSales: boolean;
  busyAction: string | null;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const base = `/api/instructor/programs/${program.id}`;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(program.title);
  const [subtitle, setSubtitle] = useState(program.subtitle ?? "");
  const [description, setDescription] = useState(program.description ?? "");
  const [price, setPrice] = useState((program.priceCents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  function startEdit() {
    setTitle(program.title);
    setSubtitle(program.subtitle ?? "");
    setDescription(program.description ?? "");
    setPrice((program.priceCents / 100).toFixed(2));
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
      await api(`${base}/update`, "POST", { title, subtitle, description, priceCents });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadCover(file: File) {
    setError(null);
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/instructor/programs/cover", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      await api(`${base}/update`, "POST", { coverImageUrl: data.url });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingCover(false);
    }
  }

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Details</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit} disabled={busyAction !== null}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        /* ------------ read-only summary ------------ */
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-rose-50">
            {program.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={program.coverImageUrl}
                alt="Program cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
                <Film className="h-6 w-6 text-pink-300" />
                <label className="cursor-pointer text-sm text-pink-500 hover:text-pink-600">
                  {uploadingCover ? "Uploading…" : "Add a cover image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCover(f);
                    }}
                  />
                </label>
              </div>
            )}
          </div>
          {program.coverImageUrl && (
            <label className="inline-block cursor-pointer text-sm text-pink-500 hover:text-pink-600">
              {uploadingCover ? "Uploading…" : "Change cover image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingCover}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCover(f);
                }}
              />
            </label>
          )}
          <p className="text-xs text-gray-400">
            Best: a wide photo, 16:9 — at least 1600×900 pixels. JPG, PNG or
            WebP, up to 5MB.
          </p>

          <div>
            <p className="text-lg font-medium text-gray-900">{program.title}</p>
            {program.subtitle ? (
              <p className="mt-1 text-gray-600">{program.subtitle}</p>
            ) : (
              <p className="mt-1 text-sm italic text-gray-400">
                No one-line summary yet — it shows under the title on your page.
              </p>
            )}
          </div>

          {program.description ? (
            <p className="whitespace-pre-line text-sm text-gray-600 line-clamp-4">
              {program.description}
            </p>
          ) : (
            <p className="text-sm italic text-gray-400">
              No description yet — tell students what they&apos;ll do and what results
              to expect.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-pink-50 pt-4 text-sm">
            <span className="font-medium text-gray-900">
              {formatPrice(program.priceCents, program.currency)}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">
              {program.structure === "days"
                ? `Day-by-day plan (${program.programLengthDays ?? "?"} days)`
                : "Simple lesson list"}
            </span>
          </div>
        </div>
      ) : (
        /* ------------ edit form ------------ */
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-title">Program name</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-subtitle">One-line summary</Label>
            <Input
              id="p-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Tone up in 4 weeks, 20 minutes a day"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-description">Description</Label>
            <Textarea
              id="p-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students do, and what results can they expect?"
              rows={5}
              maxLength={5000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">Price (€)</Label>
            <Input
              id="p-price"
              type="number"
              min="19"
              max="500"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="max-w-40"
              required
            />
            <EarnPreview priceEuros={price} />
            {hasSales && (
              <p className="text-sm text-gray-500">Price changes only affect new sales.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

function LessonsCard({
  program,
  lessons,
  hasSales,
  pendingUploads,
  pendingPct,
  busyAction,
  run,
  base,
}: {
  program: ManagedProgram;
  lessons: ManagedLesson[];
  hasSales: boolean;
  pendingUploads: { uid: string; title: string; status: "uploading" | "processing" }[];
  pendingPct: Record<string, number>;
  busyAction: string | null;
  run: (action: string, fn: () => Promise<unknown>) => Promise<void>;
  base: string;
}) {
  const router = useRouter();
  const [addMode, setAddMode] = useState<"upload" | "reuse">("upload");
  const [recordings, setRecordings] = useState<Recording[] | null>(null);
  const [renaming, setRenaming] = useState<{ contentId: string; value: string } | null>(null);
  const [uploadingThumbFor, setUploadingThumbFor] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    contentId: string;
    styles: string;
    calories: string;
    description: string;
  } | null>(null);

  // Optimistic view of the lessons: mutations update it immediately, and the
  // server truth replaces it when router.refresh() delivers new props.
  const [view, setView] = useState<ManagedLesson[]>(lessons);
  useEffect(() => setView(lessons), [lessons]);

  useEffect(() => {
    if (addMode === "reuse" && recordings === null) {
      fetch("/api/instructor/programs/recordings")
        .then((r) => r.json())
        .then((d) => setRecordings(d.recordings ?? []))
        .catch(() => setRecordings([]));
    }
  }, [addMode, recordings]);

  function reorderPayload(next: ManagedLesson[]) {
    return {
      items: next.map((l, i) => ({
        contentId: l.contentId,
        position: i + 1,
        dayNumber: l.dayNumber,
        isPreview: l.isPreview,
        itemLabel: l.itemLabel,
      })),
    };
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...view];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setView(next);
    void run("reorder", () => api(`${base}/lessons/reorder`, "PATCH", reorderPayload(next)));
  }

  function setPreview(contentId: string) {
    const next = view.map((l) => ({
      ...l,
      isPreview: l.contentId === contentId ? !l.isPreview : false,
    }));
    setView(next);
    void run("preview", () => api(`${base}/lessons/reorder`, "PATCH", reorderPayload(next)));
  }

  function setDay(contentId: string, day: string) {
    const parsed = day === "" ? null : Number(day);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1 || parsed > 90)) return;
    const next = view.map((l) =>
      l.contentId === contentId ? { ...l, dayNumber: parsed } : l
    );
    setView(next);
    void run("day", () => api(`${base}/lessons/reorder`, "PATCH", reorderPayload(next)));
  }

  function saveRename() {
    if (!renaming) return;
    const value = renaming.value.trim();
    const next = view.map((l) =>
      l.contentId === renaming.contentId ? { ...l, itemLabel: value || null } : l
    );
    setRenaming(null);
    setView(next);
    void run("rename", () => api(`${base}/lessons/reorder`, "PATCH", reorderPayload(next)));
  }

  function removeLesson(contentId: string) {
    setView(view.filter((l) => l.contentId !== contentId));
    void run("remove", () => api(`${base}/lessons`, "DELETE", { contentId }));
  }

  function openDetails(l: ManagedLesson) {
    setDetails({
      contentId: l.contentId,
      styles: l.styles ?? "",
      calories: l.calories != null ? String(l.calories) : "",
      description: l.description ?? "",
    });
  }

  function saveDetails() {
    if (!details) return;
    const calories =
      details.calories.trim() === "" ? null : Number(details.calories);
    setView((prev) =>
      prev.map((l) =>
        l.contentId === details.contentId
          ? {
              ...l,
              styles: details.styles.trim() || null,
              calories,
              description: details.description.trim() || null,
            }
          : l
      )
    );
    const payload = {
      contentId: details.contentId,
      styles: details.styles,
      calories,
      description: details.description,
    };
    setDetails(null);
    void run("details", () => api(`${base}/lessons/details`, "POST", payload));
  }

  async function uploadLessonThumb(contentId: string, file: File) {
    setUploadingThumbFor(contentId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("contentId", contentId);
      const res = await fetch(`${base}/lessons/thumbnail`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setView((prev) =>
        prev.map((l) => (l.contentId === contentId ? { ...l, thumbnailUrl: data.url } : l))
      );
      router.refresh();
    } catch {
      /* error surfaces on refresh; keep UI calm */
    } finally {
      setUploadingThumbFor(null);
    }
  }

  function removeLessonThumb(contentId: string) {
    setView((prev) =>
      prev.map((l) => (l.contentId === contentId ? { ...l, thumbnailUrl: null } : l))
    );
    void run("thumb-remove", () =>
      api(`${base}/lessons/thumbnail`, "DELETE", { contentId })
    );
  }

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Lessons</h2>
        <span className="text-sm text-gray-500">
          {view.length} lesson{view.length === 1 ? "" : "s"}
        </span>
      </div>

      {view.length === 0 && pendingUploads.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          description="Upload a video or add a recording of one of your past classes below."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {view.map((l, i) => (
            <li
              key={l.contentId}
              className="rounded-xl border border-pink-100 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
              <div className="group/thumb relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-pink-50 to-rose-50">
                <label
                  className="absolute inset-0 cursor-pointer"
                  title={
                    (l.thumbnailUrl ? "Change the lesson image" : "Add a lesson image") +
                    " — wide 16:9 photo, at least 1280×720. JPG, PNG or WebP, up to 5MB."
                  }
                >
                  {l.thumbnailUrl ? (
                    <ThumbImg key={l.thumbnailUrl} src={l.thumbnailUrl} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Film className="h-4 w-4 text-pink-300" />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover/thumb:opacity-100">
                    {uploadingThumbFor === l.contentId ? "Uploading…" : "Change image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingThumbFor !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadLessonThumb(l.contentId, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {l.thumbnailUrl && (
                  <button
                    type="button"
                    title="Remove image"
                    className="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 group-hover/thumb:flex"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeLessonThumb(l.contentId);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {renaming?.contentId === l.contentId ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={renaming.value}
                      maxLength={255}
                      onChange={(e) =>
                        setRenaming({ contentId: l.contentId, value: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveRename();
                        }
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="h-8"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={saveRename}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRenaming(null)}
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="group flex min-w-0 items-center gap-2 text-left"
                    title="Rename lesson"
                    onClick={() =>
                      setRenaming({
                        contentId: l.contentId,
                        value: l.itemLabel || l.title || "",
                      })
                    }
                  >
                    <span className="truncate font-medium text-gray-900 group-hover:text-pink-500">
                      {l.itemLabel || l.title || "Untitled lesson"}
                    </span>
                    <Pencil className="h-3 w-3 shrink-0 text-gray-300 group-hover:text-pink-400" />
                  </button>
                )}
                <p className="truncate text-sm text-gray-500">
                  {formatDuration(l.durationInSeconds)}
                  {l.isPreview && " · Free preview"}
                  {l.calories != null && ` · ~${l.calories} kcal`}
                  {l.styles && ` · ${l.styles}`}
                </p>
              </div>
              {program.structure === "days" && (
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Day
                  <Input
                    type="number"
                    min={1}
                    max={program.programLengthDays ?? 90}
                    defaultValue={l.dayNumber ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== String(l.dayNumber ?? "")) setDay(l.contentId, v);
                    }}
                    className="h-8 w-16"
                  />
                </label>
              )}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Edit details (styles, calories, description)"
                  onClick={() =>
                    details?.contentId === l.contentId
                      ? setDetails(null)
                      : openDetails(l)
                  }
                  className={
                    details?.contentId === l.contentId
                      ? "text-pink-500"
                      : "text-gray-400"
                  }
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title={l.isPreview ? "Remove free preview" : "Make free preview"}
                  onClick={() => setPreview(l.contentId)}
                  disabled={busyAction !== null}
                  className={l.isPreview ? "text-pink-500" : "text-gray-400"}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(i, -1)}
                  disabled={busyAction !== null || i === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => move(i, 1)}
                  disabled={busyAction !== null || i === view.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title={
                    hasSales
                      ? "Lessons can't be removed after the first sale"
                      : "Remove lesson"
                  }
                  onClick={() => removeLesson(l.contentId)}
                  disabled={busyAction !== null || hasSales}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              </div>

              {/* Inline details editor: styles / calories / description */}
              {details?.contentId === l.contentId && (
                <div className="mt-3 space-y-3 border-t border-pink-50 pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`styles-${l.contentId}`}>
                        Dance styles
                      </Label>
                      <Input
                        id={`styles-${l.contentId}`}
                        value={details.styles}
                        maxLength={255}
                        placeholder="e.g. Hip-hop, Afro House"
                        onChange={(e) =>
                          setDetails({ ...details, styles: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-400">
                        Separate with commas — shown as tags on the lesson page.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`kcal-${l.contentId}`}>
                        Calories (estimate)
                      </Label>
                      <Input
                        id={`kcal-${l.contentId}`}
                        type="number"
                        min={0}
                        max={5000}
                        value={details.calories}
                        placeholder="e.g. 150"
                        onChange={(e) =>
                          setDetails({ ...details, calories: e.target.value })
                        }
                        className="max-w-32"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`desc-${l.contentId}`}>Description</Label>
                    <Textarea
                      id={`desc-${l.contentId}`}
                      value={details.description}
                      rows={3}
                      maxLength={2000}
                      placeholder="What happens in this lesson, and how will it feel?"
                      onChange={(e) =>
                        setDetails({ ...details, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="brand"
                      size="sm"
                      onClick={saveDetails}
                      disabled={busyAction !== null}
                    >
                      Save details
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetails(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {/* In-flight uploads, styled like the lesson rows they will become. */}
          {pendingUploads.map((u) => (
            <li key={u.uid} className="rounded-xl border border-pink-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-50 to-rose-50">
                  <Film className="h-4 w-4 text-pink-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{u.title}</p>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className="gap-1.5 border-transparent bg-pink-50 text-pink-600"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {u.status === "uploading"
                        ? "Uploading"
                        : pendingPct[u.uid] !== undefined
                          ? `Processing (${pendingPct[u.uid]}%)`
                          : "Processing"}
                    </Badge>
                  </div>
                </div>
                {/* A tab closed mid-upload leaves the row stuck in 'uploading'
                    forever and it keeps counting against the caps — Remove is
                    the only way to free the slot. Processing rows are about to
                    become lessons; the API refuses to remove those. */}
                {u.status === "uploading" && (
                  <button
                    type="button"
                    onClick={() =>
                      run(`remove-upload-${u.uid}`, () =>
                        api(`/api/instructor/programs/lessons/${u.uid}`, "DELETE")
                      )
                    }
                    disabled={busyAction !== null}
                    className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-red-600 disabled:opacity-50"
                  >
                    {busyAction === `remove-upload-${u.uid}` ? "Removing…" : "Remove"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingUploads.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Videos become lessons when processing finishes — meanwhile you can
          edit details or add more. If an upload got stuck (for example the tab
          closed mid-upload), remove it to free the slot.
        </p>
      )}

      {/* Add lesson */}
      <div className="mt-6 border-t border-pink-100 pt-6">
        <h3 className="mb-3 font-medium text-gray-900">Add a lesson</h3>
        <div className="mb-4 flex gap-6 border-b border-pink-100" role="tablist">
          {(
            [
              { key: "upload", label: "Upload a video" },
              { key: "reuse", label: "Use a class recording" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={addMode === tab.key}
              onClick={() => setAddMode(tab.key)}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                addMode === tab.key
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {addMode === "upload" ? (
          <ProgramUploader programId={program.id} onLessonReady={() => router.refresh()} />
        ) : recordings === null ? (
          <p className="text-sm text-gray-500">Loading your recordings…</p>
        ) : recordings.length === 0 ? (
          <p className="text-sm text-gray-500">
            No recordings yet. Recordings of your past live classes appear here after
            they end.
          </p>
        ) : (
          <ul className="space-y-2">
            {recordings
              .filter((r) => !view.some((l) => l.contentId === r.id))
              .map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-pink-100 px-4 py-3"
                >
                  <Film className="h-4 w-4 shrink-0 text-pink-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {r.title || "Untitled recording"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(r.durationInSeconds)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyAction !== null}
                    onClick={() =>
                      run("add-recording", () =>
                        api(`${base}/lessons`, "POST", { workoutId: r.id })
                      )
                    }
                  >
                    Add
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Publish                                                             */
/* ------------------------------------------------------------------ */

function PublishCard({
  program,
  lessonCount,
  hasSales,
  busyAction,
  run,
  base,
  onDeleted,
}: {
  program: ManagedProgram;
  lessonCount: number;
  hasSales: boolean;
  busyAction: string | null;
  run: (action: string, fn: () => Promise<unknown>) => Promise<void>;
  base: string;
  onDeleted: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const canPublish = lessonCount > 0 && !program.adminDisabled;

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Publish</h2>
        <Badge
          variant={
            program.adminDisabled ? "destructive" : program.isActive ? "brand" : "secondary"
          }
        >
          {program.adminDisabled ? "DISABLED" : program.isActive ? "PUBLISHED" : "DRAFT"}
        </Badge>
      </div>

      {!program.isActive ? (
        <div className="space-y-4">
          <ul className="space-y-1 text-sm text-gray-600">
            <li>{lessonCount > 0 ? "✓" : "○"} At least one lesson</li>
            <li>✓ Price set: {formatPrice(program.priceCents, program.currency)}</li>
          </ul>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(v) => setTermsAccepted(v === true)}
              className="mt-0.5"
            />
            <span>
              I confirm I have the rights to all content in this program, including the
              music. I am responsible for what I sell here.
            </span>
          </label>
          <Button
            type="button"
            variant="brand"
            disabled={!canPublish || !termsAccepted || busyAction !== null}
            onClick={() =>
              run("publish", () => api(`${base}/publish`, "POST", { termsAccepted: true }))
            }
          >
            {busyAction === "publish" ? "Publishing…" : "Publish Program"}
          </Button>
          {!program.adminDisabled && (!canPublish || !termsAccepted) && (
            <p className="text-xs text-gray-500">
              {lessonCount === 0
                ? "To publish: add at least one lesson, then tick the rights confirmation above."
                : "To publish: tick the rights confirmation above."}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Publishing puts the program on your public profile so students can buy it.
            You can unpublish anytime.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Your program is live on your public profile.</p>
          <div className="border-t border-pink-50 pt-4">
            <ShareKit
              context={{
                kind: "program",
                title: program.title,
                path: `/programs/${program.slug}`,
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busyAction !== null}
            onClick={() => run("unpublish", () => api(`${base}/unpublish`, "POST"))}
          >
            {busyAction === "unpublish" ? "Working…" : "Unpublish"}
          </Button>
          <p className="text-sm text-gray-500">
            Unpublishing removes it from sale. Students who already bought it keep
            access.
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-pink-100 pt-6">
        <Button
          type="button"
          variant="ghost"
          className="text-red-500 hover:text-red-600"
          disabled={hasSales || busyAction !== null}
          title={hasSales ? "Programs with sales can't be deleted" : undefined}
          onClick={() => {
            if (
              window.confirm(
                "Delete this program and its uploaded videos? This cannot be undone."
              )
            ) {
              void run("delete", async () => {
                await api(`${base}/delete`, "POST");
                onDeleted();
              });
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Program
        </Button>
        {hasSales && (
          <p className="mt-2 text-sm text-gray-500">
            This program has sales, so it can&apos;t be deleted — your students keep
            access to what they bought.
          </p>
        )}
      </div>
    </section>
  );
}
