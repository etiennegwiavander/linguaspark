/**
 * Admin Statistics API Route Tests
 * 
 * Tests for GET /api/admin/stats endpoint
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/stats/route';
import * as adminUtils from '@/lib/admin-utils-server';
import type { AdminStats } from '@/lib/types/public-lessons';

// Mock the admin utilities module
vi.mock('@/lib/admin-utils-server', () => ({
  requireAdmin: vi.fn(),
  getAdminStats: vi.fn()
}));

describe('Admin Stats API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns stats for authenticated admin user', async () => {
    const mockAdminId = 'admin-123';
    const mockStats: AdminStats = {
      total_lessons: 25,
      lessons_by_category: {
        'general-english': 5,
        'business': 8,
        'travel': 3,
        'academic': 2,
        'conversation': 4,
        'grammar': 1,
        'vocabulary': 1,
        'pronunciation': 1,
        'culture': 0
      },
      lessons_by_level: {
        'A1': 3,
        'A2': 5,
        'B1': 10,
        'B2': 5,
        'C1': 2
      },
      recent_lessons: [],
      my_lessons_count: 12
    };

    vi.mocked(adminUtils.requireAdmin).mockResolvedValue(mockAdminId);
    vi.mocked(adminUtils.getAdminStats).mockResolvedValue(mockStats);

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats).toEqual(mockStats);
    expect(adminUtils.requireAdmin).toHaveBeenCalledWith(request);
    expect(adminUtils.getAdminStats).toHaveBeenCalledWith(mockAdminId);
  });

  test('returns 401 for unauthenticated request', async () => {
    vi.mocked(adminUtils.requireAdmin).mockRejectedValue(
      new Error('UNAUTHORIZED: No authorization header')
    );

    const request = new Request('http://localhost:3000/api/admin/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNAUTHORIZED');
    expect(data.message).toBe('Authentication required');
  });

  test('returns 403 for non-admin user', async () => {
    vi.mocked(adminUtils.requireAdmin).mockRejectedValue(
      new Error('PERMISSION_DENIED: Admin privileges required')
    );

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer non-admin-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('PERMISSION_DENIED');
    expect(data.message).toBe('Admin privileges required');
  });

  test('returns 500 for database errors', async () => {
    const mockAdminId = 'admin-123';
    
    vi.mocked(adminUtils.requireAdmin).mockResolvedValue(mockAdminId);
    vi.mocked(adminUtils.getAdminStats).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INTERNAL_ERROR');
    expect(data.message).toBe('Failed to retrieve admin statistics');
  });

  test('handles invalid token error', async () => {
    vi.mocked(adminUtils.requireAdmin).mockRejectedValue(
      new Error('UNAUTHORIZED: Invalid token')
    );

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer invalid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  test('returns stats with zero lessons', async () => {
    const mockAdminId = 'admin-123';
    const mockStats: AdminStats = {
      total_lessons: 0,
      lessons_by_category: {
        'general-english': 0,
        'business': 0,
        'travel': 0,
        'academic': 0,
        'conversation': 0,
        'grammar': 0,
        'vocabulary': 0,
        'pronunciation': 0,
        'culture': 0
      },
      lessons_by_level: {
        'A1': 0,
        'A2': 0,
        'B1': 0,
        'B2': 0,
        'C1': 0
      },
      recent_lessons: [],
      my_lessons_count: 0
    };

    vi.mocked(adminUtils.requireAdmin).mockResolvedValue(mockAdminId);
    vi.mocked(adminUtils.getAdminStats).mockResolvedValue(mockStats);

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.total_lessons).toBe(0);
    expect(data.stats.my_lessons_count).toBe(0);
  });

  test('includes recent lessons in response', async () => {
    const mockAdminId = 'admin-123';
    const mockRecentLessons = [
      {
        id: 'lesson-1',
        title: 'Recent Lesson 1',
        category: 'business' as const,
        cefr_level: 'B1' as const,
        created_at: '2025-10-26T10:00:00Z'
      },
      {
        id: 'lesson-2',
        title: 'Recent Lesson 2',
        category: 'travel' as const,
        cefr_level: 'A2' as const,
        created_at: '2025-10-25T10:00:00Z'
      }
    ];

    const mockStats: AdminStats = {
      total_lessons: 2,
      lessons_by_category: {
        'general-english': 0,
        'business': 1,
        'travel': 1,
        'academic': 0,
        'conversation': 0,
        'grammar': 0,
        'vocabulary': 0,
        'pronunciation': 0,
        'culture': 0
      },
      lessons_by_level: {
        'A1': 0,
        'A2': 1,
        'B1': 1,
        'B2': 0,
        'C1': 0
      },
      recent_lessons: mockRecentLessons as any,
      my_lessons_count: 2
    };

    vi.mocked(adminUtils.requireAdmin).mockResolvedValue(mockAdminId);
    vi.mocked(adminUtils.getAdminStats).mockResolvedValue(mockStats);

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.recent_lessons).toHaveLength(2);
    expect(data.stats.recent_lessons[0].title).toBe('Recent Lesson 1');
  });

  test('correctly counts lessons created by admin', async () => {
    const mockAdminId = 'admin-123';
    const mockStats: AdminStats = {
      total_lessons: 50,
      lessons_by_category: {
        'general-english': 10,
        'business': 10,
        'travel': 10,
        'academic': 5,
        'conversation': 5,
        'grammar': 5,
        'vocabulary': 3,
        'pronunciation': 2,
        'culture': 0
      },
      lessons_by_level: {
        'A1': 10,
        'A2': 10,
        'B1': 15,
        'B2': 10,
        'C1': 5
      },
      recent_lessons: [],
      my_lessons_count: 15 // Admin created 15 out of 50 total
    };

    vi.mocked(adminUtils.requireAdmin).mockResolvedValue(mockAdminId);
    vi.mocked(adminUtils.getAdminStats).mockResolvedValue(mockStats);

    const request = new Request('http://localhost:3000/api/admin/stats', {
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.total_lessons).toBe(50);
    expect(data.stats.my_lessons_count).toBe(15);
  });
});
