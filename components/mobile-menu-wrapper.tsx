import { createClient } from "@/utils/supabase/server";
import { MobileMenu } from "./mobile-menu";

export default async function MobileMenuWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is an instructor
  let isInstructor = false;
  if (user) {
    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    isInstructor = !!instructorProfile;
  }

  return <MobileMenu user={user} isInstructor={isInstructor} />;
}
