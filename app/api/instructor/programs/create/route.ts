import { NextRequest, NextResponse } from "next/server";
import { getInstructorContext } from "@/lib/program-auth";
import { provisionProgramProduct } from "@/lib/program-products";
import { SUPPORTED_CURRENCIES } from "@/lib/stream-products";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  PROGRAM_CAPS,
  PROGRAM_PRICE_MIN_CENTS,
  PROGRAM_PRICE_MAX_CENTS,
} from "@/lib/programs";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/create
 * { title, priceCents, currency?, structure: "list"|"days", programLengthDays? }
 *
 * Creates a DRAFT program (products row, kind='course', is_active=false).
 * Lessons and publishing happen on the manage page.
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title || title.length > 255) {
      return NextResponse.json(
        { error: "Title is required and must be 255 characters or fewer." },
        { status: 400 }
      );
    }

    const priceCents = Number(data.priceCents);
    if (
      !Number.isInteger(priceCents) ||
      priceCents < PROGRAM_PRICE_MIN_CENTS ||
      priceCents > PROGRAM_PRICE_MAX_CENTS
    ) {
      return NextResponse.json(
        { error: "Price must be between €5 and €500." },
        { status: 400 }
      );
    }

    const currency =
      typeof data.currency === "string" && data.currency.trim()
        ? data.currency.trim().toLowerCase()
        : "eur";
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      return NextResponse.json({ error: "Only EUR pricing is supported." }, { status: 400 });
    }

    const structure = data.structure === "days" ? "days" : "list";
    let programLengthDays: number | undefined;
    if (structure === "days") {
      programLengthDays = Number(data.programLengthDays);
      if (
        !Number.isInteger(programLengthDays) ||
        programLengthDays < 1 ||
        programLengthDays > 90
      ) {
        return NextResponse.json(
          { error: "Program length must be between 1 and 90 days." },
          { status: 400 }
        );
      }
    }

    const auth = await getInstructorContext();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Cap: programs per instructor (draft + published).
    const db = getServiceRoleClient();
    const { count } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("kind", "course")
      .eq("instructor_id", auth.instructorId);
    if ((count ?? 0) >= PROGRAM_CAPS.maxProgramsPerInstructor) {
      return NextResponse.json(
        {
          error: `You can have up to ${PROGRAM_CAPS.maxProgramsPerInstructor} programs right now. Contact us if you need more.`,
        },
        { status: 400 }
      );
    }

    const { productId, slug } = await provisionProgramProduct({
      instructorId: auth.instructorId,
      title,
      priceCents,
      currency,
      structure,
      programLengthDays,
    });

    return NextResponse.json({ programId: productId, slug, success: true });
  } catch (error) {
    console.error("Program creation error:", error);
    return NextResponse.json(
      { error: "Failed to create the program. Please try again." },
      { status: 500 }
    );
  }
}
