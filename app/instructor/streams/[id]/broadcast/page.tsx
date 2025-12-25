import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveStreamSession } from "@/types/streaming";
import { BroadcastManagementView } from "@/components/instructor/broadcast-management-view";

export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: stream, error } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !stream) {
    redirect("/instructor/streams");
  }

  return <BroadcastManagementView stream={stream as LiveStreamSession} />;
}
