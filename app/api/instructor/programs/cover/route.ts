import { NextRequest, NextResponse } from "next/server";
import { getInstructorContext } from "@/lib/program-auth";
import { uploadImage } from "@/lib/cloudflare-images";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/cover  (multipart: file)
 * Uploads a program cover image to Cloudflare Images and returns its URL,
 * which is then saved via the program update route. Mirrors
 * app/api/instructor/streams/thumbnail.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getInstructorContext();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
    const { imageUrl } = await uploadImage(buffer, file.name || "program-cover", {
      instructorId: auth.instructorId,
      type: "gallery_item",
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Program cover upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
