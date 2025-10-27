/**
 * Admin Statistics API Route
 * 
 * GET /api/admin/stats
 * 
 * Returns comprehensive statistics about public lessons including:
 * - Total lesson count
 * - Lessons by category
 * - Lessons by CEFR level
 * - Recent lessons
 * - Lessons created by current admin
 * 
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats, requireAdmin } from '@/lib/admin-utils-server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication and get admin ID
    const adminId = await requireAdmin(request);

    // Get admin statistics
    const stats = await getAdminStats(adminId);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in admin stats API:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('UNAUTHORIZED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          { status: 401 }
        );
      }

      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'PERMISSION_DENIED',
            message: 'Admin privileges required'
          },
          { status: 403 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve admin statistics'
      },
      { status: 500 }
    );
  }
}
