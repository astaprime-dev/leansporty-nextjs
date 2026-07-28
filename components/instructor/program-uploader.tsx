"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Loader2, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

function formatTimeLeft(seconds: number): string {
  if (seconds < 60) return "less than a minute left";
  if (seconds < 3600) return `about ${Math.round(seconds / 60)} min left`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `about ${h} h ${m} min left` : `about ${h} h left`;
}

/**
 * Direct-to-Cloudflare lesson upload: asks our API for a one-time tus URL,
 * then uploads straight from the browser (resumable, ~50MB chunks). After the
 * bytes land, polls the status route until Cloudflare finishes processing and
 * the lesson row appears.
 */
export function ProgramUploader({
  programId,
  onLessonReady,
}: {
  programId: string;
  onLessonReady: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progressPct, setProgressPct] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  // Recent (time, bytes-sent) samples for the time-left estimate; a ~30s
  // window keeps it responsive to real speed changes without jitter.
  const speedSamples = useRef<{ t: number; sent: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function pollUntilReady(uid: string) {
    setPhase("processing");
    for (;;) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/instructor/programs/lessons/${uid}/status`);
        const data = await res.json();
        if (data.status === "ready") {
          setPhase("done");
          setFile(null);
          setTitle("");
          onLessonReady();
          return;
        }
        if (data.status === "error") {
          setPhase("error");
          setError(
            "The video could not be processed. Please check the file and try again."
          );
          return;
        }
      } catch {
        // transient network error — keep polling
      }
    }
  }

  async function startUpload() {
    if (!file || !title.trim()) return;
    setError(null);
    setPhase("uploading");
    setProgressPct(0);
    setEtaSeconds(null);
    speedSamples.current = [];

    let uploadUrl: string, uid: string;
    try {
      const res = await fetch(
        `/api/instructor/programs/${programId}/lessons/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), fileSizeBytes: file.size }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setPhase("error");
        setError(data.error ?? "Could not start the upload.");
        return;
      }
      ({ uploadUrl, uid } = data);
    } catch {
      setPhase("error");
      setError("Could not start the upload. Please try again.");
      return;
    }

    const upload = new tus.Upload(file, {
      uploadUrl,
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      onProgress: (sent, total) => {
        setProgressPct(Math.round((sent / total) * 100));
        const now = Date.now();
        const samples = speedSamples.current;
        samples.push({ t: now, sent });
        while (samples.length > 2 && samples[0].t < now - 30_000) samples.shift();
        const first = samples[0];
        // Wait a few seconds before showing an estimate so it starts sane.
        if (now - first.t > 5_000 && sent > first.sent) {
          const bytesPerSec = (sent - first.sent) / ((now - first.t) / 1000);
          setEtaSeconds((total - sent) / bytesPerSec);
        }
      },
      onError: () => {
        setPhase("error");
        setError("The upload failed. Please check your connection and try again.");
      },
      onSuccess: () => {
        void pollUntilReady(uid);
      },
    });
    upload.start();
  }

  const busy = phase === "uploading" || phase === "processing";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lesson-title">Lesson title</Label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Day 1 — Warm up and basics"
          maxLength={255}
          disabled={busy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lesson-file">Video file</Label>
        <input
          ref={fileInputRef}
          id="lesson-file"
          type="file"
          accept="video/*"
          disabled={busy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-pink-600 hover:file:bg-pink-100"
        />
        <p className="text-sm text-gray-500">
          Up to 45 minutes and 20GB. MP4 works best. Big files can take a while
          on home wifi — the upload resumes by itself if the connection drops.
        </p>
      </div>

      {phase === "uploading" && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-pink-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Uploading… {progressPct}%{etaSeconds !== null && ` · ${formatTimeLeft(etaSeconds)}`}.
            Please keep this tab open until the upload finishes.
          </p>
        </div>
      )}

      {phase === "processing" && (
        <Alert variant="success" hideIcon>
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <div>
              <p className="font-medium">Upload complete — your video is safe.</p>
              <p className="mt-1">
                We&apos;re preparing it for streaming. Small videos take a few
                minutes; very large ones can take a while. You can leave this
                page or add another lesson — it will appear in the list when
                it&apos;s ready.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {phase === "done" && <Alert variant="success">Lesson added.</Alert>}

      {error && <Alert variant="error">{error}</Alert>}

      <Button
        type="button"
        variant="brand"
        onClick={startUpload}
        disabled={busy || !file || !title.trim()}
      >
        <UploadIcon className="w-4 h-4 mr-2" />
        {busy ? "Working…" : "Upload Lesson"}
      </Button>
    </div>
  );
}
