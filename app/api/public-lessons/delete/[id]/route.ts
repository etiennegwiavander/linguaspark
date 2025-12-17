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

    // Check for Bearer token first
    const authHeader = request.headers.get('authorization');
    let accessToken: string | undefined = undefined;
    let supabase;
    
    console.log('[DELETE] Auth header present:', !!authHeader);
    
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      console.log('[DELETE] Extracted Bearer token (first 20 chars):', accessToken.substring(0, 20));
      // Create Supabase client with the access token
      supabase = await createServerSupabaseClient(accessToken);
    } else {
      console.log('[DELETE] Using cookie-based auth');
      // Use cookie-based auth
      supabase = await createServerSupabaseClient();
    }
    
    // Get authenticated user
    console.log('[DELETE] Calling supabase.auth.getUser()...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[DELETE] Auth result - user:', user?.id, 'error:', authError?.message);

    if (authError || !user) {
      console.error('[DELETE] Auth failed:', {
        error: authError,
        hasToken: !!accessToken,
        authHeader: authHeader?.substring(0, 30)
      });
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required to delete lessons'
        },
        { status: 401 }
      );
    }

    console.log('[DELETE] ✅ Authenticated user:', user.id);
    console.log('[DELETE] Using access token:', !!accessToken);

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
