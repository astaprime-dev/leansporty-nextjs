import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamsView } from "@/components/streams-view";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Live dance classes",
  description:
    "Live-streamed dance and fitness classes you can join from home — see what's on now and what's coming up.",
  alternates: { canonical: "/streams" },
};

export default async function StreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  // Check auth status
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user enrollments (to badge cards) and the shared catalog
  const enrollments = await getUserEnrollments();
  const streams = await getStreams();

  return (
    <StreamsView
      liveStreams={streams.liveStreams}
      upcomingStreams={streams.upcomingStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
      notice={notice}
    />
  );
}
