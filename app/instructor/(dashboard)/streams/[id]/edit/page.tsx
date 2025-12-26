import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { StreamForm } from "@/components/stream-form";

interface EditStreamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStreamPage({ params }: EditStreamPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get instructor profile
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!instructorProfile) {
    redirect("/instructor/profile");
  }

  // Fetch the stream
  const { data: stream, error } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", instructorProfile.id)
    .single();

  if (error || !stream) {
    notFound();
  }

  // Only allow editing streams that haven't started yet
  if (stream.status !== "scheduled") {
    redirect(`/instructor/streams/${id}/broadcast`);
  }

  // Convert database timestamp to datetime-local format
  const scheduledStartTime = new Date(stream.scheduled_start_time)
    .toISOString()
    .slice(0, 16); // Format: YYYY-MM-DDTHH:mm

  const initialData = {
    title: stream.title,
    description: stream.description || "",
    instructorName: stream.instructor_name,
    scheduledStartTime,
    durationMinutes: Math.floor(stream.scheduled_duration_seconds / 60),
    priceInTokens: stream.price_in_tokens,
  };

  return <StreamForm mode="edit" streamId={id} initialData={initialData} />;
}
