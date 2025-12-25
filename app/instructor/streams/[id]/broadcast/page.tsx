import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveStreamSession } from "@/types/streaming";
import { BroadcastManagementView } from "@/components/instructor/broadcast-management-view";

export default async function BroadcastPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: stream, error } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !stream) {
    redirect("/instructor/streams");
  }

  return <BroadcastManagementView stream={stream as LiveStreamSession} />;
}
