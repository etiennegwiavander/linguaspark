import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExtractionConfirmationDialog } from '@/components/extraction-confirmation-dialog';
import { ExtractionConfirmationManager } from '@/lib/extraction-confirmation-manager';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';
import type { LessonType, CEFRLevel } from '@/lib/extraction-confirmation-manager';

// Mock the UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select data-testid="select" onChange={(e) => onValueChange(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid="textarea" {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}));

// Mock the hook with React state
vi.mock('@/hooks/use-extraction-confirmation', () => ({
  useExtractionConfirmation: (options: any) => {
    const [isEditing, setIsEditing] = React.useState(false);
    
    const mockExtractedContent: ExtractedContent = {
      text: "Sample extracted content for testing purposes.",
      structuredContent: {
        headings: [{ level: 1, text: "Test Article" }],
        paragraphs: ["Sample paragraph content."],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test Article",
        sourceUrl: "https://example.com/test",
        domain: "example.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 50,
        readingTime: 1,
        complexity: 'beginner' as const,
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://example.com/test",
        domain: "example.com",
        title: "Test Article",
        extractedAt: new Date(),
        userAgent: "Test Agent",
        attribution: "Source: Test Article - example.com"
      },
      suggestedLessonType: 'discussion' as LessonType,
      suggestedCEFRLevel: 'B1' as CEFRLevel
    };

    return {
      isOpen: true,
      extractedContent: mockExtractedContent,
      selectedLessonType: 'discussion' as LessonType,
      selectedCEFRLevel: 'B1' as CEFRLevel,
      editedContent: mockExtractedContent.text,
      isEditing,
      currentSession: null,
      showConfirmationDialog: vi.fn(),
      handleConfirm: vi.fn().mockImplementation(() => {
        if (options.onConfirm) {
          return options.onConfirm(mockExtractedContent, 'discussion', 'B1');
        }
      }),
      handleCancel: vi.fn().mockImplementation(() => {
        if (options.onCancel) {
          options.onCancel();
        }
      }),
      handleContentEdit: vi.fn(),
      handleLessonTypeChange: vi.fn(),
      handleCEFRLevelChange: vi.fn(),
      toggleEditingMode: vi.fn().mockImplementation(() => {
        setIsEditing(!isEditing);
      }),
      closeDialog: vi.fn(),
      clearSession: vi.fn(),
      isProcessing: false,
      error: null
    };
  }
}));

describe('ExtractionConfirmationDialog', () => {
  it('renders the confirmation dialog with extracted content', () => {
    render(<ExtractionConfirmationDialog />);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Content Extracted Successfully')).toBeInTheDocument();
    expect(screen.getByText('Review the extracted content and customize your lesson settings before proceeding.')).toBeInTheDocument();
  });

  it('displays content preview and metadata', () => {
    render(<ExtractionConfirmationDialog />);
    
    expect(screen.getByText('Content Preview')).toBeInTheDocument();
    expect(screen.getByText('Source Information')).toBeInTheDocument();
    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('shows lesson configuration options', () => {
    render(<ExtractionConfirmationDialog />);
    
    expect(screen.getByText('Lesson Configuration')).toBeInTheDocument();
    expect(screen.getByText('Lesson Type')).toBeInTheDocument();
    expect(screen.getByText('CEFR Level')).toBeInTheDocument();
  });

  it('displays quality assessment', () => {
    render(<ExtractionConfirmationDialog />);
    
    expect(screen.getByText('Quality Assessment')).toBeInTheDocument();
    expect(screen.getByText('Suitability Score')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('has generate lesson and cancel buttons', () => {
    render(<ExtractionConfirmationDialog />);
    
    const buttons = screen.getAllByTestId('button');
    const generateButton = buttons.find(button => button.textContent?.includes('Generate Lesson'));
    const cancelButton = buttons.find(button => button.textContent?.includes('Cancel'));
    
    expect(generateButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('calls onConfirm when generate lesson button is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    
    render(<ExtractionConfirmationDialog onConfirm={onConfirm} />);
    
    const buttons = screen.getAllByTestId('button');
    const generateButton = buttons.find(button => button.textContent?.includes('Generate Lesson'));
    
    if (generateButton) {
      fireEvent.click(generateButton);
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    }
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    
    render(<ExtractionConfirmationDialog onCancel={onCancel} />);
    
    const buttons = screen.getAllByTestId('button');
    const cancelButton = buttons.find(button => button.textContent?.includes('Cancel'));
    
    if (cancelButton) {
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  it('shows edit mode when edit button is clicked', () => {
    render(<ExtractionConfirmationDialog />);
    
    const buttons = screen.getAllByTestId('button');
    const editButton = buttons.find(button => button.textContent?.includes('Edit'));
    
    if (editButton) {
      fireEvent.click(editButton);
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    }
  });
});

describe('ExtractionConfirmationManager', () => {
  let manager: ExtractionConfirmationManager;
  let mockCallbacks: any;

  beforeEach(() => {
    manager = new ExtractionConfirmationManager();
    mockCallbacks = {
      onConfirm: vi.fn().mockResolvedValue(undefined),
      onCancel: vi.fn(),
      onContentEdit: vi.fn(),
      onLessonTypeChange: vi.fn(),
      onCEFRLevelChange: vi.fn()
    };
    manager.initialize(mockCallbacks);
  });

  it('initializes with correct default state', () => {
    const state = manager.getDialogState();
    expect(state.isOpen).toBe(false);
    expect(state.extractedContent).toBe(null);
    expect(state.selectedLessonType).toBe('discussion');
    expect(state.selectedCEFRLevel).toBe('B1');
  });

  it('shows confirmation dialog with extracted content', async () => {
    const mockContent: ExtractedContent = {
      text: "Test content",
      structuredContent: {
        headings: [],
        paragraphs: ["Test paragraph"],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test",
        sourceUrl: "https://test.com",
        domain: "test.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 10,
        readingTime: 1,
        complexity: 'beginner',
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://test.com",
        domain: "test.com",
        title: "Test",
        extractedAt: new Date(),
        userAgent: "Test",
        attribution: "Test"
      },
      suggestedLessonType: 'grammar',
      suggestedCEFRLevel: 'A2'
    };

    await manager.showConfirmationDialog(mockContent);
    
    const state = manager.getDialogState();
    expect(state.isOpen).toBe(true);
    expect(state.extractedContent).toBe(mockContent);
    expect(state.selectedLessonType).toBe('grammar');
    expect(state.selectedCEFRLevel).toBe('A2');
  });

  it('handles confirmation correctly', async () => {
    const mockContent: ExtractedContent = {
      text: "Test content",
      structuredContent: {
        headings: [],
        paragraphs: ["Test paragraph"],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test",
        sourceUrl: "https://test.com",
        domain: "test.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 10,
        readingTime: 1,
        complexity: 'beginner',
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://test.com",
        domain: "test.com",
        title: "Test",
        extractedAt: new Date(),
        userAgent: "Test",
        attribution: "Test"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B1'
    };

    await manager.showConfirmationDialog(mockContent);
    await manager.handleConfirmation();
    
    expect(mockCallbacks.onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Test content" }),
      'discussion',
      'B1'
    );
    
    const state = manager.getDialogState();
    expect(state.isOpen).toBe(false);
  });

  it('handles cancellation correctly', async () => {
    const mockContent: ExtractedContent = {
      text: "Test content",
      structuredContent: {
        headings: [],
        paragraphs: ["Test paragraph"],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test",
        sourceUrl: "https://test.com",
        domain: "test.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 10,
        readingTime: 1,
        complexity: 'beginner',
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://test.com",
        domain: "test.com",
        title: "Test",
        extractedAt: new Date(),
        userAgent: "Test",
        attribution: "Test"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B1'
    };

    await manager.showConfirmationDialog(mockContent);
    manager.handleCancellation();
    
    expect(mockCallbacks.onCancel).toHaveBeenCalled();
    
    const state = manager.getDialogState();
    expect(state.isOpen).toBe(false);
  });

  it('handles content editing', async () => {
    const mockContent: ExtractedContent = {
      text: "Original content",
      structuredContent: {
        headings: [],
        paragraphs: ["Test paragraph"],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test",
        sourceUrl: "https://test.com",
        domain: "test.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 10,
        readingTime: 1,
        complexity: 'beginner',
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://test.com",
        domain: "test.com",
        title: "Test",
        extractedAt: new Date(),
        userAgent: "Test",
        attribution: "Test"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B1'
    };

    await manager.showConfirmationDialog(mockContent);
    manager.handleContentEdit("Edited content");
    
    expect(mockCallbacks.onContentEdit).toHaveBeenCalledWith("Edited content");
    
    const state = manager.getDialogState();
    expect(state.editedContent).toBe("Edited content");
  });

  it('handles lesson type changes', async () => {
    const mockContent: ExtractedContent = {
      text: "Test content",
      structuredContent: {
        headings: [],
        paragraphs: ["Test paragraph"],
        lists: [],
        quotes: [],
        images: [],
        links: [],
        tables: [],
        codeBlocks: []
      },
      metadata: {
        title: "Test",
        sourceUrl: "https://test.com",
        domain: "test.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 1
      },
      quality: {
        wordCount: 10,
        readingTime: 1,
        complexity: 'beginner',
        suitabilityScore: 0.8,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.5,
        sentenceComplexity: 0.4
      },
      sourceInfo: {
        url: "https://test.com",
        domain: "test.com",
        title: "Test",
        extractedAt: new Date(),
        userAgent: "Test",
        attribution: "Test"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B1'
    };

    await manager.showConfirmationDialog(mockContent);
    manager.handleLessonTypeChange('grammar');
    
    expect(mockCallbacks.onLessonTypeChange).toHaveBeenCalledWith('grammar');
    
    const state = manager.getDialogState();
    expect(state.selectedLessonType).toBe('grammar');
  });

  it('generates unique session IDs', () => {
    const manager1 = new ExtractionConfirmationManager();
    const manager2 = new ExtractionConfirmationManager();
    
    // Access private method through any cast for testing
    const id1 = (manager1 as any).generateSessionId();
    const id2 = (manager2 as any).generateSessionId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^extraction_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^extraction_\d+_[a-z0-9]+$/);
  });
});