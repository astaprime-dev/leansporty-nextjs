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

    // Single-use, attributable, expirable invite code (S0.3) — the only path.
    // The legacy shared INSTRUCTOR_ACCESS_TOKEN fallback was removed 2026-07-27.
    const authorized = await consumeInstructorInvite(code, user.id);

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
