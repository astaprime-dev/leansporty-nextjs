import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RosterExport, type RosterRow } from "@/components/instructor/roster-export";

export default async function StreamRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/instructor/streams");

  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructorProfile) redirect("/instructor/profile");

  // Ownership-scoped stream fetch.
  const { data: stream } = await supabase
    .from("live_stream_sessions")
    .select("id, title, product_id")
    .eq("id", id)
    .eq("instructor_id", instructorProfile.id)
    .single();
  if (!stream) redirect("/instructor/streams");

  // Roster rows (instructor-read RLS added in 20260704000000).
  const { data: enrollments } = await supabase
    .from("stream_enrollments")
    .select("user_id, enrolled_at")
    .eq("stream_id", id)
    .order("enrolled_at", { ascending: false });

  // Merge display names from user_profiles separately — stream_enrollments.user_id
  // FKs to auth.users, not user_profiles, so a nested select won't join here.
  const userIds = (enrollments ?? []).map((e) => e.user_id);
  const profileById = new Map<string, { display_name: string | null; username: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username")
      .in("user_id", userIds);
    for (const p of profiles ?? []) {
      profileById.set(p.user_id, { display_name: p.display_name, username: p.username });
    }
  }

  const rows: RosterRow[] = (enrollments ?? []).map((e) => {
    const p = profileById.get(e.user_id);
    return {
      name: p?.display_name || "Member",
      username: p?.username || "",
      enrolledAt: new Date(e.enrolled_at).toISOString().slice(0, 10),
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/instructor/streams/${id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to class
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">Roster</h1>
          <p className="text-gray-600 mt-1">
            {rows.length} {rows.length === 1 ? "person" : "people"} in “{stream.title}”
            {stream.product_id ? " (paid)" : " (free)"}
          </p>
        </div>
        <RosterExport
          rows={rows}
          filename={`roster-${id}.csv`}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No one has joined yet"
          description="Share your class link to fill the room."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-100 bg-pink-50/60 text-left">
                <th className="p-4 font-semibold text-gray-900">Name</th>
                <th className="p-4 font-semibold text-gray-900">Username</th>
                <th className="p-4 font-semibold text-gray-900">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="p-4 text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {r.name}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{r.username ? `@${r.username}` : "—"}</td>
                  <td className="p-4 text-gray-600">{r.enrolledAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
