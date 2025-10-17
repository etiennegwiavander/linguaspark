import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LessonInterfaceBridge, LessonInterfaceUtils } from '@/lib/lesson-interface-bridge';
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

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

describe('LessonInterfaceBridge', () => {
  let bridge: LessonInterfaceBridge;
  let mockCallbacks: any;
  let mockContent: ExtractedContent;

  beforeEach(() => {
    // Setup mocks
    global.window = {
      chrome: mockChrome,
      location: { origin: 'https://test.com' },
      open: vi.fn()
    } as any;
    
    global.sessionStorage = mockSessionStorage as any;

    // Reset mocks
    vi.clearAllMocks();

    bridge = new LessonInterfaceBridge();
    mockCallbacks = {
      onLessonInterfaceOpened: vi.fn(),
      onContentPrePopulated: vi.fn(),
      onSettingsApplied: vi.fn(),
      onError: vi.fn()
    };
    bridge.initialize(mockCallbacks);

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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('openLessonInterface', () => {
    it('creates lesson pre-configuration correctly', async () => {
      await bridge.openLessonInterface(mockContent);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonConfiguration: expect.objectContaining({
            sourceContent: mockContent.text,
            suggestedType: mockContent.suggestedLessonType,
            suggestedLevel: mockContent.suggestedCEFRLevel,
            extractionSource: 'webpage',
            allowContentEditing: true,
            userCanModifySettings: true,
            attribution: mockContent.sourceInfo.attribution
          }),
          extractionSource: 'webpage'
        })
      );
    });

    it('opens popup interface', async () => {
      await bridge.openLessonInterface(mockContent);

      expect(mockChrome.action.openPopup).toHaveBeenCalled();
    });

    it('falls back to tab creation if popup fails', async () => {
      mockChrome.action.openPopup.mockRejectedValue(new Error('Popup failed'));

      await bridge.openLessonInterface(mockContent);

      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/popup.html?source=extraction&autoPopulate=true'
      });
    });

    it('calls onLessonInterfaceOpened callback', async () => {
      await bridge.openLessonInterface(mockContent);

      expect(mockCallbacks.onLessonInterfaceOpened).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceContent: mockContent.text,
          suggestedType: mockContent.suggestedLessonType,
          suggestedLevel: mockContent.suggestedCEFRLevel
        })
      );
    });

    it('handles errors gracefully', async () => {
      mockChrome.storage.local.set.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      await expect(bridge.openLessonInterface(mockContent)).rejects.toThrow('Storage failed');
      expect(mockCallbacks.onError).toHaveBeenCalledWith('Storage failed');
    });
  });

  describe('populateInterface', () => {
    beforeEach(() => {
      // Reset mocks for this test group
      vi.clearAllMocks();
      mockChrome.storage.local.set.mockImplementation((data, callback) => callback && callback());
    });

    it('stores extracted content for lesson generator', async () => {
      await bridge.populateInterface(mockContent);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedText: mockContent.text,
          sourceUrl: mockContent.metadata.sourceUrl,
          lessonType: mockContent.suggestedLessonType,
          studentLevel: mockContent.suggestedCEFRLevel
        })
      );
    });

    it('calls onContentPrePopulated callback', async () => {
      await bridge.populateInterface(mockContent);

      expect(mockCallbacks.onContentPrePopulated).toHaveBeenCalledWith(mockContent.text);
    });

    it('updates interface state', async () => {
      await bridge.populateInterface(mockContent);

      const state = bridge.getState();
      expect(state.contentPrePopulated).toBe(true);
      expect(state.readyForGeneration).toBe(true);
    });
  });

  describe('static methods', () => {
    it('isExtractionSource detects extraction source correctly', async () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ extractionSource: 'webpage' });
      });

      const result = await LessonInterfaceBridge.isExtractionSource();
      expect(result).toBe(true);
    });

    it('loadExtractionConfiguration loads stored configuration', async () => {
      const storedConfig = {
        sourceContent: 'test content',
        suggestedType: 'discussion',
        suggestedLevel: 'B1',
        metadata: {
          title: 'Test',
          extractedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ lessonConfiguration: storedConfig });
      });

      const result = await LessonInterfaceBridge.loadExtractionConfiguration();
      
      expect(result).toEqual(expect.objectContaining({
        sourceContent: 'test content',
        suggestedType: 'discussion',
        suggestedLevel: 'B1'
      }));
      expect(result?.metadata.extractedAt).toBeInstanceOf(Date);
    });

    it('clearExtractionConfiguration removes stored data', async () => {
      await LessonInterfaceBridge.clearExtractionConfiguration();

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith([
        'lessonConfiguration',
        'extractionSource'
      ]);
    });
  });

  describe('fallback to sessionStorage', () => {
    beforeEach(() => {
      // Remove chrome from window to test fallback
      global.window = {
        location: { origin: 'https://test.com' },
        open: vi.fn()
      } as any;
    });

    it('uses sessionStorage when chrome is not available', async () => {
      await bridge.populateInterface(mockContent);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'linguaspark_selected_text',
        mockContent.text
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'linguaspark_source_url',
        mockContent.metadata.sourceUrl
      );
    });

    it('loads from sessionStorage when chrome is not available', async () => {
      const storedConfig = JSON.stringify({
        sourceContent: 'test content',
        metadata: { extractedAt: '2024-01-01T00:00:00.000Z' }
      });

      mockSessionStorage.getItem.mockReturnValue(storedConfig);

      const result = await LessonInterfaceBridge.loadExtractionConfiguration();
      
      expect(result).toEqual(expect.objectContaining({
        sourceContent: 'test content'
      }));
    });
  });

  describe('content editing and customization', () => {
    beforeEach(() => {
      // Reset mocks for this test group
      vi.clearAllMocks();
      mockChrome.storage.local.set.mockImplementation((data, callback) => callback && callback());
    });

    it('enables content editing', async () => {
      await bridge.openLessonInterface(mockContent);
      bridge.enableContentEditing();

      const config = bridge.getCurrentConfiguration();
      expect(config?.allowContentEditing).toBe(true);
    });

    it('preserves user customizations', async () => {
      await bridge.openLessonInterface(mockContent);
      bridge.preserveUserCustomizations();

      const config = bridge.getCurrentConfiguration();
      expect(config?.userCanModifySettings).toBe(true);
    });

    it('integrates with existing workflow', () => {
      bridge.integrateWithExistingWorkflow();

      const state = bridge.getState();
      expect(state.readyForGeneration).toBe(true);
    });
  });
});

describe('LessonInterfaceUtils', () => {
  beforeEach(() => {
    global.window = {
      location: {
        search: '?source=extraction&autoPopulate=true'
      }
    } as any;
  });

  it('detects extraction lesson interface correctly', async () => {
    const result = await LessonInterfaceUtils.isExtractionLessonInterface();
    expect(result).toBe(true);
  });

  it('gets extraction parameters from URL', () => {
    const params = LessonInterfaceUtils.getExtractionParams();
    expect(params).toEqual({
      source: 'extraction',
      autoPopulate: true
    });
  });

  it('formats attribution correctly', () => {
    const attribution = 'Test Article - example.com';
    const formatted = LessonInterfaceUtils.formatAttribution(attribution);
    expect(formatted).toBe('Source: Test Article - example.com');
  });

  it('creates metadata display string', () => {
    const metadata = {
      title: 'Test Article',
      author: 'Test Author',
      domain: 'example.com',
      wordCount: 100,
      readingTime: 2,
      extractedAt: new Date(),
      complexity: 'intermediate' as const,
      suitabilityScore: 0.85
    };

    const display = LessonInterfaceUtils.createMetadataDisplay(metadata);
    expect(display).toBe('Test Article • by Test Author • from example.com • 100 words • 2 min read');
  });

  it('handles missing metadata fields gracefully', () => {
    const metadata = {
      title: 'Test Article',
      domain: 'example.com',
      wordCount: 100,
      readingTime: 2,
      extractedAt: new Date(),
      complexity: 'intermediate' as const,
      suitabilityScore: 0.85
    };

    const display = LessonInterfaceUtils.createMetadataDisplay(metadata);
    expect(display).toBe('Test Article • from example.com • 100 words • 2 min read');
  });
});