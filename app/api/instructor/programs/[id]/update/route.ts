import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { PROGRAM_PRICE_MIN_CENTS, PROGRAM_PRICE_MAX_CENTS } from "@/lib/programs";
import type { ProductConfig } from "@/types/commerce";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/update
 * { title?, subtitle?, description?, priceCents?, coverImageUrl?, structure?, programLengthDays? }
 *
 * Text/cover/price edits are always allowed (price changes are forward-only —
 * checkout prices inline from the row, existing buyers are unaffected).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const data = await request.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if (data.title !== undefined) {
      const title = typeof data.title === "string" ? data.title.trim() : "";
      if (!title || title.length > 255) {
        return NextResponse.json(
          { error: "Title is required and must be 255 characters or fewer." },
          { status: 400 }
        );
      }
      patch.title = title;
    }

    if (data.subtitle !== undefined) {
      const subtitle = typeof data.subtitle === "string" ? data.subtitle.trim() : "";
      if (subtitle.length > 255) {
        return NextResponse.json(
          { error: "Subtitle must be 255 characters or fewer." },
          { status: 400 }
        );
      }
      patch.subtitle = subtitle || null;
    }

    if (data.description !== undefined) {
      const description =
        typeof data.description === "string" ? data.description.trim() : "";
      if (description.length > 5000) {
        return NextResponse.json(
          { error: "Description must be 5000 characters or fewer." },
          { status: 400 }
        );
      }
      patch.description = description || null;
    }

    if (data.priceCents !== undefined) {
      const priceCents = Number(data.priceCents);
      if (
        !Number.isInteger(priceCents) ||
        priceCents < PROGRAM_PRICE_MIN_CENTS ||
        priceCents > PROGRAM_PRICE_MAX_CENTS
      ) {
        return NextResponse.json(
          { error: "Price must be between €0.50 and €500." },
          { status: 400 }
        );
      }
      patch.price_cents = priceCents;
    }

    if (data.coverImageUrl !== undefined) {
      const url = typeof data.coverImageUrl === "string" ? data.coverImageUrl.trim() : "";
      if (url.length > 500) {
        return NextResponse.json({ error: "Invalid cover image URL." }, { status: 400 });
      }
      patch.cover_image_url = url || null;
    }

    if (data.structure !== undefined || data.programLengthDays !== undefined) {
      const config: ProductConfig = { ...(auth.ctx.program.config ?? {}) };
      if (data.structure !== undefined) {
        config.structure = data.structure === "days" ? "days" : "list";
      }
      if ((config.structure ?? "list") === "days") {
        const len = Number(data.programLengthDays ?? config.program_length_days);
        if (!Number.isInteger(len) || len < 1 || len > 90) {
          return NextResponse.json(
            { error: "Program length must be between 1 and 90 days." },
            { status: 400 }
          );
        }
        config.program_length_days = len;
      } else {
        delete config.program_length_days;
      }
      patch.config = config;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true });
    }

    const db = getServiceRoleClient();
    const { error } = await db.from("products").update(patch).eq("id", auth.ctx.program.id);
    if (error) {
      console.error("Program update failed:", error);
      return NextResponse.json(
        { error: "Failed to save changes. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Program update error:", error);
    return NextResponse.json(
      { error: "Failed to save changes. Please try again." },
      { status: 500 }
    );
  }
}
