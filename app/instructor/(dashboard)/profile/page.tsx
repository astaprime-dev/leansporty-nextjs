import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { InstructorProfileForm } from "@/components/instructor/profile-form";
import GalleryManager from "@/components/instructor/gallery-manager";

export default async function InstructorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?redirect=/instructor/activate");
  }

  // Get instructor record (for slug, id, and timestamps)
  const { data: instructorRecord } = await supabase
    .from("instructors")
    .select("id, user_id, slug, created_at, updated_at")
    .eq("user_id", user.id)
    .single();

  // Get user profile data (for display fields)
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("display_name, bio, profile_photo_url, instagram_handle, website_url")
    .eq("user_id", user.id)
    .single();

  // Merge for form
  const instructorProfile = instructorRecord && userProfile
    ? {
        id: instructorRecord.id,
        user_id: instructorRecord.user_id,
        slug: instructorRecord.slug,
        display_name: userProfile.display_name,
        bio: userProfile.bio,
        profile_photo_url: userProfile.profile_photo_url,
        instagram_handle: userProfile.instagram_handle,
        website_url: userProfile.website_url,
        created_at: instructorRecord.created_at,
        updated_at: instructorRecord.updated_at,
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
          {instructorProfile ? "Edit Your Profile" : "Create Your Instructor Profile"}
        </h1>
        <p className="text-gray-600">
          {instructorProfile
            ? "Update your public instructor profile information"
            : "Set up your public profile to let students know more about you"}
        </p>
      </div>

      <InstructorProfileForm
        initialData={instructorProfile}
        userId={user.id}
      />

      {instructorProfile && (
        <div className="mt-12">
          <GalleryManager instructorId={instructorProfile.id} />
        </div>
      )}
    </div>
  );
}
