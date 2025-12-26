import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import InstructorActivateForm from "./activate-form";

export default async function InstructorActivatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // NEW: Require authentication first
  if (!user) {
    redirect("/?redirect=/instructor/activate");
  }

  // Check if they already have instructor profile
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Check if they have instructor role in app_metadata
  const roles = user?.app_metadata?.roles || [];
  const hasRole = roles.includes('instructor');

  // If they have BOTH profile and role, they're fully activated
  if (instructorProfile && hasRole) {
    redirect("/instructor");
  }

  // Show activation form - handles both:
  // 1. New instructors (no profile, no role)
  // 2. Existing instructors from before role system (has profile, missing role)
  return <InstructorActivateForm />;
}
