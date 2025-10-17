/**
 * Content Analysis Engine for Extract from Page Button Feature
 * 
 * Analyzes webpage content to determine if the extract button should be displayed.
 * Implements intelligent content detection, quality scoring, and language detection.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface ContentAnalysisResult {
  wordCount: number;
  contentType: ContentType;
  language: string;
  languageConfidence: number;
  qualityScore: number;
  hasMainContent: boolean;
  isEducational: boolean;
  advertisingRatio: number;
  hasSocialMediaFeeds: boolean;
  hasCommentSections: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  isSupported: boolean;
}

export interface QualityScore {
  readability: number;
  structure: number;
  length: number;
  overall: number;
}

export type ContentType = 
  | 'article' 
  | 'blog' 
  | 'news' 
  | 'tutorial' 
  | 'encyclopedia' 
  | 'product' 
  | 'social' 
  | 'navigation' 
  | 'ecommerce' 
  | 'multimedia' 
  | 'other';

export class ContentAnalysisEngine {
  private readonly MINIMUM_WORD_COUNT = 200; // Requirement 2.3
  private readonly SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'];
  private readonly EDUCATIONAL_DOMAINS = [
    'wikipedia.org', 'britannica.com', 'khanacademy.org', 'coursera.org',
    'edx.org', 'mit.edu', 'stanford.edu', 'harvard.edu', 'bbc.com/news',
    'cnn.com', 'reuters.com', 'npr.org', 'medium.com', 'dev.to',
    'stackoverflow.com', 'github.com', 'mozilla.org', 'w3schools.com'
  ];

  /**
   * Analyzes the current page content and returns analysis results
   * Requirement 2.1: Detect educational content (articles, blogs, news, tutorials)
   */
  public analyzePageContent(): ContentAnalysisResult {
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

  /**
   * Determines if content is suitable for lesson generation
   * Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  public isContentSuitable(analysis: ContentAnalysisResult): boolean {
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
    const excludedTypes: ContentType[] = ['product', 'social', 'navigation', 'ecommerce', 'multimedia'];
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

  /**
   * Detects the primary content type of the webpage
   * Requirement 2.1: Content type classification
   */
  public detectContentType(document: Document): ContentType {
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

    // Structured data analysis
    const jsonLd = this.extractJsonLd(document);
    if (jsonLd) {
      if (jsonLd['@type'] === 'Article' || jsonLd['@type'] === 'NewsArticle') {
        return 'article';
      }
      if (jsonLd['@type'] === 'BlogPosting') {
        return 'blog';
      }
      if (jsonLd['@type'] === 'Product') {
        return 'product';
      }
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

  /**
   * Calculates content quality score based on multiple factors
   */
  public calculateContentQuality(content: string): QualityScore {
    const wordCount = this.countWords(content);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Readability score (simplified)
    const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
    const readability = Math.min(1, Math.max(0, 1 - Math.abs(avgWordsPerSentence - 15) / 15));

    // Structure score
    const hasGoodStructure = paragraphs.length >= 3 && avgWordsPerSentence > 5 && avgWordsPerSentence < 30;
    const structure = hasGoodStructure ? 0.8 : 0.4;

    // Length score
    const lengthScore = Math.min(1, wordCount / 500); // Optimal around 500+ words

    // Overall score
    const overall = (readability * 0.3 + structure * 0.4 + lengthScore * 0.3);

    return {
      readability,
      structure,
      length: lengthScore,
      overall
    };
  }

  /**
   * Detects the primary language of the content
   * Requirement 2.4: Language detection
   */
  public detectLanguage(content: string): LanguageDetectionResult {
    // Simple language detection based on common words and patterns
    const text = content.toLowerCase().substring(0, 1000); // Sample first 1000 chars
    
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
        // Count occurrences of each pattern
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

    // Only boost confidence if it's clearly the dominant language
    if (bestMatch.confidence > 0.4) {
      bestMatch.confidence = Math.min(1, bestMatch.confidence + 0.2);
    }

    return {
      language: bestMatch.language,
      confidence: bestMatch.confidence,
      isSupported: this.SUPPORTED_LANGUAGES.includes(bestMatch.language)
    };
  }

  /**
   * Excludes social media content from analysis
   * Requirement 2.5: Exclude social media feeds and comment sections
   */
  public excludeSocialMediaContent(content: string): boolean {
    const socialMediaIndicators = [
      'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com',
      'linkedin.com', 'reddit.com', 'youtube.com', 'snapchat.com'
    ];

    const domain = window.location.hostname;
    return socialMediaIndicators.some(indicator => domain.includes(indicator));
  }

  // Private helper methods

  private extractTextContent(document: Document): string {
    // Remove script, style, and other non-content elements
    const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer', 'aside'];
    const clone = document.cloneNode(true) as Document;
    
    elementsToRemove.forEach(tag => {
      const elements = clone.getElementsByTagName(tag);
      Array.from(elements).forEach(el => el.remove());
    });

    // Try to find main content area
    const mainContent = clone.querySelector('main, article, .content, .post, .entry') || clone.body;
    return mainContent?.textContent?.trim() || '';
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private analyzeStructure(document: Document): { hasMainContent: boolean } {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const paragraphs = document.querySelectorAll('p').length;
    const mainContent = document.querySelector('main, article, .content, .post');
    
    return {
      hasMainContent: !!(mainContent && headings >= 2 && paragraphs >= 3)
    };
  }

  private calculateAdRatio(document: Document): number {
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

  private isEducationalContent(contentType: ContentType, document: Document): boolean {
    const educationalTypes: ContentType[] = ['article', 'blog', 'news', 'tutorial', 'encyclopedia'];
    
    if (educationalTypes.includes(contentType)) {
      return true;
    }

    // Check for educational indicators in content
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

  private hasSocialMediaFeeds(document: Document): boolean {
    const socialFeedSelectors = [
      '[class*="feed"]', '[class*="timeline"]', '[class*="stream"]',
      '[class*="social"]', '[class*="tweet"]', '[class*="post-list"]'
    ];

    return socialFeedSelectors.some(selector => 
      document.querySelectorAll(selector).length > 0
    );
  }

  private hasCommentSections(document: Document): boolean {
    const commentSelectors = [
      '[class*="comment"]', '[id*="comment"]', '[class*="discussion"]',
      '.disqus', '#disqus_thread', '[class*="reply"]'
    ];

    return commentSelectors.some(selector => 
      document.querySelectorAll(selector).length > 0
    );
  }

  private matchesPattern(pathname: string, patterns: string[]): boolean {
    return patterns.some(pattern => pathname.includes(pattern));
  }

  private extractJsonLd(document: Document): any {
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript?.textContent) {
      try {
        return JSON.parse(jsonLdScript.textContent);
      } catch {
        return null;
      }
    }
    return null;
  }

  private hasArticleStructure(document: Document): boolean {
    const hasTitle = document.querySelector('h1');
    const hasContent = document.querySelectorAll('p').length >= 3;
    const hasStructure = document.querySelectorAll('h2, h3').length >= 1;
    
    return !!(hasTitle && hasContent && hasStructure);
  }

  private isSocialMediaSite(domain: string): boolean {
    const socialDomains = [
      'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com',
      'reddit.com', 'tiktok.com', 'snapchat.com', 'pinterest.com'
    ];
    
    return socialDomains.some(social => domain.includes(social));
  }

  private isEcommerceSite(document: Document): boolean {
    const ecommerceIndicators = [
      '[class*="price"]', '[class*="cart"]', '[class*="buy"]',
      '[class*="product"]', '[class*="shop"]', 'button[class*="add-to-cart"]'
    ];

    return ecommerceIndicators.some(selector => 
      document.querySelectorAll(selector).length > 2
    );
  }

  private calculateOverallQualityScore(params: {
    wordCount: number;
    structure: { hasMainContent: boolean };
    contentType: ContentType;
    advertisingRatio: number;
  }): number {
    const { wordCount, structure, contentType, advertisingRatio } = params;

    // Word count score (0-1)
    const wordScore = Math.min(1, wordCount / 500); // Optimal around 500+ words

    // Structure score (0-1)
    const structureScore = structure.hasMainContent ? 0.8 : 0.3;

    // Content type score (0-1)
    const educationalTypes: ContentType[] = ['article', 'blog', 'news', 'tutorial', 'encyclopedia'];
    const contentTypeScore = educationalTypes.includes(contentType) ? 0.9 : 0.3;

    // Advertising penalty (0-1, where 1 is no ads)
    const adScore = Math.max(0, 1 - advertisingRatio * 2);

    // Weighted average
    return (wordScore * 0.3 + structureScore * 0.3 + contentTypeScore * 0.3 + adScore * 0.1);
  }
}