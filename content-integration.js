// Content script integration loader
// This script injects the necessary classes and initializes the extract button integration

;(() => {
  'use strict';

  // ContentAnalysisEngine implementation (simplified for content script)
  class ContentAnalysisEngine {
    constructor() {
      this.MINIMUM_WORD_COUNT = 200;
      this.SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'];
      this.EDUCATIONAL_DOMAINS = [
        'wikipedia.org', 'britannica.com', 'khanacademy.org', 'coursera.org',
        'edx.org', 'mit.edu', 'stanford.edu', 'harvard.edu', 'bbc.com/news',
        'cnn.com', 'reuters.com', 'npr.org', 'medium.com', 'dev.to',
        'stackoverflow.com', 'github.com', 'mozilla.org', 'w3schools.com'
      ];
    }

    analyzePageContent() {
      const content = this.extractTextContent(document);
      const wordCount = this.countWords(content);
      const contentType = this.detectContentType(document);
      const structure = this.analyzeStructure(document);
      const language = this.detectLanguage(content);
      const advertisingRatio = this.calculateAdRatio(document);
      
      const qualityScore = this.calculateOverallQualityScore({
        wordCount,
        structure,
        contentType,
        advertisingRatio
      });

      return {
        wordCount,
        contentType,
        language: language.language,
        languageConfidence: language.confidence,
        qualityScore: qualityScore,
        hasMainContent: structure.hasMainContent,
        isEducational: this.isEducationalContent(contentType, document),
        advertisingRatio,
        hasSocialMediaFeeds: this.hasSocialMediaFeeds(document),
        hasCommentSections: this.hasCommentSections(document)
      };
    }

    isContentSuitable(analysis) {
      // Requirement 2.3: Minimum 200 words
      if (analysis.wordCount < this.MINIMUM_WORD_COUNT) {
        return false;
      }

      // Requirement 2.4: Supported language detection
      if (!this.SUPPORTED_LANGUAGES.includes(analysis.language) || analysis.languageConfidence < 0.7) {
        return false;
      }

      // Requirement 2.1: Educational content only
      if (!analysis.isEducational) {
        return false;
      }

      // Requirement 2.2: Exclude non-educational content types
      const excludedTypes = ['product', 'social', 'navigation', 'ecommerce', 'multimedia'];
      if (excludedTypes.includes(analysis.contentType)) {
        return false;
      }

      // Requirement 2.5: Exclude social media feeds and comments
      if (analysis.hasSocialMediaFeeds || analysis.hasCommentSections) {
        return false;
      }

      // Quality threshold
      if (analysis.qualityScore < 0.6) {
        return false;
      }

      // Advertising ratio threshold
      if (analysis.advertisingRatio > 0.4) {
        return false;
      }

      return true;
    }

    detectContentType(document) {
      const url = window.location.href;
      const pathname = window.location.pathname;
      const domain = window.location.hostname;

      // URL pattern analysis
      if (this.matchesPattern(pathname, ['/blog/', '/article/', '/post/'])) {
        return 'blog';
      }
      
      if (this.matchesPattern(pathname, ['/news/', '/story/', '/breaking/'])) {
        return 'news';
      }
      
      if (this.matchesPattern(pathname, ['/tutorial/', '/guide/', '/how-to/', '/learn/'])) {
        return 'tutorial';
      }
      
      if (this.matchesPattern(pathname, ['/wiki/', '/encyclopedia/']) || domain.includes('wikipedia')) {
        return 'encyclopedia';
      }
      
      if (this.matchesPattern(pathname, ['/product/', '/shop/', '/buy/', '/cart/'])) {
        return 'product';
      }

      // Meta tag analysis
      const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');
      if (ogType === 'article') {
        return 'article';
      }

      // Content pattern analysis
      const hasArticleStructure = this.hasArticleStructure(document);
      if (hasArticleStructure) {
        return 'article';
      }

      // Domain-based classification
      if (this.EDUCATIONAL_DOMAINS.some(domain => window.location.hostname.includes(domain))) {
        return 'article';
      }

      // Social media detection
      if (this.isSocialMediaSite(domain)) {
        return 'social';
      }

      // E-commerce detection
      if (this.isEcommerceSite(document)) {
        return 'ecommerce';
      }

      return 'other';
    }

    detectLanguage(content) {
      const text = content.toLowerCase().substring(0, 1000);
      
      const languagePatterns = {
        en: ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'is', 'a', 'of', 'to', 'in'],
        es: ['que', 'de', 'no', 'la', 'el', 'en', 'un', 'es', 'se', 'te', 'y', 'por', 'con', 'del', 'los'],
        fr: ['que', 'de', 'et', 'le', 'la', 'les', 'des', 'un', 'une', 'du', 'dans', 'pour', 'avec', 'sur', 'ce'],
        de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'ist', 'ein', 'eine', 'auf', 'für'],
        it: ['che', 'di', 'la', 'il', 'le', 'da', 'un', 'per', 'con', 'del', 'è', 'una', 'in', 'sono', 'alla'],
        pt: ['que', 'de', 'não', 'um', 'da', 'em', 'do', 'se', 'na', 'por', 'é', 'uma', 'para', 'com', 'dos']
      };

      let bestMatch = { language: 'en', confidence: 0 };

      for (const [lang, patterns] of Object.entries(languagePatterns)) {
        let matches = 0;
        for (const pattern of patterns) {
          const regex = new RegExp(`\\b${pattern}\\b`, 'g');
          const occurrences = (text.match(regex) || []).length;
          if (occurrences > 0) matches++;
        }
        
        const confidence = matches / patterns.length;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { language: lang, confidence };
        }
      }

      // Check HTML lang attribute as fallback
      const htmlLang = document.documentElement.lang?.substring(0, 2);
      if (htmlLang && this.SUPPORTED_LANGUAGES.includes(htmlLang) && bestMatch.confidence < 0.5) {
        bestMatch = { language: htmlLang, confidence: 0.8 };
      }

      if (bestMatch.confidence > 0.4) {
        bestMatch.confidence = Math.min(1, bestMatch.confidence + 0.2);
      }

      return {
        language: bestMatch.language,
        confidence: bestMatch.confidence,
        isSupported: this.SUPPORTED_LANGUAGES.includes(bestMatch.language)
      };
    }

    // Helper methods
    extractTextContent(document) {
      const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer', 'aside'];
      const clone = document.cloneNode(true);
      
      elementsToRemove.forEach(tag => {
        const elements = clone.getElementsByTagName(tag);
        Array.from(elements).forEach(el => el.remove());
      });

      const mainContent = clone.querySelector('main, article, .content, .post, .entry') || clone.body;
      return mainContent?.textContent?.trim() || '';
    }

    countWords(text) {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    analyzeStructure(document) {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const paragraphs = document.querySelectorAll('p').length;
      const mainContent = document.querySelector('main, article, .content, .post');
      
      return {
        hasMainContent: !!(mainContent && headings >= 2 && paragraphs >= 3)
      };
    }

    calculateAdRatio(document) {
      const adSelectors = [
        '[class*="ad"]', '[id*="ad"]', '[class*="advertisement"]',
        '[class*="banner"]', '[class*="sponsor"]', '.google-ads',
        'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]'
      ];

      let adElements = 0;
      adSelectors.forEach(selector => {
        adElements += document.querySelectorAll(selector).length;
      });

      const totalElements = document.querySelectorAll('div, section, article').length;
      return totalElements > 0 ? adElements / totalElements : 0;
    }

    isEducationalContent(contentType, document) {
      const educationalTypes = ['article', 'blog', 'news', 'tutorial', 'encyclopedia'];
      
      if (educationalTypes.includes(contentType)) {
        return true;
      }

      const educationalKeywords = [
        'learn', 'education', 'tutorial', 'guide', 'how to', 'explanation',
        'research', 'study', 'analysis', 'academic', 'scientific'
      ];

      const title = document.title.toLowerCase();
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || '';
      
      return educationalKeywords.some(keyword => 
        title.includes(keyword) || metaDescription.includes(keyword)
      );
    }

    hasSocialMediaFeeds(document) {
      const socialFeedSelectors = [
        '[class*="feed"]', '[class*="timeline"]', '[class*="stream"]',
        '[class*="social"]', '[class*="tweet"]', '[class*="post-list"]'
      ];

      return socialFeedSelectors.some(selector => 
        document.querySelectorAll(selector).length > 0
      );
    }

    hasCommentSections(document) {
      const commentSelectors = [
        '[class*="comment"]', '[id*="comment"]', '[class*="discussion"]',
        '.disqus', '#disqus_thread', '[class*="reply"]'
      ];

      return commentSelectors.some(selector => 
        document.querySelectorAll(selector).length > 0
      );
    }

    matchesPattern(pathname, patterns) {
      return patterns.some(pattern => pathname.includes(pattern));
    }

    hasArticleStructure(document) {
      const hasTitle = document.querySelector('h1');
      const hasContent = document.querySelectorAll('p').length >= 3;
      const hasStructure = document.querySelectorAll('h2, h3').length >= 1;
      
      return !!(hasTitle && hasContent && hasStructure);
    }

    isSocialMediaSite(domain) {
      const socialDomains = [
        'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com',
        'reddit.com', 'tiktok.com', 'snapchat.com', 'pinterest.com'
      ];
      
      return socialDomains.some(social => domain.includes(social));
    }

    isEcommerceSite(document) {
      const ecommerceIndicators = [
        '[class*="price"]', '[class*="cart"]', '[class*="buy"]',
        '[class*="product"]', '[class*="shop"]', 'button[class*="add-to-cart"]'
      ];

      return ecommerceIndicators.some(selector => 
        document.querySelectorAll(selector).length > 2
      );
    }

    calculateOverallQualityScore(params) {
      const { wordCount, structure, contentType, advertisingRatio } = params;

      const wordScore = Math.min(1, wordCount / 500);
      const structureScore = structure.hasMainContent ? 0.8 : 0.3;
      
      const educationalTypes = ['article', 'blog', 'news', 'tutorial', 'encyclopedia'];
      const contentTypeScore = educationalTypes.includes(contentType) ? 0.9 : 0.3;
      
      const adScore = Math.max(0, 1 - advertisingRatio * 2);

      return (wordScore * 0.3 + structureScore * 0.3 + contentTypeScore * 0.3 + adScore * 0.1);
    }
  }

  // ExtractButtonIntegration implementation (simplified for content script)
  class ExtractButtonIntegration {
    constructor(config = {}) {
      this.analysisEngine = new ContentAnalysisEngine();
      this.cache = {};
      this.analysisTimeout = null;
      this.domObserver = null;
      this.lastAnalysisTime = 0;
      this.onVisibilityChange = null;

      this.config = {
        analysisThrottleMs: 1000,
        cacheExpiryMs: 5 * 60 * 1000,
        domChangeThreshold: 10,
        enablePerformanceOptimizations: true,
        debugMode: false,
        ...config
      };
    }

    initialize(onVisibilityChange) {
      this.onVisibilityChange = onVisibilityChange;
      
      // Perform initial analysis
      this.performAnalysis('initial_load');
      
      // Set up DOM change monitoring
      this.setupDOMMonitoring();
      
      // Set up page visibility change handling
      this.setupPageVisibilityHandling();
    }

    destroy() {
      if (this.analysisTimeout) {
        clearTimeout(this.analysisTimeout);
        this.analysisTimeout = null;
      }
      
      if (this.domObserver) {
        this.domObserver.disconnect();
        this.domObserver = null;
      }
      
      this.onVisibilityChange = null;
    }

    performAnalysis(trigger, force = false) {
      const now = Date.now();
      const url = window.location.href;
      
      // Check throttling
      if (!force && this.config.enablePerformanceOptimizations) {
        if (now - this.lastAnalysisTime < this.config.analysisThrottleMs) {
          const cached = this.getCachedAnalysis();
          if (cached) {
            return cached;
          }
        }
      }

      // Check cache
      if (!force) {
        const cached = this.cache[url];
        if (cached && this.isCacheValid(cached)) {
          const currentDomHash = this.calculateDOMHash();
          if (cached.domHash === currentDomHash) {
            return cached.decision;
          }
        }
      }

      this.lastAnalysisTime = now;

      try {
        const analysisResult = this.analysisEngine.analyzePageContent();
        const shouldShow = this.analysisEngine.isContentSuitable(analysisResult);
        const reason = this.generateVisibilityReason(analysisResult, shouldShow);
        
        const decision = {
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

        return decision;

      } catch (error) {
        console.error('[ExtractButtonIntegration] Analysis failed:', error);
        
        const fallbackDecision = {
          shouldShow: false,
          reason: `Analysis failed: ${error.message}`,
          contentAnalysis: this.getEmptyAnalysisResult(),
          timestamp: new Date()
        };

        if (this.onVisibilityChange) {
          this.onVisibilityChange(fallbackDecision);
        }

        return fallbackDecision;
      }
    }

    setupDOMMonitoring() {
      if (!this.config.enablePerformanceOptimizations) {
        return;
      }

      let changeCount = 0;
      
      this.domObserver = new MutationObserver((mutations) => {
        const significantChanges = mutations.filter(mutation => {
          if (mutation.type === 'childList') {
            return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
          }
          if (mutation.type === 'attributes') {
            return ['class', 'id', 'style'].includes(mutation.attributeName || '');
          }
          return false;
        });

        changeCount += significantChanges.length;

        if (changeCount >= this.config.domChangeThreshold) {
          changeCount = 0;
          this.scheduleThrottledAnalysis('dom_change');
        }
      });

      this.domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'style']
      });
    }

    setupPageVisibilityHandling() {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          this.scheduleThrottledAnalysis('page_visible');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      window.addEventListener('focus', () => {
        this.scheduleThrottledAnalysis('window_focus');
      });
    }

    scheduleThrottledAnalysis(trigger) {
      if (this.analysisTimeout) {
        clearTimeout(this.analysisTimeout);
      }

      this.analysisTimeout = setTimeout(() => {
        this.performAnalysis(trigger);
        this.analysisTimeout = null;
      }, this.config.analysisThrottleMs);
    }

    getCachedAnalysis() {
      const url = window.location.href;
      const cached = this.cache[url];
      
      if (cached && this.isCacheValid(cached)) {
        return cached.decision;
      }
      
      return null;
    }

    isCacheValid(cached) {
      const now = Date.now();
      return (now - cached.timestamp) < this.config.cacheExpiryMs;
    }

    calculateDOMHash() {
      const mainContent = document.querySelector('main, article, .content, .post') || document.body;
      const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const paragraphs = mainContent.querySelectorAll('p').length;
      const images = mainContent.querySelectorAll('img').length;
      const links = mainContent.querySelectorAll('a').length;
      
      return `${headings}-${paragraphs}-${images}-${links}-${mainContent.children.length}`;
    }

    generateVisibilityReason(analysis, shouldShow) {
      if (shouldShow) {
        return `Button shown: ${analysis.wordCount} words, ${analysis.contentType} content, quality score ${analysis.qualityScore.toFixed(2)}`;
      }

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

      return 'Button hidden: Content does not meet suitability criteria';
    }

    getEmptyAnalysisResult() {
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

  // Make classes available globally for content.js
  window.ExtractButtonIntegration = ExtractButtonIntegration;
  window.ContentAnalysisEngine = ContentAnalysisEngine;

  console.log('[LinguaSpark] Integration classes loaded');
})();