/**
 * Content Validation Service
 * 
 * Ensures source content meets minimum requirements for AI processing
 * before attempting lesson generation.
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

export interface QualityScore {
  score: number; // 0-100
  factors: {
    wordCount: number;
    sentenceCount: number;
    averageWordsPerSentence: number;
    hasVariedVocabulary: boolean;
    hasCompleteThoughts: boolean;
  };
}

export interface ContentValidator {
  validateContent(content: string): ValidationResult;
  getMinimumWordCount(): number;
  checkContentQuality(content: string): QualityScore;
}

export class ContentValidatorImpl implements ContentValidator {
  private readonly MINIMUM_WORD_COUNT = 50;
  private readonly MINIMUM_SENTENCE_COUNT = 3;
  private readonly MINIMUM_QUALITY_SCORE = 60;

  /**
   * Validates content for AI lesson generation suitability
   */
  validateContent(content: string): ValidationResult {
    // Basic sanitization and preparation
    const cleanContent = this.sanitizeContent(content);
    
    if (!cleanContent || cleanContent.trim().length === 0) {
      return {
        isValid: false,
        reason: "No content provided",
        suggestions: ["Please select or paste some text content to generate a lesson from"]
      };
    }

    // Check minimum word count
    const wordCount = this.getWordCount(cleanContent);
    if (wordCount < this.MINIMUM_WORD_COUNT) {
      return {
        isValid: false,
        reason: `Content too short (${wordCount} words, minimum ${this.MINIMUM_WORD_COUNT} required)`,
        suggestions: [
          "Select more text from the webpage",
          "Choose a longer article or passage",
          "Combine multiple paragraphs for better lesson content"
        ]
      };
    }

    // Check sentence count
    const sentenceCount = this.getSentenceCount(cleanContent);
    if (sentenceCount < this.MINIMUM_SENTENCE_COUNT) {
      return {
        isValid: false,
        reason: `Content lacks structure (${sentenceCount} sentences, minimum ${this.MINIMUM_SENTENCE_COUNT} required)`,
        suggestions: [
          "Select content with complete sentences",
          "Choose text with proper punctuation",
          "Avoid selecting only titles or bullet points"
        ]
      };
    }

    // Check content quality
    const qualityScore = this.checkContentQuality(cleanContent);
    if (qualityScore.score < this.MINIMUM_QUALITY_SCORE) {
      return {
        isValid: false,
        reason: `Content quality insufficient for lesson generation (score: ${qualityScore.score}/100)`,
        suggestions: this.getQualityImprovementSuggestions(qualityScore)
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Returns the minimum word count required for content validation
   */
  getMinimumWordCount(): number {
    return this.MINIMUM_WORD_COUNT;
  }

  /**
   * Analyzes content quality and returns a detailed score
   */
  checkContentQuality(content: string): QualityScore {
    const cleanContent = this.sanitizeContent(content);
    const words = this.getWords(cleanContent);
    const sentences = this.getSentences(cleanContent);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Check vocabulary variety (unique words vs total words)
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const vocabularyVariety = uniqueWords.size / wordCount;
    const hasVariedVocabulary = vocabularyVariety > 0.4; // At least 40% unique words
    
    // Check for complete thoughts (sentences ending with proper punctuation)
    const completeThoughts = sentences.filter(sentence => 
      /[.!?]$/.test(sentence.trim())
    ).length;
    const hasCompleteThoughts = (completeThoughts / sentenceCount) > 0.7; // 70% complete sentences
    
    // Calculate overall quality score
    let score = 0;
    
    // Word count factor (0-30 points)
    if (wordCount >= this.MINIMUM_WORD_COUNT) {
      score += Math.min(30, (wordCount / 200) * 30); // Max points at 200 words
    }
    
    // Sentence structure factor (0-25 points)
    if (averageWordsPerSentence >= 8 && averageWordsPerSentence <= 25) {
      score += 25; // Good sentence length
    } else if (averageWordsPerSentence >= 5) {
      score += 15; // Acceptable sentence length
    }
    
    // Vocabulary variety factor (0-25 points)
    if (hasVariedVocabulary) {
      score += 25;
    } else if (vocabularyVariety > 0.25) {
      score += 15;
    }
    
    // Complete thoughts factor (0-20 points)
    if (hasCompleteThoughts) {
      score += 20;
    } else if ((completeThoughts / sentenceCount) > 0.5) {
      score += 10;
    }
    
    return {
      score: Math.round(score),
      factors: {
        wordCount,
        sentenceCount,
        averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
        hasVariedVocabulary,
        hasCompleteThoughts
      }
    };
  }

  /**
   * Sanitizes content by removing excessive whitespace and non-text elements
   */
  private sanitizeContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/[^\w\s.,!?;:'"()-]/g, '') // Remove special characters except basic punctuation
      .trim();
  }

  /**
   * Counts words in the content
   */
  private getWordCount(content: string): number {
    return this.getWords(content).length;
  }

  /**
   * Gets array of words from content
   */
  private getWords(content: string): string[] {
    return content
      .split(/\s+/)
      .filter(word => word.length > 0 && /\w/.test(word));
  }

  /**
   * Counts sentences in the content
   */
  private getSentenceCount(content: string): number {
    return this.getSentences(content).length;
  }

  /**
   * Gets array of sentences from content
   */
  private getSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Generates improvement suggestions based on quality score factors
   */
  private getQualityImprovementSuggestions(qualityScore: QualityScore): string[] {
    const suggestions: string[] = [];
    
    if (qualityScore.factors.wordCount < 100) {
      suggestions.push("Select longer content with more detailed information");
    }
    
    if (qualityScore.factors.averageWordsPerSentence < 8) {
      suggestions.push("Choose content with more complex, complete sentences");
    }
    
    if (!qualityScore.factors.hasVariedVocabulary) {
      suggestions.push("Select content with more diverse vocabulary and topics");
    }
    
    if (!qualityScore.factors.hasCompleteThoughts) {
      suggestions.push("Choose well-structured text with proper punctuation");
    }
    
    if (suggestions.length === 0) {
      suggestions.push("Try selecting different content that is more suitable for language learning");
    }
    
    return suggestions;
  }
}

// Export singleton instance
export const contentValidator = new ContentValidatorImpl();