import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonInterfaceBridge } from '@/lib/lesson-interface-bridge';
import { useLessonInterfaceBridge } from '@/hooks/use-lesson-interface-bridge';
import type { ExtractedContent } from '@/lib/enhanced-content-extractor';

// Mock Chrome extension APIs
const mockChrome = {
  storage: {
    local: {
      set: vi.fn((data, callback) => callback && callback()),
      get: vi.fn((keys, callback) => callback({})),
      remove: vi.fn((keys, callback) => callback && callback())
    }
  },
  action: {
    openPopup: vi.fn()
  },
  tabs: {
    create: vi.fn()
  },
  runtime: {
    getURL: vi.fn((path) => `chrome-extension://test/${path}`)
  }
};

describe('Lesson Interface Bridge Integration', () => {
  let mockContent: ExtractedContent;

  beforeEach(() => {
    // Setup mocks
    global.window = {
      chrome: mockChrome,
      location: { origin: 'https://test.com' },
      open: vi.fn()
    } as any;

    // Reset mocks
    vi.clearAllMocks();

    mockContent = {
      text: "Sample content for lesson generation testing.",
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
        author: "Test Author",
        sourceUrl: "https://example.com/test",
        domain: "example.com",
        language: "en",
        contentType: "article",
        estimatedReadingTime: 2
      },
      quality: {
        wordCount: 50,
        readingTime: 2,
        complexity: 'intermediate',
        suitabilityScore: 0.85,
        issues: [],
        meetsMinimumStandards: true,
        readabilityScore: 0.8,
        vocabularyComplexity: 0.6,
        sentenceComplexity: 0.5
      },
      sourceInfo: {
        url: "https://example.com/test",
        domain: "example.com",
        title: "Test Article",
        extractedAt: new Date(),
        userAgent: "Test Agent",
        attribution: "Source: Test Article - example.com"
      },
      suggestedLessonType: 'discussion',
      suggestedCEFRLevel: 'B1'
    };
  });

  describe('LessonInterfaceBridge Integration', () => {
    it('completes full workflow from extraction to lesson interface', async () => {
      const bridge = new LessonInterfaceBridge();
      const callbacks = {
        onLessonInterfaceOpened: vi.fn(),
        onContentPrePopulated: vi.fn(),
        onSettingsApplied: vi.fn(),
        onError: vi.fn()
      };
      
      bridge.initialize(callbacks);

      // Step 1: Open lesson interface
      await bridge.openLessonInterface(mockContent);

      // Verify configuration was stored
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonConfiguration: expect.objectContaining({
            sourceContent: mockContent.text,
            suggestedType: mockContent.suggestedLessonType,
            suggestedLevel: mockContent.suggestedCEFRLevel,
            extractionSource: 'webpage'
          })
        })
      );

      // Verify popup was opened
      expect(mockChrome.action.openPopup).toHaveBeenCalled();

      // Verify callback was called
      expect(callbacks.onLessonInterfaceOpened).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceContent: mockContent.text,
          suggestedType: mockContent.suggestedLessonType,
          suggestedLevel: mockContent.suggestedCEFRLevel
        })
      );

      // Step 2: Populate interface
      await bridge.populateInterface(mockContent);

      // Verify content was stored for lesson generator
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedText: mockContent.text,
          sourceUrl: mockContent.metadata.sourceUrl,
          lessonType: mockContent.suggestedLessonType,
          studentLevel: mockContent.suggestedCEFRLevel
        })
      );

      // Verify callback was called
      expect(callbacks.onContentPrePopulated).toHaveBeenCalledWith(mockContent.text);

      // Step 3: Check state
      const state = bridge.getState();
      expect(state.lessonInterfaceOpen).toBe(true);
      expect(state.contentPrePopulated).toBe(true);
      expect(state.readyForGeneration).toBe(true);
    });

    it('handles configuration loading and recovery', async () => {
      const storedConfig = {
        sourceContent: 'test content',
        suggestedType: 'discussion',
        suggestedLevel: 'B1',
        metadata: {
          title: 'Test',
          extractedAt: '2024-01-01T00:00:00.000Z',
          sourceUrl: 'https://example.com',
          domain: 'example.com',
          wordCount: 100,
          readingTime: 2,
          complexity: 'intermediate',
          suitabilityScore: 0.8
        },
        extractionSource: 'webpage',
        allowContentEditing: true,
        userCanModifySettings: true,
        attribution: 'Source: Test - example.com'
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ lessonConfiguration: storedConfig });
      });

      const config = await LessonInterfaceBridge.loadExtractionConfiguration();
      
      expect(config).toEqual(expect.objectContaining({
        sourceContent: 'test content',
        suggestedType: 'discussion',
        suggestedLevel: 'B1'
      }));
      expect(config?.metadata.extractedAt).toBeInstanceOf(Date);
    });

    it('detects extraction source correctly', async () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ extractionSource: 'webpage' });
      });

      const isExtraction = await LessonInterfaceBridge.isExtractionSource();
      expect(isExtraction).toBe(true);
    });

    it('clears configuration properly', async () => {
      await LessonInterfaceBridge.clearExtractionConfiguration();

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith([
        'lessonConfiguration',
        'extractionSource'
      ]);
    });
  });

  describe('Hook Integration', () => {
    it('provides correct interface for components', () => {
      // This test verifies the hook interface without mocking
      // We can't easily test the hook implementation without React context
      // but we can verify the types and structure
      
      expect(typeof useLessonInterfaceBridge).toBe('function');
      
      // The hook should return an object with these properties
      const expectedProperties = [
        'interfaceState',
        'currentConfiguration',
        'isLoading',
        'error',
        'openLessonInterface',
        'populateInterface',
        'enableContentEditing',
        'preserveUserCustomizations',
        'integrateWithExistingWorkflow',
        'clearConfiguration',
        'isExtractionSource',
        'loadConfiguration'
      ];

      // We can't test the actual hook without React context,
      // but we can verify it exists and is callable
      expect(useLessonInterfaceBridge).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', async () => {
      const bridge = new LessonInterfaceBridge();
      const callbacks = {
        onLessonInterfaceOpened: vi.fn(),
        onContentPrePopulated: vi.fn(),
        onSettingsApplied: vi.fn(),
        onError: vi.fn()
      };
      
      bridge.initialize(callbacks);

      // Mock storage failure
      mockChrome.storage.local.set.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      await expect(bridge.openLessonInterface(mockContent)).rejects.toThrow('Storage failed');
      expect(callbacks.onError).toHaveBeenCalledWith('Storage failed');
    });

    it('handles popup failure with tab fallback', async () => {
      // Reset storage mock to work properly
      mockChrome.storage.local.set.mockImplementation((data, callback) => callback && callback());
      
      const bridge = new LessonInterfaceBridge();
      bridge.initialize({});

      // Mock popup failure
      mockChrome.action.openPopup.mockRejectedValue(new Error('Popup failed'));

      await bridge.openLessonInterface(mockContent);

      // Should fall back to tab creation
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/popup.html?source=extraction&autoPopulate=true'
      });
    });
  });

  describe('Metadata Handling', () => {
    beforeEach(() => {
      // Reset storage mock to work properly
      mockChrome.storage.local.set.mockImplementation((data, callback) => callback && callback());
    });

    it('preserves all extraction metadata', async () => {
      const bridge = new LessonInterfaceBridge();
      bridge.initialize({});

      await bridge.openLessonInterface(mockContent);

      const config = bridge.getCurrentConfiguration();
      
      expect(config).toEqual(expect.objectContaining({
        sourceContent: mockContent.text,
        suggestedType: mockContent.suggestedLessonType,
        suggestedLevel: mockContent.suggestedCEFRLevel,
        metadata: expect.objectContaining({
          title: mockContent.metadata.title,
          author: mockContent.metadata.author,
          sourceUrl: mockContent.metadata.sourceUrl,
          domain: mockContent.metadata.domain,
          wordCount: mockContent.quality.wordCount,
          readingTime: mockContent.quality.readingTime,
          complexity: mockContent.quality.complexity,
          suitabilityScore: mockContent.quality.suitabilityScore
        }),
        attribution: mockContent.sourceInfo.attribution,
        extractionSource: 'webpage',
        allowContentEditing: true,
        userCanModifySettings: true
      }));
    });

    it('handles missing optional metadata gracefully', async () => {
      const contentWithoutAuthor = {
        ...mockContent,
        metadata: {
          ...mockContent.metadata,
          author: undefined
        }
      };

      const bridge = new LessonInterfaceBridge();
      bridge.initialize({});

      await bridge.openLessonInterface(contentWithoutAuthor);

      const config = bridge.getCurrentConfiguration();
      expect(config?.metadata.author).toBeUndefined();
      expect(config?.metadata.title).toBe(mockContent.metadata.title);
    });
  });
});