import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { OAuthSignInModal } from "./oauth-signin-modal";
import { UserMenu } from "./user-menu";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has instructor role (from app_metadata - no DB query)
  const roles = user?.app_metadata?.roles || [];
  const isInstructor = roles.includes('instructor');

  return user ? (
    <UserMenu user={user} isInstructor={isInstructor} />
  ) : (
    <OAuthSignInModal>
      <Button size="sm" variant={"outline"}>
        Sign in / Join
      </Button>
    </OAuthSignInModal>
  );
}
