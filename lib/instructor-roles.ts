import { createClient } from "@supabase/supabase-js";

/**
 * Grant instructor role to a user
 * Creates instructor profile and sets role in app_metadata
 */
export async function grantInstructorRole(userId: string) {
  // Create admin client with service role key for auth.admin methods
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 2. Check if instructor profile exists
    const { data: existingInstructor } = await supabase
      .from("instructors")
      .select("id, slug")
      .eq("user_id", userId)
      .single();

    // Also get user_profiles data
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username")
      .eq("user_id", userId)
      .single();

    // 3. Check if user has instructor role in app_metadata
    const currentRoles = user.app_metadata?.roles || [];
    const hasRole = currentRoles.includes('instructor');

    // 4. If both instructor record and role exist, nothing to do
    if (existingInstructor && hasRole) {
      return {
        success: true,
        alreadyInstructor: true,
        slug: existingInstructor.slug,
        displayName: existingProfile?.display_name
      };
    }

    // 5. If instructor record exists but role is missing, just add the role
    if (existingInstructor && !hasRole) {
      const updatedRoles = [...currentRoles, 'instructor'];

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          app_metadata: { roles: updatedRoles }
        }
      );

      if (updateError) {
        throw new Error(`Failed to add instructor role: ${updateError.message}`);
      }

      return {
        success: true,
        roleAdded: true,
        slug: existingInstructor.slug,
        displayName: existingProfile?.display_name
      };
    }

    // 6. Instructor record doesn't exist - create it and add role
    // user_profiles should already exist (auto-created on signup)
    // Generate slug from user profile or fallback to user data
    let displayName = existingProfile?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Instructor";

    let baseSlug = (existingProfile?.username || displayName)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (!baseSlug || baseSlug === "") {
      baseSlug = `instructor-${Date.now()}`;
    }

    // 7. Make slug unique
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

    // 8. Ensure user_profiles exists and update display_name if needed
    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          display_name: displayName,
          username: slug, // Use slug as username
        });

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }
    }

    // 9. Create instructors entry with ONLY slug
    const { error: insertError } = await supabase
      .from("instructors")
      .insert({
        user_id: userId,
        slug: slug,
      });

    if (insertError) {
      throw new Error(`Failed to create instructor record: ${insertError.message}`);
    }

    // 9. Add instructor role to app_metadata (don't replace existing roles)
    // Reuse currentRoles from step 3 - it hasn't changed
    const updatedRoles = hasRole
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
  // Create admin client with service role key for auth.admin methods
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Get user to access current roles
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 2. Delete instructor record (keep user_profiles)
    const { error: deleteError } = await supabase
      .from("instructors")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw new Error(`Failed to delete instructor record: ${deleteError.message}`);
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
  // Create admin client with service role key for auth.admin methods
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: { user } } = await supabase.auth.admin.getUserById(userId);

  const roles = user?.app_metadata?.roles || [];
  return roles.includes('instructor');
}

/**
 * Verify instructor profile exists in database
 * Authoritative check for actual profile existence
 */
export async function verifyInstructorProfile(userId: string): Promise<boolean> {
  // For database queries, regular client is fine (doesn't need service role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", userId)
    .single();

  return !!profile;
}
