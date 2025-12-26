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

  // If they have an instructor profile, redirect to dashboard
  if (instructorProfile) {
    redirect("/instructor");
  }

  // Show activation form (user is logged in but not activated)
  return <InstructorActivateForm />;
}
