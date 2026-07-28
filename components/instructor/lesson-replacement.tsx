"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ProgramUploader } from "@/components/instructor/program-uploader";
import { LinkImporter } from "@/components/instructor/link-importer";

export type LessonReplacement = {
  uid: string;
  contentId: string;
  status: "uploading" | "processing" | "ready" | "error" | "applied";
};

/**
 * Replace the video of one lesson, without ever being one click away from
 * losing the original.
 *
 * The lesson keeps playing its current video while the new one uploads and
 * processes. When it's ready the instructor watches it here first, then
 * applies it. Even after that the old video is still on Cloudflare — "Go back"
 * restores it, and it is deleted only when they say so.
 */
export function LessonReplacementPanel({
  base,
  programId,
  contentId,
  lessonTitle,
  replacement,
  processingPct,
  busyAction,
  run,
  onClose,
  onRefresh,
}: {
  base: string;
  programId: string;
  contentId: string;
  lessonTitle: string;
  replacement: LessonReplacement | null;
  processingPct: number | undefined;
  busyAction: string | null;
  run: (action: string, fn: () => Promise<unknown>) => Promise<void>;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [quality, setQuality] = useState<PreviewQuality | null>(null);

  const act = (action: "apply" | "revert" | "discard") =>
    run(`replace-${action}-${contentId}`, () =>
      post(`${base}/lessons/replace`, { contentId, action })
    );

  const cancel = () =>
    run(`replace-cancel-${contentId}`, () =>
      del(`/api/instructor/programs/lessons/${replacement?.uid}`)
    );

  async function loadPreview() {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetch(
        `${base}/lessons/replace?contentId=${encodeURIComponent(contentId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Preview is not available.");
      setPreviewUrl(data.iframe);
      setQuality({
        maxHeight: data.maxHeight ?? null,
        sourceHeight: data.sourceHeight ?? null,
        encoding: data.encoding ?? null,
      });
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview is not available.");
    } finally {
      setLoadingPreview(false);
    }
  }

  const busy = busyAction !== null;

  return (
    <div className="mt-3 space-y-3 border-t border-pink-50 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          {replacement ? "New video for this lesson" : "Replace the video"}
        </h4>
        <button
          type="button"
          title="Close"
          onClick={onClose}
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ---------------- nothing started yet: pick a source ---------------- */}
      {!replacement && (
        <ReplacementSource
          base={base}
          programId={programId}
          contentId={contentId}
          lessonTitle={lessonTitle}
          onStarted={onRefresh}
        />
      )}

      {/* ---------------- in flight ---------------- */}
      {(replacement?.status === "uploading" ||
        replacement?.status === "processing") && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="secondary"
            className="gap-1.5 border-transparent bg-pink-50 text-pink-600"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            {replacement.status === "uploading"
              ? "Uploading new video"
              : processingPct !== undefined
                ? `Preparing new video (${processingPct}%)`
                : "Preparing new video"}
          </Badge>
          <p className="text-sm text-gray-500">
            Students still see the current video.
          </p>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="text-xs font-medium text-gray-500 transition-colors hover:text-red-600 disabled:opacity-50"
          >
            {busyAction === `replace-cancel-${contentId}` ? "Removing…" : "Remove"}
          </button>
        </div>
      )}

      {/* ---------------- failed ---------------- */}
      {replacement?.status === "error" && (
        <div className="space-y-2">
          <Alert variant="error">
            The new video could not be prepared. Remove it and try again with a
            different file or link.
          </Alert>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancel}
            disabled={busy}
          >
            Remove
          </Button>
        </div>
      )}

      {/* ---------------- ready to apply ---------------- */}
      {replacement?.status === "ready" && (
        <div className="space-y-3">
          <Alert variant="success">
            The new video is ready. Watch it first, then apply it. Students still
            see the current video.
          </Alert>

          {previewUrl ? (
            <div className="space-y-2">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                <iframe
                  src={previewUrl}
                  className="h-full w-full"
                  allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  title="New video preview"
                />
              </div>
              <QualityNote
                quality={quality}
                onRecheck={loadPreview}
                rechecking={loadingPreview}
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? "Loading…" : "Watch the new video"}
            </Button>
          )}

          {previewError && <Alert variant="error">{previewError}</Alert>}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => act("apply")}
              disabled={busy}
            >
              {busyAction === `replace-apply-${contentId}`
                ? "Applying…"
                : "Apply new video"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete the new video and keep the current one? This can't be undone."
                  )
                ) {
                  void cancel();
                }
              }}
            >
              Cancel replacement
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- applied: old video still safe ---------------- */}
      {replacement?.status === "applied" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="brand">Using new video</Badge>
            <p className="text-sm text-gray-500">
              The old video is saved in case you want to go back.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => act("revert")}
              disabled={busy}
            >
              {busyAction === `replace-revert-${contentId}`
                ? "Going back…"
                : "Go back to the old video"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete the old video permanently? You won't be able to go back."
                  )
                ) {
                  void act("discard");
                }
              }}
            >
              {busyAction === `replace-discard-${contentId}`
                ? "Deleting…"
                : "Delete the old video"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type PreviewQuality = {
  /** Best picture height playable right now, from the HLS manifest. */
  maxHeight: number | null;
  /** Height of the file the instructor gave us. */
  sourceHeight: number | null;
  encoding: { done: boolean; pctComplete: number | string | null } | null;
};

/**
 * What the instructor is actually judging.
 *
 * A video plays before Cloudflare has finished the sharper renditions, so
 * "it looks soft" right after upload is usually encoding, not the file. Saying
 * so — with the quality that exists right now — is the difference between
 * waiting two minutes and re-exporting a 10GB master for nothing.
 */
function QualityNote({
  quality,
  onRecheck,
  rechecking,
}: {
  quality: PreviewQuality | null;
  onRecheck: () => void;
  rechecking: boolean;
}) {
  if (!quality?.maxHeight) return null;

  const stillEncoding = quality.encoding ? !quality.encoding.done : false;
  const pct = Number(quality.encoding?.pctComplete);
  const pctLabel = Number.isFinite(pct) ? ` (${Math.round(pct)}%)` : "";
  // Cloudflare's ladder tops out below 4K, so a 4K master never plays back at
  // source quality — worth saying once, rather than leaving them waiting for a
  // sharpness that isn't coming.
  const cappedFromSource =
    !stillEncoding &&
    quality.sourceHeight != null &&
    quality.sourceHeight > quality.maxHeight;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="text-gray-700">
        Playing at up to <strong>{quality.maxHeight}p</strong>
      </span>
      {stillEncoding ? (
        <>
          <span className="text-gray-500">
            — sharper quality is still being prepared{pctLabel}, so judge it
            after this finishes
          </span>
          <button
            type="button"
            onClick={onRecheck}
            disabled={rechecking}
            className="font-medium text-pink-600 transition-colors hover:text-pink-700 disabled:opacity-50"
          >
            {rechecking ? "Checking…" : "Check again"}
          </button>
        </>
      ) : (
        <span className="text-gray-500">
          — this is the final quality
          {cappedFromSource &&
            `, the most we deliver (your file is ${quality.sourceHeight}p)`}
        </span>
      )}
    </div>
  );
}

/** Upload / link chooser — the same two paths as adding a lesson. */
function ReplacementSource({
  base,
  programId,
  contentId,
  lessonTitle,
  onStarted,
}: {
  base: string;
  programId: string;
  contentId: string;
  lessonTitle: string;
  onStarted: () => void;
}) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const replace = { workoutId: contentId, title: lessonTitle };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Upload a new video for this lesson. Students keep watching the current
        one until you apply the new video, and the old video is kept until you
        delete it.
      </p>

      <div className="flex gap-6 border-b border-pink-100" role="tablist">
        {(
          [
            { key: "upload", label: "Upload a video" },
            { key: "link", label: "From a link" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
              mode === tab.key
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <ProgramUploader
          programId={programId}
          replace={replace}
          onLessonReady={onStarted}
          onUploadComplete={onStarted}
        />
      ) : (
        <LinkImporter base={base} replace={replace} onStarted={onStarted} />
      )}
    </div>
  );
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

async function del(path: string) {
  const res = await fetch(path, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}
