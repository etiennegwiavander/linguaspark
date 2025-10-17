/**
 * Tests for LessonGenerator extraction handling
 * 
 * Tests the enhanced lesson generator's ability to handle extracted content
 * and integrate with the lesson interface bridge.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonGenerator from '@/components/lesson-generator';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';

// Mock the auth wrapper
vi.mock('@/components/auth-wrapper', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

// Mock the lesson interface bridge
vi.mock('@/lib/lesson-interface-bridge', () => ({
  LessonInterfaceBridge: {
    isExtractionSource: vi.fn(),
    loadExtractionConfiguration: vi.fn(),
    clearExtractionConfiguration: vi.fn()
  },
  LessonInterfaceUtils: {
    isExtractionLessonInterface: vi.fn(),
    createMetadataDisplay: vi.fn(),
    formatAttribution: vi.fn()
  }
}));

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

describe('LessonGenerator Extraction Handling', () => {
  const mockOnLessonGenerated = vi.fn();
  const mockOnExtractFromPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders normally when no extraction source', async () => {
    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(false);

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    expect(screen.getByText('AI-Powered Lesson Generator')).toBeInTheDocument();
    expect(screen.getByText('Extract from Page')).toBeInTheDocument();
    expect(screen.queryByText('Content Extracted from Web')).not.toBeInTheDocument();
  });

  it('displays extraction information when available', async () => {
    const mockConfig = {
      sourceContent: 'Test extracted content',
      suggestedType: 'discussion' as const,
      suggestedLevel: 'B1' as const,
      metadata: {
        title: 'Test Article',
        sourceUrl: 'https://example.com/article',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 500,
        readingTime: 3,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.85
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article from example.com'
    };

    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(true);
    vi.mocked(LessonInterfaceBridge.loadExtractionConfiguration).mockResolvedValue(mockConfig);

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    expect(screen.getByText('Auto-populated')).toBeInTheDocument();
    expect(screen.getByText('AI Suggested Type')).toBeInTheDocument();
    expect(screen.getByText('AI Suggested Level')).toBeInTheDocument();
  });

  it('auto-populates fields from extraction config', async () => {
    const mockConfig = {
      sourceContent: 'Test extracted content for lesson generation',
      suggestedType: 'grammar' as const,
      suggestedLevel: 'A2' as const,
      metadata: {
        title: 'Grammar Guide',
        sourceUrl: 'https://example.com/grammar',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 300,
        readingTime: 2,
        complexity: 'beginner' as const,
        suitabilityScore: 0.9
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Grammar Guide from example.com'
    };

    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(true);
    vi.mocked(LessonInterfaceBridge.loadExtractionConfiguration).mockResolvedValue(mockConfig);

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Test extracted content for lesson generation');
    });
  });

  it('allows content editing when enabled', async () => {
    const mockConfig = {
      sourceContent: 'Original content',
      suggestedType: 'discussion' as const,
      suggestedLevel: 'B1' as const,
      metadata: {
        title: 'Test Article',
        sourceUrl: 'https://example.com/article',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 200,
        readingTime: 1,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.8
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article from example.com'
    };

    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(true);
    vi.mocked(LessonInterfaceBridge.loadExtractionConfiguration).mockResolvedValue(mockConfig);

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('You can edit the extracted content below before generating your lesson')).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modified content' } });
    
    expect(textarea).toHaveValue('Modified content');
  });

  it('shows user customization note when enabled', async () => {
    const mockConfig = {
      sourceContent: 'Test content',
      suggestedType: 'business' as const,
      suggestedLevel: 'C1' as const,
      metadata: {
        title: 'Business Article',
        sourceUrl: 'https://example.com/business',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 800,
        readingTime: 5,
        complexity: 'advanced' as const,
        suitabilityScore: 0.95
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Business Article from example.com'
    };

    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(true);
    vi.mocked(LessonInterfaceBridge.loadExtractionConfiguration).mockResolvedValue(mockConfig);

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/AI has pre-selected lesson type and level based on content analysis/)).toBeInTheDocument();
    });
  });

  it('handles clearing extraction data', async () => {
    const mockConfig = {
      sourceContent: 'Test content',
      suggestedType: 'travel' as const,
      suggestedLevel: 'B2' as const,
      metadata: {
        title: 'Travel Guide',
        sourceUrl: 'https://example.com/travel',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 600,
        readingTime: 4,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.88
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Travel Guide from example.com'
    };

    vi.mocked(LessonInterfaceBridge.isExtractionSource).mockResolvedValue(true);
    vi.mocked(LessonInterfaceBridge.loadExtractionConfiguration).mockResolvedValue(mockConfig);
    vi.mocked(LessonInterfaceBridge.clearExtractionConfiguration).mockResolvedValue();

    render(
      <LessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear & Start Fresh');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(LessonInterfaceBridge.clearExtractionConfiguration).toHaveBeenCalled();
    });
  });
});