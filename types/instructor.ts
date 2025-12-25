export interface Instructor {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  profile_photo_url: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
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
