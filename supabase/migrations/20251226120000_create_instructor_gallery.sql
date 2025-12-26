-- Create instructor gallery items table
-- This table stores images and videos that instructors upload to showcase on their profile

CREATE TABLE IF NOT EXISTS instructor_gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  cloudflare_image_id TEXT NOT NULL,
  cloudflare_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_instructor_order UNIQUE(instructor_id, display_order)
);

-- Create index for efficient querying by instructor and order
CREATE INDEX idx_gallery_instructor ON instructor_gallery_items(instructor_id, display_order);

-- Add comment to table
COMMENT ON TABLE instructor_gallery_items IS 'Stores gallery media (images/videos) for instructor profiles, max 8 items per instructor';

-- Add comments to key columns
COMMENT ON COLUMN instructor_gallery_items.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN instructor_gallery_items.cloudflare_image_id IS 'Cloudflare Images ID for the uploaded media';
COMMENT ON COLUMN instructor_gallery_items.display_order IS 'Order in which items appear in gallery (0-7)';
