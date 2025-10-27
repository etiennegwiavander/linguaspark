import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/public-lessons/list/route';
import { NextRequest } from 'next/server';
import * as publicLessonsServer from '@/lib/public-lessons-server';

// Mock the public lessons server module
vi.mock('@/lib/public-lessons-server', () => ({
  getPublicLessons: vi.fn(),
}));

describe('Public Lessons List API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return public lessons with default parameters', async () => {
    const mockLessons = [
      {
        id: '1',
        title: 'Test Lesson',
        category: 'general-english',
        cefr_level: 'B1',
        lesson_type: 'discussion',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: mockLessons,
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lessons).toEqual(mockLessons);
    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith({}, undefined, 20);
  });

  it('should apply category filter', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?category=business');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      { category: 'business' },
      undefined,
      20
    );
  });

  it('should apply CEFR level filter', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?cefr_level=B2');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      { cefr_level: 'B2' },
      undefined,
      20
    );
  });

  it('should apply lesson type filter', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?lesson_type=grammar');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      { lesson_type: 'grammar' },
      undefined,
      20
    );
  });

  it('should apply search filter', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?search=climate');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      { search: 'climate' },
      undefined,
      20
    );
  });

  it('should apply multiple filters', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/public-lessons/list?category=business&cefr_level=B1&lesson_type=discussion'
    );
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      {
        category: 'business',
        cefr_level: 'B1',
        lesson_type: 'discussion',
      },
      undefined,
      20
    );
  });

  it('should handle cursor-based pagination', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: '2025-01-01T00:00:00Z',
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/public-lessons/list?cursor=2025-01-02T00:00:00Z'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith(
      {},
      '2025-01-02T00:00:00Z',
      20
    );
    expect(data.nextCursor).toBe('2025-01-01T00:00:00Z');
  });

  it('should respect custom limit parameter', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?limit=50');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith({}, undefined, 50);
  });

  it('should cap limit at 100', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?limit=200');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith({}, undefined, 100);
  });

  it('should enforce minimum limit of 1', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list?limit=0');
    await GET(request);

    expect(publicLessonsServer.getPublicLessons).toHaveBeenCalledWith({}, undefined, 1);
  });

  it('should handle database errors', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch lessons',
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DATABASE_ERROR');
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(publicLessonsServer.getPublicLessons).mockRejectedValue(
      new Error('Unexpected error')
    );

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNKNOWN_ERROR');
  });

  it('should be publicly accessible (no auth required)', async () => {
    // This test verifies that the endpoint doesn't check for authentication
    vi.mocked(publicLessonsServer.getPublicLessons).mockResolvedValue({
      success: true,
      data: {
        lessons: [],
        nextCursor: undefined,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/public-lessons/list');
    const response = await GET(request);

    expect(response.status).toBe(200);
    // No authentication headers required
  });
});
