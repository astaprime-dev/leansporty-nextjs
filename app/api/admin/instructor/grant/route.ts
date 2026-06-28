import { NextRequest, NextResponse } from "next/server";
import { grantInstructorRole } from "@/lib/instructor-roles";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/admin/instructor/grant
 * Grant instructor role to a user (admin only)
 *
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - not logged in" },
        { status: 401 }
      );
    }

    // Admin-only (DEF-2): the requesting user must carry the 'admin' role.
    if (!currentUser.app_metadata?.roles?.includes("admin")) {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await grantInstructorRole(userId);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error granting instructor role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grant instructor role" },
      { status: 500 }
    );
  }
}
