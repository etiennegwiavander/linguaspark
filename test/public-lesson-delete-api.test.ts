import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/public-lessons/delete/[id]/route';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn()
}));

vi.mock('@/lib/public-lessons-server', () => ({
  deletePublicLesson: vi.fn()
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { deletePublicLesson } from '@/lib/public-lessons-server';

describe('DELETE /api/public-lessons/delete/[id]', () => {
  const mockRequest = {} as any;
  const mockUser = { id: 'test-user-id' };
  const mockAdminUser = { id: 'admin-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if lesson ID is missing', async () => {
    const params = { id: '' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_REQUEST');
    expect(data.message).toContain('Lesson ID is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const params = { id: 'lesson-123' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNAUTHORIZED');
    expect(data.message).toContain('Authentication required');
  });

  it('should return 403 if user is not an admin', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(deletePublicLesson).mockResolvedValue({
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'Only administrators can delete public lessons'
    });

    const params = { id: 'lesson-123' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('PERMISSION_DENIED');
    expect(data.message).toContain('Only administrators can delete');
    expect(deletePublicLesson).toHaveBeenCalledWith('lesson-123', mockUser.id);
  });

  it('should successfully delete lesson if user is admin', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(deletePublicLesson).mockResolvedValue({
      success: true
    });

    const params = { id: 'lesson-123' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
    expect(deletePublicLesson).toHaveBeenCalledWith('lesson-123', mockAdminUser.id);
  });

  it('should return 500 if database error occurs', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(deletePublicLesson).mockResolvedValue({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to delete lesson'
    });

    const params = { id: 'lesson-123' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DATABASE_ERROR');
  });

  it('should handle unexpected errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error('Unexpected error'))
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const params = { id: 'lesson-123' };
    const response = await DELETE(mockRequest, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNKNOWN_ERROR');
    expect(data.message).toContain('unexpected error');
  });

  it('should verify admin status through deletePublicLesson function', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(deletePublicLesson).mockResolvedValue({
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'Only administrators can delete public lessons'
    });

    const params = { id: 'lesson-456' };
    await DELETE(mockRequest, { params });

    // Verify that the function was called with correct parameters
    expect(deletePublicLesson).toHaveBeenCalledWith('lesson-456', mockUser.id);
  });

  it('should pass correct lesson ID from URL params', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null
        })
      }
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(deletePublicLesson).mockResolvedValue({
      success: true
    });

    const testLessonId = 'uuid-test-lesson-789';
    const params = { id: testLessonId };
    await DELETE(mockRequest, { params });

    expect(deletePublicLesson).toHaveBeenCalledWith(testLessonId, mockAdminUser.id);
  });
});
