import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { InstructorProfileForm } from "@/components/instructor/profile-form";

export default async function InstructorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?redirect=/instructor/activate");
  }

  // Get instructor profile if exists
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", user.id)
    .single();

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
    </div>
  );
}
