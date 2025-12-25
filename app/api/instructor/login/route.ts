import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Simple token-based auth (not role-based, just a shared secret)
    if (token === process.env.INSTRUCTOR_ACCESS_TOKEN) {
      const cookieStore = await cookies();

      // Set secure cookie
      cookieStore.set("instructor_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid access token" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Instructor login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint
  const cookieStore = await cookies();
  cookieStore.delete("instructor_token");

  return NextResponse.json({ success: true });
}
