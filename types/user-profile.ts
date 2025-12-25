export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio: string | null;
  profile_photo_url: string | null;
  location: string | null;
  birthday: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}
