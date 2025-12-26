import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { LiveStreamSession } from "@/types/streaming";
import { Plus, Edit, Radio, Calendar, Coins, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InstructorStreamsPage() {
  const supabase = await createClient();

  // Check if instructor has profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!instructorProfile) {
    // No profile yet, redirect to create one
    redirect("/instructor/profile");
  }

  // Fetch only this instructor's streams with instructor data (sorted by scheduled time)
  const { data: streams } = await supabase
    .from("live_stream_sessions")
    .select(`
      *,
      instructor:instructors(id, display_name, slug, profile_photo_url)
    `)
    .eq("instructor_id", instructorProfile.id)
    .order("scheduled_start_time", { ascending: false });

  const streamsList = (streams || []) as LiveStreamSession[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Streams</h1>
          <p className="text-gray-600 mt-1">Manage your live streaming sessions</p>
        </div>
        <Link href="/instructor/streams/create" className="shrink-0">
          <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Stream
          </Button>
        </Link>
      </div>

      {streamsList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-lg text-gray-600 mb-4">No streams created yet</p>
          <Link href="/instructor/streams/create">
            <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500">
              Create Your First Stream
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {streamsList.map((stream) => (
            <div
              key={stream.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-pink-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 break-words">
                      {stream.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        stream.status === "live"
                          ? "bg-red-100 text-red-700"
                          : stream.status === "scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {stream.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 break-words">{stream.description}</p>
                  <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">{new Date(stream.scheduled_start_time).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Coins className="w-4 h-4" />
                      {stream.price_in_tokens} tokens
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="w-4 h-4" />
                      {stream.total_enrollments} enrolled
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 sm:flex-col sm:items-end">
                  {stream.status === "scheduled" && (
                    <Link href={`/instructor/streams/${stream.id}/edit`} className="flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  )}
                  <Link href={`/instructor/streams/${stream.id}/broadcast`} className="flex-1 sm:flex-initial">
                    <Button
                      variant={stream.status === "scheduled" ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                    >
                      {stream.status === "scheduled" ? (
                        <>
                          <Radio className="w-4 h-4 mr-1" />
                          Broadcast
                        </>
                      ) : (
                        "Manage →"
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
