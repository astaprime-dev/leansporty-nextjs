"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/** Local `datetime-local` min = now, formatted in the browser's own timezone.
 *  (toISOString() would give UTC and reject valid local times near the boundary.) */
function localDateTimeMin(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** The viewer's IANA timezone label (e.g. "Europe/Warsaw"), for the schedule hint. */
function localTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
  } catch {
    return "your local time";
  }
}

interface StreamFormData {
  title: string;
  description: string;
  scheduledStartTime: string;
  durationMinutes: number;
  /** Price in EUR as the instructor types it ("" or "0" = free). */
  priceEuros: string;
  /** Cover image URL (Cloudflare Images), or "" for none. */
  thumbnailUrl: string;
}

interface StreamFormProps {
  initialData?: Partial<StreamFormData>;
  streamId?: string;
  mode: "create" | "edit";
}

/** Suggested class prices in EUR ("" = Free). Instructors can also enter a custom amount. */
const PRESET_PRICES = ["", "5", "9", "12", "15", "19", "25", "39", "49"];

export function StreamForm({ initialData, streamId, mode }: StreamFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StreamFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    scheduledStartTime: initialData?.scheduledStartTime || "",
    durationMinutes: initialData?.durationMinutes ?? 60,
    priceEuros: initialData?.priceEuros ?? "",
    thumbnailUrl: initialData?.thumbnailUrl ?? "",
  });
  // A price not in the preset list (e.g. an existing custom amount) starts in custom mode.
  const [customPrice, setCustomPrice] = useState(
    !!initialData?.priceEuros && !PRESET_PRICES.includes(initialData.priceEuros)
  );
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/instructor/streams/thumbnail", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: data.url }));
      } else {
        setError(data.error || "Couldn't upload the cover image.");
      }
    } catch {
      setError("Couldn't upload the cover image. Please try again.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // "" / invalid / ≤0 → free (0 cents). Otherwise euros → integer cents.
    const eurosNum = parseFloat(formData.priceEuros);
    const priceCents =
      Number.isFinite(eurosNum) && eurosNum > 0 ? Math.round(eurosNum * 100) : 0;
    if (priceCents > 0 && priceCents < 50) {
      setIsLoading(false);
      setError("A paid class must be at least €0.50, or leave the price empty for free.");
      return;
    }

    try {
      const url = mode === "create"
        ? "/api/instructor/streams/create"
        : `/api/instructor/streams/${streamId}/update`;

      const payload = {
        title: formData.title,
        description: formData.description,
        scheduledStartTime: formData.scheduledStartTime,
        durationMinutes: formData.durationMinutes,
        priceCents,
        currency: "eur",
        thumbnailUrl: formData.thumbnailUrl || null,
      };

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const id = mode === "create" ? result.streamId : streamId;
        // Land on the class detail page (share the link, go live when ready) rather
        // than dropping straight into the camera/broadcast screen (S1.3).
        router.push(`/instructor/streams/${id}?created=${mode === "create" ? 1 : 0}`);
      } else {
        setError(result.error || `Failed to ${mode} the class.`);
      }
    } catch {
      setError(`Failed to ${mode} the class. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900 mb-2">
        {mode === "create" ? "Create Live Stream" : "Edit Stream"}
      </h1>
      <p className="text-gray-600 mb-8">
        {mode === "create"
          ? "Schedule a new live streaming session"
          : "Update stream details and schedule"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-2xl p-8 shadow-sm border border-pink-100"
      >
        <div className="space-y-1.5">
          <Label htmlFor="stream-title">Class title *</Label>
          <Input
            id="stream-title"
            required
            maxLength={255}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., High Energy Hip-Hop Dance Workout"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stream-description">Description</Label>
          <Textarea
            id="stream-description"
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Tell students what to expect in this class..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stream-cover">Cover image</Label>
          <div className="flex items-center gap-4">
            {formData.thumbnailUrl ? (
              <img
                src={formData.thumbnailUrl}
                alt="Class cover"
                className="h-20 w-32 rounded-lg border border-pink-100 object-cover"
              />
            ) : (
              <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-pink-200 bg-pink-50/40 text-xs text-gray-400">
                No cover
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <input
                id="stream-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-pink-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-200"
              />
              {uploadingCover ? (
                <span className="text-xs text-gray-500">Uploading…</span>
              ) : formData.thumbnailUrl ? (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                  className="w-fit text-xs text-gray-500 hover:text-pink-500"
                >
                  Remove
                </button>
              ) : (
                <span className="text-xs text-gray-500">JPG, PNG, or WebP · up to 5MB</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stream-start">Start date &amp; time *</Label>
            <Input
              id="stream-start"
              type="datetime-local"
              required
              min={localDateTimeMin()}
              value={formData.scheduledStartTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scheduledStartTime: e.target.value,
                })
              }
            />
            <p className="text-xs text-gray-500">
              Future date and time, in your timezone ({localTimezoneLabel()})
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stream-duration">Duration (minutes) *</Label>
            <Input
              id="stream-duration"
              type="number"
              required
              min={15}
              max={180}
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationMinutes: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500">Between 15 and 180 minutes</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stream-price">Price</Label>
          <select
            id="stream-price"
            value={customPrice ? "custom" : formData.priceEuros}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "custom") {
                setCustomPrice(true);
                setFormData({ ...formData, priceEuros: "" });
              } else {
                setCustomPrice(false);
                setFormData({ ...formData, priceEuros: v });
              }
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {PRESET_PRICES.map((p) => (
              <option key={p || "free"} value={p}>
                {p === "" ? "Free" : `€${p}`}
              </option>
            ))}
            <option value="custom">Custom amount…</option>
          </select>
          {customPrice && (
            <Input
              type="number"
              min={0.5}
              step="0.01"
              inputMode="decimal"
              value={formData.priceEuros}
              onChange={(e) =>
                setFormData({ ...formData, priceEuros: e.target.value })
              }
              placeholder="e.g. 22.00"
              aria-label="Custom price in euros"
            />
          )}
          <p className="text-xs text-gray-500">
            Pick a price or set a custom amount — students pay to join and you keep 85%
            (90% as a featured instructor), paid out via Stripe. Choose Free to open the
            class to everyone.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="brand"
            disabled={isLoading || uploadingCover}
            className="flex-1"
          >
            {isLoading
              ? (mode === "create" ? "Creating..." : "Saving...")
              : (mode === "create" ? "Create Stream" : "Save Changes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
