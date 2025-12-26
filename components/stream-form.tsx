"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StreamFormData {
  title: string;
  description: string;
  instructorName: string;
  scheduledStartTime: string;
  durationMinutes: number;
  priceInTokens: number;
}

interface StreamFormProps {
  initialData?: Partial<StreamFormData>;
  streamId?: string;
  mode: "create" | "edit";
}

export function StreamForm({ initialData, streamId, mode }: StreamFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<StreamFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    instructorName: initialData?.instructorName || "",
    scheduledStartTime: initialData?.scheduledStartTime || "",
    durationMinutes: initialData?.durationMinutes || 60,
    priceInTokens: initialData?.priceInTokens || 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = mode === "create"
        ? "/api/instructor/streams/create"
        : `/api/instructor/streams/${streamId}/update`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        const id = mode === "create" ? result.streamId : streamId;
        router.push(`/instructor/streams/${id}/broadcast`);
      } else {
        alert(result.error || `Failed to ${mode} stream`);
      }
    } catch (error) {
      alert(`Failed to ${mode} stream. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        {mode === "create" ? "Create Live Stream" : "Edit Stream"}
      </h1>
      <p className="text-gray-600 mb-8">
        {mode === "create"
          ? "Schedule a new live streaming session"
          : "Update stream details and schedule"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Stream Title *
          </label>
          <Input
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., High Energy Hip-Hop Dance Workout"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full border rounded-lg p-3 min-h-[100px]"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Tell users what to expect in this workout..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Instructor Name *
          </label>
          <Input
            required
            value={formData.instructorName}
            onChange={(e) =>
              setFormData({ ...formData, instructorName: e.target.value })
            }
            placeholder="Your name"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date & Time *
            </label>
            <Input
              type="datetime-local"
              required
              min={new Date().toISOString().slice(0, 16)}
              value={formData.scheduledStartTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scheduledStartTime: e.target.value,
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be a future date and time
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Duration (minutes) *
            </label>
            <Input
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Price (tokens) *
          </label>
          <Input
            type="number"
            required
            min={0}
            value={formData.priceInTokens}
            onChange={(e) =>
              setFormData({
                ...formData,
                priceInTokens: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Set to 0 for a free stream
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
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
