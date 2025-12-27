export interface Instructor {
  id: string;
  user_id: string;
  slug: string;
  created_at: string;
  updated_at: string;
  // Note: display_name, bio, profile_photo_url, instagram_handle, website_url
  // have been moved to user_profiles table. Join with user_profiles to get these fields.
}

// Merged type for instructor + user profile data (used in forms and display)
export interface InstructorWithProfile extends Instructor {
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  instagram_handle: string | null;
  website_url: string | null;
}

export interface InstructorWithStreams extends Instructor {
  streams: {
    id: string;
    title: string;
    scheduled_start_time: string;
    status: string;
    price_in_tokens: number;
  }[];
}
