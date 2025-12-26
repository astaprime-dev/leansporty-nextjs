import { checkStreamEnrollment, getStreamById } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StreamWatchView } from "@/components/stream-watch-view";

export default async function StreamWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: streamId } = await params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check enrollment
  const enrollment = await checkStreamEnrollment(streamId);

  if (!enrollment) {
    redirect("/streams");
  }

  // Get stream details
  const stream = await getStreamById(streamId);

  if (!stream) {
    redirect("/streams");
  }

  return (
    <StreamWatchView
      stream={stream}
      enrollment={enrollment}
      isLive={stream.status === "live"}
    />
  );
}
