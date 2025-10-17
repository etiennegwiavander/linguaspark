import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EnhancedLessonGenerator from '@/components/enhanced-lesson-generator';

// Mock the lesson interface bridge hook
vi.mock('@/hooks/use-lesson-interface-bridge', () => ({
  useLessonInterfaceBridge: vi.fn(() => ({
    currentConfiguration: null,
    isLoading: false,
    error: null,
    loadConfiguration: vi.fn(),
    clearConfiguration: vi.fn(),
    isExtractionSource: vi.fn().mockResolvedValue(false)
  }))
}));

// Mock the lesson interface utils
vi.mock('@/lib/lesson-interface-bridge', () => ({
  LessonInterfaceUtils: {
    isExtractionLessonInterface: vi.fn().mockResolvedValue(false),
    createMetadataDisplay: vi.fn().mockReturnValue('Test Article • 100 words • 2 min read'),
    formatAttribution: vi.fn().mockReturnValue('Source: Test Article - example.com')
  }
}));

// Mock the original lesson generator
vi.mock('@/components/lesson-generator', () => ({
  default: ({ onLessonGenerated, onExtractFromPage }: any) => (
    <div data-testid="lesson-generator">
      <button onClick={() => onLessonGenerated({ title: 'Test Lesson' })}>
        Generate Lesson
      </button>
      <button onClick={onExtractFromPage}>Extract from Page</button>
    </div>
  )
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

describe('EnhancedLessonGenerator', () => {
  const mockOnLessonGenerated = vi.fn();
  const mockOnExtractFromPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic lesson generator when no extraction source', async () => {
    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('lesson-generator')).toBeInTheDocument();
    });

    expect(screen.queryByText('Content Extracted from Web')).not.toBeInTheDocument();
  });

  it('shows loading state', async () => {
    const { useLessonInterfaceBridge } = await import('@/hooks/use-lesson-interface-bridge');
    vi.mocked(useLessonInterfaceBridge).mockReturnValue({
      currentConfiguration: null,
      isLoading: true,
      error: null,
      loadConfiguration: vi.fn(),
      clearConfiguration: vi.fn(),
      isExtractionSource: vi.fn().mockResolvedValue(false)
    });

    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    expect(screen.getByText('Loading extraction data...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    const { useLessonInterfaceBridge } = await import('@/hooks/use-lesson-interface-bridge');
    vi.mocked(useLessonInterfaceBridge).mockReturnValue({
      currentConfiguration: null,
      isLoading: false,
      error: 'Failed to load configuration',
      loadConfiguration: vi.fn(),
      clearConfiguration: vi.fn(),
      isExtractionSource: vi.fn().mockResolvedValue(false)
    });

    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    expect(screen.getByText('Failed to load extraction data: Failed to load configuration')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-generator')).toBeInTheDocument();
  });

  it('displays extraction information when available', async () => {
    const mockConfig = {
      sourceContent: 'Test content for lesson generation',
      suggestedType: 'discussion',
      suggestedLevel: 'B1',
      metadata: {
        title: 'Test Article',
        author: 'Test Author',
        sourceUrl: 'https://example.com/test',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 100,
        readingTime: 2,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.85
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article - example.com'
    };

    mockUseLessonInterfaceBridge.mockReturnValue({
      currentConfiguration: mockConfig,
      isLoading: false,
      error: null,
      loadConfiguration: vi.fn().mockResolvedValue(mockConfig),
      clearConfiguration: vi.fn(),
      isExtractionSource: vi.fn().mockResolvedValue(true)
    });

    const { LessonInterfaceUtils } = await import('@/lib/lesson-interface-bridge');
    LessonInterfaceUtils.isExtractionLessonInterface.mockResolvedValue(true);

    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    expect(screen.getByText('Auto-populated')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('discussion')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('85% suitable')).toBeInTheDocument();
  });

  it('handles lesson generation with extraction metadata', async () => {
    const mockConfig = {
      sourceContent: 'Test content',
      suggestedType: 'discussion',
      suggestedLevel: 'B1',
      metadata: {
        title: 'Test Article',
        sourceUrl: 'https://example.com/test',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 100,
        readingTime: 2,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.85
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article - example.com'
    };

    mockUseLessonInterfaceBridge.mockReturnValue({
      currentConfiguration: mockConfig,
      isLoading: false,
      error: null,
      loadConfiguration: vi.fn().mockResolvedValue(mockConfig),
      clearConfiguration: vi.fn(),
      isExtractionSource: vi.fn().mockResolvedValue(true)
    });

    const { LessonInterfaceUtils } = await import('@/lib/lesson-interface-bridge');
    LessonInterfaceUtils.isExtractionLessonInterface.mockResolvedValue(true);

    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    // Simulate lesson generation
    const generateButton = screen.getByText('Generate Lesson');
    generateButton.click();

    expect(mockOnLessonGenerated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Lesson',
        extractionSource: expect.objectContaining({
          url: 'https://example.com/test',
          domain: 'example.com',
          title: 'Test Article'
        }),
        contentMetadata: expect.objectContaining({
          wordCount: 100,
          readingTime: 2,
          complexity: 'intermediate'
        })
      })
    );
  });

  it('allows clearing extraction data', async () => {
    const mockClearConfiguration = vi.fn();
    const mockConfig = {
      sourceContent: 'Test content',
      suggestedType: 'discussion',
      suggestedLevel: 'B1',
      metadata: {
        title: 'Test Article',
        sourceUrl: 'https://example.com/test',
        domain: 'example.com',
        extractedAt: new Date(),
        wordCount: 100,
        readingTime: 2,
        complexity: 'intermediate' as const,
        suitabilityScore: 0.85
      },
      extractionSource: 'webpage' as const,
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: 'Source: Test Article - example.com'
    };

    mockUseLessonInterfaceBridge.mockReturnValue({
      currentConfiguration: mockConfig,
      isLoading: false,
      error: null,
      loadConfiguration: vi.fn().mockResolvedValue(mockConfig),
      clearConfiguration: mockClearConfiguration,
      isExtractionSource: vi.fn().mockResolvedValue(true)
    });

    const { LessonInterfaceUtils } = await import('@/lib/lesson-interface-bridge');
    LessonInterfaceUtils.isExtractionLessonInterface.mockResolvedValue(true);

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });

    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Content Extracted from Web')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear & Start Fresh');
    clearButton.click();

    expect(mockClearConfiguration).toHaveBeenCalled();
  });

  it('handles extraction from page callback', async () => {
    render(
      <EnhancedLessonGenerator
        onLessonGenerated={mockOnLessonGenerated}
        onExtractFromPage={mockOnExtractFromPage}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('lesson-generator')).toBeInTheDocument();
    });

    const extractButton = screen.getByText('Extract from Page');
    extractButton.click();

    expect(mockOnExtractFromPage).toHaveBeenCalled();
  });
});