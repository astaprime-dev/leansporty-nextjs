import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import InstructorLoginForm from "./login-form";

export default async function InstructorLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, check if they have an instructor profile
  if (user) {
    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    // If they have an instructor profile, redirect to dashboard
    if (instructorProfile) {
      redirect("/instructor/streams");
    }
  }

  // Otherwise, show the login form
  return <InstructorLoginForm />;
}
