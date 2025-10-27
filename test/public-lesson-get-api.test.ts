import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/public-lessons/[id]/route';
import { getPublicLesson } from '@/lib/public-lessons-server';
import type { PublicLesson } from '@/lib/types/public-lessons';

// Mock the server utilities
vi.mock('@/lib/public-lessons-server', () => ({
  getPublicLesson: vi.fn(),
}));

describe('GET /api/public-lessons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a public lesson successfully', async () => {
    const mockLesson: PublicLesson = {
      id: 'test-lesson-id',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      creator_id: 'admin-user-id',
      title: 'Test Public Lesson',
      content: {
        title: 'Test Public Lesson',
        warmup: {
          questions: ['What do you think about this topic?'],
        },
        vocabulary: {
          words: [
            {
              word: 'example',
              definition: 'A thing characteristic of its kind',
              example_sentence: 'This is an example sentence.',
            },
          ],
        },
        wrapup: {
          summary: 'Great lesson!',
        },
        metadata: {
          cefr_level: 'B1',
          lesson_type: 'discussion',
        },
      },
      source_url: 'https://example.com',
      source_title: 'Example Article',
      banner_image_url: null,
      category: 'general-english',
      cefr_level: 'B1',
      lesson_type: 'discussion',
      tags: ['test', 'example'],
      estimated_duration_minutes: 30,
    };

    vi.mocked(getPublicLesson).mockResolvedValue({
      success: true,
      data: mockLesson,
    });

    const request = new Request('http://localhost/api/public-lessons/test-lesson-id');
    const response = await GET(request, { params: { id: 'test-lesson-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lesson).toEqual(mockLesson);
    expect(getPublicLesson).toHaveBeenCalledWith('test-lesson-id');
  });

  it('should return 404 when lesson is not found', async () => {
    vi.mocked(getPublicLesson).mockResolvedValue({
      success: false,
      error: 'NOT_FOUND',
      message: 'Public lesson not found',
    });

    const request = new Request('http://localhost/api/public-lessons/nonexistent-id');
    const response = await GET(request, { params: { id: 'nonexistent-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Public lesson not found');
  });

  it('should return 400 when lesson ID is missing', async () => {
    const request = new Request('http://localhost/api/public-lessons/');
    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Lesson ID is required');
  });

  it('should return 500 on database error', async () => {
    vi.mocked(getPublicLesson).mockResolvedValue({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch public lesson: Connection error',
    });

    const request = new Request('http://localhost/api/public-lessons/test-lesson-id');
    const response = await GET(request, { params: { id: 'test-lesson-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch public lesson: Connection error');
  });

  it('should handle unexpected errors gracefully', async () => {
    vi.mocked(getPublicLesson).mockRejectedValue(new Error('Unexpected error'));

    const request = new Request('http://localhost/api/public-lessons/test-lesson-id');
    const response = await GET(request, { params: { id: 'test-lesson-id' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('An unexpected error occurred');
  });

  it('should be publicly accessible (no auth required)', async () => {
    const mockLesson: PublicLesson = {
      id: 'test-lesson-id',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      creator_id: 'admin-user-id',
      title: 'Test Public Lesson',
      content: {
        title: 'Test Public Lesson',
        warmup: {
          questions: ['What do you think?'],
        },
        wrapup: {
          summary: 'Summary',
        },
        metadata: {
          cefr_level: 'B1',
          lesson_type: 'discussion',
        },
      },
      source_url: null,
      source_title: null,
      banner_image_url: null,
      category: 'general-english',
      cefr_level: 'B1',
      lesson_type: 'discussion',
      tags: [],
      estimated_duration_minutes: null,
    };

    vi.mocked(getPublicLesson).mockResolvedValue({
      success: true,
      data: mockLesson,
    });

    // Request without any authentication headers
    const request = new Request('http://localhost/api/public-lessons/test-lesson-id');
    const response = await GET(request, { params: { id: 'test-lesson-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lesson).toEqual(mockLesson);
  });

  it('should return full lesson content including all sections', async () => {
    const mockLesson: PublicLesson = {
      id: 'test-lesson-id',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      creator_id: 'admin-user-id',
      title: 'Comprehensive Test Lesson',
      content: {
        title: 'Comprehensive Test Lesson',
        warmup: {
          questions: ['Question 1', 'Question 2'],
        },
        vocabulary: {
          words: [
            {
              word: 'comprehensive',
              definition: 'Complete and including everything',
              example_sentence: 'This is a comprehensive guide.',
            },
          ],
        },
        grammar: {
          focus: 'Present Perfect',
          explanation: 'Used for actions that started in the past...',
          examples: ['I have lived here for 5 years.'],
        },
        reading: {
          passage: 'This is a reading passage...',
          questions: ['What is the main idea?'],
        },
        discussion: {
          questions: ['What do you think about this?'],
        },
        pronunciation: {
          focus: 'TH sounds',
          words: ['think', 'this', 'that'],
        },
        wrapup: {
          summary: 'We covered a lot today!',
          homework: 'Practice the vocabulary.',
        },
        metadata: {
          cefr_level: 'B2',
          lesson_type: 'grammar',
          source_url: 'https://example.com/article',
          source_title: 'Example Article Title',
          banner_image_url: 'https://example.com/image.jpg',
        },
      },
      source_url: 'https://example.com/article',
      source_title: 'Example Article Title',
      banner_image_url: 'https://example.com/image.jpg',
      category: 'grammar',
      cefr_level: 'B2',
      lesson_type: 'grammar',
      tags: ['grammar', 'present-perfect', 'intermediate'],
      estimated_duration_minutes: 45,
    };

    vi.mocked(getPublicLesson).mockResolvedValue({
      success: true,
      data: mockLesson,
    });

    const request = new Request('http://localhost/api/public-lessons/test-lesson-id');
    const response = await GET(request, { params: { id: 'test-lesson-id' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lesson.content.vocabulary).toBeDefined();
    expect(data.lesson.content.grammar).toBeDefined();
    expect(data.lesson.content.reading).toBeDefined();
    expect(data.lesson.content.discussion).toBeDefined();
    expect(data.lesson.content.pronunciation).toBeDefined();
    expect(data.lesson.banner_image_url).toBe('https://example.com/image.jpg');
    expect(data.lesson.tags).toEqual(['grammar', 'present-perfect', 'intermediate']);
  });
});
