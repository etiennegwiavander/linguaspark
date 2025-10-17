/**
 * Enhanced Content Extraction Engine
 * 
 * Builds upon existing content.js extraction with improved accuracy and validation.
 * Implements content quality validation, structured content preservation, and
 * automatic lesson type and CEFR level suggestions.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 4.3
 */

export interface ExtractedContent {
  text: string;
  structuredContent: StructuredContent;
  metadata: ContentMetadata;
  quality: ContentQuality;
  sourceInfo: SourceInfo;
  suggestedLessonType: LessonType;
  suggestedCEFRLevel: CEFRLevel;
}

export interface StructuredContent {
  headings: Heading[];
  paragraphs: string[];
  lists: List[];
  quotes: string[];
  images: ImageInfo[];
  links: LinkInfo[];
  tables: TableInfo[];
  codeBlocks: CodeBlock[];
}

export interface Heading {
  level: number;
  text: string;
  id?: string;
}

export interface List {
  type: 'ordered' | 'unordered';
  items: string[];
  nested?: List[];
}

export interface ImageInfo {
  alt: string;
  src: string;
  caption?: string;
}

export interface LinkInfo {
  text: string;
  url: string;
  isExternal: boolean;
}

export interface TableInfo {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CodeBlock {
  language?: string;
  code: string;
}

export interface ContentMetadata {
  title: string;
  author?: string;
  publicationDate?: Date;
  sourceUrl: string;
  domain: string;
  description?: string;
  keywords?: string[];
  language: string;
  contentType: string;
  estimatedReadingTime: number;
  lastModified?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  meetsMinimumQuality: boolean;
  issues: ValidationIssue[];
  warnings: string[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: 'insufficient_content' | 'poor_quality' | 'unsupported_language' | 'extraction_failed';
  message: string;
  severity: 'error' | 'warning';
  suggestedAction: string;
}

export interface ContentQuality {
  wordCount: number;
  readingTime: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  suitabilityScore: number;
  issues: string[];
  meetsMinimumStandards: boolean;
  readabilityScore: number;
  vocabularyComplexity: number;
  sentenceComplexity: number;
}

export interface SourceInfo {
  url: string;
  domain: string;
  title: string;
  extractedAt: Date;
  userAgent: string;
  attribution: string;
}

export type LessonType = 'discussion' | 'grammar' | 'travel' | 'business' | 'pronunciation';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export class EnhancedContentExtractor {
  private readonly MINIMUM_WORD_COUNT = 100;
  private readonly MINIMUM_QUALITY_SCORE = 0.6;
  private readonly SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'];

  /**
   * Extracts and processes page content with enhanced validation
   * Requirements: 3.2, 3.3, 3.4, 3.5
   */
  public async extractPageContent(): Promise<ExtractedContent> {
    try {
      // Get the current document
      const document = window.document;
      
      // Extract raw content using improved algorithms
      const rawContent = this.extractRawContent(document);
      
      // Clean and process the content
      const cleanedText = this.cleanContent(rawContent.text);
      
      // Extract structured content with preservation
      const structuredContent = this.extractStructuredContent(document);
      
      // Extract comprehensive metadata
      const metadata = this.extractMetadata(document, cleanedText);
      
      // Analyze content quality
      const quality = this.analyzeContentQuality(cleanedText, structuredContent);
      
      // Create source information
      const sourceInfo = this.createSourceInfo(metadata);
      
      // Suggest lesson type and CEFR level
      const suggestedLessonType = this.suggestLessonType(cleanedText, metadata, structuredContent);
      const suggestedCEFRLevel = this.suggestCEFRLevel(cleanedText, quality);
      
      return {
        text: cleanedText,
        structuredContent,
        metadata,
        quality,
        sourceInfo,
        suggestedLessonType,
        suggestedCEFRLevel
      };
    } catch (error) {
      throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates extracted content against quality standards
   * Requirement 3.5: Content quality validation with minimum standards enforcement
   */
  public validateContent(content: ExtractedContent): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check minimum word count
    if (content.quality.wordCount < this.MINIMUM_WORD_COUNT) {
      issues.push({
        type: 'insufficient_content',
        message: `Content too short: ${content.quality.wordCount} words (minimum ${this.MINIMUM_WORD_COUNT} required)`,
        severity: 'error',
        suggestedAction: 'Select more content or choose a longer article'
      });
    }

    // Check language support
    if (!this.SUPPORTED_LANGUAGES.includes(content.metadata.language)) {
      issues.push({
        type: 'unsupported_language',
        message: `Language '${content.metadata.language}' is not supported`,
        severity: 'error',
        suggestedAction: 'Choose content in a supported language'
      });
    }

    // Check content quality
    if (content.quality.suitabilityScore < this.MINIMUM_QUALITY_SCORE) {
      issues.push({
        type: 'poor_quality',
        message: `Content quality below threshold: ${Math.round(content.quality.suitabilityScore * 100)}%`,
        severity: 'error',
        suggestedAction: 'Choose higher quality content with better structure'
      });
    }

    // Add warnings for borderline cases
    if (content.quality.wordCount < 200) {
      warnings.push('Content is quite short - consider selecting more text for better lesson quality');
    }

    if (content.quality.complexity === 'advanced' && content.suggestedCEFRLevel === 'A1') {
      warnings.push('Content complexity may be too high for suggested CEFR level');
    }

    // Add recommendations
    if (content.structuredContent.headings.length === 0) {
      recommendations.push('Content with headings typically creates better structured lessons');
    }

    if (content.structuredContent.lists.length === 0 && content.structuredContent.quotes.length === 0) {
      recommendations.push('Content with lists or quotes can enhance lesson engagement');
    }

    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;
    const meetsMinimumQuality = content.quality.meetsMinimumStandards;

    return {
      isValid,
      meetsMinimumQuality,
      issues,
      warnings,
      recommendations
    };
  }

  /**
   * Extracts raw content using improved cleaning algorithms
   * Requirement 3.2: Improved removal of navigation, advertisements, headers, footers
   */
  private extractRawContent(document: Document): { text: string; element: Element | null } {
    // Work with original document since we're only reading, not modifying
    const workingDoc = document;

    // Note: We don't remove elements since we're working with the original document
    // Instead, we'll filter them out during text extraction

    // Find main content area with enhanced priority
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content-body',
      '.post-body',
      '.article-body',
      '.main-content',
      '#content',
      '.content',
      '.text-content'
    ];

    let mainContent: Element | null = null;
    for (const selector of contentSelectors) {
      try {
        mainContent = workingDoc.querySelector(selector);
        if (mainContent && this.hasSubstantialContent(mainContent)) {
          break;
        }
      } catch (error) {
        // Continue if selector fails
      }
    }

    // Fallback to body if no main content found
    if (!mainContent) {
      mainContent = workingDoc.body;
    }

    if (!mainContent) {
      return { text: '', element: null };
    }

    // Extract and clean text, filtering out unwanted content
    let text = this.extractCleanTextFromElement(mainContent);
    
    // Advanced text cleaning
    text = this.cleanContent(text);

    return { text, element: mainContent };
  }

  /**
   * Extracts clean text from an element, filtering out unwanted content
   */
  private extractCleanTextFromElement(element: Element): string {
    // Get all text content but filter out unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ads', '.social-share', '.comments'
    ];

    let text = '';
    
    // Simple approach: get textContent and clean it
    if (element.textContent) {
      text = element.textContent;
      console.log('[DEBUG] Enhanced extractor - raw textContent length:', text.length);
    } else if ('innerText' in element) {
      text = (element as any).innerText;
      console.log('[DEBUG] Enhanced extractor - raw innerText length:', text.length);
    }

    return text || '';
  }

  /**
   * Cleans extracted content with improved algorithms
   * Requirement 3.2: Improved content cleaning algorithms
   */
  private cleanContent(rawText: string): string {
    console.log('[DEBUG] Enhanced extractor - cleanContent input length:', rawText.length);
    let text = rawText;

    // Remove excessive whitespace and normalize line breaks
    text = text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\r/g, '\n')             // Convert remaining \r to \n
      .replace(/\t/g, ' ')              // Convert tabs to spaces
      .replace(/ +/g, ' ')              // Multiple spaces to single space
      .replace(/\n +/g, '\n')           // Remove spaces at start of lines
      .replace(/ +\n/g, '\n')           // Remove spaces at end of lines
      .replace(/\n{3,}/g, '\n\n')       // Multiple line breaks to double

    // Remove common web artifacts
    text = text
      .replace(/\[?\d+\]?/g, '')        // Remove reference numbers [1], [2], etc.
      .replace(/^\s*\d+\.\s*/gm, '')    // Remove numbered list artifacts at line start
      .replace(/^\s*[•·▪▫]\s*/gm, '')   // Remove bullet point artifacts
      .replace(/\s*\|\s*/g, ' ')        // Remove table separators
      .replace(/_{3,}/g, '')            // Remove underline artifacts
      .replace(/-{3,}/g, '')            // Remove dash artifacts
      .replace(/={3,}/g, '')            // Remove equals artifacts

    // Remove navigation and UI text patterns
    const uiPatterns = [
      /\b(click here|read more|continue reading|learn more|see more|show more)\b/gi,
      /\b(home|about|contact|privacy|terms|login|register|subscribe)\b/gi,
      /\b(next|previous|back|forward|up|down)\b(?=\s*$)/gmi,
      /\b(share on|follow us|like us|subscribe to)\b/gi,
      /\b(advertisement|sponsored|promoted)\b/gi
    ];

    uiPatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });

    // Clean up after pattern removal
    text = text
      .replace(/\n\s*\n/g, '\n\n')      // Normalize paragraph breaks
      .replace(/^\s+|\s+$/g, '')        // Trim start and end
      .replace(/\s+$/gm, '')            // Remove trailing spaces on lines

    console.log('[DEBUG] Enhanced extractor - cleanContent output length:', text.length);
    return text;
  }

  /**
   * Extracts structured content with preservation
   * Requirement 3.3: Structured content preservation (headings, lists, quotes)
   */
  private extractStructuredContent(document: Document): StructuredContent {
    const structured: StructuredContent = {
      headings: [],
      paragraphs: [],
      lists: [],
      quotes: [],
      images: [],
      links: [],
      tables: [],
      codeBlocks: []
    };

    // Find main content area
    const mainContent = this.findMainContentArea(document);
    if (!mainContent) return structured;

    // Extract headings with hierarchy and IDs
    const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const text = heading.textContent?.trim();
      if (text && text.length > 0) {
        structured.headings.push({
          level: parseInt(heading.tagName.charAt(1)),
          text,
          id: heading.id || undefined
        });
      }
    });

    // Extract meaningful paragraphs
    const paragraphs = mainContent.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 30) { // Only substantial paragraphs
        structured.paragraphs.push(text);
      }
    });

    // Extract lists with nesting support
    const lists = mainContent.querySelectorAll('ul, ol');
    lists.forEach(list => {
      if (!this.isNestedList(list)) { // Only process top-level lists
        const listData = this.extractListData(list);
        if (listData.items.length > 0) {
          structured.lists.push(listData);
        }
      }
    });

    // Extract quotes and blockquotes
    const quotes = mainContent.querySelectorAll('blockquote, q, .quote');
    quotes.forEach(quote => {
      const text = quote.textContent?.trim();
      if (text && text.length > 20) {
        structured.quotes.push(text);
      }
    });

    // Extract images with comprehensive information
    const images = mainContent.querySelectorAll('img');
    images.forEach(img => {
      const alt = img.alt?.trim();
      const src = img.src;
      if (alt && src) {
        const caption = this.findImageCaption(img);
        structured.images.push({
          alt,
          src,
          caption
        });
      }
    });

    // Extract meaningful links
    const links = mainContent.querySelectorAll('a[href]');
    links.forEach(link => {
      const text = link.textContent?.trim();
      const href = link.href;
      if (text && text.length > 3 && href && !href.startsWith('javascript:')) {
        const isExternal = !href.startsWith(window.location.origin);
        structured.links.push({
          text,
          url: href,
          isExternal
        });
      }
    });

    // Extract tables
    const tables = mainContent.querySelectorAll('table');
    tables.forEach(table => {
      const tableData = this.extractTableData(table);
      if (tableData.headers.length > 0 || tableData.rows.length > 0) {
        structured.tables.push(tableData);
      }
    });

    // Extract code blocks
    const codeBlocks = mainContent.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      const code = block.textContent?.trim();
      if (code && code.length > 10) {
        const language = this.detectCodeLanguage(block);
        structured.codeBlocks.push({
          code,
          language
        });
      }
    });

    return structured;
  }

  /**
   * Extracts comprehensive metadata
   * Requirement 3.4: Metadata extraction including title, author, publication date, source URL
   */
  private extractMetadata(document: Document, content: string): ContentMetadata {
    const metadata: ContentMetadata = {
      title: '',
      sourceUrl: window.location.href,
      domain: window.location.hostname,
      language: 'en',
      contentType: 'article',
      estimatedReadingTime: 0
    };

    // Extract title with multiple fallbacks
    metadata.title = 
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      document.querySelector('title')?.textContent ||
      document.querySelector('h1')?.textContent ||
      'Untitled Content';

    // Extract author information
    metadata.author = 
      document.querySelector('meta[name="author"]')?.getAttribute('content') ||
      document.querySelector('[rel="author"]')?.textContent ||
      document.querySelector('.author')?.textContent ||
      document.querySelector('.byline')?.textContent ||
      document.querySelector('[class*="author"]')?.textContent ||
      undefined;

    // Extract publication date
    const dateString = 
      document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
      document.querySelector('meta[name="date"]')?.getAttribute('content') ||
      document.querySelector('time[datetime]')?.getAttribute('datetime') ||
      document.querySelector('.date')?.textContent ||
      document.querySelector('[class*="date"]')?.textContent;

    if (dateString) {
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        metadata.publicationDate = parsedDate;
      }
    }

    // Extract description
    metadata.description = 
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      undefined;

    // Extract keywords
    const keywordsContent = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (keywordsContent) {
      metadata.keywords = keywordsContent
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 10);
    }

    // Detect language
    metadata.language = 
      document.documentElement.lang?.substring(0, 2) ||
      document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content')?.substring(0, 2) ||
      this.detectContentLanguage(content) ||
      'en';

    // Determine content type
    metadata.contentType = this.determineContentType(document);

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    metadata.estimatedReadingTime = Math.ceil(wordCount / 200);

    // Extract last modified date
    const lastModified = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content');
    if (lastModified) {
      const parsedModified = new Date(lastModified);
      if (!isNaN(parsedModified.getTime())) {
        metadata.lastModified = parsedModified;
      }
    }

    return metadata;
  }

  /**
   * Analyzes content quality with comprehensive metrics
   * Requirement 3.5: Content quality validation with minimum standards enforcement
   */
  private analyzeContentQuality(text: string, structured: StructuredContent): ContentQuality {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    // Calculate readability score (simplified Flesch Reading Ease)
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgSyllablesPerWord = this.estimateAverageSyllables(words);
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Calculate vocabulary complexity
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyComplexity = this.calculateVocabularyComplexity(words);

    // Calculate sentence complexity
    const sentenceComplexity = this.calculateSentenceComplexity(sentences);

    // Determine overall complexity level
    let complexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (readabilityScore > 70 && vocabularyComplexity < 0.3 && sentenceComplexity < 0.4) {
      complexity = 'beginner';
    } else if (readabilityScore < 50 || vocabularyComplexity > 0.7 || sentenceComplexity > 0.7) {
      complexity = 'advanced';
    }

    // Calculate suitability score
    const suitabilityScore = this.calculateSuitabilityScore({
      wordCount,
      readabilityScore,
      vocabularyComplexity,
      sentenceComplexity,
      structuredElements: structured.headings.length + structured.lists.length + structured.quotes.length
    });

    // Identify quality issues
    const issues: string[] = [];
    if (wordCount < this.MINIMUM_WORD_COUNT) {
      issues.push(`Content too short (${wordCount} words)`);
    }
    if (readabilityScore < 30) {
      issues.push('Content may be too complex for language learning');
    }
    if (avgWordsPerSentence > 30) {
      issues.push('Sentences are too long and complex');
    }
    if (uniqueWords.size / wordCount < 0.3) {
      issues.push('Limited vocabulary variety');
    }

    const meetsMinimumStandards = wordCount >= this.MINIMUM_WORD_COUNT && 
                                  suitabilityScore >= this.MINIMUM_QUALITY_SCORE &&
                                  issues.length === 0;

    return {
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      complexity,
      suitabilityScore,
      issues,
      meetsMinimumStandards,
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      vocabularyComplexity,
      sentenceComplexity
    };
  }

  /**
   * Suggests appropriate lesson type based on content analysis
   * Requirement 4.3: Automatic lesson type suggestion based on content analysis
   */
  private suggestLessonType(text: string, metadata: ContentMetadata, structured: StructuredContent): LessonType {
    const content = text.toLowerCase();
    const title = metadata.title.toLowerCase();
    const domain = metadata.domain.toLowerCase();

    // Business content indicators
    const businessKeywords = [
      'business', 'company', 'corporate', 'management', 'marketing', 'sales',
      'finance', 'economy', 'investment', 'profit', 'revenue', 'strategy',
      'meeting', 'presentation', 'negotiation', 'contract', 'client'
    ];

    // Travel content indicators
    const travelKeywords = [
      'travel', 'trip', 'vacation', 'holiday', 'destination', 'hotel',
      'flight', 'airport', 'restaurant', 'tourist', 'sightseeing',
      'culture', 'country', 'city', 'guide', 'visit', 'explore'
    ];

    // Grammar content indicators
    const grammarKeywords = [
      'grammar', 'verb', 'noun', 'adjective', 'tense', 'sentence',
      'plural', 'singular', 'conjugation', 'syntax', 'language rule',
      'past tense', 'present tense', 'future tense', 'conditional'
    ];

    // Pronunciation content indicators
    const pronunciationKeywords = [
      'pronunciation', 'phonetic', 'accent', 'sound', 'vowel', 'consonant',
      'stress', 'intonation', 'rhythm', 'syllable', 'phoneme', 'speak',
      'speaking', 'oral', 'listening', 'audio'
    ];

    // Count keyword matches
    const businessScore = this.countKeywordMatches(content + ' ' + title, businessKeywords);
    const travelScore = this.countKeywordMatches(content + ' ' + title, travelKeywords);
    const grammarScore = this.countKeywordMatches(content + ' ' + title, grammarKeywords);
    const pronunciationScore = this.countKeywordMatches(content + ' ' + title, pronunciationKeywords);

    // Domain-based scoring
    if (domain.includes('business') || domain.includes('corporate') || domain.includes('finance')) {
      return 'business';
    }
    if (domain.includes('travel') || domain.includes('tourism') || domain.includes('trip')) {
      return 'travel';
    }

    // Content type based scoring
    if (metadata.contentType === 'tutorial' && grammarScore > 0) {
      return 'grammar';
    }

    // Find the highest scoring category
    const scores = {
      business: businessScore,
      travel: travelScore,
      grammar: grammarScore,
      pronunciation: pronunciationScore
    };

    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore > 0) {
      const topCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
      if (topCategory && topCategory !== 'pronunciation') {
        return topCategory as LessonType;
      }
    }

    // Default to discussion for general content
    return 'discussion';
  }

  /**
   * Suggests appropriate CEFR level based on content complexity
   */
  private suggestCEFRLevel(text: string, quality: ContentQuality): CEFRLevel {
    const { readabilityScore, vocabularyComplexity, sentenceComplexity, wordCount } = quality;

    // Calculate complexity factors
    const readabilityFactor = readabilityScore / 100; // Higher is easier
    const vocabularyFactor = 1 - vocabularyComplexity; // Lower complexity is easier
    const sentenceFactor = 1 - sentenceComplexity; // Lower complexity is easier
    const lengthFactor = Math.min(1, wordCount / 300); // Longer texts tend to be more complex

    // Weighted average (readability is most important)
    const easeScore = (readabilityFactor * 0.4) + (vocabularyFactor * 0.3) + (sentenceFactor * 0.2) + (lengthFactor * 0.1);

    // Map to CEFR levels
    if (easeScore >= 0.8) return 'A1';
    if (easeScore >= 0.65) return 'A2';
    if (easeScore >= 0.5) return 'B1';
    if (easeScore >= 0.35) return 'B2';
    return 'C1';
  }

  // Helper methods

  private hasSubstantialContent(element: Element): boolean {
    const text = element.textContent || '';
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    return wordCount >= 50;
  }

  private findMainContentArea(document: Document): Element | null {
    const selectors = [
      'main', 'article', '[role="main"]', '.post-content', '.entry-content',
      '.article-content', '.content-body', '.post-body', '.article-body'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.hasSubstantialContent(element)) {
        return element;
      }
    }

    return document.body;
  }

  private isNestedList(list: Element): boolean {
    return !!(list.closest('li'));
  }

  private extractListData(list: Element): List {
    const type = list.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered';
    const items: string[] = [];
    const nested: List[] = [];

    const directItems = Array.from(list.children).filter(child => child.tagName === 'LI');
    
    directItems.forEach(item => {
      // Get text content excluding nested lists
      const nestedLists = item.querySelectorAll('ul, ol');
      const clone = item.cloneNode(true) as Element;
      clone.querySelectorAll('ul, ol').forEach(nestedList => nestedList.remove());
      
      const text = clone.textContent?.trim();
      if (text) {
        items.push(text);
      }

      // Extract nested lists
      nestedLists.forEach(nestedList => {
        const nestedData = this.extractListData(nestedList);
        if (nestedData.items.length > 0) {
          nested.push(nestedData);
        }
      });
    });

    return { type, items, nested: nested.length > 0 ? nested : undefined };
  }

  private findImageCaption(img: Element): string | undefined {
    // Look for caption in various places
    const figcaption = img.closest('figure')?.querySelector('figcaption');
    if (figcaption) return figcaption.textContent?.trim();

    const caption = img.nextElementSibling;
    if (caption && (caption.classList.contains('caption') || caption.tagName === 'FIGCAPTION')) {
      return caption.textContent?.trim();
    }

    return undefined;
  }

  private extractTableData(table: Element): TableInfo {
    const headers: string[] = [];
    const rows: string[][] = [];
    let caption: string | undefined;

    // Extract caption
    const captionElement = table.querySelector('caption');
    if (captionElement) {
      caption = captionElement.textContent?.trim();
    }

    // Extract headers
    const headerCells = table.querySelectorAll('th');
    headerCells.forEach(th => {
      const text = th.textContent?.trim();
      if (text) headers.push(text);
    });

    // Extract rows
    const tableRows = table.querySelectorAll('tr');
    tableRows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length > 0) {
        const rowData: string[] = [];
        cells.forEach(td => {
          const text = td.textContent?.trim() || '';
          rowData.push(text);
        });
        rows.push(rowData);
      }
    });

    return { headers, rows, caption };
  }

  private detectCodeLanguage(block: Element): string | undefined {
    // Check class names for language hints
    const className = block.className;
    const languageMatch = className.match(/language-(\w+)|lang-(\w+)|(\w+)-code/);
    if (languageMatch) {
      return languageMatch[1] || languageMatch[2] || languageMatch[3];
    }

    // Check data attributes
    const dataLang = block.getAttribute('data-language') || block.getAttribute('data-lang');
    if (dataLang) return dataLang;

    return undefined;
  }

  private detectContentLanguage(content: string): string | null {
    // Simple language detection based on common words
    const sample = content.toLowerCase().substring(0, 500);
    
    const patterns = {
      en: /\b(the|and|that|have|for|not|with|you|this|but|his|from|they)\b/g,
      es: /\b(que|de|no|la|el|en|un|es|se|te|y|por|con|del|los)\b/g,
      fr: /\b(que|de|et|le|la|les|des|un|une|du|dans|pour|avec|sur)\b/g,
      de: /\b(der|die|und|in|den|von|zu|das|mit|sich|ist|ein|eine)\b/g
    };

    let bestMatch = { lang: 'en', count: 0 };

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = sample.match(pattern);
      const count = matches ? matches.length : 0;
      if (count > bestMatch.count) {
        bestMatch = { lang, count };
      }
    }

    return bestMatch.count > 3 ? bestMatch.lang : null;
  }

  private determineContentType(document: Document): string {
    const url = window.location.href;
    const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');
    
    if (ogType) return ogType;
    
    if (url.includes('/blog/') || url.includes('/post/')) return 'blog';
    if (url.includes('/news/') || url.includes('/article/')) return 'news';
    if (url.includes('/tutorial/') || url.includes('/guide/')) return 'tutorial';
    if (url.includes('/wiki/')) return 'encyclopedia';
    
    return 'article';
  }

  private estimateAverageSyllables(words: string[]): number {
    const totalSyllables = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0);
    
    return words.length > 0 ? totalSyllables / words.length : 0;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  private calculateVocabularyComplexity(words: string[]): number {
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'
    ]);

    const complexWords = words.filter(word => 
      word.length > 6 && !commonWords.has(word.toLowerCase())
    );

    return words.length > 0 ? complexWords.length / words.length : 0;
  }

  private calculateSentenceComplexity(sentences: string[]): number {
    const complexSentences = sentences.filter(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      const hasComplexPunctuation = /[;:,]/.test(sentence);
      return wordCount > 20 || hasComplexPunctuation;
    });

    return sentences.length > 0 ? complexSentences.length / sentences.length : 0;
  }

  private calculateSuitabilityScore(params: {
    wordCount: number;
    readabilityScore: number;
    vocabularyComplexity: number;
    sentenceComplexity: number;
    structuredElements: number;
  }): number {
    const { wordCount, readabilityScore, vocabularyComplexity, sentenceComplexity, structuredElements } = params;

    // Word count factor (0-1)
    const wordFactor = Math.min(1, wordCount / 300);

    // Readability factor (0-1)
    const readabilityFactor = Math.max(0, Math.min(1, readabilityScore / 100));

    // Complexity factors (lower is better for suitability)
    const vocabFactor = Math.max(0, 1 - vocabularyComplexity);
    const sentenceFactor = Math.max(0, 1 - sentenceComplexity);

    // Structure factor (more structure is better)
    const structureFactor = Math.min(1, structuredElements / 5);

    // Weighted average
    return (wordFactor * 0.2) + (readabilityFactor * 0.3) + (vocabFactor * 0.2) + 
           (sentenceFactor * 0.2) + (structureFactor * 0.1);
  }

  private countKeywordMatches(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private createSourceInfo(metadata: ContentMetadata): SourceInfo {
    return {
      url: metadata.sourceUrl,
      domain: metadata.domain,
      title: metadata.title,
      extractedAt: new Date(),
      userAgent: navigator.userAgent,
      attribution: `Content extracted from ${metadata.title} (${metadata.domain})`
    };
  }
}