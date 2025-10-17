/**
 * Integration tests for LessonGenerator with extraction metadata
 * 
 * Tests the complete flow of lesson generation with extracted content
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonGenerator from '@/components/lesson-generator';

// Mock the auth wrapper
vi.mock('@/components/auth-wrapper', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Chrome storage
const mockChromeStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
};

Object.defineProperty(window, 'chrome', {
  value: {
    storage: mockChromeStorage
  },
  writable: true
});

describe('LessonGenerator Integration with Extraction', () => {
  const mockOnLessonGenerated = vi.fn();
  const mockOnExtractFromPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        lesson: {
          id: 'test-lesson-id',
          title: 'Test Lesson',
          content: 'Test lesson content',
          type: 'discussion',
          level: 'B1'
        }
      })
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates lesson with extraction metadata when from extraction source', async () => {
    // Mock extraction configuration
    const mockConfig = {
      sourceContent: 'This is extracted content for lesson generation. It contains enough text to create a meaningful lesson.',
      suggestedType: 'discussion' as const,
      suggestedLevel: 'B1' as const,
      metadata: {
        title: 'Test Article',
        author: 'Test Author',
        sourceUrl: 'https://example.com/article',
        domain: 'example.com',
        extractedAt: new Date('2024-01-01'),
        wordCount: 500,
        readingTime: 3,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.85
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article by Test Author from example.com'
    };

    // Mock Chrome storage to return extraction configuration
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      if (typeof keys === 'string') {
        if (keys === 'extractionSource') {
          callback({ extractionSource: 'webpage' });
        } else if (keys === 'lessonConfiguration') {
          callback({ lessonConfiguration: mockConfig });
        }
      } else if (Array.isArray(keys)) {
        const result: any = {};
        if (keys.includes('extractionSource')) {
          result.extractionSource = 'webpage';
        }
        if (keys.includes('lessonConfiguration')) {
          result.lessonConfiguration = mockConfig;
        }
        callback(result);
      }
    });

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    // Wait for extraction configuration to load
    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    // Verify content is pre-populated
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(mockConfig.sourceContent);

    // Set target language (required field) - use the third combobox (target language)
    const comboboxes = screen.getAllByRole('combobox');
    const languageSelect = comboboxes[2]; // Third combobox is target language
    fireEvent.click(languageSelect);
    
    await waitFor(() => {
      const englishOption = screen.getByText('English');
      fireEvent.click(englishOption);
    });

    // Generate lesson
    const generateButton = screen.getByRole('button', { name: /generate ai lesson/i });
    fireEvent.click(generateButton);

    // Wait for lesson generation to complete
    await waitFor(() => {
      expect(mockOnLessonGenerated).toHaveBeenCalled();
    });

    // Verify the lesson was enhanced with extraction metadata
    const generatedLesson = mockOnLessonGenerated.mock.calls[0][0];
    expect(generatedLesson).toHaveProperty('extractionSource');
    expect(generatedLesson.extractionSource).toEqual({
      url: mockConfig.metadata.sourceUrl,
      domain: mockConfig.metadata.domain,
      title: mockConfig.metadata.title,
      author: mockConfig.metadata.author,
      extractedAt: mockConfig.metadata.extractedAt,
      attribution: mockConfig.attribution
    });

    expect(generatedLesson).toHaveProperty('contentMetadata');
    expect(generatedLesson.contentMetadata).toEqual({
      wordCount: mockConfig.metadata.wordCount,
      readingTime: mockConfig.metadata.readingTime,
      complexity: mockConfig.metadata.complexity,
      suitabilityScore: mockConfig.metadata.suitabilityScore
    });
  });

  it('generates normal lesson without extraction metadata when not from extraction', async () => {
    // Mock no extraction source
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    render(
      <LessonGenerator
        initialText="This is regular content input by the user."
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    // Verify no extraction info is shown
    expect(screen.queryByText('Content Extracted from Web')).not.toBeInTheDocument();

    // Fill in required fields using combobox order
    const comboboxes = screen.getAllByRole('combobox');
    
    // First combobox is lesson type
    fireEvent.click(comboboxes[0]);
    await waitFor(() => {
      const discussionOption = screen.getByText('Discussion');
      fireEvent.click(discussionOption);
    });

    // Second combobox is student level
    fireEvent.click(comboboxes[1]);
    await waitFor(() => {
      const b1Option = screen.getByText('B1 - Intermediate');
      fireEvent.click(b1Option);
    });

    // Third combobox is target language
    fireEvent.click(comboboxes[2]);
    await waitFor(() => {
      const englishOption = screen.getByText('English');
      fireEvent.click(englishOption);
    });

    // Generate lesson
    const generateButton = screen.getByRole('button', { name: /generate ai lesson/i });
    fireEvent.click(generateButton);

    // Wait for lesson generation to complete
    await waitFor(() => {
      expect(mockOnLessonGenerated).toHaveBeenCalled();
    });

    // Verify the lesson does not have extraction metadata
    const generatedLesson = mockOnLessonGenerated.mock.calls[0][0];
    expect(generatedLesson).not.toHaveProperty('extractionSource');
    expect(generatedLesson).not.toHaveProperty('contentMetadata');
  });
});