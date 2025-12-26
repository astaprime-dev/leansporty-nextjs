import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { grantInstructorRole } from "@/lib/instructor-roles";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate activation token - trim both to handle whitespace
    const trimmedToken = token?.trim();
    const expectedToken = process.env.INSTRUCTOR_ACCESS_TOKEN?.trim();

    console.log('Received token:', `"${token}"`, 'length:', token?.length);
    console.log('Trimmed token:', `"${trimmedToken}"`, 'length:', trimmedToken?.length);
    console.log('Expected token:', `"${expectedToken}"`, 'length:', expectedToken?.length);
    console.log('Tokens match:', trimmedToken === expectedToken);

    if (trimmedToken !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid activation code" },
        { status: 401 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to activate instructor status" },
        { status: 401 }
      );
    }

    // Grant instructor role using utility function
    // This creates profile, generates slug, and sets role
    const result = await grantInstructorRole(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Instructor activation error:", error);
    return NextResponse.json(
      { error: "Activation failed" },
      { status: 500 }
    );
  }
}
