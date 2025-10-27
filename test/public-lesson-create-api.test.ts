import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/public-lessons/create/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn()
}));

vi.mock('@/lib/public-lessons-server', () => ({
  createPublicLesson: vi.fn(),
  validatePublicLessonContent: vi.fn()
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createPublicLesson, validatePublicLessonContent } from '@/lib/public-lessons-server';

describe('POST /api/public-lessons/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({
        lesson: { title: 'Test' },
        metadata: { category: 'general-english' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('AUTHENTICATION_REQUIRED');
  });

  it('should return 400 if lesson or metadata is missing', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 if lesson content validation fails', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(validatePublicLessonContent).mockReturnValue({
      valid: false,
      errors: ['Title is required', 'Warmup section is required']
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({
        lesson: { title: '' },
        metadata: { category: 'general-english' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.errors).toEqual(['Title is required', 'Warmup section is required']);
  });

  it('should create public lesson successfully for authenticated user', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(validatePublicLessonContent).mockReturnValue({
      valid: true,
      errors: []
    });
    vi.mocked(createPublicLesson).mockResolvedValue({
      success: true,
      data: 'lesson-456'
    });

    const lessonContent = {
      title: 'Test Lesson',
      warmup: { questions: ['Q1', 'Q2'] },
      wrapup: { summary: 'Summary' },
      vocabulary: { words: [] },
      metadata: {
        cefr_level: 'B1',
        lesson_type: 'discussion'
      }
    };

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({
        lesson: lessonContent,
        metadata: {
          category: 'general-english',
          tags: ['test'],
          estimated_duration_minutes: 30
        }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lesson_id).toBe('lesson-456');
    expect(createPublicLesson).toHaveBeenCalledWith(
      lessonContent,
      {
        category: 'general-english',
        tags: ['test'],
        estimated_duration_minutes: 30
      },
      'user-123'
    );
  });

  it('should return 500 if createPublicLesson fails', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(validatePublicLessonContent).mockReturnValue({
      valid: true,
      errors: []
    });
    vi.mocked(createPublicLesson).mockResolvedValue({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to save lesson'
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({
        lesson: {
          title: 'Test',
          warmup: { questions: [] },
          wrapup: { summary: '' }
        },
        metadata: { category: 'general-english' }
      })
    });

    const response = await POST(request);
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

    const request = new NextRequest('http://localhost:3000/api/public-lessons/create', {
      method: 'POST',
      body: JSON.stringify({
        lesson: { title: 'Test' },
        metadata: { category: 'general-english' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNKNOWN_ERROR');
  });
});
