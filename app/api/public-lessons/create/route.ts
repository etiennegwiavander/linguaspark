import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { createPublicLesson, validatePublicLessonContent } from '@/lib/public-lessons-server';
import { isAdmin } from '@/lib/admin-utils-server';
import type { LessonContent, PublicLessonMetadata } from '@/lib/types/public-lessons';

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
    const body = await request.json();
    const { lesson, metadata, userId } = body as {
      lesson: LessonContent;
      metadata: PublicLessonMetadata;
      userId?: string;
    };

    let authenticatedUserId: string;

    // Check if userId is provided (from extension)
    if (userId) {
      // Verify the user is an admin
      const adminStatus = await isAdmin(userId);
      if (!adminStatus) {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'Only admins can create public lessons'
          },
          { status: 403 }
        );
      }
      authenticatedUserId = userId;
    } else {
      // Get authenticated user from Authorization header or session
      const authHeader = request.headers.get('authorization');
      let user = null;
      let authError = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use the Bearer token from the header
        const token = authHeader.substring(7);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        });
        const result = await supabase.auth.getUser(token);
        user = result.data.user;
        authError = result.error;
      } else {
        // Fall back to cookie-based session
        const supabase = await createServerSupabaseClient();
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
      }

      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: 'AUTHENTICATION_REQUIRED',
            message: 'You must be logged in to create public lessons'
          },
          { status: 401 }
        );
      }

      // Verify the user is an admin
      const adminStatus = await isAdmin(user.id);
      if (!adminStatus) {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'Only admins can create public lessons'
          },
          { status: 403 }
        );
      }

      authenticatedUserId = user.id;
    }

    if (!lesson || !metadata) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Lesson content and metadata are required'
        },
        { status: 400 }
      );
    }

    // Validate lesson content
    console.log('[API] Validating lesson content...');
    console.log('[API] Lesson keys:', Object.keys(lesson));
    console.log('[API] Has title:', !!lesson.title);
    console.log('[API] Has warmup:', !!lesson.warmup);
    console.log('[API] Has wrapup:', !!lesson.wrapup);
    console.log('[API] Has metadata:', !!lesson.metadata);
    if (lesson.metadata) {
      console.log('[API] Metadata keys:', Object.keys(lesson.metadata));
      console.log('[API] Has cefr_level:', !!lesson.metadata.cefr_level);
      console.log('[API] Has lesson_type:', !!lesson.metadata.lesson_type);
    }
    
    const validation = validatePublicLessonContent(lesson);
    if (!validation.valid) {
      console.log('[API] Validation failed:', validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Lesson content validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Create public lesson
    const result = await createPublicLesson(lesson, metadata, authenticatedUserId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson_id: result.data,
      message: 'Public lesson created successfully'
    });

  } catch (error) {
    console.error('Error creating public lesson:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while creating the lesson'
      },
      { status: 500 }
    );
  }
}
