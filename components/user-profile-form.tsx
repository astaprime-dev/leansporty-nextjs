"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types/user-profile";
import { createClient } from "@/utils/supabase/client";

interface UserProfileFormProps {
  initialData: UserProfile | null;
  userId: string;
}

export function UserProfileForm({
  initialData,
  userId,
}: UserProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    display_name: initialData?.display_name || "",
    username: initialData?.username || "",
    bio: initialData?.bio || "",
    profile_photo_url: initialData?.profile_photo_url || "",
    location: initialData?.location || "",
    instagram_handle: initialData?.instagram_handle || "",
    website_url: initialData?.website_url || "",
  });

  // Auto-generate username from display name if creating new profile
  const handleDisplayNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      display_name: value,
      // Only auto-generate username if this is a new profile and username is empty
      username: !initialData && !prev.username
        ? value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
        : prev.username,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Validate required fields
      if (!formData.display_name || !formData.username) {
        setError("Display name and username are required");
        setIsLoading(false);
        return;
      }

      // Validate username format
      if (!/^[a-z0-9-]+$/.test(formData.username)) {
        setError("Username can only contain lowercase letters, numbers, and hyphens");
        setIsLoading(false);
        return;
      }

      if (initialData) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            display_name: formData.display_name,
            username: formData.username,
            bio: formData.bio || null,
            profile_photo_url: formData.profile_photo_url || null,
            location: formData.location || null,
            instagram_handle: formData.instagram_handle || null,
            website_url: formData.website_url || null,
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: userId,
            display_name: formData.display_name,
            username: formData.username,
            bio: formData.bio || null,
            profile_photo_url: formData.profile_photo_url || null,
            location: formData.location || null,
            instagram_handle: formData.instagram_handle || null,
            website_url: formData.website_url || null,
          });

        if (insertError) throw insertError;
      }

      router.refresh();
    } catch (err: any) {
      console.error("Profile save error:", err);
      if (err.code === "23505") {
        setError("This username is already taken. Please choose another.");
      } else {
        setError(err.message || "Failed to save profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.display_name}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          placeholder="John Smith"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Your name as it will appear on your profile
        </p>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">leansporty.com/@</span>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value.toLowerCase() })
            }
            placeholder="john-smith"
            required
            disabled={isLoading}
            pattern="[a-z0-9-]+"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Profile Photo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo URL
        </label>
        <Input
          type="url"
          value={formData.profile_photo_url}
          onChange={(e) =>
            setFormData({ ...formData, profile_photo_url: e.target.value })
          }
          placeholder="https://example.com/photo.jpg"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Direct URL to your profile photo
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          placeholder="San Francisco, CA"
          disabled={isLoading}
        />
      </div>

      {/* Instagram Handle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instagram Handle
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">@</span>
          <Input
            type="text"
            value={formData.instagram_handle}
            onChange={(e) =>
              setFormData({ ...formData, instagram_handle: e.target.value })
            }
            placeholder="johnsmith"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website
        </label>
        <Input
          type="url"
          value={formData.website_url}
          onChange={(e) =>
            setFormData({ ...formData, website_url: e.target.value })
          }
          placeholder="https://yourwebsite.com"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
        >
          {isLoading ? "Saving..." : initialData ? "Update Profile" : "Create Profile"}
        </Button>

        {initialData && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/@${initialData.username}`)}
            disabled={isLoading}
          >
            View Public Profile
          </Button>
        )}
      </div>
    </form>
  );
}
