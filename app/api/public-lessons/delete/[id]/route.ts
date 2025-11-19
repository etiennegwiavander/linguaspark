import { NextRequest, NextResponse } from 'next/server';
import { deletePublicLesson } from '@/lib/public-lessons-server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
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

    // Get authenticated user - try both cookie-based and Bearer token auth
    const supabase = await createServerSupabaseClient();
    
    // First try cookie-based auth
    let user = null;
    let authError = null;
    let accessToken: string | undefined = undefined;
    
    const cookieAuth = await supabase.auth.getUser();
    if (cookieAuth.data.user) {
      user = cookieAuth.data.user;
    } else {
      // Try Bearer token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        accessToken = token; // Store token for RLS
        const tokenAuth = await supabase.auth.getUser(token);
        if (tokenAuth.data.user) {
          user = tokenAuth.data.user;
        } else {
          authError = tokenAuth.error;
        }
      } else {
        authError = cookieAuth.error;
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required to delete lessons'
        },
        { status: 401 }
      );
    }

    // Attempt to delete the lesson (admin verification happens in the function)
    // Skip auth check since we already verified the user above
    // Pass access token so RLS policies work correctly
    const result = await deletePublicLesson(lessonId, user.id, true, accessToken);

    if (!result.success) {
      // Return appropriate status code based on error type
      const statusCode = result.error === 'PERMISSION_DENIED' ? 403 : 500;
      
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
      message: 'Public lesson deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete public lesson route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while deleting the lesson'
      },
      { status: 500 }
    );
  }
}
