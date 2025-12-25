import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  // Get provider info from user metadata
  const provider = user.app_metadata?.provider || 'Unknown';
  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent mb-8">
          Account Settings
        </h1>

        {/* Account Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Sign-in Provider</label>
              <p className="text-lg text-gray-900 capitalize">{provider}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Account Created</label>
              <p className="text-lg text-gray-900">{createdAt}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-700 mb-6">
            Once you delete your account, there is no going back. Your account will be permanently removed,
            but your workout history will be preserved for analytics purposes.
          </p>

          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
