import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicLessonView from '@/components/public-lesson-view';
import type { PublicLesson } from '@/lib/types/public-lessons';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock export utilities
vi.mock('@/lib/export-utils', () => ({
  lessonExporter: {
    exportToPDF: vi.fn(),
    exportToWord: vi.fn(),
  },
}));

vi.mock('@/lib/export-html-pptx', () => ({
  exportToHTML: vi.fn(),
}));

// Mock components
vi.mock('@/components/public-navbar', () => ({
  default: () => <div data-testid="public-navbar">Public Navbar</div>,
}));

vi.mock('@/components/public-footer', () => ({
  default: () => <div data-testid="public-footer">Public Footer</div>,
}));

describe('PublicLessonView', () => {
  const mockLesson: PublicLesson = {
    id: 'test-lesson-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_id: 'creator-id',
    title: 'Test Lesson Title',
    content: {
      title: 'Test Lesson Title',
      warmup: {
        questions: ['What is your name?', 'Where are you from?'],
      },
      vocabulary: {
        words: [
          {
            word: 'hello',
            definition: 'a greeting',
            example: 'Hello, how are you?',
          },
        ],
      },
      reading: {
        passage: 'This is a test reading passage.',
        comprehension_questions: ['What is the main idea?'],
      },
      grammar: {
        focus: 'Present Simple',
        explanation: 'Used for habits and facts',
        examples: ['I eat breakfast every day.'],
        practice: ['Complete the sentence: She ___ to school.'],
      },
      discussion: {
        topics: ['Education'],
        questions: ['What do you think about online learning?'],
      },
      wrapup: {
        summary: 'Today we learned about greetings.',
        homework: ['Practice greetings with a friend.'],
      },
      metadata: {
        cefr_level: 'B1',
        lesson_type: 'discussion',
        source_url: 'https://example.com/article',
        source_title: 'Example Article',
      },
    },
    source_url: 'https://example.com/article',
    source_title: 'Example Article',
    banner_image_url: 'https://example.com/image.jpg',
    category: 'general-english',
    cefr_level: 'B1',
    lesson_type: 'discussion',
    tags: ['greetings', 'conversation'],
    estimated_duration_minutes: 45,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated User View', () => {
    it('should render lesson content without sidebar', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      // Check that lesson content is displayed
      expect(screen.getByText('Test Lesson Title')).toBeInTheDocument();
      expect(screen.getByText('B1')).toBeInTheDocument();
      expect(screen.getByText('discussion')).toBeInTheDocument();
      expect(screen.getByText('general-english')).toBeInTheDocument();

      // Check that sidebar is not present
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('should display all lesson sections', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      // Check for section headings
      expect(screen.getByText('Warm-up Questions')).toBeInTheDocument();
      expect(screen.getByText('Key Vocabulary')).toBeInTheDocument();
      expect(screen.getByText('Reading Passage')).toBeInTheDocument();
      expect(screen.getByText(/Grammar Focus/)).toBeInTheDocument();
      expect(screen.getByText('Discussion Questions')).toBeInTheDocument();
      expect(screen.getByText('Wrap-up')).toBeInTheDocument();
    });

    it('should display lesson metadata', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      // Check for tags
      expect(screen.getByText('greetings')).toBeInTheDocument();
      expect(screen.getByText('conversation')).toBeInTheDocument();

      // Check for duration
      expect(screen.getByText('45 min')).toBeInTheDocument();

      // Check for source link
      expect(screen.getByText('Example Article')).toBeInTheDocument();
    });

    it('should display banner image if available', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      const images = screen.getAllByAltText('Test Lesson Title');
      expect(images.length).toBeGreaterThan(0);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  describe('Authenticated Non-Admin User View', () => {
    it('should render sidebar with export options', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={false}
          userId="user-id"
        />
      );

      // Check that sidebar is present
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();

      // Check for export buttons
      expect(screen.getByText('Export as HTML')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Word')).toBeInTheDocument();
    });

    it('should not show delete button for non-admin', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={false}
          userId="user-id"
        />
      );

      // Check that delete button is not present
      expect(screen.queryByText('Delete Lesson')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('should handle PDF export', async () => {
      const { lessonExporter } = await import('@/lib/export-utils');
      
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={false}
          userId="user-id"
        />
      );

      const pdfButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(lessonExporter.exportToPDF).toHaveBeenCalled();
      });
    });

    it('should handle Word export', async () => {
      const { lessonExporter } = await import('@/lib/export-utils');
      
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={false}
          userId="user-id"
        />
      );

      const wordButton = screen.getByText('Export as Word');
      fireEvent.click(wordButton);

      await waitFor(() => {
        expect(lessonExporter.exportToWord).toHaveBeenCalled();
      });
    });

    it('should handle HTML export', async () => {
      const { exportToHTML } = await import('@/lib/export-html-pptx');
      
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={false}
          userId="user-id"
        />
      );

      const htmlButton = screen.getByText('Export as HTML');
      fireEvent.click(htmlButton);

      await waitFor(() => {
        expect(exportToHTML).toHaveBeenCalled();
      });
    });
  });

  describe('Admin User View', () => {
    it('should render sidebar with delete option', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={true}
          userId="admin-id"
        />
      );

      // Check that admin section is present
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Delete Lesson')).toBeInTheDocument();
    });

    it('should show confirmation dialog before delete', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={true}
          userId="admin-id"
        />
      );

      const deleteButton = screen.getByText('Delete Lesson');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should handle delete action', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Mock localStorage
      const mockSession = {
        access_token: 'test-token',
      };
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockSession));

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={true}
          isAdmin={true}
          userId="admin-id"
        />
      );

      const deleteButton = screen.getByText('Delete Lesson');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/public-lessons/delete/test-lesson-id',
          expect.objectContaining({
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer test-token',
            },
          })
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should have back to library button', () => {
      render(
        <PublicLessonView
          lesson={mockLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      expect(screen.getByText('Back to Library')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should handle lesson without optional sections', () => {
      const minimalLesson: PublicLesson = {
        ...mockLesson,
        content: {
          title: 'Minimal Lesson',
          warmup: {
            questions: ['Question 1'],
          },
          wrapup: {
            summary: 'Summary',
          },
          metadata: {
            cefr_level: 'A1',
            lesson_type: 'grammar',
          },
        },
        banner_image_url: null,
        source_url: null,
        source_title: null,
        tags: [],
        estimated_duration_minutes: null,
      };

      render(
        <PublicLessonView
          lesson={minimalLesson}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Minimal Lesson')).toBeInTheDocument();
      expect(screen.getByText('Warm-up Questions')).toBeInTheDocument();
      expect(screen.getByText('Wrap-up')).toBeInTheDocument();
    });

    it('should display pronunciation section if present', () => {
      const lessonWithPronunciation: PublicLesson = {
        ...mockLesson,
        content: {
          ...mockLesson.content,
          pronunciation: {
            focus: 'TH sounds',
            words: [
              {
                word: 'think',
                pronunciation: '/θɪŋk/',
                tips: 'Place tongue between teeth',
              },
            ],
            practice: [],
          },
        },
      };

      render(
        <PublicLessonView
          lesson={lessonWithPronunciation}
          isAuthenticated={false}
          isAdmin={false}
        />
      );

      expect(screen.getByText('Pronunciation Practice')).toBeInTheDocument();
      expect(screen.getByText('TH sounds')).toBeInTheDocument();
      expect(screen.getByText('think')).toBeInTheDocument();
      expect(screen.getByText('/θɪŋk/')).toBeInTheDocument();
    });
  });
});
