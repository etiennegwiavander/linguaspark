/**
 * Content Validation Engine for Extract from Page Button
 * Validates extracted content quality and provides detailed error classification
 */

export interface ValidationResult {
  isValid: boolean;
  meetsMinimumQuality: boolean;
  issues: ValidationIssue[];
  warnings: string[];
  recommendations: string[];
  score: number; // 0-100 quality score
}

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
  severity: 'error' | 'warning';
  suggestedAction: string;
  recoverable: boolean;
}

export type ValidationIssueType = 
  | 'insufficient_content'
  | 'poor_quality'
  | 'unsupported_language'
  | 'extraction_failed'
  | 'no_main_content'
  | 'too_much_advertising'
  | 'social_media_content'
  | 'navigation_only'
  | 'low_readability';

export interface ContentQualityMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readabilityScore: number;
  advertisingRatio: number;
  structureScore: number;
  languageConfidence: number;
  educationalValue: number;
}

export interface ValidationConfig {
  minWordCount: number;
  minQualityScore: number;
  maxAdvertisingRatio: number;
  minLanguageConfidence: number;
  supportedLanguages: string[];
  strictMode: boolean;
}

export class ContentValidationEngine {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      minWordCount: 200,
      minQualityScore: 60,
      maxAdvertisingRatio: 0.3,
      minLanguageConfidence: 0.8,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'],
      strictMode: false,
      ...config
    };
  }

  /**
   * Validates extracted content and returns detailed validation result
   */
  async validateContent(
    content: string,
    metadata?: {
      title?: string;
      url?: string;
      contentType?: string;
      language?: string;
      languageConfidence?: number;
    }
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Calculate quality metrics
    const metrics = this.calculateQualityMetrics(content, metadata);

    // Validate content length
    this.validateContentLength(content, metrics, issues, recommendations);

    // Validate language support (only if metadata provided)
    if (metadata) {
      this.validateLanguageSupport(metadata, issues, recommendations);
    }

    // Validate content quality
    this.validateContentQuality(metrics, issues, warnings, recommendations);

    // Validate content structure
    this.validateContentStructure(content, metrics, issues, warnings, recommendations);

    // Calculate overall validation score
    const score = this.calculateValidationScore(metrics, issues);

    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;
    const meetsMinimumQuality = score >= this.config.minQualityScore;

    return {
      isValid,
      meetsMinimumQuality,
      issues,
      warnings,
      recommendations,
      score
    };
  }

  private calculateQualityMetrics(
    content: string,
    metadata?: {
      title?: string;
      url?: string;
      contentType?: string;
      language?: string;
      languageConfidence?: number;
    }
  ): ContentQualityMetrics {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      readabilityScore: this.calculateReadabilityScore(content),
      advertisingRatio: this.estimateAdvertisingRatio(content),
      structureScore: this.calculateStructureScore(content),
      languageConfidence: metadata?.languageConfidence || 0,
      educationalValue: this.assessEducationalValue(content, metadata)
    };
  }

  private validateContentLength(
    content: string,
    metrics: ContentQualityMetrics,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    if (metrics.wordCount < this.config.minWordCount) {
      issues.push({
        type: 'insufficient_content',
        message: `Content is too short (${metrics.wordCount} words). Minimum ${this.config.minWordCount} words required for quality lesson generation.`,
        severity: 'error',
        suggestedAction: 'Try selecting a longer article or manually select additional text from the page.',
        recoverable: true
      });
      
      recommendations.push('Look for longer articles, blog posts, or news stories');
      recommendations.push('Consider combining multiple short sections of content');
    } else if (metrics.wordCount < this.config.minWordCount * 1.5) {
      recommendations.push('Content is on the shorter side. Consider finding additional related content for a more comprehensive lesson.');
    }
  }

  private validateContentQuality(
    metrics: ContentQualityMetrics,
    issues: ValidationIssue[],
    warnings: string[],
    recommendations: string[]
  ): void {
    // Check advertising ratio
    if (metrics.advertisingRatio > this.config.maxAdvertisingRatio) {
      issues.push({
        type: 'too_much_advertising',
        message: 'This page contains too much advertising or promotional content for quality lesson generation.',
        severity: 'error',
        suggestedAction: 'Try finding content from educational or news sources with less advertising.',
        recoverable: true
      });
    }

    // Check readability
    if (metrics.readabilityScore < 30) {
      issues.push({
        type: 'low_readability',
        message: 'Content appears to have very low readability, which may not be suitable for language learning.',
        severity: 'warning',
        suggestedAction: 'Consider finding content with clearer, more structured writing.',
        recoverable: true
      });
    } else if (metrics.readabilityScore < 50) {
      warnings.push('Content readability is below average. Consider finding clearer, more structured content.');
    }

    // Check structure
    if (metrics.structureScore < 40) {
      warnings.push('Content lacks clear structure. Look for articles with headings, paragraphs, and organized sections.');
      recommendations.push('Educational articles, news stories, and blog posts typically have better structure');
    }

    // Check educational value
    if (metrics.educationalValue < 50) {
      warnings.push('Content may have limited educational value for language learning.');
      recommendations.push('Look for informative articles, tutorials, or educational content');
    }
  }

  private validateLanguageSupport(
    metadata: {
      language?: string;
      languageConfidence?: number;
    } | undefined,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    if (!metadata?.language) {
      issues.push({
        type: 'unsupported_language',
        message: 'Could not detect the language of this content.',
        severity: 'error',
        suggestedAction: 'Try content in a clearly supported language (English, Spanish, French, German, etc.).',
        recoverable: true
      });
      return;
    }

    if (!this.config.supportedLanguages.includes(metadata.language)) {
      issues.push({
        type: 'unsupported_language',
        message: `Language "${metadata.language}" is not currently supported for lesson generation.`,
        severity: 'error',
        suggestedAction: `Try content in one of these supported languages: ${this.config.supportedLanguages.join(', ')}.`,
        recoverable: true
      });
      return;
    }

    if (metadata.languageConfidence < this.config.minLanguageConfidence) {
      issues.push({
        type: 'unsupported_language',
        message: 'Language detection confidence is too low. The content may be mixed-language or unclear.',
        severity: 'warning',
        suggestedAction: 'Try content that is clearly written in a single supported language.',
        recoverable: true
      });
    }
  }

  private validateContentStructure(
    content: string,
    metrics: ContentQualityMetrics,
    issues: ValidationIssue[],
    warnings: string[],
    recommendations: string[]
  ): void {
    // Check for main content indicators (only if very short)
    if (metrics.paragraphCount < 1 && metrics.wordCount < 50) {
      issues.push({
        type: 'no_main_content',
        message: 'Content appears to lack substantial paragraphs or main content.',
        severity: 'error',
        suggestedAction: 'Try extracting from the main article area or select content manually.',
        recoverable: true
      });
    }

    // Check sentence structure
    if (metrics.sentenceCount < 3 && metrics.wordCount > 100) {
      warnings.push('Content has very few sentences. Consider finding more substantial content.');
    }

    // Check for social media patterns
    if (this.detectSocialMediaContent(content)) {
      issues.push({
        type: 'social_media_content',
        message: 'Content appears to be from social media feeds or comments, which are not suitable for lessons.',
        severity: 'error',
        suggestedAction: 'Try extracting from articles, blogs, or news content instead of social media.',
        recoverable: true
      });
    }

    // Check for navigation-only content
    if (this.detectNavigationContent(content)) {
      issues.push({
        type: 'navigation_only',
        message: 'Content appears to be primarily navigation links or menu items.',
        severity: 'error',
        suggestedAction: 'Try selecting the main article content instead of navigation areas.',
        recoverable: true
      });
    }
  }

  private calculateValidationScore(metrics: ContentQualityMetrics, issues: ValidationIssue[]): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      if (issue.severity === 'error') {
        score -= 30;
      } else if (issue.severity === 'warning') {
        score -= 15;
      }
    });

    // If there are no errors, factor in quality metrics more generously
    if (issues.filter(i => i.severity === 'error').length === 0) {
      // Base score on metrics but don't be too harsh
      const readabilityFactor = Math.max(0.6, metrics.readabilityScore / 100);
      const structureFactor = Math.max(0.7, metrics.structureScore / 100);
      const educationalFactor = Math.max(0.6, metrics.educationalValue / 100);
      const languageFactor = Math.max(0.8, metrics.languageConfidence);

      score *= readabilityFactor * structureFactor * educationalFactor * languageFactor;

      // Bonus for good length
      if (metrics.wordCount > this.config.minWordCount * 2) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified readability calculation
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Ideal range is 15-20 words per sentence
    let score = 100;
    if (avgWordsPerSentence > 25) {
      score -= (avgWordsPerSentence - 25) * 2;
    } else if (avgWordsPerSentence < 10) {
      score -= (10 - avgWordsPerSentence) * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  private estimateAdvertisingRatio(content: string): number {
    const adKeywords = [
      'advertisement', 'sponsored', 'buy now', 'click here', 'subscribe',
      'sale', 'discount', 'offer', 'deal', 'promotion', 'affiliate',
      'buy', 'purchase', 'order', 'shop', 'cart', 'checkout'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    let adWordCount = 0;
    
    words.forEach(word => {
      adKeywords.forEach(keyword => {
        if (word.includes(keyword)) {
          adWordCount++;
        }
      });
    });
    
    return words.length > 0 ? adWordCount / words.length : 0;
  }

  private calculateStructureScore(content: string): number {
    let score = 0;
    
    // Check for headings (markdown or HTML-like patterns)
    if (/^#+\s|\n#+\s|<h[1-6]>/m.test(content)) {
      score += 30;
    }
    
    // Check for lists
    if (/^\s*[-*+]\s|^\s*\d+\.\s/m.test(content)) {
      score += 20;
    }
    
    // Check for paragraphs
    const paragraphs = content.split(/\n\s*\n/).length;
    if (paragraphs > 2) {
      score += 30;
    }
    
    // Check for quotes or emphasis
    if (/["'].*["']|_.*_|\*.*\*/.test(content)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private assessEducationalValue(content: string, metadata?: { contentType?: string; url?: string }): number {
    let score = 50; // Base score
    
    // Check content type
    if (metadata?.contentType) {
      const educationalTypes = ['article', 'blog', 'news', 'tutorial', 'encyclopedia'];
      if (educationalTypes.includes(metadata.contentType)) {
        score += 30;
      }
    }
    
    // Check URL patterns
    if (metadata?.url) {
      const educationalDomains = [
        'wikipedia', 'edu', 'bbc', 'cnn', 'reuters', 'guardian',
        'medium', 'blog', 'news', 'article', 'tutorial'
      ];
      if (educationalDomains.some(domain => metadata.url!.includes(domain))) {
        score += 20;
      }
    }
    
    // Check for educational keywords
    const educationalKeywords = [
      'learn', 'understand', 'explain', 'research', 'study', 'analysis',
      'history', 'science', 'culture', 'education', 'knowledge'
    ];
    const words = content.toLowerCase().split(/\s+/);
    const educationalWords = words.filter(word =>
      educationalKeywords.some(keyword => word.includes(keyword))
    );
    
    if (educationalWords.length > words.length * 0.02) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private detectSocialMediaContent(content: string): boolean {
    const socialPatterns = [
      /@\w+/, // Mentions
      /#\w+/, // Hashtags
      /\d+\s*(likes?|shares?|comments?|retweets?)/, // Social metrics
      /posted\s+\d+\s+(minutes?|hours?|days?)\s+ago/, // Timestamps
      /reply|retweet|share|like this/i // Social actions
    ];
    
    return socialPatterns.some(pattern => pattern.test(content));
  }

  private detectNavigationContent(content: string): boolean {
    const navPatterns = [
      /^(home|about|contact|menu|navigation|sitemap)$/im,
      /^(next|previous|back|forward|skip)$/im,
      /^\s*(›|»|>|→)\s*$/m, // Navigation arrows
      /^(page\s+\d+|more|load more|see all)$/im
    ];
    
    const lines = content.split('\n').map(line => line.trim());
    const navLines = lines.filter(line => 
      navPatterns.some(pattern => pattern.test(line))
    );
    
    // If more than 50% of lines are navigation, it's likely nav content
    return navLines.length > lines.length * 0.5;
  }

  /**
   * Get user-friendly error message for validation issues
   */
  getErrorMessage(issues: ValidationIssue[]): string {
    const errors = issues.filter(issue => issue.severity === 'error');
    
    if (errors.length === 0) {
      return '';
    }
    
    if (errors.length === 1) {
      return errors[0].message;
    }
    
    return `Multiple issues found: ${errors.map(e => e.message).join(' ')}`;
  }

  /**
   * Get actionable recovery suggestions
   */
  getRecoveryOptions(issues: ValidationIssue[]): string[] {
    const recoverableIssues = issues.filter(issue => issue.recoverable);
    const suggestions = new Set<string>();
    
    recoverableIssues.forEach(issue => {
      suggestions.add(issue.suggestedAction);
    });
    
    // Add general fallback options
    suggestions.add('Try manually selecting text from the main article area');
    suggestions.add('Copy and paste content directly into the lesson generator');
    suggestions.add('Look for content on educational or news websites');
    
    return Array.from(suggestions);
  }
}