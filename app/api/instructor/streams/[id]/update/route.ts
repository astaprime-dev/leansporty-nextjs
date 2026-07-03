import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  provisionStreamProduct,
  deactivateStreamProduct,
} from "@/lib/stream-products";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get instructor profile
    const { data: instructorProfile, error: profileError } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !instructorProfile) {
      return NextResponse.json(
        { error: "Instructor profile not found" },
        { status: 403 }
      );
    }

    // Verify stream ownership and status
    const { data: existingStream, error: streamError } = await supabase
      .from("live_stream_sessions")
      .select("status, product_id")
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id)
      .single();

    if (streamError || !existingStream) {
      return NextResponse.json(
        { error: "Stream not found" },
        { status: 404 }
      );
    }

    // Only allow editing scheduled streams
    if (existingStream.status !== "scheduled") {
      return NextResponse.json(
        { error: "Can only edit scheduled streams" },
        { status: 400 }
      );
    }

    // Parse + validate body (mirrors create).
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 255) {
      return NextResponse.json({ error: "Title is required and must be 255 characters or fewer." }, { status: 400 });
    }
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const durationMinutes = Number(body?.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      return NextResponse.json({ error: "Duration must be a whole number of minutes between 15 and 180." }, { status: 400 });
    }
    const priceCents = Number(body?.priceCents ?? 0);
    if (!Number.isInteger(priceCents) || priceCents < 0 || (priceCents > 0 && priceCents < 50)) {
      return NextResponse.json({ error: "Price must be 0 (free) or at least 50 cents." }, { status: 400 });
    }
    const currency =
      typeof body?.currency === "string" && body.currency.trim()
        ? body.currency.trim().toLowerCase()
        : "eur";

    const scheduledDate = new Date(body?.scheduledStartTime);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled start time must be a valid time in the future." }, { status: 400 });
    }

    // Resolve the price transition (free ↔ paid ↔ re-priced) into a product_id.
    let newProductId: string | null = existingStream.product_id;
    if (priceCents > 0) {
      let existing = null;
      if (existingStream.product_id) {
        const { data: prod } = await supabase
          .from("products")
          .select("id, slug, stripe_product_id")
          .eq("id", existingStream.product_id)
          .maybeSingle();
        existing = prod;
      }
      try {
        const { productId } = await provisionStreamProduct({
          instructorId: instructorProfile.id,
          streamId: id,
          title,
          priceCents,
          currency,
          existing,
        });
        newProductId = productId;
      } catch (e) {
        console.error("Stream re-pricing failed:", e);
        return NextResponse.json({ error: "Couldn't update the price. Please try again." }, { status: 500 });
      }
    } else if (existingStream.product_id) {
      // Paid → free: retire the product and unlink it.
      await deactivateStreamProduct(existingStream.product_id);
      newProductId = null;
    }

    const { error: updateError } = await supabase
      .from("live_stream_sessions")
      .update({
        title,
        description: description || null,
        scheduled_start_time: scheduledDate.toISOString(),
        scheduled_duration_seconds: durationMinutes * 60,
        product_id: newProductId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id);

    if (updateError) {
      console.error("Error updating stream:", updateError);
      return NextResponse.json(
        { error: "Failed to update stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamId: id,
    });
  } catch (error) {
    console.error("Error in update stream API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
