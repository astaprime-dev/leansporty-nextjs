import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createLiveInput } from "@/lib/cloudflare-stream";
import { provisionStreamProduct } from "@/lib/stream-products";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Validate title.
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title || title.length > 255) {
      return NextResponse.json(
        { error: "Title is required and must be 255 characters or fewer." },
        { status: 400 }
      );
    }

    // Validate description (optional).
    const description =
      typeof data.description === "string" ? data.description.trim() : "";
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Description must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    // Validate duration (integer minutes, 15–180).
    const durationMinutes = Number(data.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      return NextResponse.json(
        { error: "Duration must be a whole number of minutes between 15 and 180." },
        { status: 400 }
      );
    }

    // Validate price in minor units (S2): 0 = free, otherwise a whole number of cents
    // ≥ 50 (Stripe's practical minimum). Currency defaults to eur.
    const priceCents = Number(data.priceCents ?? 0);
    if (!Number.isInteger(priceCents) || priceCents < 0 || (priceCents > 0 && priceCents < 50)) {
      return NextResponse.json(
        { error: "Price must be 0 (free) or at least 50 cents." },
        { status: 400 }
      );
    }
    const currency =
      typeof data.currency === "string" && data.currency.trim()
        ? data.currency.trim().toLowerCase()
        : "eur";

    const thumbnailUrl =
      typeof data.thumbnailUrl === "string" && data.thumbnailUrl.trim().length <= 500
        ? data.thumbnailUrl.trim() || null
        : null;

    // Validate scheduled time: must be a real date AND in the future. Guard against
    // the `new Date(undefined) <= now` bypass (NaN comparisons are always false).
    const scheduledDate = new Date(data.scheduledStartTime);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled start time must be a valid time in the future." },
        { status: 400 }
      );
    }

    // Authenticate FIRST — never create a Cloudflare live input for an
    // unauthenticated / non-instructor caller (resource-abuse guard).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { data: instructorProfile, error: instructorError } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (instructorError || !instructorProfile) {
      console.error("Instructor lookup error:", instructorError);
      return NextResponse.json(
        { error: "Instructor profile not found. Please create your profile first." },
        { status: 400 }
      );
    }

    // Check Cloudflare environment variables
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
      console.error("Missing Cloudflare credentials");
      return NextResponse.json(
        { error: "Cloudflare not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create Cloudflare live input (only reached by an authenticated instructor)
    let cloudflare;
    try {
      cloudflare = await createLiveInput(title);

      // Validate Cloudflare response
      if (!cloudflare.webrtcUrl || !cloudflare.streamId) {
        console.error("Invalid Cloudflare response:", cloudflare);
        throw new Error("Cloudflare returned invalid data - missing webrtcUrl or streamId");
      }

      console.log("Cloudflare live input created:", {
        streamId: cloudflare.streamId,
        hasWebrtcUrl: !!cloudflare.webrtcUrl,
        hasToken: !!cloudflare.webrtcToken,
        hasWhepUrl: !!cloudflare.whepPlaybackUrl,
      });
    } catch (cloudflareError: any) {
      console.error("Cloudflare API error:", cloudflareError);
      return NextResponse.json(
        { error: "Could not set up the live stream. Please try again." },
        { status: 500 }
      );
    }

    // Create stream session in database. NOTE: the live-ingest secrets (WHIP/RTMPS
    // url + key) are deliberately NOT stored here — live_stream_sessions is publicly
    // readable, so they go into the owner-only live_stream_ingest table below.
    const { data: stream, error } = await supabase
      .from("live_stream_sessions")
      .insert({
        title,
        description: description || null,
        instructor_id: instructorProfile.id,
        scheduled_start_time: scheduledDate.toISOString(),
        scheduled_duration_seconds: durationMinutes * 60,
        price_in_tokens: 0, // legacy column (NOT NULL); real pricing lives on the linked product
        thumbnail_url: thumbnailUrl,
        cloudflare_stream_id: cloudflare.streamId,
        cloudflare_playback_id: cloudflare.playbackId,
        cloudflare_whep_playback_url: cloudflare.whepPlaybackUrl,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save stream. Please try again." },
        { status: 500 }
      );
    }

    // Store the ingest secrets in the owner-only table. RLS allows this because the
    // stream we just created belongs to this instructor.
    const { error: ingestError } = await supabase
      .from("live_stream_ingest")
      .insert({
        stream_id: stream.id,
        webrtc_url: cloudflare.webrtcUrl,
        webrtc_token: cloudflare.webrtcToken,
        rtmps_url: cloudflare.rtmpsUrl,
        rtmps_stream_key: cloudflare.rtmpsStreamKey,
      });

    if (ingestError) {
      // Without ingest credentials the stream can't be broadcast — don't leave a
      // half-created stream around. Best-effort delete of the row we just made
      // (owner-scoped) so the instructor can cleanly retry.
      console.error("Ingest secret store error:", ingestError);
      await supabase.from("live_stream_sessions").delete().eq("id", stream.id);
      return NextResponse.json(
        { error: "Failed to save stream. Please try again." },
        { status: 500 }
      );
    }

    // Paid class → provision its Stripe product/price and link it. The stream is
    // already saved (as free) if this fails, so we surface the error but keep the
    // class; the instructor can re-price via Edit.
    if (priceCents > 0) {
      try {
        const { productId } = await provisionStreamProduct({
          instructorId: instructorProfile.id,
          streamId: stream.id,
          title,
          priceCents,
          currency,
        });
        await supabase
          .from("live_stream_sessions")
          .update({ product_id: productId })
          .eq("id", stream.id)
          .eq("instructor_id", instructorProfile.id);
      } catch (e) {
        console.error("Stream product provisioning failed:", e);
        return NextResponse.json(
          {
            streamId: stream.id,
            success: true,
            warning: "Your class was created, but pricing couldn't be set up. Edit the class to add a price.",
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ streamId: stream.id, success: true });
  } catch (error: any) {
    console.error("Stream creation error:", error);
    return NextResponse.json(
      { error: "Failed to create stream. Please try again." },
      { status: 500 }
    );
  }
}
