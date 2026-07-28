"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * "From a link" video import: paste a Google Drive share link (or any direct
 * video URL) and Cloudflare pulls the file server-side — nothing goes through
 * the instructor's device. Mirrors the uploader's layout (same Lesson title
 * field first) so all three add-lesson modes feel identical.
 *
 * With `replace`, the same import becomes a new video for an existing lesson:
 * the title is inherited, and the lesson keeps playing its current video until
 * the new one is applied.
 */
export function LinkImporter({
  base,
  onStarted,
  replace,
}: {
  base: string;
  onStarted: () => void;
  replace?: { workoutId: string; title: string };
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveTitle = replace ? replace.title : title.trim();

  async function start() {
    if (!effectiveTitle || !url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/lessons/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: effectiveTitle,
          url: url.trim(),
          ...(replace ? { replacesWorkoutId: replace.workoutId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to start the import.");
      onStarted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start the import.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!replace && (
        <div className="space-y-2">
          <Label htmlFor="link-title">Lesson title</Label>
          <Input
            id="link-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Day 1 — Warm up and basics"
            maxLength={255}
            disabled={busy}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="link-url">Video link</Label>
        <Input
          id="link-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/…"
          disabled={busy}
        />
        <p className="text-sm text-gray-500">
          Paste a Google Drive share link (set the file to &quot;Anyone with the
          link&quot;) or a direct video link. We fetch the video for you — no
          download or upload on your side, and you can close this page right
          away.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Button
        type="button"
        variant="brand"
        onClick={start}
        disabled={busy || !effectiveTitle || !url.trim()}
      >
        {busy ? "Starting…" : replace ? "Import New Video" : "Import Video"}
      </Button>
    </div>
  );
}
