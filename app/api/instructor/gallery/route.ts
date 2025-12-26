import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadImage, uploadVideo, deleteMedia } from '@/lib/cloudflare-images';

// GET - Fetch all gallery items for the instructor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get instructor profile
    const { data: instructorProfile, error: instructorError } = await supabase
      .from('instructors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (instructorError || !instructorProfile) {
      return NextResponse.json(
        { error: 'Instructor profile not found' },
        { status: 404 }
      );
    }

    // Fetch gallery items
    const { data: galleryItems, error: galleryError } = await supabase
      .from('instructor_gallery_items')
      .select('*')
      .eq('instructor_id', instructorProfile.id)
      .order('display_order', { ascending: true });

    if (galleryError) {
      console.error('Error fetching gallery items:', galleryError);
      return NextResponse.json(
        { error: 'Failed to fetch gallery items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ galleryItems });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

// POST - Upload new gallery item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get instructor profile
    const { data: instructorProfile, error: instructorError } = await supabase
      .from('instructors')
      .select('id, slug')
      .eq('user_id', user.id)
      .single();

    if (instructorError || !instructorProfile) {
      return NextResponse.json(
        { error: 'Instructor profile not found' },
        { status: 404 }
      );
    }

    // Check current gallery item count
    const { count } = await supabase
      .from('instructor_gallery_items')
      .select('*', { count: 'exact', head: true })
      .eq('instructor_id', instructorProfile.id);

    if (count !== null && count >= 8) {
      return NextResponse.json(
        { error: 'Maximum of 8 gallery items allowed' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine media type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or video' },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    const validVideoTypes = ['video/mp4', 'video/webm'];

    if (isImage && !validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please use JPG, PNG, WebP, or GIF' },
        { status: 400 }
      );
    }

    if (isVideo && !validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video type. Please use MP4 or WebM' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB

    if (isImage && file.size > maxImageSize) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    if (isVideo && file.size > maxVideoSize) {
      return NextResponse.json(
        { error: 'Video too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine next display order
    const { data: lastItem } = await supabase
      .from('instructor_gallery_items')
      .select('display_order')
      .eq('instructor_id', instructorProfile.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = lastItem ? lastItem.display_order + 1 : 0;

    // Create filename with instructor slug and order
    const fileExtension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const filename = `${instructorProfile.slug}-gallery-${nextOrder}.${fileExtension}`;

    // Upload to Cloudflare Images
    const uploadFn = isVideo ? uploadVideo : uploadImage;
    const { imageUrl, imageId } = await uploadFn(buffer, filename, {
      userId: user.id,
      instructorId: instructorProfile.id,
      type: 'gallery_item',
      order: nextOrder,
    });

    // Insert into database
    const { data: newItem, error: insertError } = await supabase
      .from('instructor_gallery_items')
      .insert({
        instructor_id: instructorProfile.id,
        media_type: isVideo ? 'video' : 'image',
        cloudflare_image_id: imageId,
        cloudflare_url: imageUrl,
        display_order: nextOrder,
        caption: caption || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting gallery item:', insertError);
      // Try to delete uploaded media from Cloudflare
      await deleteMedia(imageId);
      return NextResponse.json(
        { error: 'Failed to save gallery item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ galleryItem: newItem, success: true });
  } catch (error: any) {
    console.error('Gallery upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// DELETE - Remove gallery item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get item ID from query params
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Get the gallery item to verify ownership and get Cloudflare ID
    const { data: item, error: fetchError } = await supabase
      .from('instructor_gallery_items')
      .select('*, instructors!inner(user_id)')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (item.instructors.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from('instructor_gallery_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting gallery item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete gallery item' },
        { status: 500 }
      );
    }

    // Delete from Cloudflare (best effort)
    await deleteMedia(item.cloudflare_image_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Gallery delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

// PATCH - Update gallery item (order or caption)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, displayOrder, caption } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: item, error: fetchError } = await supabase
      .from('instructor_gallery_items')
      .select('*, instructors!inner(user_id)')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    if (item.instructors.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object
    const updates: any = {};
    if (displayOrder !== undefined) updates.display_order = displayOrder;
    if (caption !== undefined) updates.caption = caption;

    // Update item
    const { error: updateError } = await supabase
      .from('instructor_gallery_items')
      .update(updates)
      .eq('id', itemId);

    if (updateError) {
      console.error('Error updating gallery item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update gallery item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Gallery update error:', error);
    return NextResponse.json(
      { error: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}
