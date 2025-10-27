import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '@/app/api/public-lessons/update/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/public-lessons-server', () => ({
  updatePublicLesson: vi.fn(),
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { updatePublicLesson } from '@/lib/public-lessons-server';

describe('PUT /api/public-lessons/update/[id]', () => {
  const mockUserId = 'test-user-id';
  const mockLessonId = 'test-lesson-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    // Mock unauthenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('AUTHENTICATION_REQUIRED');
  });

  it('should require lesson ID', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_REQUEST');
  });

  it('should require update data', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_REQUEST');
  });

  it('should successfully update a public lesson', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock successful update
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: true,
      message: 'Public lesson updated successfully',
    });

    const updates = {
      title: 'Updated Title',
      category: 'business' as const,
    };

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Public lesson updated successfully');
    expect(updatePublicLesson).toHaveBeenCalledWith(mockLessonId, updates, mockUserId);
  });

  it('should handle validation errors', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock validation error
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Content validation failed: Title is required',
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({ title: '' }),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('should handle permission denied errors', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock permission denied
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'You do not have permission to update this lesson',
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('PERMISSION_DENIED');
  });

  it('should handle not found errors', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock not found error
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: false,
      error: 'NOT_FOUND',
      message: 'Public lesson not found',
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/nonexistent-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: 'nonexistent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('NOT_FOUND');
  });

  it('should handle database errors', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock database error
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to update public lesson',
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DATABASE_ERROR');
  });

  it('should handle unexpected errors', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock unexpected error
    vi.mocked(updatePublicLesson).mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNKNOWN_ERROR');
  });

  it('should allow updating multiple fields', async () => {
    // Mock authenticated user
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    } as any);

    // Mock successful update
    vi.mocked(updatePublicLesson).mockResolvedValue({
      success: true,
      message: 'Public lesson updated successfully',
    });

    const updates = {
      title: 'Updated Title',
      category: 'business' as const,
      tags: ['professional', 'communication'],
      estimated_duration_minutes: 45,
    };

    const request = new NextRequest('http://localhost:3000/api/public-lessons/update/test-id', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const response = await PUT(request, { params: { id: mockLessonId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updatePublicLesson).toHaveBeenCalledWith(mockLessonId, updates, mockUserId);
  });
});
