import { NextRequest } from 'next/server';
import { getPublicLessons } from '@/lib/public-lessons-server';
import type { PublicLessonFilters } from '@/lib/types/public-lessons';

// Disable caching for this route to ensure fresh data after deletions
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const filters: PublicLessonFilters = {};
    
    const category = searchParams.get('category');
    if (category) {
      filters.category = category as any;
    }
    
    const cefrLevel = searchParams.get('cefr_level');
    if (cefrLevel) {
      filters.cefr_level = cefrLevel as any;
    }
    
    const lessonType = searchParams.get('lesson_type');
    if (lessonType) {
      filters.lesson_type = lessonType as any;
    }
    
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }
    
    // Extract pagination parameters
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 100); // Between 1 and 100
    
    // Fetch public lessons
    const result = await getPublicLessons(filters, cursor, validLimit);
    
    if (!result.success || !result.data) {
      return Response.json(
        {
          success: false,
          error: result.error,
          message: result.message
        },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      lessons: result.data.lessons,
      nextCursor: result.data.nextCursor
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error in public lessons list API:', error);
    return Response.json(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred while fetching public lessons'
      },
      { status: 500 }
    );
  }
}
