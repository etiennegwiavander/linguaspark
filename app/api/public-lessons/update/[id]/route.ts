import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { updatePublicLesson } from '@/lib/public-lessons-server';
import type { PublicLesson } from '@/lib/types/public-lessons';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to update public lessons'
        },
        { status: 401 }
      );
    }

    // Get lesson ID from params
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Lesson ID is required'
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates = body as Partial<PublicLesson>;

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Update data is required'
        },
        { status: 400 }
      );
    }

    // Update public lesson
    const result = await updatePublicLesson(lessonId, updates, user.id);

    if (!result.success) {
      const statusCode = 
        result.error === 'AUTHENTICATION_ERROR' ? 401 :
        result.error === 'PERMISSION_DENIED' ? 403 :
        result.error === 'VALIDATION_ERROR' ? 400 :
        result.error === 'NOT_FOUND' ? 404 :
        500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Public lesson updated successfully'
    });

  } catch (error) {
    console.error('Error updating public lesson:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while updating the lesson'
      },
      { status: 500 }
    );
  }
}
