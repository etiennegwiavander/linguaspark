/**
 * Extract Button Integration
 * 
 * Integrates the ContentAnalysisEngine with FloatingActionButton to provide
 * intelligent button visibility and real-time page analysis.
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3
 */

import { ContentAnalysisEngine, type ContentAnalysisResult } from './content-analysis-engine';

export interface ButtonVisibilityDecision {
  shouldShow: boolean;
  reason: string;
  contentAnalysis: ContentAnalysisResult;
  timestamp: Date;
}

export interface AnalysisCache {
  [url: string]: {
    result: ContentAnalysisResult;
    decision: ButtonVisibilityDecision;
    timestamp: number;
    domHash: string;
  };
}

export interface IntegrationConfig {
  analysisThrottleMs: number;
  cacheExpiryMs: number;
  domChangeThreshold: number;
  enablePerformanceOptimizations: boolean;
  debugMode: boolean;
}

export class ExtractButtonIntegration {
  private analysisEngine: ContentAnalysisEngine;
  private cache: AnalysisCache = {};
  private analysisTimeout: NodeJS.Timeout | null = null;
  private domObserver: MutationObserver | null = null;
  private lastAnalysisTime = 0;
  private onVisibilityChange: ((decision: ButtonVisibilityDecision) => void) | null = null;

  private readonly config: IntegrationConfig = {
    analysisThrottleMs: 1000, // Throttle analysis to max once per second
    cacheExpiryMs: 5 * 60 * 1000, // Cache results for 5 minutes
    domChangeThreshold: 10, // Minimum DOM changes before re-analysis
    enablePerformanceOptimizations: true,
    debugMode: false
  };

  constructor(config?: Partial<IntegrationConfig>) {
    this.analysisEngine = new ContentAnalysisEngine();
    this.config = { ...this.config, ...config };
    
    if (this.config.debugMode) {
      console.log('[ExtractButtonIntegration] Initialized with config:', this.config);
    }
  }

  /**
   * Initialize the integration and start monitoring the page
   * Requirements: 1.1, 1.2 - Button appears on webpages with substantial content
   */
  public initialize(onVisibilityChange: (decision: ButtonVisibilityDecision) => void): void {
    this.onVisibilityChange = onVisibilityChange;
    
    // Perform initial analysis
    this.performAnalysis('initial_load');
    
    // Set up DOM change monitoring for real-time updates
    this.setupDOMMonitoring();
    
    // Set up page visibility change handling
    this.setupPageVisibilityHandling();
    
    if (this.config.debugMode) {
      console.log('[ExtractButtonIntegration] Initialized and monitoring started');
    }
  }

  /**
   * Clean up resources and stop monitoring
   */
  public destroy(): void {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = null;
    }
    
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    
    this.onVisibilityChange = null;
    
    if (this.config.debugMode) {
      console.log('[ExtractButtonIntegration] Destroyed and monitoring stopped');
    }
  }

  /**
   * Force a new analysis (bypasses throttling and cache)
   */
  public forceAnalysis(): ButtonVisibilityDecision {
    return this.performAnalysis('forced', true);
  }

  /**
   * Get the current cached analysis result
   */
  public getCachedAnalysis(): ButtonVisibilityDecision | null {
    const url = window.location.href;
    const cached = this.cache[url];
    
    if (cached && this.isCacheValid(cached)) {
      return cached.decision;
    }
    
    return null;
  }

  /**
   * Clear the analysis cache
   */
  public clearCache(): void {
    this.cache = {};
    if (this.config.debugMode) {
      console.log('[ExtractButtonIntegration] Cache cleared');
    }
  }

  /**
   * Perform content analysis and determine button visibility
   * Requirements: 2.1, 2.2, 2.3 - Content suitability criteria
   */
  private performAnalysis(trigger: string, force = false): ButtonVisibilityDecision {
    const now = Date.now();
    const url = window.location.href;
    
    // Check throttling (unless forced)
    if (!force && this.config.enablePerformanceOptimizations) {
      if (now - this.lastAnalysisTime < this.config.analysisThrottleMs) {
        const cached = this.getCachedAnalysis();
        if (cached) {
          if (this.config.debugMode) {
            console.log('[ExtractButtonIntegration] Analysis throttled, returning cached result');
          }
          return cached;
        }
      }
    }

    // Check cache (unless forced)
    if (!force) {
      const cached = this.cache[url];
      if (cached && this.isCacheValid(cached)) {
        const currentDomHash = this.calculateDOMHash();
        if (cached.domHash === currentDomHash) {
          if (this.config.debugMode) {
            console.log('[ExtractButtonIntegration] Returning cached analysis result');
          }
          return cached.decision;
        }
      }
    }

    this.lastAnalysisTime = now;

    try {
      // Perform content analysis
      const analysisResult = this.analysisEngine.analyzePageContent();
      
      // Determine button visibility
      const shouldShow = this.analysisEngine.isContentSuitable(analysisResult);
      
      // Create decision with detailed reasoning
      const reason = this.generateVisibilityReason(analysisResult, shouldShow);
      
      const decision: ButtonVisibilityDecision = {
        shouldShow,
        reason,
        contentAnalysis: analysisResult,
        timestamp: new Date()
      };

      // Cache the result
      this.cache[url] = {
        result: analysisResult,
        decision,
        timestamp: now,
        domHash: this.calculateDOMHash()
      };

      // Notify about visibility change
      if (this.onVisibilityChange) {
        this.onVisibilityChange(decision);
      }

      if (this.config.debugMode) {
        console.log('[ExtractButtonIntegration] Analysis completed:', {
          trigger,
          shouldShow,
          reason,
          wordCount: analysisResult.wordCount,
          contentType: analysisResult.contentType,
          qualityScore: analysisResult.qualityScore
        });
      }

      return decision;

    } catch (error) {
      console.error('[ExtractButtonIntegration] Analysis failed:', error);
      
      // Return a safe default decision
      const fallbackDecision: ButtonVisibilityDecision = {
        shouldShow: false,
        reason: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        contentAnalysis: this.getEmptyAnalysisResult(),
        timestamp: new Date()
      };

      if (this.onVisibilityChange) {
        this.onVisibilityChange(fallbackDecision);
      }

      return fallbackDecision;
    }
  }

  /**
   * Set up DOM monitoring for real-time page analysis
   * Requirement: Real-time page analysis on DOM changes
   */
  private setupDOMMonitoring(): void {
    if (!this.config.enablePerformanceOptimizations) {
      return;
    }

    let changeCount = 0;
    
    this.domObserver = new MutationObserver((mutations) => {
      // Count significant changes
      const significantChanges = mutations.filter(mutation => {
        // Only count changes that might affect content analysis
        if (mutation.type === 'childList') {
          return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
        }
        if (mutation.type === 'attributes') {
          return ['class', 'id', 'style'].includes(mutation.attributeName || '');
        }
        return false;
      });

      changeCount += significantChanges.length;

      // Throttle re-analysis based on change threshold
      if (changeCount >= this.config.domChangeThreshold) {
        changeCount = 0;
        this.scheduleThrottledAnalysis('dom_change');
      }
    });

    // Observe changes to the entire document
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'style']
    });

    if (this.config.debugMode) {
      console.log('[ExtractButtonIntegration] DOM monitoring started');
    }
  }

  /**
   * Set up page visibility change handling
   */
  private setupPageVisibilityHandling(): void {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, perform fresh analysis
        this.scheduleThrottledAnalysis('page_visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle focus events
    window.addEventListener('focus', () => {
      this.scheduleThrottledAnalysis('window_focus');
    });
  }

  /**
   * Schedule a throttled analysis to avoid excessive processing
   */
  private scheduleThrottledAnalysis(trigger: string): void {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }

    this.analysisTimeout = setTimeout(() => {
      this.performAnalysis(trigger);
      this.analysisTimeout = null;
    }, this.config.analysisThrottleMs);
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cached: AnalysisCache[string]): boolean {
    const now = Date.now();
    return (now - cached.timestamp) < this.config.cacheExpiryMs;
  }

  /**
   * Calculate a simple hash of the DOM structure for change detection
   */
  private calculateDOMHash(): string {
    // Simple hash based on main content structure
    const mainContent = document.querySelector('main, article, .content, .post') || document.body;
    const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const paragraphs = mainContent.querySelectorAll('p').length;
    const images = mainContent.querySelectorAll('img').length;
    const links = mainContent.querySelectorAll('a').length;
    
    return `${headings}-${paragraphs}-${images}-${links}-${mainContent.children.length}`;
  }

  /**
   * Generate detailed reasoning for visibility decision
   */
  private generateVisibilityReason(analysis: ContentAnalysisResult, shouldShow: boolean): string {
    if (shouldShow) {
      return `Button shown: ${analysis.wordCount} words, ${analysis.contentType} content, quality score ${analysis.qualityScore.toFixed(2)}`;
    }

    // Determine primary reason for hiding
    if (analysis.wordCount < 200) {
      return `Button hidden: Insufficient content (${analysis.wordCount} words, minimum 200 required)`;
    }

    if (!analysis.isEducational) {
      return `Button hidden: Non-educational content type (${analysis.contentType})`;
    }

    if (analysis.hasSocialMediaFeeds) {
      return 'Button hidden: Page contains social media feeds';
    }

    if (analysis.hasCommentSections) {
      return 'Button hidden: Page contains comment sections';
    }

    if (analysis.advertisingRatio > 0.4) {
      return `Button hidden: High advertising ratio (${(analysis.advertisingRatio * 100).toFixed(1)}%)`;
    }

    if (analysis.qualityScore < 0.6) {
      return `Button hidden: Low content quality score (${analysis.qualityScore.toFixed(2)})`;
    }

    if (!['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'].includes(analysis.language)) {
      return `Button hidden: Unsupported language (${analysis.language})`;
    }

    return 'Button hidden: Content does not meet suitability criteria';
  }

  /**
   * Get empty analysis result for error cases
   */
  private getEmptyAnalysisResult(): ContentAnalysisResult {
    return {
      wordCount: 0,
      contentType: 'other',
      language: 'unknown',
      languageConfidence: 0,
      qualityScore: 0,
      hasMainContent: false,
      isEducational: false,
      advertisingRatio: 1,
      hasSocialMediaFeeds: false,
      hasCommentSections: false
    };
  }
}

// Export types for external use
export type { ContentAnalysisResult };