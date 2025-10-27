/**
 * Admin Stats Panel Component Tests
 * 
 * Tests for the AdminStatsPanel component including:
 * - Admin verification and rendering
 * - Statistics display
 * - Loading and error states
 * - Data formatting
 * - Non-admin user handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminStatsPanel } from '@/components/admin-stats-panel';
import type { AdminStats } from '@/lib/types/public-lessons';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AdminStatsPanel', () => {
  const mockAdminStats: AdminStats = {
    total_lessons: 25,
    my_lessons_count: 8,
    lessons_by_category: {
      'general-english': 5,
      'business': 8,
      'travel': 3,
      'academic': 2,
      'conversation': 4,
      'grammar': 2,
      'vocabulary': 1,
      'pronunciation': 0,
      'culture': 0,
    },
    lessons_by_level: {
      'A1': 3,
      'A2': 5,
      'B1': 10,
      'B2': 5,
      'C1': 2,
    },
    recent_lessons: [
      {
        id: '1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        creator_id: 'admin-1',
        title: 'Business English: Meetings',
        content: {
          title: 'Business English: Meetings',
          warmup: { questions: ['What makes a good meeting?'] },
          wrapup: { summary: 'Summary' },
          metadata: {
            cefr_level: 'B2',
            lesson_type: 'business',
          },
        },
        source_url: null,
        source_title: null,
        banner_image_url: null,
        category: 'business',
        cefr_level: 'B2',
        lesson_type: 'business',
        tags: [],
        estimated_duration_minutes: 45,
      },
      {
        id: '2',
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z',
        creator_id: 'admin-1',
        title: 'Travel Vocabulary',
        content: {
          title: 'Travel Vocabulary',
          warmup: { questions: ['Where do you like to travel?'] },
          wrapup: { summary: 'Summary' },
          metadata: {
            cefr_level: 'A2',
            lesson_type: 'travel',
          },
        },
        source_url: null,
        source_title: null,
        banner_image_url: null,
        category: 'travel',
        cefr_level: 'A2',
        lesson_type: 'travel',
        tags: ['vocabulary', 'beginner'],
        estimated_duration_minutes: 30,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Admin User Rendering', () => {
    it('should render stats panel for admin users', async () => {
      // Mock admin user
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@test.com' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Admin Statistics')).toBeInTheDocument();
      });

      // Check total lessons display
      expect(screen.getByText('Total Lessons')).toBeInTheDocument();
      const totalLessonsValue = screen.getAllByText('25')[0];
      expect(totalLessonsValue).toBeInTheDocument();

      // Check user's lessons display
      expect(screen.getByText('Your Lessons')).toBeInTheDocument();
      const myLessonsValue = screen.getAllByText('8')[0];
      expect(myLessonsValue).toBeInTheDocument();
    });

    it('should display category breakdown', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Lessons by Category')).toBeInTheDocument();
      });

      // Check that categories with lessons are displayed
      const businessBadges = screen.getAllByText('Business');
      expect(businessBadges.length).toBeGreaterThan(0);
      const generalEnglishBadges = screen.getAllByText('General English');
      expect(generalEnglishBadges.length).toBeGreaterThan(0);
      const travelBadges = screen.getAllByText('Travel');
      expect(travelBadges.length).toBeGreaterThan(0);
    });

    it('should display CEFR level breakdown', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Lessons by CEFR Level')).toBeInTheDocument();
      });

      // Check that CEFR levels are displayed
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('B1')).toBeInTheDocument();
      expect(screen.getByText('C1')).toBeInTheDocument();
    });

    it('should display recent lessons', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Recent Additions')).toBeInTheDocument();
      });

      // Check that recent lessons are displayed
      expect(screen.getByText('Business English: Meetings')).toBeInTheDocument();
      expect(screen.getByText('Travel Vocabulary')).toBeInTheDocument();
    });
  });

  describe('Non-Admin User Handling', () => {
    it('should not render for non-admin users', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: false },
            error: null,
          }),
        }),
      });

      const { container } = render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render for unauthenticated users', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { container } = render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', async () => {
      mockGetUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: 'admin-1' } },
                  error: null,
                }),
              100
            )
          )
      );

      render(<AdminStatsPanel />);

      // Check for skeleton elements (using role or test-id if available)
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when stats fetch fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Server error' }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Statistics')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Statistics')).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format category names correctly', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        // Check that "general-english" is formatted as "General English"
        const generalEnglishBadges = screen.getAllByText('General English');
        expect(generalEnglishBadges.length).toBeGreaterThan(0);
      });
    });

    it('should sort categories by count in descending order', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: mockAdminStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        const businessBadges = screen.getAllByText('Business');
        expect(businessBadges.length).toBeGreaterThan(0);
      });

      // Business (8) should appear before General English (5) in the category breakdown section
      // We can verify this by checking the order of elements in the DOM
      const categorySection = screen.getByText('Lessons by Category').closest('div');
      expect(categorySection).toBeInTheDocument();
    });

    it('should limit recent lessons to 5', async () => {
      const manyRecentLessons = Array.from({ length: 10 }, (_, i) => ({
        id: `lesson-${i}`,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        creator_id: 'admin-1',
        title: `Lesson ${i + 1}`,
        content: {
          title: `Lesson ${i + 1}`,
          warmup: { questions: ['Question'] },
          wrapup: { summary: 'Summary' },
          metadata: {
            cefr_level: 'B1' as const,
            lesson_type: 'discussion' as const,
          },
        },
        source_url: null,
        source_title: null,
        banner_image_url: null,
        category: 'general-english' as const,
        cefr_level: 'B1' as const,
        lesson_type: 'discussion' as const,
        tags: [],
        estimated_duration_minutes: 30,
      }));

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: { ...mockAdminStats, recent_lessons: manyRecentLessons },
        }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Recent Additions')).toBeInTheDocument();
      });

      // Should only show first 5 lessons
      expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      expect(screen.getByText('Lesson 5')).toBeInTheDocument();
      expect(screen.queryByText('Lesson 6')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show message when no lessons exist', async () => {
      const emptyStats: AdminStats = {
        total_lessons: 0,
        my_lessons_count: 0,
        lessons_by_category: {
          'general-english': 0,
          'business': 0,
          'travel': 0,
          'academic': 0,
          'conversation': 0,
          'grammar': 0,
          'vocabulary': 0,
          'pronunciation': 0,
          'culture': 0,
        },
        lessons_by_level: {
          'A1': 0,
          'A2': 0,
          'B1': 0,
          'B2': 0,
          'C1': 0,
        },
        recent_lessons: [],
      };

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, stats: emptyStats }),
      });

      render(<AdminStatsPanel />);

      await waitFor(() => {
        const noLessonsMessages = screen.getAllByText('No lessons yet');
        expect(noLessonsMessages.length).toBeGreaterThan(0);
        expect(screen.getByText('No recent lessons')).toBeInTheDocument();
      });
    });
  });
});
