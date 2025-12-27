import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadImage } from '@/lib/cloudflare-images';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get instructor profile to verify user is an instructor
    const { data: instructorProfile, error: instructorError } = await supabase
      .from('instructors')
      .select('id, slug')
      .eq('user_id', user.id)
      .single();

    if (instructorError || !instructorProfile) {
      return NextResponse.json(
        { error: 'Only instructors can upload profile photos' },
        { status: 403 }
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 4. Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please use JPG, PNG, or WebP' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // 5. Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Create filename with instructor slug
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${instructorProfile.slug}-profile.${fileExtension}`;

    // 7. Upload to Cloudflare Images
    const { imageUrl, imageId } = await uploadImage(buffer, filename, {
      userId: user.id,
      instructorId: instructorProfile.id,
      type: 'profile_photo',
    });

    // 8. Update user profile with new photo URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_photo_url: imageUrl })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl,
      imageId,
      success: true,
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
