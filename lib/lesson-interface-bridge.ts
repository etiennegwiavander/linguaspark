/**
 * Lesson Interface Bridge
 * 
 * Connects extracted content to the existing lesson generation interface.
 * Handles automatic popup opening, content pre-population, and metadata preservation.
 * 
 * Requirements: 4.1, 4.2, 4.6, 6.6
 */

import type { ExtractedContent } from './enhanced-content-extractor';
import type { LessonType, CEFRLevel } from './extraction-confirmation-manager';

export interface LessonPreConfiguration {
  sourceContent: string;
  suggestedType: LessonType;
  suggestedLevel: CEFRLevel;
  metadata: ExtractedContentMetadata;
  extractionSource: 'webpage';
  allowContentEditing: boolean;
  userCanModifySettings: boolean;
  attribution: string;
}

export interface ExtractedContentMetadata {
  title: string;
  author?: string;
  sourceUrl: string;
  domain: string;
  extractedAt: Date;
  wordCount: number;
  readingTime: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  suitabilityScore: number;
  bannerImages?: Array<{
    url: string;
    alt: string;
    type: 'meta' | 'content';
    priority: number;
    width?: number | null;
    height?: number | null;
  }>;
  bannerImage?: string; // URL of the primary banner image
  images?: Array<any>; // All extracted images
}

export interface InterfaceState {
  contentPrePopulated: boolean;
  settingsCustomizable: boolean;
  extractionConfirmed: boolean;
  readyForGeneration: boolean;
  lessonInterfaceOpen: boolean;
}

export interface LessonInterfaceBridgeCallbacks {
  onLessonInterfaceOpened?: (config: LessonPreConfiguration) => void;
  onContentPrePopulated?: (content: string) => void;
  onSettingsApplied?: (lessonType: LessonType, cefrLevel: CEFRLevel) => void;
  onError?: (error: string) => void;
}

export class LessonInterfaceBridge {
  private state: InterfaceState = {
    contentPrePopulated: false,
    settingsCustomizable: true,
    extractionConfirmed: false,
    readyForGeneration: false,
    lessonInterfaceOpen: false
  };
  
  private callbacks: LessonInterfaceBridgeCallbacks = {};
  private currentConfiguration: LessonPreConfiguration | null = null;

  /**
   * Initialize the bridge with callbacks
   */
  public initialize(callbacks: LessonInterfaceBridgeCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Open lesson interface with extracted content
   * Requirement 4.1: Open the LinguaSpark lesson generation interface
   */
  public async openLessonInterface(content: ExtractedContent): Promise<void> {
    try {
      // Create lesson pre-configuration
      const config = this.createLessonPreConfiguration(content);
      this.currentConfiguration = config;

      // Store configuration for the lesson interface
      await this.storeConfiguration(config);

      // Open the lesson interface
      await this.openInterface();

      // Update state
      this.state.lessonInterfaceOpen = true;
      this.state.extractionConfirmed = true;

      // Notify callback
      if (this.callbacks.onLessonInterfaceOpened) {
        this.callbacks.onLessonInterfaceOpened(config);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open lesson interface';
      console.error('[LessonInterfaceBridge] Failed to open lesson interface:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Pre-populate lesson interface with extracted content
   * Requirement 4.2: Pre-populate source content field with extracted content
   */
  public async populateInterface(content: ExtractedContent): Promise<void> {
    try {
      const config = this.createLessonPreConfiguration(content);
      
      // Store the content for the lesson generator
      await this.storeExtractedContent(config);
      
      // Update state
      this.state.contentPrePopulated = true;
      this.state.readyForGeneration = true;

      // Notify callback
      if (this.callbacks.onContentPrePopulated) {
        this.callbacks.onContentPrePopulated(config.sourceContent);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to populate interface';
      console.error('[LessonInterfaceBridge] Failed to populate interface:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Enable content editing in the lesson interface
   * Requirement 4.5: User can edit extracted content before generation
   */
  public enableContentEditing(): void {
    if (this.currentConfiguration) {
      this.currentConfiguration.allowContentEditing = true;
      this.storeConfiguration(this.currentConfiguration);
    }
  }

  /**
   * Preserve user customizations
   * Requirement 4.4: User can modify lesson type, CEFR level, and other settings
   */
  public preserveUserCustomizations(): void {
    if (this.currentConfiguration) {
      this.currentConfiguration.userCanModifySettings = true;
      this.storeConfiguration(this.currentConfiguration);
    }
  }

  /**
   * Integrate with existing lesson generation workflow
   * Requirement 4.6: Follow existing enhanced lesson generation workflow
   */
  public integrateWithExistingWorkflow(): void {
    // The integration happens through the stored configuration
    // The lesson generator will detect the extraction source and handle accordingly
    this.state.readyForGeneration = true;
  }

  /**
   * Get current interface state
   */
  public getState(): InterfaceState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  public getCurrentConfiguration(): LessonPreConfiguration | null {
    return this.currentConfiguration ? { ...this.currentConfiguration } : null;
  }

  /**
   * Check if content is from extraction
   */
  public static async isExtractionSource(): Promise<boolean> {
    try {
      // First try URL parameters (most reliable for web context)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('source') === 'extraction') {
          return true;
        }
      }

      // Try Chrome storage if available (extension context)
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        return new Promise((resolve) => {
          try {
            window.chrome.storage.local.get(['extractionSource'], (result: any) => {
              if (window.chrome.runtime.lastError) {
                console.warn('[LessonInterfaceBridge] Chrome storage error, checking localStorage fallback:', window.chrome.runtime.lastError.message);
                // Check localStorage fallback
                const fallbackConfig = LessonInterfaceBridge.loadFromLocalStorage();
                resolve(fallbackConfig?.extractionSource === 'webpage');
              } else {
                resolve(result.extractionSource === 'webpage');
              }
            });
          } catch (error) {
            console.warn('[LessonInterfaceBridge] Chrome storage access failed, checking localStorage fallback:', error);
            // Check localStorage fallback
            const fallbackConfig = LessonInterfaceBridge.loadFromLocalStorage();
            resolve(fallbackConfig?.extractionSource === 'webpage');
          }
        });
      }

      // Try localStorage (fallback for extension context invalidation)
      const localStorageConfig = LessonInterfaceBridge.loadFromLocalStorage();
      if (localStorageConfig?.extractionSource === 'webpage') {
        return true;
      }

      // Try session storage (web context fallback)
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('linguaspark_lesson_config');
        if (stored) {
          const config = JSON.parse(stored);
          return config.extractionSource === 'webpage';
        }
      }

      return false;
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to check extraction source:', error);
      return false;
    }
  }

  /**
   * Load extraction configuration
   */
  public static async loadExtractionConfiguration(): Promise<LessonPreConfiguration | null> {
    try {
      // Try Chrome storage if available (extension context)
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        return new Promise((resolve) => {
          try {
            window.chrome.storage.local.get(['lessonConfiguration'], (result: any) => {
              if (window.chrome.runtime.lastError) {
                console.warn('[LessonInterfaceBridge] Chrome storage error, trying localStorage fallback:', window.chrome.runtime.lastError.message);
                // Fallback to localStorage
                const fallbackConfig = LessonInterfaceBridge.loadFromLocalStorage();
                resolve(fallbackConfig);
              } else if (result.lessonConfiguration) {
                // Parse dates
                const config = result.lessonConfiguration;
                if (config.metadata.extractedAt) {
                  config.metadata.extractedAt = new Date(config.metadata.extractedAt);
                }
                resolve(config);
              } else {
                // Try localStorage fallback
                const fallbackConfig = LessonInterfaceBridge.loadFromLocalStorage();
                resolve(fallbackConfig);
              }
            });
          } catch (error) {
            console.warn('[LessonInterfaceBridge] Chrome storage access failed, using localStorage fallback:', error);
            const fallbackConfig = LessonInterfaceBridge.loadFromLocalStorage();
            resolve(fallbackConfig);
          }
        });
      }

      // Try localStorage (fallback for extension context invalidation)
      const localStorageConfig = LessonInterfaceBridge.loadFromLocalStorage();
      if (localStorageConfig) {
        return localStorageConfig;
      }

      // Try session storage (web context)
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('linguaspark_lesson_config');
        if (stored) {
          const config = JSON.parse(stored);
          // Parse dates
          if (config.metadata.extractedAt) {
            config.metadata.extractedAt = new Date(config.metadata.extractedAt);
          }
          return config;
        }
      }

      // Try URL parameters (for metadata only, content should be in storage)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sourceParam = urlParams.get('sourceUrl');
        const isExtractionSource = urlParams.get('source') === 'extraction';
        
        // If this is an extraction source but no content in URL, it should be in storage
        if (isExtractionSource && sourceParam) {
          // This indicates content should be available in storage
          // Return null here so the caller knows to check storage
          console.log('[LessonInterfaceBridge] Extraction source detected but content not in URL - should be in storage');
        }
        
        // Legacy support: if content is in URL parameters (for small content)
        const contentParam = urlParams.get('content');
        if (contentParam && sourceParam) {
          try {
            const decodedContent = decodeURIComponent(contentParam);
            return {
              sourceContent: decodedContent,
              suggestedType: (urlParams.get('type') as LessonType) || 'discussion',
              suggestedLevel: (urlParams.get('level') as CEFRLevel) || 'B1',
              metadata: {
                title: urlParams.get('title') || 'Extracted Content',
                sourceUrl: decodeURIComponent(sourceParam),
                domain: new URL(decodeURIComponent(sourceParam)).hostname,
                extractedAt: new Date(),
                wordCount: decodedContent.split(/\s+/).length,
                readingTime: Math.ceil(decodedContent.split(/\s+/).length / 200),
                complexity: 'intermediate',
                suitabilityScore: 0.8
              },
              extractionSource: 'webpage',
              allowContentEditing: true,
              userCanModifySettings: true,
              attribution: `Source: ${new URL(decodeURIComponent(sourceParam)).hostname}`
            };
          } catch (urlError) {
            console.warn('[LessonInterfaceBridge] Failed to parse URL parameters:', urlError);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to load extraction configuration:', error);
      return null;
    }
  }

  /**
   * Clear extraction configuration
   */
  public static async clearExtractionConfiguration(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        window.chrome.storage.local.remove(['lessonConfiguration', 'extractionSource']);
      } else if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('linguaspark_lesson_config');
      }
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to clear extraction configuration:', error);
    }
  }

  /**
   * Create lesson pre-configuration from extracted content
   */
  private createLessonPreConfiguration(content: ExtractedContent): LessonPreConfiguration {
    return {
      sourceContent: content.text,
      suggestedType: content.suggestedLessonType,
      suggestedLevel: content.suggestedCEFRLevel,
      metadata: {
        title: content.metadata.title,
        author: content.metadata.author,
        sourceUrl: content.metadata.sourceUrl,
        domain: content.metadata.domain,
        extractedAt: content.sourceInfo.extractedAt,
        wordCount: content.quality.wordCount,
        readingTime: content.quality.readingTime,
        complexity: content.quality.complexity,
        suitabilityScore: content.quality.suitabilityScore,
        bannerImages: (content as any).bannerImages || (content.metadata as any)?.bannerImages || [],
        bannerImage: (content as any).bannerImage || (content.metadata as any)?.bannerImage || null,
        images: (content as any).images || (content.metadata as any)?.images || []
      },
      extractionSource: 'webpage',
      allowContentEditing: true,
      userCanModifySettings: true,
      attribution: content.sourceInfo.attribution
    };
  }

  /**
   * Store configuration for lesson interface
   */
  private async storeConfiguration(config: LessonPreConfiguration): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        // Store in Chrome extension storage
        window.chrome.storage.local.set({
          lessonConfiguration: config,
          extractionSource: 'webpage',
          extractionTimestamp: Date.now()
        });
      } else if (typeof sessionStorage !== 'undefined') {
        // Fallback to session storage
        sessionStorage.setItem('linguaspark_lesson_config', JSON.stringify(config));
      }
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to store configuration:', error);
      throw error;
    }
  }

  /**
   * Store extracted content for lesson generator
   */
  private async storeExtractedContent(config: LessonPreConfiguration): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        // Store content in the format expected by lesson generator
        window.chrome.storage.local.set({
          selectedText: config.sourceContent,
          sourceUrl: config.metadata.sourceUrl,
          lessonType: config.suggestedType,
          studentLevel: config.suggestedLevel,
          extractionMetadata: config.metadata,
          attribution: config.attribution
        });
      } else if (typeof sessionStorage !== 'undefined') {
        // Fallback storage
        sessionStorage.setItem('linguaspark_selected_text', config.sourceContent);
        sessionStorage.setItem('linguaspark_source_url', config.metadata.sourceUrl);
        sessionStorage.setItem('linguaspark_lesson_type', config.suggestedType);
        sessionStorage.setItem('linguaspark_student_level', config.suggestedLevel);
      }
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to store extracted content:', error);
      throw error;
    }
  }

  /**
   * Open the lesson interface
   */
  private async openInterface(): Promise<void> {
    try {
      const config = this.currentConfiguration;
      if (!config) {
        throw new Error('No configuration available');
      }

      if (typeof window !== 'undefined' && window.chrome?.action) {
        // Extension context - try to open popup
        try {
          await window.chrome.action.openPopup();
        } catch (popupError) {
          // If popup fails, open in new tab with minimal URL parameters
          // ALWAYS store full content in Chrome storage, NEVER in URL
          await window.chrome.storage.local.set({
            lessonConfiguration: config,
            extractionSource: 'webpage',
            extractionTimestamp: Date.now()
          });
          
          const url = new URL(window.chrome.runtime.getURL('popup.html'));
          url.searchParams.set('source', 'extraction');
          url.searchParams.set('autoPopulate', 'true');
          url.searchParams.set('sourceUrl', encodeURIComponent(config.metadata.sourceUrl));
          url.searchParams.set('type', config.suggestedType);
          url.searchParams.set('level', config.suggestedLevel);
          url.searchParams.set('title', encodeURIComponent(config.metadata.title));
          // NOTE: NO 'content' parameter to avoid URL length limits
          
          console.log('[LessonInterfaceBridge] Stored full content in Chrome storage, opening popup with metadata-only URL');
          await window.chrome.tabs.create({ url: url.toString() });
        }
      } else if (typeof window !== 'undefined') {
        // Web context - ALWAYS store full content in session storage, NEVER in URL
        sessionStorage.setItem('linguaspark_lesson_config', JSON.stringify(config));
        
        // Use minimal URL parameters - NO CONTENT in URL to avoid truncation
        const url = new URL('/popup', window.location.origin);
        url.searchParams.set('source', 'extraction');
        url.searchParams.set('autoPopulate', 'true');
        url.searchParams.set('sourceUrl', encodeURIComponent(config.metadata.sourceUrl));
        url.searchParams.set('type', config.suggestedType);
        url.searchParams.set('level', config.suggestedLevel);
        url.searchParams.set('title', encodeURIComponent(config.metadata.title));
        // NOTE: NO 'content' parameter to avoid URL length limits
        
        console.log('[LessonInterfaceBridge] Stored full content in session storage, opening popup with metadata-only URL');
        window.open(url.toString(), '_blank');
      }
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to open interface:', error);
      throw error;
    }
  }
  /**
   * Load configuration from localStorage (fallback for extension context invalidation)
   */
  private static loadFromLocalStorage(): LessonPreConfiguration | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      
      const stored = localStorage.getItem('linguaspark_lesson_config');
      if (stored) {
        const config = JSON.parse(stored);
        // Parse dates
        if (config.metadata?.extractedAt) {
          config.metadata.extractedAt = new Date(config.metadata.extractedAt);
        }
        console.log('[LessonInterfaceBridge] Loaded configuration from localStorage fallback');
        return config;
      }
      return null;
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear extraction configuration from all storage types
   */
  public static async clearExtractionConfiguration(): Promise<void> {
    try {
      // Clear Chrome storage if available
      if (typeof window !== 'undefined' && window.chrome?.storage) {
        try {
          await new Promise<void>((resolve) => {
            window.chrome.storage.local.remove(['lessonConfiguration', 'extractedContent', 'extractionSource', 'extractionTimestamp'], () => {
              if (window.chrome.runtime.lastError) {
                console.warn('[LessonInterfaceBridge] Chrome storage clear error:', window.chrome.runtime.lastError.message);
              }
              resolve();
            });
          });
        } catch (error) {
          console.warn('[LessonInterfaceBridge] Failed to clear Chrome storage:', error);
        }
      }

      // Clear localStorage fallback
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('linguaspark_lesson_config');
        } catch (error) {
          console.warn('[LessonInterfaceBridge] Failed to clear localStorage:', error);
        }
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('linguaspark_lesson_config');
          sessionStorage.removeItem('linguaspark_selected_text');
          sessionStorage.removeItem('linguaspark_source_url');
          sessionStorage.removeItem('linguaspark_lesson_type');
          sessionStorage.removeItem('linguaspark_student_level');
        } catch (error) {
          console.warn('[LessonInterfaceBridge] Failed to clear sessionStorage:', error);
        }
      }

      console.log('[LessonInterfaceBridge] Cleared extraction configuration from all storage types');
    } catch (error) {
      console.error('[LessonInterfaceBridge] Failed to clear extraction configuration:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for lesson interface integration
 */
export const LessonInterfaceUtils = {
  /**
   * Check if current page is lesson interface with extraction source
   */
  async isExtractionLessonInterface(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const isExtractionSource = urlParams.get('source') === 'extraction';
    const shouldAutoPopulate = urlParams.get('autoPopulate') === 'true';
    
    return isExtractionSource && shouldAutoPopulate;
  },

  /**
   * Get extraction parameters from URL
   */
  getExtractionParams(): { source: string | null; autoPopulate: boolean } {
    if (typeof window === 'undefined') {
      return { source: null, autoPopulate: false };
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('source'),
      autoPopulate: urlParams.get('autoPopulate') === 'true'
    };
  },

  /**
   * Check if Chrome APIs are available
   */
  isChromeExtensionContext(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.chrome !== 'undefined' && 
           typeof window.chrome.storage !== 'undefined';
  },

  /**
   * Safe Chrome storage access with fallback
   */
  async safeStorageGet(keys: string[]): Promise<any> {
    console.log('[LessonInterfaceUtils] safeStorageGet called with keys:', keys);
    console.log('[LessonInterfaceUtils] Chrome extension context:', this.isChromeExtensionContext());
    
    if (this.isChromeExtensionContext()) {
      return new Promise((resolve) => {
        try {
          window.chrome.storage.local.get(keys, (result) => {
            if (window.chrome.runtime.lastError) {
              console.warn('[LessonInterfaceUtils] Chrome storage error, trying localStorage fallback:', window.chrome.runtime.lastError.message);
              const fallbackResult = this.getFromLocalStorageFallback(keys);
              console.log('[LessonInterfaceUtils] Fallback result:', Object.keys(fallbackResult));
              resolve(fallbackResult);
            } else {
              console.log('[LessonInterfaceUtils] Chrome storage result:', Object.keys(result || {}));
              resolve(result);
            }
          });
        } catch (error) {
          console.warn('[LessonInterfaceUtils] Chrome storage access failed:', error);
          const fallbackResult = this.getFromLocalStorageFallback(keys);
          console.log('[LessonInterfaceUtils] Exception fallback result:', Object.keys(fallbackResult));
          resolve(fallbackResult);
        }
      });
    }
    
    const fallbackResult = this.getFromLocalStorageFallback(keys);
    console.log('[LessonInterfaceUtils] Direct fallback result:', Object.keys(fallbackResult));
    return fallbackResult;
  },

  /**
   * Get data from localStorage fallback
   */
  getFromLocalStorageFallback(keys: string[]): any {
    const result: any = {};
    
    // First try the main lesson config key (used by content script)
    try {
      const mainConfig = localStorage.getItem('linguaspark_lesson_config');
      if (mainConfig) {
        const parsed = JSON.parse(mainConfig);
        console.log('[LessonInterfaceUtils] Found localStorage config:', Object.keys(parsed));
        
        // Map the stored data to the expected keys
        if (parsed.lessonConfiguration) {
          result.lessonConfiguration = parsed.lessonConfiguration;
        }
        if (parsed.extractedContent) {
          result.extractedContent = parsed.extractedContent;
        }
        if (parsed.selectedText) {
          result.selectedText = parsed.selectedText;
        }
        if (parsed.sourceUrl) {
          result.sourceUrl = parsed.sourceUrl;
        }
        
        // If we have lesson configuration, that's the primary data
        if (result.lessonConfiguration) {
          return result;
        }
      }
    } catch (error) {
      console.warn('[LessonInterfaceUtils] Failed to parse localStorage config:', error);
    }
    
    // Fallback to individual sessionStorage keys
    for (const key of keys) {
      try {
        const stored = sessionStorage.getItem(`linguaspark_${key}`);
        if (stored) {
          try {
            result[key] = JSON.parse(stored);
          } catch {
            result[key] = stored;
          }
        }
      } catch (error) {
        console.warn(`[LessonInterfaceUtils] Failed to get sessionStorage key ${key}:`, error);
      }
    }
    
    return result;
  },

  /**
   * Safe Chrome storage set with fallback
   */
  async safeStorageSet(data: Record<string, any>): Promise<void> {
    if (this.isChromeExtensionContext()) {
      try {
        window.chrome.storage.local.set(data);
        return;
      } catch (error) {
        console.warn('[LessonInterfaceUtils] Chrome storage set failed, using localStorage fallback:', error);
      }
    }
    
    // Fallback to localStorage with the same format as content script
    try {
      localStorage.setItem('linguaspark_lesson_config', JSON.stringify(data));
      console.log('[LessonInterfaceUtils] Stored data in localStorage fallback');
    } catch (error) {
      console.warn('[LessonInterfaceUtils] localStorage fallback failed:', error);
      
      // Final fallback to session storage
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(`linguaspark_${key}`, JSON.stringify(value));
      }
    }
  },

  /**
   * Format attribution text for display
   */
  formatAttribution(attribution: string): string {
    return attribution.startsWith('Source: ') ? attribution : `Source: ${attribution}`;
  },

  /**
   * Create lesson metadata display
   */
  createMetadataDisplay(metadata: ExtractedContentMetadata): string {
    const parts = [];
    
    if (metadata.title) {
      parts.push(metadata.title);
    }
    
    if (metadata.author) {
      parts.push(`by ${metadata.author}`);
    }
    
    if (metadata.domain) {
      parts.push(`from ${metadata.domain}`);
    }
    
    parts.push(`${metadata.wordCount} words`);
    parts.push(`${metadata.readingTime} min read`);
    
    return parts.join(' • ');
  },

  /**
   * Debug storage state for troubleshooting
   */
  async debugStorageState(): Promise<void> {
    console.log('[LessonInterfaceBridge] Debug Storage State:');
    console.log('- Chrome extension context:', this.isChromeExtensionContext());
    console.log('- URL:', window.location.href);
    console.log('- URL params:', Object.fromEntries(new URLSearchParams(window.location.search)));
    
    if (this.isChromeExtensionContext()) {
      const chromeData = await this.safeStorageGet(['lessonConfiguration', 'extractedContent', 'selectedText']);
      console.log('- Chrome storage:', chromeData);
    }
    
    console.log('- Session storage keys:', Object.keys(sessionStorage).filter(k => k.startsWith('linguaspark_')));
    
    const sessionConfig = sessionStorage.getItem('linguaspark_lesson_config');
    if (sessionConfig) {
      try {
        console.log('- Session config:', JSON.parse(sessionConfig));
      } catch {
        console.log('- Session config (raw):', sessionConfig);
      }
    }
  }
};