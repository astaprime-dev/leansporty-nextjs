import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  grantInstructorRole,
  consumeInstructorInvite,
} from "@/lib/instructor-roles";

/**
 * Best-effort per-user activation rate limiter. In-memory (per serverless instance,
 * resets on cold start) — a deterrent against code-guessing, mirroring the playback
 * token limiter. Activation requires an authenticated user, so we key on user id.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60_000; // 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(userId: string): boolean {
  const now = Date.now();
  const entry = attempts.get(userId);
  if (!entry || now > entry.resetAt) {
    attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const code = typeof body?.token === "string" ? body.token.trim() : "";

    // Must be logged in to activate — and we rate-limit per user.
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to activate instructor status" },
        { status: 401 }
      );
    }

    if (tooManyAttempts(user.id)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Invalid activation code" },
        { status: 401 }
      );
    }

    // Primary path: single-use, attributable, expirable invite code (S0.3).
    let authorized = await consumeInstructorInvite(code, user.id);

    // Legacy fallback: the old shared INSTRUCTOR_ACCESS_TOKEN, honored ONLY while the
    // env var is still set. Retire it (unset the var) once invite codes are issued —
    // then this branch is dead and the shared secret is fully gone.
    if (!authorized) {
      const legacy = process.env.INSTRUCTOR_ACCESS_TOKEN?.trim();
      if (legacy && code === legacy) {
        authorized = true;
        console.warn(
          "Instructor activation used the LEGACY shared token — issue per-user invite codes and retire INSTRUCTOR_ACCESS_TOKEN."
        );
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Invalid activation code" },
        { status: 401 }
      );
    }

    // Grant instructor role (creates profile, generates slug, sets role).
    const result = await grantInstructorRole(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Instructor activation error:", error);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
