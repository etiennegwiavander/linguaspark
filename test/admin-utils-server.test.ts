/**
 * Unit tests for admin utilities server functions
 * 
 * Tests cover:
 * - isAdmin() function with admin and non-admin users
 * - verifyAdmin() function for access control
 * - getAdminStats() data aggregation
 * - requireAdmin() middleware functionality
 * - getAdminInfo() user information retrieval
 * 
 * Requirements: 1.3, 1.4, 8.1, 8.2, 11.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PublicLesson } from '../lib/types/public-lessons';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Create comprehensive mock functions for Supabase client
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

// Mock the Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser
    }
  }))
}));

// Import functions after mocking
import { 
  isAdmin, 
  verifyAdmin, 
  getAdminStats, 
  requireAdmin, 
  getAdminInfo 
} from '../lib/admin-utils-server';

describe('Admin Utils Server', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock chain for tutors table queries
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'tutors') {
        return { select: mockSelect };
      }
      if (table === 'public_lessons') {
        return {
          select: vi.fn(() => ({
            order: mockOrder
          }))
        };
      }
      return { select: mockSelect };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAdmin() - Requirement 1.3, 1.4', () => {
    it('should return true for admin users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      const result = await isAdmin('admin-user-id');
      
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('tutors');
      expect(mockSelect).toHaveBeenCalledWith('is_admin');
      expect(mockEq).toHaveBeenCalledWith('id', 'admin-user-id');
    });

    it('should return false for non-admin users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      });

      const result = await isAdmin('regular-user-id');
      
      expect(result).toBe(false);
      expect(mockFrom).toHaveBeenCalledWith('tutors');
    });

    it('should return false when is_admin is null', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: null },
        error: null
      });

      const result = await isAdmin('user-id');
      
      expect(result).toBe(false);
    });

    it('should return false when is_admin is undefined', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {},
        error: null
      });

      const result = await isAdmin('user-id');
      
      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' }
      });

      const result = await isAdmin('user-id');
      
      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found', code: 'PGRST116' }
      });

      const result = await isAdmin('nonexistent-user-id');
      
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Network error'));

      const result = await isAdmin('user-id');
      
      expect(result).toBe(false);
    });
  });

  describe('verifyAdmin() - Requirement 8.1, 8.2', () => {
    it('should not throw for admin users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      await expect(verifyAdmin('admin-id')).resolves.toBeUndefined();
    });

    it('should throw PERMISSION_DENIED for non-admin users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      });

      await expect(verifyAdmin('user-id')).rejects.toThrow('PERMISSION_DENIED');
      await expect(verifyAdmin('user-id')).rejects.toThrow('Admin privileges required');
    });

    it('should throw PERMISSION_DENIED when user not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(verifyAdmin('nonexistent-id')).rejects.toThrow('PERMISSION_DENIED');
    });

    it('should throw PERMISSION_DENIED on database error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(verifyAdmin('user-id')).rejects.toThrow('PERMISSION_DENIED');
    });
  });

  describe('getAdminStats() - Requirement 11.1', () => {
    const mockLessons: Partial<PublicLesson>[] = [
      {
        id: '1',
        category: 'business',
        cefr_level: 'B1',
        creator_id: 'admin-id',
        created_at: '2024-01-15T10:00:00Z',
        title: 'Business Lesson 1'
      },
      {
        id: '2',
        category: 'grammar',
        cefr_level: 'A2',
        creator_id: 'other-admin-id',
        created_at: '2024-01-14T10:00:00Z',
        title: 'Grammar Lesson 1'
      },
      {
        id: '3',
        category: 'business',
        cefr_level: 'B2',
        creator_id: 'admin-id',
        created_at: '2024-01-13T10:00:00Z',
        title: 'Business Lesson 2'
      },
      {
        id: '4',
        category: 'vocabulary',
        cefr_level: 'C1',
        creator_id: 'admin-id',
        created_at: '2024-01-12T10:00:00Z',
        title: 'Vocabulary Lesson 1'
      },
      {
        id: '5',
        category: 'travel',
        cefr_level: 'A1',
        creator_id: 'other-admin-id',
        created_at: '2024-01-11T10:00:00Z',
        title: 'Travel Lesson 1'
      }
    ];

    beforeEach(() => {
      // Reset mock chain for each test
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'tutors') {
          return { select: mockSelect };
        }
        if (table === 'public_lessons') {
          return {
            select: vi.fn(() => ({
              order: mockOrder
            }))
          };
        }
        return { select: mockSelect };
      });
    });

    it('should return comprehensive statistics for admin users', async () => {
      // Mock admin verification
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      // Mock lessons query
      mockOrder.mockResolvedValueOnce({
        data: mockLessons,
        error: null
      });

      const stats = await getAdminStats('admin-id');

      expect(stats.total_lessons).toBe(5);
      expect(stats.my_lessons_count).toBe(3);
      expect(stats.lessons_by_category.business).toBe(2);
      expect(stats.lessons_by_category.grammar).toBe(1);
      expect(stats.lessons_by_category.vocabulary).toBe(1);
      expect(stats.lessons_by_category.travel).toBe(1);
      expect(stats.lessons_by_level.A1).toBe(1);
      expect(stats.lessons_by_level.A2).toBe(1);
      expect(stats.lessons_by_level.B1).toBe(1);
      expect(stats.lessons_by_level.B2).toBe(1);
      expect(stats.lessons_by_level.C1).toBe(1);
      expect(stats.recent_lessons).toHaveLength(5);
      expect(stats.recent_lessons[0].id).toBe('1'); // Most recent first
    });

    it('should limit recent lessons to 10', async () => {
      const manyLessons = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        category: 'grammar',
        cefr_level: 'B1',
        creator_id: 'admin-id',
        created_at: `2024-01-${String(15 - i).padStart(2, '0')}T10:00:00Z`,
        title: `Lesson ${i + 1}`
      }));

      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      mockOrder.mockResolvedValueOnce({
        data: manyLessons,
        error: null
      });

      const stats = await getAdminStats('admin-id');

      expect(stats.total_lessons).toBe(15);
      expect(stats.recent_lessons).toHaveLength(10);
    });

    it('should handle empty lesson library', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const stats = await getAdminStats('admin-id');

      expect(stats.total_lessons).toBe(0);
      expect(stats.my_lessons_count).toBe(0);
      expect(stats.recent_lessons).toHaveLength(0);
      expect(stats.lessons_by_category.business).toBe(0);
      expect(stats.lessons_by_level.B1).toBe(0);
    });

    it('should throw PERMISSION_DENIED for non-admin users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      });

      await expect(getAdminStats('user-id')).rejects.toThrow('PERMISSION_DENIED');
    });

    it('should handle database errors when fetching lessons', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(getAdminStats('admin-id')).rejects.toThrow('Failed to retrieve admin statistics');
    });

    it('should initialize all category counts to zero', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            category: 'business',
            cefr_level: 'B1',
            creator_id: 'admin-id',
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        error: null
      });

      const stats = await getAdminStats('admin-id');

      // Check that all categories are initialized
      expect(stats.lessons_by_category['general-english']).toBe(0);
      expect(stats.lessons_by_category.business).toBe(1);
      expect(stats.lessons_by_category.travel).toBe(0);
      expect(stats.lessons_by_category.academic).toBe(0);
      expect(stats.lessons_by_category.conversation).toBe(0);
      expect(stats.lessons_by_category.grammar).toBe(0);
      expect(stats.lessons_by_category.vocabulary).toBe(0);
      expect(stats.lessons_by_category.pronunciation).toBe(0);
      expect(stats.lessons_by_category.culture).toBe(0);
    });
  });

  describe('requireAdmin() - Requirement 8.1, 8.2', () => {
    it('should return user ID for valid admin token', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer valid-admin-token'
        }
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-id' } },
        error: null
      });

      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      const userId = await requireAdmin(mockRequest);
      
      expect(userId).toBe('admin-id');
      expect(mockGetUser).toHaveBeenCalledWith('valid-admin-token');
    });

    it('should throw UNAUTHORIZED for missing authorization header', async () => {
      const mockRequest = new Request('http://localhost');

      await expect(requireAdmin(mockRequest)).rejects.toThrow('UNAUTHORIZED');
      await expect(requireAdmin(mockRequest)).rejects.toThrow('No authorization header');
    });

    it('should throw UNAUTHORIZED for invalid token', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await expect(requireAdmin(mockRequest)).rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw UNAUTHORIZED when user is null', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(requireAdmin(mockRequest)).rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw PERMISSION_DENIED for non-admin users', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer valid-user-token'
        }
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-id' } },
        error: null
      });

      mockSingle.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      });

      await expect(requireAdmin(mockRequest)).rejects.toThrow('PERMISSION_DENIED');
    });

    it('should handle Bearer token with extra spaces', async () => {
      const mockRequest = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer  token-with-spaces  '
        }
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-id' } },
        error: null
      });

      mockSingle.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      });

      const userId = await requireAdmin(mockRequest);
      expect(userId).toBe('admin-id');
    });
  });

  describe('getAdminInfo() - Requirement 1.3, 1.4', () => {
    it('should return admin info for valid admin user', async () => {
      const mockAdminInfo = {
        id: 'admin-id',
        email: 'admin@example.com',
        is_admin: true
      };

      mockSingle.mockResolvedValueOnce({
        data: mockAdminInfo,
        error: null
      });

      const info = await getAdminInfo('admin-id');
      
      expect(info).toEqual(mockAdminInfo);
      expect(mockFrom).toHaveBeenCalledWith('tutors');
      expect(mockSelect).toHaveBeenCalledWith('id, email, is_admin');
      expect(mockEq).toHaveBeenCalledWith('id', 'admin-id');
    });

    it('should return info for non-admin user', async () => {
      const mockUserInfo = {
        id: 'user-id',
        email: 'user@example.com',
        is_admin: false
      };

      mockSingle.mockResolvedValueOnce({
        data: mockUserInfo,
        error: null
      });

      const info = await getAdminInfo('user-id');
      
      expect(info).toEqual(mockUserInfo);
      expect(info?.is_admin).toBe(false);
    });

    it('should return null when user not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found', code: 'PGRST116' }
      });

      const info = await getAdminInfo('nonexistent-id');
      
      expect(info).toBeNull();
    });

    it('should return null on database error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const info = await getAdminInfo('user-id');
      
      expect(info).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Network error'));

      const info = await getAdminInfo('user-id');
      
      expect(info).toBeNull();
    });
  });
});
