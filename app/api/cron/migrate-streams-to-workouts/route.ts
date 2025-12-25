import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Find all streams ready for catalog migration
    const { data: streamsToMigrate, error: fetchError } = await supabase
      .from("live_stream_sessions")
      .select("*")
      .eq("status", "ended")
      .is("migrated_to_workout_id", null)
      .not("migration_scheduled_at", "is", null)
      .lt("migration_scheduled_at", new Date().toISOString())
      .eq("recording_available", true);

    if (fetchError) {
      console.error("Error fetching streams to migrate:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch streams to migrate" },
        { status: 500 }
      );
    }

    if (!streamsToMigrate || streamsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No streams ready for migration",
        migrated: 0,
      });
    }

    const results = {
      migrated: 0,
      failed: [] as string[],
    };

    // Migrate each stream to the workouts catalog
    for (const stream of streamsToMigrate) {
      try {
        // Create a new workout entry from the stream
        const { data: newWorkout, error: insertError } = await supabase
          .from("workouts")
          .insert({
            title: stream.title,
            description: stream.description || "",
            instructor_name: stream.instructor_name || "LeanSporty Instructor",
            difficulty_level: "intermediate", // Default difficulty
            duration_in_seconds: stream.scheduled_duration_seconds,
            mux_playback_id: stream.cloudflare_stream_id, // Store Cloudflare video ID
            thumbnail_url: stream.thumbnail_url,
            category: "dance", // Default category - adjust as needed
            is_free: false, // Migrated streams are premium content
            is_featured: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to create workout for stream ${stream.id}:`, insertError);
          results.failed.push(stream.id);
          continue;
        }

        // Update the original stream to link to the new workout
        const { error: updateError } = await supabase
          .from("live_stream_sessions")
          .update({
            migrated_to_workout_id: newWorkout.id,
          })
          .eq("id", stream.id);

        if (updateError) {
          console.error(`Failed to update stream ${stream.id} with workout link:`, updateError);
          results.failed.push(stream.id);
        } else {
          results.migrated++;
          console.log(
            `Migrated stream "${stream.title}" (${stream.id}) to workout ${newWorkout.id}`
          );
        }
      } catch (error) {
        console.error(`Error migrating stream ${stream.id}:`, error);
        results.failed.push(stream.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${results.migrated} streams to workout catalog`,
      migrated: results.migrated,
      failed: results.failed.length > 0 ? results.failed : undefined,
    });
  } catch (error) {
    console.error("Migration cron job error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
