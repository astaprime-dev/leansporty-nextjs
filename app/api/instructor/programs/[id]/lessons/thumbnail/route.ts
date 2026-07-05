import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { uploadImage } from "@/lib/cloudflare-images";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/lessons/thumbnail
 * (multipart: file, contentId)
 *
 * Uploads a lesson thumbnail to Cloudflare Images and sets it as the
 * workout's thumbnailUrl. Needed because direct-upload lessons have
 * requireSignedURLs on, which 404s Cloudflare Stream's auto-thumbnails.
 * Note: workouts rows are shared (a reused class recording shows the same
 * image in the catalog) — acceptable, it's the instructor's own content.
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
    const { program, instructorId } = auth.ctx;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const contentId = formData.get("contentId");
    if (!file || typeof contentId !== "string" || !contentId) {
      return NextResponse.json({ error: "file and contentId required" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!file.type || !validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Please use a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    // The lesson must belong to this program (which we own).
    const db = getServiceRoleClient();
    const { data: item } = await db
      .from("product_items")
      .select("content_id")
      .eq("product_id", program.id)
      .eq("content_id", contentId)
      .maybeSingle();
    if (!item) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { imageUrl } = await uploadImage(buffer, file.name || "lesson-thumb", {
      instructorId,
      type: "gallery_item",
    });

    const { error } = await db
      .from("workouts")
      .update({ thumbnailUrl: imageUrl })
      .eq("id", contentId);
    if (error) {
      console.error("Lesson thumbnail update failed:", error);
      return NextResponse.json(
        { error: "Failed to save the image. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Lesson thumbnail error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instructor/programs/[id]/lessons/thumbnail  { contentId }
 * Clears the lesson image (back to the placeholder / auto-thumbnail).
 */
export async function DELETE(
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
    const contentId = typeof data?.contentId === "string" ? data.contentId : "";
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    const db = getServiceRoleClient();
    const { data: item } = await db
      .from("product_items")
      .select("content_id")
      .eq("product_id", auth.ctx.program.id)
      .eq("content_id", contentId)
      .maybeSingle();
    if (!item) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const { error } = await db
      .from("workouts")
      .update({ thumbnailUrl: null })
      .eq("id", contentId);
    if (error) {
      console.error("Lesson thumbnail clear failed:", error);
      return NextResponse.json(
        { error: "Failed to remove the image. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson thumbnail delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove the image. Please try again." },
      { status: 500 }
    );
  }
}
