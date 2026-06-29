"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkoutHistoryItem, Workout } from "@/types/database";
import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";

// Commented out - no longer needed with Apple OAuth
// Keeping for reference in case of migration needs

// export const signUpAction = async (formData: FormData) => {
//   const email = formData.get("email")?.toString();
//   const password = formData.get("password")?.toString();
//   const supabase = await createClient();
//   const origin = (await headers()).get("origin");

//   if (!email || !password) {
//     return encodedRedirect(
//       "error",
//       "/sign-up",
//       "Email and password are required",
//     );
//   }

//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       emailRedirectTo: `${origin}/auth/callback`,
//     },
//   });

//   if (error) {
//     console.error(error.code + " " + error.message);
//     return encodedRedirect("error", "/sign-up", error.message);
//   } else {
//     return encodedRedirect(
//       "success",
//       "/sign-up",
//       "Thanks for signing up! Please check your email for a verification link.",
//     );
//   }
// };

// export const signInAction = async (formData: FormData) => {
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;
//   const supabase = await createClient();

//   const { error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) {
//     return encodedRedirect("error", "/sign-in", error.message);
//   }

//   return redirect("/workouts");
// };

// export const forgotPasswordAction = async (formData: FormData) => {
//   const email = formData.get("email")?.toString();
//   const supabase = await createClient();
//   const origin = (await headers()).get("origin");
//   const callbackUrl = formData.get("callbackUrl")?.toString();

//   if (!email) {
//     return encodedRedirect("error", "/forgot-password", "Email is required");
//   }

//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
//   });

//   if (error) {
//     console.error(error.message);
//     return encodedRedirect(
//       "error",
//       "/forgot-password",
//       "Could not reset password",
//     );
//   }

//   if (callbackUrl) {
//     return redirect(callbackUrl);
//   }

//   return encodedRedirect(
//     "success",
//     "/forgot-password",
//     "Check your email for a link to reset your password.",
//   );
// };

// export const resetPasswordAction = async (formData: FormData) => {
//   const supabase = await createClient();

//   const password = formData.get("password") as string;
//   const confirmPassword = formData.get("confirmPassword") as string;

//   if (!password || !confirmPassword) {
//     encodedRedirect(
//       "error",
//       "/protected/reset-password",
//       "Password and confirm password are required",
//     );
//   }

//   if (password !== confirmPassword) {
//     encodedRedirect(
//       "error",
//       "/protected/reset-password",
//       "Passwords do not match",
//     );
//   }

//   const { error } = await supabase.auth.updateUser({
//     password: password,
//   });

//   if (error) {
//     encodedRedirect(
//       "error",
//       "/protected/reset-password",
//       "Password update failed",
//     );
//   }

//   encodedRedirect("success", "/protected/reset-password", "Password updated");
// };

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

/**
 * State returned by signInWithMagicLinkAction, rendered inline in the auth modal
 * (via useActionState) so the user gets immediate feedback without navigating away.
 */
export type MagicLinkState = {
  status: "success" | "error";
  message: string;
} | null;

/**
 * Email magic-link sign-in (OD-4 / FR-1.0.4). Lets a cold buyer who has neither
 * an Apple nor a Google account create one and authenticate at checkout. The
 * link returns through /auth/callback, which honors `redirect_to` so the user
 * resumes their original intent (e.g. checkout) instead of landing on the home page.
 *
 * Returns state (not a redirect) so the modal can show "check your email" inline
 * and stay open — the confirmation IS the flow for passwordless auth.
 */
export const signInWithMagicLinkAction = async (
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> => {
  const email = formData.get("email")?.toString().trim();
  const next = formData.get("next")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email) {
    return { status: "error", message: "Please enter your email address." };
  }

  const redirectTo = next
    ? `${origin}/auth/callback?redirect_to=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return {
      status: "error",
      message: "We couldn't send your sign-in link. Please try again.",
    };
  }

  return {
    status: "success",
    message: `Check your email — we sent a sign-in link to ${email}.`,
  };
};

// Build the OAuth callback URL, carrying the intent-resume path (UX-FR-2) when one
// is supplied via the form's hidden `next` field. Only same-site paths are honored
// (must start with "/") to avoid an open-redirect.
const oauthCallbackUrl = (origin: string | null, formData?: FormData) => {
  const next = formData?.get("next")?.toString();
  const safeNext = next && next.startsWith("/") ? next : undefined;
  return safeNext
    ? `${origin}/auth/callback?redirect_to=${encodeURIComponent(safeNext)}`
    : `${origin}/auth/callback`;
};

export const signInWithAppleAction = async (formData?: FormData) => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: oauthCallbackUrl(origin, formData),
    },
  });

  if (error) {
    return encodedRedirect("error", "/", error.message);
  }

  return redirect(data.url);
};

export const signInWithGoogleAction = async (formData?: FormData) => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: oauthCallbackUrl(origin, formData),
    },
  });

  if (error) {
    return encodedRedirect("error", "/", error.message);
  }

  return redirect(data.url);
};

export const deleteAccountAction = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "Not authenticated");
  }

  try {
    // 1. Anonymize workout sessions (keep for analytics, remove PII)
    // Set user_id to NULL to disassociate from user account
    const { error: sessionsError } = await supabase
      .from('workout_sessions')
      .update({ user_id: null })
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error anonymizing workout sessions:', sessionsError);
      return encodedRedirect("error", "/settings", "Failed to delete account data");
    }

    // 2. Enrollments and chat messages will be auto-deleted via CASCADE
    // when auth.users record is deleted

    // 3. Delete user from Supabase Auth
    // Note: This uses the client which may not have admin permissions
    // If this fails, we fall back to just signing out
    const { error: deleteError } = await supabase.rpc('delete_user');

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      // Fallback: Just sign out if delete fails
      await supabase.auth.signOut();
      return redirect("/?message=Account removal initiated");
    }

    // Sign out after successful deletion
    await supabase.auth.signOut();
    return redirect("/?message=Account successfully deleted");

  } catch (error) {
    console.error('Account deletion error:', error);
    // Fallback: Sign out on any error
    await supabase.auth.signOut();
    return redirect("/?message=Account removal initiated");
  }
};

export const getWorkoutHistory = async (): Promise<WorkoutHistoryItem[]> => {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error getting user:", userError);
    return [];
  }

  // Fetch workout sessions with workout details
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workouts (*)
    `)
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false });

  if (error) {
    console.error("Error fetching workout history:", error);
    return [];
  }

  return data as WorkoutHistoryItem[];
};

export const getWorkouts = async (): Promise<Workout[]> => {
  const supabase = await createClient();

  // Fetch all workouts, ordered by created_at (newest first)
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }

  return data as Workout[];
};

// ============================================
// LIVE STREAMING ACTIONS
// ============================================

/**
 * Get live and upcoming streams with enrollment-aware filtering
 *
 * Business logic:
 * - Not authenticated: show only future scheduled streams
 * - Authenticated but not enrolled: show only future scheduled streams
 * - Enrolled users: show future scheduled + their past enrolled scheduled streams
 * - Instructor profile pages (when instructorId provided): show ALL instructor's scheduled streams
 */
export const getStreams = async (options?: {
  enrolledStreamIds?: string[];
  instructorId?: string;
}): Promise<{
  liveStreams: LiveStreamSession[];
  upcomingStreams: LiveStreamSession[];
}> => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Build live streams query with instructor data (only id, slug, user_id)
  let liveQuery = supabase
    .from('live_stream_sessions')
    .select(`
      *,
      instructor:instructors(id, slug, user_id)
    `)
    .eq('status', 'live');

  if (options?.instructorId) {
    liveQuery = liveQuery.eq('instructor_id', options.instructorId);
  }

  const { data: liveData, error: liveError } = await liveQuery
    .order('actual_start_time', { ascending: false });

  if (liveError) {
    console.error("Error fetching live streams:", liveError);
  }

  // Build scheduled streams query with instructor data (only id, slug, user_id)
  let scheduledQuery = supabase
    .from('live_stream_sessions')
    .select(`
      *,
      instructor:instructors(id, slug, user_id)
    `)
    .eq('status', 'scheduled');

  if (options?.instructorId) {
    scheduledQuery = scheduledQuery.eq('instructor_id', options.instructorId);
  }

  const { data: allScheduledData, error: upcomingError } = await scheduledQuery
    .order('scheduled_start_time', { ascending: true });

  if (upcomingError) {
    console.error("Error fetching upcoming streams:", upcomingError);
  }

  // Filter upcoming streams based on context:
  // - If viewing instructor profile: show ALL their scheduled streams
  // - Otherwise: show future scheduled OR enrolled past scheduled
  const upcomingData = (allScheduledData || []).filter((stream) => {
    if (options?.instructorId) {
      // On instructor profile: show all scheduled streams
      return true;
    }

    const isFutureScheduled = stream.scheduled_start_time >= now;
    const isEnrolled = options?.enrolledStreamIds?.includes(stream.id);

    // Show if future scheduled OR user is enrolled (even if past scheduled)
    return isFutureScheduled || isEnrolled;
  });

  // Fetch user_profiles for all instructors
  const allStreams = [...(liveData || []), ...(upcomingData || [])];
  const instructorUserIds = Array.from(new Set(
    allStreams
      .map(s => s.instructor?.user_id)
      .filter((id): id is string => !!id)
  ));

  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, profile_photo_url')
    .in('user_id', instructorUserIds);

  // Create a map of user_id -> profile data
  const profileMap = new Map(
    userProfiles?.map(p => [p.user_id, p]) || []
  );

  // Merge user_profiles data into instructor objects
  const mergeLiveStreams = (liveData || []).map(stream => ({
    ...stream,
    instructor: stream.instructor ? {
      ...stream.instructor,
      display_name: profileMap.get(stream.instructor.user_id)?.display_name || '',
      profile_photo_url: profileMap.get(stream.instructor.user_id)?.profile_photo_url || null,
    } : null
  }));

  const mergeUpcomingStreams = upcomingData.map(stream => ({
    ...stream,
    instructor: stream.instructor ? {
      ...stream.instructor,
      display_name: profileMap.get(stream.instructor.user_id)?.display_name || '',
      profile_photo_url: profileMap.get(stream.instructor.user_id)?.profile_photo_url || null,
    } : null
  }));

  return {
    liveStreams: mergeLiveStreams as LiveStreamSession[],
    upcomingStreams: mergeUpcomingStreams as LiveStreamSession[],
  };
};

/**
 * Get past streams (ended) that user is enrolled in with available recordings
 */
export const getPastStreams = async (options?: {
  enrolledStreamIds?: string[];
}): Promise<LiveStreamSession[]> => {
  const supabase = await createClient();

  if (!options?.enrolledStreamIds || options.enrolledStreamIds.length === 0) {
    return [];
  }

  // Fetch ended streams that user is enrolled in with recordings available
  const { data, error } = await supabase
    .from('live_stream_sessions')
    .select(`
      *,
      instructor:instructors(id, slug, user_id)
    `)
    .eq('status', 'ended')
    .eq('recording_available', true)
    .in('id', options.enrolledStreamIds)
    .order('actual_end_time', { ascending: false });

  if (error) {
    console.error("Error fetching past streams:", error);
    return [];
  }

  // Fetch instructor profiles for all streams
  const instructorUserIds = Array.from(new Set(
    data
      .map(s => s.instructor?.user_id)
      .filter((id): id is string => id != null)
  ));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, profile_photo_url')
    .in('user_id', instructorUserIds);

  const profileMap = new Map(
    (profiles || []).map(p => [p.user_id, p])
  );

  // Merge instructor display names and photos
  const mergePastStreams = data.map(stream => ({
    ...stream,
    instructor: stream.instructor ? {
      ...stream.instructor,
      display_name: profileMap.get(stream.instructor.user_id)?.display_name || '',
      profile_photo_url: profileMap.get(stream.instructor.user_id)?.profile_photo_url || null,
    } : null
  }));

  return mergePastStreams as LiveStreamSession[];
};

/**
 * Get user's stream enrollments
 */
export const getUserEnrollments = async (): Promise<StreamEnrollment[]> => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('stream_enrollments')
    .select('*')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }

  return data as StreamEnrollment[];
};

/**
 * Check if user is enrolled in a specific stream
 */
export const checkStreamEnrollment = async (
  streamId: string
): Promise<StreamEnrollment | null> => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('stream_enrollments')
    .select('*')
    .eq('stream_id', streamId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    // Not enrolled (expected for this query)
    return null;
  }

  return data as StreamEnrollment;
};

/**
 * Add the current user to a stream's roster (free, live-only sessions).
 *
 * The deprecated "tokens" model is retired (FR-1.0.3): no balance is charged and
 * no token price is recorded here. Content access truth now lives in the
 * `entitlements` table via `get_playable_uid` (E1.1/E1.3) — a roster row does NOT
 * by itself unlock paid playback. Paid sessions go through Stripe Checkout →
 * webhook → entitlement; turning this into an entitlement-created cohort roster
 * is the Phase 2 work (E2.1). Safe today because no paid live product exists yet.
 */
export const enrollInStream = async (
  streamId: string
): Promise<{ success: boolean; error?: string }> => {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get stream details
  const { data: stream, error: streamError } = await supabase
    .from('live_stream_sessions')
    .select('*')
    .eq('id', streamId)
    .single();

  if (streamError || !stream) {
    return { success: false, error: 'Stream not found' };
  }

  // Check if already enrolled
  const existing = await checkStreamEnrollment(streamId);
  if (existing) {
    return { success: false, error: 'Already enrolled' };
  }

  // Tokens are retired — no deduction, no balance check. `tokens_paid` is kept at
  // 0 only because the column still exists on the deprecated schema.

  // Calculate replay expiry (7 days from now, or from actual stream end)
  const replayExpiresAt = stream.recording_expires_at ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create roster row (free live access only — not a paid-content grant)
  const { error: enrollError } = await supabase
    .from('stream_enrollments')
    .insert({
      stream_id: streamId,
      user_id: user.id,
      tokens_paid: 0,
      replay_access_expires_at: replayExpiresAt,
    });

  if (enrollError) {
    console.error("Error creating enrollment:", enrollError);
    return { success: false, error: 'Enrollment failed' };
  }

  // Update stream enrollment count
  await supabase
    .from('live_stream_sessions')
    .update({ total_enrollments: stream.total_enrollments + 1 })
    .eq('id', streamId);

  return { success: true };
};

/**
 * Get a single stream by ID
 */
export const getStreamById = async (
  streamId: string
): Promise<LiveStreamSession | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('live_stream_sessions')
    .select('*')
    .eq('id', streamId)
    .single();

  if (error) {
    console.error("Error fetching stream:", error);
    return null;
  }

  return data as LiveStreamSession;
};
