import { NextRequest, NextResponse } from "next/server";
import { revokeInstructorRole } from "@/lib/instructor-roles";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/admin/instructor/revoke
 * Revoke instructor role from a user (admin only)
 *
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll just process the request
    // In production, verify the requesting user is an admin

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - not logged in" },
        { status: 401 }
      );
    }

    // TODO: Check if currentUser is an admin
    // if (!currentUser.app_metadata?.roles?.includes('admin')) {
    //   return NextResponse.json(
    //     { error: "Forbidden - admin access required" },
    //     { status: 403 }
    //   );
    // }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await revokeInstructorRole(userId);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error revoking instructor role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke instructor role" },
      { status: 500 }
    );
  }
}
