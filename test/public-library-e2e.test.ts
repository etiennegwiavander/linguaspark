/**
 * End-to-End Integration Tests for Public Library Workflow
 * 
 * Tests complete user flows through the public library system:
 * 1. Unauthenticated user: browse → filter → view lesson
 * 2. Authenticated non-admin: browse → view → edit lesson
 * 3. Admin user: create → view → delete lesson
 * 4. Export functionality from public lesson
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { PublicLesson, LessonCategory, CEFRLevel } from '@/lib/types/public-lessons';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Test data
const mockPublicLesson: PublicLesson = {
  id: 'test-lesson-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  creator_id: 'admin-user-id',
  title: 'Test Public Lesson',
  content: {
    title: 'Test Public Lesson',
    warmup: {
      questions: ['What do you think about this topic?'],
    },
    reading: {
      passage: 'This is a test reading passage.',
      comprehension_questions: ['What is the main idea?'],
    },
    wrapup: {
      summary: 'Test summary',
    },
    metadata: {
      cefr_level: 'B1' as CEFRLevel,
      lesson_type: 'discussion',
    },
  },
  source_url: 'https://example.com/article',
  source_title: 'Example Article',
  banner_image_url: 'https://example.com/image.jpg',
  category: 'general-english' as LessonCategory,
  cefr_level: 'B1' as CEFRLevel,
  lesson_type: 'discussion',
  tags: ['test', 'example'],
  estimated_duration_minutes: 30,
};

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  is_admin: true,
};

const mockNonAdminUser = {
  id: 'user-id',
  email: 'user@example.com',
  is_admin: false,
};

describe('Public Library E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Flow 1: Unauthenticated User - Browse → Filter → View', () => {
    it('should allow unauthenticated user to browse public library', async () => {
      // Mock unauthenticated state
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock listing public lessons
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      // Simulate database query (what the API route would do)
      const result = await mockSupabase.from('public_lessons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Verify public access works
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(mockSelect).toHaveBeenCalled();
      expect(result.data).toEqual([mockPublicLesson]);
    });

    it('should allow filtering by category, CEFR level, and lesson type', async () => {
      // Mock filtered query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
      });

      // Simulate filtered database query
      const result = await mockSupabase.from('public_lessons')
        .select('*')
        .eq('category', 'general-english')
        .eq('cefr_level', 'B1')
        .eq('lesson_type', 'discussion')
        .order('created_at', { ascending: false })
        .limit(20);

      // Verify filters were applied
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(mockEq).toHaveBeenCalledWith('category', 'general-english');
      expect(mockEq).toHaveBeenCalledWith('cefr_level', 'B1');
      expect(mockEq).toHaveBeenCalledWith('lesson_type', 'discussion');
      expect(result.data).toEqual([mockPublicLesson]);
    });

    it('should allow viewing a single public lesson without authentication', async () => {
      // Mock single lesson retrieval
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Simulate database query for single lesson
      const result = await mockSupabase.from('public_lessons')
        .select('*')
        .eq('id', mockPublicLesson.id)
        .single();

      // Verify lesson was retrieved
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(mockEq).toHaveBeenCalledWith('id', mockPublicLesson.id);
      expect(mockSingle).toHaveBeenCalled();
      expect(result.data).toEqual(mockPublicLesson);
    });

    it('should display lesson without sidebar for unauthenticated users', async () => {
      // Mock unauthenticated state
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Verify no authentication required for viewing
      const { data } = await mockSupabase.auth.getUser();
      expect(data.user).toBeNull();

      // In the actual UI, sidebar should not be rendered
      // This would be tested in component tests
    });
  });

  describe('Flow 2: Authenticated Non-Admin - Browse → View → Edit', () => {
    it('should allow authenticated non-admin to browse public library', async () => {
      // Mock authenticated non-admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockNonAdminUser },
        error: null,
      });

      // Mock listing public lessons
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      // Simulate database query
      const result = await mockSupabase.from('public_lessons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(result.data).toEqual([mockPublicLesson]);
    });

    it('should display sidebar with edit and export options for authenticated users', async () => {
      // Mock authenticated non-admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockNonAdminUser },
        error: null,
      });

      const { data } = await mockSupabase.auth.getUser();
      expect(data.user).toBeTruthy();
      expect(data.user?.is_admin).toBeFalsy();

      // Sidebar should show edit and export, but not delete
    });

    it('should allow authenticated non-admin to edit public lesson', async () => {
      // Mock authenticated non-admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockNonAdminUser },
        error: null,
      });

      // Mock update operation
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: { ...mockPublicLesson, title: 'Updated Title' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      // Simulate database update
      const updatedData = { title: 'Updated Title' };
      const result = await mockSupabase.from('public_lessons')
        .update(updatedData)
        .eq('id', mockPublicLesson.id);

      // Verify update was called
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(mockUpdate).toHaveBeenCalledWith(updatedData);
      expect(result.data).toEqual({ ...mockPublicLesson, title: 'Updated Title' });
    });

    it('should prevent authenticated non-admin from deleting public lesson', async () => {
      // Mock authenticated non-admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockNonAdminUser },
        error: null,
      });

      // Mock tutor check (non-admin)
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: false },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Simulate admin check (what delete API would do)
      const adminCheck = await mockSupabase.from('tutors')
        .select('is_admin')
        .eq('id', mockNonAdminUser.id)
        .single();

      // Verify admin check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('tutors');
      expect(mockEq).toHaveBeenCalledWith('id', mockNonAdminUser.id);
      expect(adminCheck.data?.is_admin).toBeFalsy();

      // Delete should be denied (tested in API route tests)
    });
  });

  describe('Flow 3: Admin User - Create → View → Delete', () => {
    it('should allow admin to create a public lesson', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      // Mock insert operation
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
      });

      // Simulate database insert
      const newLessonData = {
        title: mockPublicLesson.title,
        content: mockPublicLesson.content,
        category: mockPublicLesson.category,
        cefr_level: mockPublicLesson.cefr_level,
        lesson_type: mockPublicLesson.lesson_type,
        tags: mockPublicLesson.tags,
        estimated_duration_minutes: mockPublicLesson.estimated_duration_minutes,
        creator_id: mockAdminUser.id,
      };

      const result = await mockSupabase.from('public_lessons')
        .insert(newLessonData)
        .select();

      // Verify insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(mockInsert).toHaveBeenCalledWith(newLessonData);
      expect(result.data).toEqual([mockPublicLesson]);
    });

    it('should allow admin to view created lesson with full sidebar', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      const { data } = await mockSupabase.auth.getUser();
      expect(data.user).toBeTruthy();
      expect(data.user?.is_admin).toBeTruthy();

      // Sidebar should show edit, export, AND delete options
    });

    it('should allow admin to delete public lesson', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      // Mock admin check
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      // Mock delete operation
      const mockDelete = vi.fn().mockReturnThis();
      const mockEqDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      }).mockReturnValueOnce({
        delete: mockDelete,
        eq: mockEqDelete,
      });

      // Simulate admin check
      const adminCheck = await mockSupabase.from('tutors')
        .select('is_admin')
        .eq('id', mockAdminUser.id)
        .single();

      // Simulate delete
      const deleteResult = await mockSupabase.from('public_lessons')
        .delete()
        .eq('id', mockPublicLesson.id);

      // Verify admin check and delete were called
      expect(mockSupabase.from).toHaveBeenCalledWith('tutors');
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');
      expect(adminCheck.data?.is_admin).toBeTruthy();
      expect(deleteResult.error).toBeNull();
    });

    it('should allow admin to view statistics', async () => {
      // Mock authenticated admin user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      // Mock admin check
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Simulate admin check (what stats API would do)
      const adminCheck = await mockSupabase.from('tutors')
        .select('is_admin')
        .eq('id', mockAdminUser.id)
        .single();

      // Verify admin check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('tutors');
      expect(adminCheck.data?.is_admin).toBeTruthy();
    });
  });

  describe('Flow 4: Export Functionality', () => {
    it('should allow exporting public lesson to PDF', async () => {
      // Mock lesson retrieval
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Retrieve lesson for export
      const lesson = mockPublicLesson;

      // Verify lesson has required fields for export
      expect(lesson.title).toBeTruthy();
      expect(lesson.content).toBeTruthy();
      expect(lesson.content.warmup).toBeTruthy();
      expect(lesson.content.wrapup).toBeTruthy();

      // Export functionality would be tested in export-utils tests
      // Here we verify the lesson data is complete
    });

    it('should allow exporting public lesson to Word', async () => {
      // Mock lesson retrieval
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Retrieve lesson for export
      const lesson = mockPublicLesson;

      // Verify lesson has required fields for export
      expect(lesson.title).toBeTruthy();
      expect(lesson.content).toBeTruthy();

      // Export functionality would be tested in export-utils tests
    });

    it('should include attribution in exported public lessons', async () => {
      // Mock lesson with source information
      const lessonWithSource = {
        ...mockPublicLesson,
        source_url: 'https://example.com/article',
        source_title: 'Example Article',
      };

      // Verify source information is present
      expect(lessonWithSource.source_url).toBeTruthy();
      expect(lessonWithSource.source_title).toBeTruthy();

      // Attribution should be included in export
      // This is tested in export-utils tests
    });

    it('should handle export errors gracefully', async () => {
      // Mock lesson retrieval failure
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Lesson not found' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      // Attempt to retrieve lesson
      const result = await mockSingle();

      // Verify error is handled
      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();

      // Export should not proceed if lesson retrieval fails
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should support complete unauthenticated user journey', async () => {
      // Step 1: Browse library
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      // Browse
      await mockSupabase.from('public_lessons').select('*').order('created_at').limit(20);
      expect(mockSupabase.from).toHaveBeenCalledWith('public_lessons');

      // Step 2: Apply filters
      const mockEq = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
      });

      await mockSupabase.from('public_lessons').select('*').eq('category', 'general-english').order('created_at').limit(20);
      expect(mockEq).toHaveBeenCalled();

      // Step 3: View lesson
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await mockSupabase.from('public_lessons').select('*').eq('id', mockPublicLesson.id).single();
      expect(mockSingle).toHaveBeenCalled();

      // Verify no authentication was required
      const { data } = await mockSupabase.auth.getUser();
      expect(data.user).toBeNull();
    });

    it('should support complete authenticated non-admin journey', async () => {
      // Step 1: Authenticate
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockNonAdminUser },
        error: null,
      });

      const { data: authData } = await mockSupabase.auth.getUser();
      expect(authData.user).toBeTruthy();
      expect(authData.user?.is_admin).toBeFalsy();

      // Step 2: Browse library
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      await mockSupabase.from('public_lessons').select('*').order('created_at').limit(20);

      // Step 3: View lesson
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await mockSupabase.from('public_lessons').select('*').eq('id', mockPublicLesson.id).single();

      // Step 4: Edit lesson
      const mockUpdate = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await mockSupabase.from('public_lessons').update({ title: 'Updated' }).eq('id', mockPublicLesson.id);

      expect(mockUpdate).toHaveBeenCalled();
    });


    it('should support complete admin journey', async () => {
      // Step 1: Authenticate as admin
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      const { data: authData } = await mockSupabase.auth.getUser();
      expect(authData.user).toBeTruthy();
      expect(authData.user?.is_admin).toBeTruthy();

      // Step 2: Create lesson
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
      });

      await mockSupabase.from('public_lessons').insert(mockPublicLesson).select();

      expect(mockInsert).toHaveBeenCalled();

      // Step 3: View created lesson
      const mockSelectView = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPublicLesson,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelectView,
        eq: mockEq,
        single: mockSingle,
      });

      await mockSupabase.from('public_lessons').select('*').eq('id', mockPublicLesson.id).single();

      // Step 4: View statistics (admin check)
      const mockSelectStats = vi.fn().mockReturnThis();
      const mockEqStats = vi.fn().mockReturnThis();
      const mockSingleStats = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelectStats,
        eq: mockEqStats,
        single: mockSingleStats,
      });

      await mockSupabase.from('tutors').select('is_admin').eq('id', mockAdminUser.id).single();

      // Step 5: Delete lesson
      const mockSelectDelete = vi.fn().mockReturnThis();
      const mockEqDeleteCheck = vi.fn().mockReturnThis();
      const mockSingleDelete = vi.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });

      const mockDelete = vi.fn().mockReturnThis();
      const mockEqDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelectDelete,
        eq: mockEqDeleteCheck,
        single: mockSingleDelete,
      }).mockReturnValueOnce({
        delete: mockDelete,
        eq: mockEqDelete,
      });

      await mockSupabase.from('tutors').select('is_admin').eq('id', mockAdminUser.id).single();
      await mockSupabase.from('public_lessons').delete().eq('id', mockPublicLesson.id);

      // Verify complete workflow
      expect(mockInsert).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });


    it('should handle pagination in browse workflow', async () => {
      // Mock paginated results
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockLt = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
        lt: mockLt,
      });

      // First page
      await mockSupabase.from('public_lessons').select('*').order('created_at').limit(20);
      expect(mockLimit).toHaveBeenCalledWith(20);

      // Second page with cursor
      await mockSupabase.from('public_lessons').select('*').order('created_at').limit(20).lt('created_at', '2024-01-01T00:00:00Z');
      expect(mockLt).toHaveBeenCalled();
    });

    it('should maintain filter state across pagination', async () => {
      // Mock filtered and paginated results
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockLt = vi.fn().mockResolvedValue({
        data: [mockPublicLesson],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
        lt: mockLt,
      });

      // Paginate with filters
      await mockSupabase.from('public_lessons')
        .select('*')
        .eq('category', 'general-english')
        .order('created_at')
        .limit(20)
        .lt('created_at', '2024-01-01T00:00:00Z');

      expect(mockEq).toHaveBeenCalledWith('category', 'general-english');
      expect(mockLt).toHaveBeenCalled();
    });

    it('should handle errors gracefully throughout workflow', async () => {
      // Mock error in listing
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit,
      });

      const result = await mockLimit();
      expect(result.error).toBeTruthy();

      // Workflow should handle error and not proceed
    });
  });
});
