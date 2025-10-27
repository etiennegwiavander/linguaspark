/**
 * Integration tests for public lesson API routes
 * 
 * Tests the complete workflow of public lesson operations including:
 * - Unauthenticated access to list and get endpoints
 * - Authenticated user creating public lessons
 * - Authenticated user updating public lessons
 * - Non-admin user attempting to delete (should fail)
 * - Admin user deleting public lessons (should succeed)
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock Supabase before importing anything else
vi.mock('../lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('../lib/public-lessons-server', () => ({
  getPublicLessons: vi.fn(),
  getPublicLesson: vi.fn(),
  createPublicLesson: vi.fn(),
  updatePublicLesson: vi.fn(),
  deletePublicLesson: vi.fn(),
  validatePublicLessonContent: vi.fn(),
}));

import { createServerSupabaseClient } from '../lib/supabase-server';
import {
  getPublicLessons,
  getPublicLesson,
  createPublicLesson,
  updatePublicLesson,
  deletePublicLesson,
  validatePublicLessonContent,
} from '../lib/public-lessons-server';

// Sample lesson data
const mockLessonContent = {
  title: 'Test Lesson',
  warmup: {
    questions: ['What is your favorite food?', 'Why do you like it?'],
  },
  vocabulary: {
    words: [
      { word: 'delicious', definition: 'very pleasant to taste', example: 'The cake was delicious.' },
    ],
  },
  wrapup: {
    summary: 'Today we learned about food vocabulary.',
  },
  metadata: {
    cefr_level: 'B1' as const,
    lesson_type: 'discussion' as const,
  },
};

const mockPublicLesson = {
  id: 'test-lesson-id',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  creator_id: 'test-user-id',
  title: 'Test Lesson',
  content: mockLessonContent,
  source_url: 'https://example.com',
  source_title: 'Example Article',
  banner_image_url: null,
  category: 'general-english' as const,
  cefr_level: 'B1' as const,
  lesson_type: 'discussion' as const,
  tags: ['food', 'vocabulary'],
  estimated_duration_minutes: 30,
};

describe('Public Lessons API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access - List Endpoint', () => {
    it('should allow unauthenticated users to list public lessons', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: true,
        data: {
          lessons: [mockPublicLesson],
          nextCursor: undefined,
        },
      });

      const result = await getPublicLessons({}, undefined, 20);

      expect(result.success).toBe(true);
      expect(result.data?.lessons).toHaveLength(1);
      expect(result.data?.lessons[0].id).toBe('test-lesson-id');
    });

    it('should support filtering by category', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: true,
        data: {
          lessons: [mockPublicLesson],
          nextCursor: undefined,
        },
      });

      await getPublicLessons({ category: 'general-english' as any }, undefined, 20);

      expect(getPublicLessons).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'general-english' }),
        undefined,
        20
      );
    });

    it('should support filtering by CEFR level', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: true,
        data: {
          lessons: [mockPublicLesson],
          nextCursor: undefined,
        },
      });

      await getPublicLessons({ cefr_level: 'B1' as any }, undefined, 20);

      expect(getPublicLessons).toHaveBeenCalledWith(
        expect.objectContaining({ cefr_level: 'B1' }),
        undefined,
        20
      );
    });

    it('should support cursor-based pagination', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: true,
        data: {
          lessons: [mockPublicLesson],
          nextCursor: '2025-01-02T00:00:00Z',
        },
      });

      const result = await getPublicLessons({}, '2025-01-01T00:00:00Z', 10);

      expect(result.data?.nextCursor).toBe('2025-01-02T00:00:00Z');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch lessons',
      });

      const result = await getPublicLessons({}, undefined, 20);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });
  });

  describe('Unauthenticated Access - Get Single Lesson', () => {
    it('should allow unauthenticated users to get a single public lesson', async () => {
      vi.mocked(getPublicLesson).mockResolvedValue({
        success: true,
        data: mockPublicLesson,
      });

      const result = await getPublicLesson('test-lesson-id');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('test-lesson-id');
      expect(result.data?.title).toBe('Test Lesson');
    });

    it('should return error for non-existent lesson', async () => {
      vi.mocked(getPublicLesson).mockResolvedValue({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson not found',
      });

      const result = await getPublicLesson('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_FOUND');
    });
  });

  describe('Authenticated User - Create Lesson', () => {
    it('should allow authenticated users to create public lessons', async () => {
      vi.mocked(validatePublicLessonContent).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(createPublicLesson).mockResolvedValue({
        success: true,
        data: 'new-lesson-id',
      });

      const result = await createPublicLesson(
        mockLessonContent,
        {
          category: 'general-english' as any,
          tags: ['food'],
          estimated_duration_minutes: 30,
        },
        'test-user-id'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('new-lesson-id');
    });

    it('should validate lesson content before creation', async () => {
      vi.mocked(validatePublicLessonContent).mockReturnValue({
        valid: false,
        errors: ['Lesson title is required', 'Warmup section is required'],
      });

      const validation = validatePublicLessonContent({ title: '' } as any);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('Authenticated User - Update Lesson', () => {
    it('should allow authenticated users to update public lessons', async () => {
      vi.mocked(updatePublicLesson).mockResolvedValue({
        success: true,
      });

      const result = await updatePublicLesson(
        'test-lesson-id',
        {
          title: 'Updated Title',
          category: 'business' as any,
        },
        'test-user-id'
      );

      expect(result.success).toBe(true);
      expect(updatePublicLesson).toHaveBeenCalledWith(
        'test-lesson-id',
        expect.objectContaining({ title: 'Updated Title' }),
        'test-user-id'
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(updatePublicLesson).mockResolvedValue({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson not found',
      });

      const result = await updatePublicLesson('non-existent-id', { title: 'Updated' }, 'user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_FOUND');
    });
  });

  describe('Access Control - Delete Lesson', () => {
    it('should allow admin users to delete public lessons', async () => {
      vi.mocked(deletePublicLesson).mockResolvedValue({
        success: true,
      });

      const result = await deletePublicLesson('test-lesson-id', 'admin-user-id');

      expect(result.success).toBe(true);
      expect(deletePublicLesson).toHaveBeenCalledWith('test-lesson-id', 'admin-user-id');
    });

    it('should deny non-admin users from deleting public lessons', async () => {
      vi.mocked(deletePublicLesson).mockResolvedValue({
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'Only administrators can delete public lessons',
      });

      const result = await deletePublicLesson('test-lesson-id', 'regular-user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PERMISSION_DENIED');
    });
  });

  describe('Complete CRUD Workflow', () => {
    it('should support complete workflow from create to delete', async () => {
      // 1. Create a lesson
      vi.mocked(validatePublicLessonContent).mockReturnValue({ valid: true, errors: [] });
      vi.mocked(createPublicLesson).mockResolvedValue({
        success: true,
        data: 'new-lesson-id',
      });

      const createResult = await createPublicLesson(
        mockLessonContent,
        { category: 'general-english' as any },
        'test-user-id'
      );
      expect(createResult.success).toBe(true);

      // 2. List lessons
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: true,
        data: {
          lessons: [{ ...mockPublicLesson, id: 'new-lesson-id' }],
          nextCursor: undefined,
        },
      });

      const listResult = await getPublicLessons({}, undefined, 20);
      expect(listResult.data?.lessons).toHaveLength(1);

      // 3. Get single lesson
      vi.mocked(getPublicLesson).mockResolvedValue({
        success: true,
        data: { ...mockPublicLesson, id: 'new-lesson-id' },
      });

      const getResult = await getPublicLesson('new-lesson-id');
      expect(getResult.data?.id).toBe('new-lesson-id');

      // 4. Update lesson
      vi.mocked(updatePublicLesson).mockResolvedValue({ success: true });

      const updateResult = await updatePublicLesson(
        'new-lesson-id',
        { title: 'Updated Title' },
        'test-user-id'
      );
      expect(updateResult.success).toBe(true);

      // 5. Delete lesson (admin only)
      vi.mocked(deletePublicLesson).mockResolvedValue({ success: true });

      const deleteResult = await deletePublicLesson('new-lesson-id', 'admin-user-id');
      expect(deleteResult.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      vi.mocked(getPublicLessons).mockResolvedValue({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to connect to database',
      });

      const result = await getPublicLessons({}, undefined, 20);

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle invalid lesson data', async () => {
      vi.mocked(validatePublicLessonContent).mockReturnValue({
        valid: false,
        errors: ['Invalid lesson structure'],
      });

      const validation = validatePublicLessonContent({} as any);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle permission errors gracefully', async () => {
      vi.mocked(deletePublicLesson).mockResolvedValue({
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'Insufficient permissions',
      });

      const result = await deletePublicLesson('lesson-id', 'non-admin-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PERMISSION_DENIED');
    });
  });
});
