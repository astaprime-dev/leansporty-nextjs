import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { LiveStreamSession } from "@/types/streaming";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InstructorStreamsPage() {
  const supabase = await createClient();

  // Check if instructor has profile
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!instructorProfile) {
      // No profile yet, redirect to create one
      redirect("/instructor/profile");
    }
  }

  // Fetch all streams (sorted by scheduled time)
  const { data: streams } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .order("scheduled_start_time", { ascending: false });

  const streamsList = (streams || []) as LiveStreamSession[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Streams</h1>
          <p className="text-gray-600 mt-1">Manage your live streaming sessions</p>
        </div>
        <Link href="/instructor/streams/create">
          <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500">
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
            <Link
              key={stream.id}
              href={`/instructor/streams/${stream.id}/broadcast`}
              className="block"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-pink-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {stream.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                    <p className="text-gray-600 mb-3">{stream.description}</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                      <span>
                        📅{" "}
                        {new Date(stream.scheduled_start_time).toLocaleString()}
                      </span>
                      <span>💰 {stream.price_in_tokens} tokens</span>
                      <span>👥 {stream.total_enrollments} enrolled</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage →
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
