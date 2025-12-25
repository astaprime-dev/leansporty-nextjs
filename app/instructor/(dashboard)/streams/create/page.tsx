"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateStreamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructorName: "",
    scheduledStartTime: "",
    durationMinutes: 60,
    priceInTokens: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/instructor/streams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.streamId) {
        router.push(`/instructor/streams/${result.streamId}/broadcast`);
      } else {
        alert(result.error || "Failed to create stream");
      }
    } catch (error) {
      alert("Failed to create stream. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Create Live Stream</h1>
      <p className="text-gray-600 mb-8">
        Schedule a new live streaming session
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
              value={formData.scheduledStartTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scheduledStartTime: e.target.value,
                })
              }
            />
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
            {isLoading ? "Creating..." : "Create Stream"}
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
