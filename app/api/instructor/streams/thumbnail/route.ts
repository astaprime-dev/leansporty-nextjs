import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uploadImage } from "@/lib/cloudflare-images";

export const runtime = "nodejs";

/**
 * POST /api/instructor/streams/thumbnail  (multipart: file)
 * Uploads a class cover image to Cloudflare Images and returns its URL. The URL is
 * then submitted with the stream create/update as `thumbnailUrl`. Instructor-only.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: instructor } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!instructor) {
      return NextResponse.json({ error: "Not an instructor" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const { imageUrl } = await uploadImage(buffer, file.name || "cover", {
      instructorId: instructor.id,
      type: "gallery_item",
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
