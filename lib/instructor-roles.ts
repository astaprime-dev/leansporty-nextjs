import { createClient } from "@/utils/supabase/server";

/**
 * Grant instructor role to a user
 * Creates instructor profile and sets role in app_metadata
 */
export async function grantInstructorRole(userId: string) {
  const supabase = await createClient();

  try {
    // 1. Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 2. Check if already an instructor
    const { data: existingProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingProfile) {
      return { success: true, alreadyInstructor: true };
    }

    // 3. Generate slug from user data
    let displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Instructor";
    let baseSlug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (!baseSlug || baseSlug === "") {
      baseSlug = `instructor-${Date.now()}`;
    }

    // 4. Make slug unique
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data: existingSlug } = await supabase
        .from("instructors")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingSlug) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // 5. Create instructor profile
    const { error: insertError } = await supabase
      .from("instructors")
      .insert({
        user_id: userId,
        display_name: displayName,
        slug: slug,
      });

    if (insertError) {
      throw new Error(`Failed to create instructor profile: ${insertError.message}`);
    }

    // 6. Add instructor role to app_metadata (don't replace existing roles)
    const currentRoles = user.app_metadata?.roles || [];
    const updatedRoles = currentRoles.includes('instructor')
      ? currentRoles
      : [...currentRoles, 'instructor'];

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { roles: updatedRoles }
      }
    );

    if (updateError) {
      // Profile created but role not set - log warning but don't fail
      console.error("Failed to add instructor role to app_metadata:", updateError);
    }

    return {
      success: true,
      slug,
      displayName
    };

  } catch (error) {
    console.error("Error granting instructor role:", error);
    throw error;
  }
}

/**
 * Revoke instructor role from a user
 * Deletes instructor profile and removes 'instructor' from roles array
 */
export async function revokeInstructorRole(userId: string) {
  const supabase = await createClient();

  try {
    // 1. Get user to access current roles
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 2. Delete instructor profile
    const { error: deleteError } = await supabase
      .from("instructors")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(`Failed to delete instructor profile: ${deleteError.message}`);
    }

    // 3. Remove 'instructor' from roles array (keep other roles)
    const currentRoles = user.app_metadata?.roles || [];
    const updatedRoles = currentRoles.filter((role: string) => role !== 'instructor');

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { roles: updatedRoles }
      }
    );

    if (updateError) {
      console.error("Failed to remove instructor role from app_metadata:", updateError);
      // Profile deleted but role still set - not ideal but not critical
    }

    return { success: true };

  } catch (error) {
    console.error("Error revoking instructor role:", error);
    throw error;
  }
}

/**
 * Check if a user has instructor role
 * Fast check using app_metadata (no DB query)
 */
export async function hasInstructorRole(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.admin.getUserById(userId);

  const roles = user?.app_metadata?.roles || [];
  return roles.includes('instructor');
}

/**
 * Verify instructor profile exists in database
 * Authoritative check for actual profile existence
 */
export async function verifyInstructorProfile(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", userId)
    .single();

  return !!profile;
}
