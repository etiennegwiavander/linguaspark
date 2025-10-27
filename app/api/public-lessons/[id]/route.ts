import { NextRequest } from 'next/server';
import { getPublicLesson } from '@/lib/public-lessons-server';

/**
 * GET /api/public-lessons/[id]
 * 
 * Retrieves a single public lesson by ID
 * 
 * Access: Public (no authentication required)
 * 
 * Returns:
 * - 200: { success: true, lesson: PublicLesson }
 * - 404: { success: false, error: 'Lesson not found' }
 * - 500: { success: false, error: 'Failed to fetch lesson' }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Lesson ID is required'
        },
        { status: 400 }
      );
    }

    const result = await getPublicLesson(id);

    if (!result.success) {
      const statusCode = result.error === 'NOT_FOUND' ? 404 : 500;
      return Response.json(
        {
          success: false,
          error: result.message || 'Failed to fetch lesson'
        },
        { status: statusCode }
      );
    }

    return Response.json({
      success: true,
      lesson: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/public-lessons/[id]:', error);
    return Response.json(
      {
        success: false,
        error: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
