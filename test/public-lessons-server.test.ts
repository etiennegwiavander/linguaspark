/**
 * Unit tests for public lessons server utilities
 * Tests CRUD operations, validation, and access control
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LessonContent, PublicLessonMetadata } from '../lib/types/public-lessons';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Create mock functions for Supabase operations
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockLt = vi.fn();
const mockTextSearch = vi.fn();
const mockLimit = vi.fn();
const mockOrder = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

// Mock Supabase client
vi.mock('../lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: mockGetUser
    }
  }))
}));

import {
  validatePublicLessonContent,
  getPublicLessons,
  getPublicLesson,
  createPublicLesson,
  updatePublicLesson,
  deletePublicLesson,
} from '../lib/public-lessons-server';

// Helper function to create valid lesson content
function createValidLessonContent(): LessonContent {
  return {
    title: 'Test Lesson',
    warmup: {
      questions: ['What do you think about this topic?']
    },
    vocabulary: {
      words: [
        {
          word: 'example',
          definition: 'A thing characteristic of its kind',
          example: 'This is an example sentence.'
        }
      ]
    },
    wrapup: {
      summary: 'This is a summary of the lesson.'
    },
    metadata: {
      cefr_level: 'B1',
      lesson_type: 'discussion'
    }
  };
}

describe('Public Lessons Server Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mock functions
    mockSingle.mockReset();
    mockEq.mockReset();
    mockLt.mockReset();
    mockTextSearch.mockReset();
    mockLimit.mockReset();
    mockOrder.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockFrom.mockReset();
    mockGetUser.mockReset();
  });

  describe('validatePublicLessonContent', () => {
    it('should validate correct lesson content', () => {
      const content = createValidLessonContent();
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject content without title', () => {
      const content = createValidLessonContent();
      content.title = '';
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lesson title is required');
    });

    it('should reject content without warmup section', () => {
      const content = createValidLessonContent();
      // @ts-ignore - Testing invalid state
      content.warmup = null;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Warmup section with at least one question is required');
    });

    it('should reject content with empty warmup questions', () => {
      const content = createValidLessonContent();
      content.warmup.questions = [];
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Warmup section with at least one question is required');
    });

    it('should reject content without wrapup section', () => {
      const content = createValidLessonContent();
      // @ts-ignore - Testing invalid state
      content.wrapup = null;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wrapup section with summary is required');
    });

    it('should reject content with empty wrapup summary', () => {
      const content = createValidLessonContent();
      content.wrapup.summary = '';
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wrapup section with summary is required');
    });

    it('should reject content without any main content section', () => {
      const content = createValidLessonContent();
      delete content.vocabulary;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one main content section (vocabulary, grammar, reading, discussion, or pronunciation) is required');
    });

    it('should accept content with grammar section', () => {
      const content = createValidLessonContent();
      delete content.vocabulary;
      content.grammar = {
        focus: 'Present Perfect',
        explanation: 'Used for actions that started in the past',
        examples: ['I have lived here for 5 years']
      };
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(true);
    });

    it('should accept content with reading section', () => {
      const content = createValidLessonContent();
      delete content.vocabulary;
      content.reading = {
        passage: 'This is a reading passage.'
      };
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(true);
    });

    it('should accept content with discussion section', () => {
      const content = createValidLessonContent();
      delete content.vocabulary;
      content.discussion = {
        topics: ['Technology'],
        questions: ['What do you think about AI?']
      };
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(true);
    });

    it('should accept content with pronunciation section', () => {
      const content = createValidLessonContent();
      delete content.vocabulary;
      content.pronunciation = {
        focus: 'TH sounds',
        words: [
          { word: 'think', pronunciation: '/θɪŋk/' }
        ]
      };
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(true);
    });

    it('should reject content without metadata', () => {
      const content = createValidLessonContent();
      // @ts-ignore - Testing invalid state
      content.metadata = null;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lesson metadata is required');
    });

    it('should reject content without CEFR level in metadata', () => {
      const content = createValidLessonContent();
      // @ts-ignore - Testing invalid state
      content.metadata.cefr_level = null;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CEFR level is required in metadata');
    });

    it('should reject content without lesson type in metadata', () => {
      const content = createValidLessonContent();
      // @ts-ignore - Testing invalid state
      content.metadata.lesson_type = null;
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Lesson type is required in metadata');
    });

    it('should accumulate multiple validation errors', () => {
      const content = createValidLessonContent();
      content.title = '';
      content.warmup.questions = [];
      content.wrapup.summary = '';
      
      const result = validatePublicLessonContent(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('getPublicLessons', () => {
    let queryBuilder: any;
    
    beforeEach(() => {
      // Create a query builder that all methods return
      queryBuilder = {
        order: mockOrder,
        limit: mockLimit,
        eq: mockEq,
        lt: mockLt,
        textSearch: mockTextSearch
      };
      
      // All query methods return the query builder for chaining
      mockTextSearch.mockReturnValue(queryBuilder);
      mockLt.mockReturnValue(queryBuilder);
      mockEq.mockReturnValue(queryBuilder);
      mockOrder.mockReturnValue(queryBuilder);
      mockSelect.mockReturnValue(queryBuilder);
      
      // limit() is the terminal operation that returns a promise
      mockLimit.mockResolvedValue({
        data: [],
        error: null
      });
      
      mockFrom.mockReturnValue({
        select: mockSelect
      });
    });

    it('should fetch public lessons without filters', async () => {
      const mockLessons = [
        {
          id: '1',
          title: 'Lesson 1',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Lesson 2',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockLimit.mockResolvedValue({
        data: mockLessons,
        error: null
      });

      const result = await getPublicLessons();

      expect(result.success).toBe(true);
      expect(result.data?.lessons).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('public_lessons');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    // Note: Filter application tests are covered by integration tests
    // Unit tests focus on validation logic and error handling

    it('should respect limit parameter', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null
      });

      await getPublicLessons({}, undefined, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should return next cursor when results equal limit', async () => {
      const mockLessons = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`
      }));

      mockLimit.mockResolvedValue({
        data: mockLessons,
        error: null
      });

      const result = await getPublicLessons({}, undefined, 20);

      expect(result.success).toBe(true);
      expect(result.data?.nextCursor).toBe(mockLessons[19].created_at);
    });

    it('should not return next cursor when results less than limit', async () => {
      const mockLessons = [
        { id: '1', created_at: '2024-01-01T00:00:00Z' }
      ];

      mockLimit.mockResolvedValue({
        data: mockLessons,
        error: null
      });

      const result = await getPublicLessons({}, undefined, 20);

      expect(result.success).toBe(true);
      expect(result.data?.nextCursor).toBeUndefined();
    });

    it('should handle database errors', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await getPublicLessons();

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
      expect(result.message).toContain('Failed to fetch public lessons');
    });

    it('should handle unexpected errors', async () => {
      mockLimit.mockRejectedValue(new Error('Unexpected error'));

      const result = await getPublicLessons();

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_ERROR');
    });


  });

  describe('getPublicLesson', () => {
    beforeEach(() => {
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });
    });

    it('should fetch a single public lesson', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: createValidLessonContent()
      };

      mockSingle.mockResolvedValue({
        data: mockLesson,
        error: null
      });

      const result = await getPublicLesson('lesson-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLesson);
      expect(mockFrom).toHaveBeenCalledWith('public_lessons');
      expect(mockEq).toHaveBeenCalledWith('id', 'lesson-1');
    });

    it('should handle lesson not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const result = await getPublicLesson('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_FOUND');
      expect(result.message).toBe('Public lesson not found');
    });

    it('should handle database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getPublicLesson('lesson-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockSingle.mockRejectedValue(new Error('Unexpected error'));

      const result = await getPublicLesson('lesson-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createPublicLesson', () => {
    beforeEach(() => {
      mockSingle.mockResolvedValue({
        data: { id: 'new-lesson-id' },
        error: null
      });
      
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });
    });

    it('should create a public lesson with valid content', async () => {
      const content = createValidLessonContent();
      const metadata: PublicLessonMetadata = {
        category: 'business',
        tags: ['meetings', 'communication'],
        estimated_duration_minutes: 45
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(true);
      expect(result.data).toBe('new-lesson-id');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_id: 'user-123',
          title: 'Test Lesson',
          category: 'business',
          cefr_level: 'B1',
          lesson_type: 'discussion',
          tags: ['meetings', 'communication'],
          estimated_duration_minutes: 45
        })
      );
    });

    it('should reject invalid content', async () => {
      const content = createValidLessonContent();
      content.title = '';

      const metadata: PublicLessonMetadata = {
        category: 'business'
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('Content validation failed');
    });

    it('should handle optional metadata fields', async () => {
      const content = createValidLessonContent();
      const metadata: PublicLessonMetadata = {
        category: 'grammar'
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          estimated_duration_minutes: null
        })
      );
    });

    it('should include source information if present', async () => {
      const content = createValidLessonContent();
      content.metadata.source_url = 'https://example.com/article';
      content.metadata.source_title = 'Example Article';
      content.metadata.banner_image_url = 'https://example.com/image.jpg';

      const metadata: PublicLessonMetadata = {
        category: 'business'
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          source_url: 'https://example.com/article',
          source_title: 'Example Article',
          banner_image_url: 'https://example.com/image.jpg'
        })
      );
    });

    it('should handle database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      const content = createValidLessonContent();
      const metadata: PublicLessonMetadata = {
        category: 'business'
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockInsert.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const content = createValidLessonContent();
      const metadata: PublicLessonMetadata = {
        category: 'business'
      };

      const result = await createPublicLesson(content, metadata, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_ERROR');
    });
  });

  describe('updatePublicLesson', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      
      mockEq.mockReturnThis();
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });
      
      mockEq.mockResolvedValue({
        data: null,
        error: null
      });
    });

    it('should update a public lesson', async () => {
      const updates = {
        title: 'Updated Title',
        category: 'grammar' as const
      };

      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          category: 'grammar'
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'lesson-1');
    });

    it('should validate content if being updated', async () => {
      const content = createValidLessonContent();
      content.title = '';

      const updates = {
        content: content
      };

      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should not update protected fields', async () => {
      const updates = {
        id: 'new-id',
        created_at: '2024-01-01',
        creator_id: 'different-user',
        title: 'Updated Title'
      };

      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          id: expect.anything(),
          created_at: expect.anything(),
          creator_id: expect.anything()
        })
      );
    });

    it('should reject unauthenticated users', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const updates = { title: 'Updated Title' };
      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject mismatched user IDs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'different-user' } },
        error: null
      });

      const updates = { title: 'Updated Title' };
      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle database errors', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      const updates = { title: 'Updated Title' };
      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockUpdate.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const updates = { title: 'Updated Title' };
      const result = await updatePublicLesson('lesson-1', updates, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_ERROR');
    });
  });

  describe('deletePublicLesson', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null
      });
      
      mockSingle.mockResolvedValue({
        data: { is_admin: true },
        error: null
      });
      
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      
      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };
      
      mockDelete.mockReturnValue(mockDeleteChain);
      
      mockFrom.mockImplementation((table: string) => {
        if (table === 'tutors') {
          return { select: mockSelect };
        }
        return { delete: mockDelete };
      });
    });

    it('should delete a public lesson for admin users', async () => {
      const result = await deletePublicLesson('lesson-1', 'admin-123');

      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('tutors');
      expect(mockFrom).toHaveBeenCalledWith('public_lessons');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      
      mockSingle.mockResolvedValue({
        data: { is_admin: false },
        error: null
      });

      const result = await deletePublicLesson('lesson-1', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PERMISSION_DENIED');
      expect(result.message).toBe('Only administrators can delete public lessons');
    });

    it('should reject when admin check fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await deletePublicLesson('lesson-1', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PERMISSION_DENIED');
    });

    it('should reject unauthenticated users', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const result = await deletePublicLesson('lesson-1', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject mismatched user IDs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'different-user' } },
        error: null
      });

      const result = await deletePublicLesson('lesson-1', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle database errors during deletion', async () => {
      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' }
        })
      };
      
      mockDelete.mockReturnValue(mockDeleteChain);

      const result = await deletePublicLesson('lesson-1', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockDelete.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await deletePublicLesson('lesson-1', 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_ERROR');
    });
  });
});
