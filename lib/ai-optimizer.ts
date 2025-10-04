// Type definitions for AI optimization
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type LessonSection = 'warmup' | 'vocabulary' | 'reading' | 'comprehension' | 'dialogue' | 'grammar';

// Core interfaces for AI optimization
export interface SharedContext {
  keyVocabulary: string[];
  mainThemes: string[];
  difficultyLevel: CEFRLevel;
  contentSummary: string;
}

export interface OptimizedPrompt {
  prompt: string;
  estimatedTokens: number;
  optimizationStrategy: string;
}

export interface BatchedPrompt {
  prompts: string[];
  combinedPrompt: string;
  estimatedTokens: number;
  sections: string[];
}

export interface AIOptimizer {
  optimizePrompt(section: LessonSection, context: SharedContext): OptimizedPrompt;
  extractKeyTerms(content: string): string[];
  summarizeContent(content: string, maxLength: number): string;
  batchPrompts(prompts: { section: string; prompt: string }[]): BatchedPrompt[];
}

// Implementation of the AI optimization engine
export class AIOptimizerImpl implements AIOptimizer {
  private readonly MAX_PROMPT_TOKENS = 2000;
  private readonly VOCABULARY_LIMIT = 15;
  private readonly THEME_LIMIT = 5;

  /**
   * Optimizes prompts to reduce token consumption while maintaining quality
   */
  optimizePrompt(section: LessonSection, context: SharedContext): OptimizedPrompt {
    const basePrompt = this.getBasePrompt(section);
    let optimizedPrompt = basePrompt;
    let strategy = 'base';

    // Apply context-based optimization
    if (context.keyVocabulary.length > 0) {
      optimizedPrompt = this.applyVocabularyOptimization(optimizedPrompt, context);
      strategy += '+vocab';
    }

    if (context.mainThemes.length > 0) {
      optimizedPrompt = this.applyThemeOptimization(optimizedPrompt, context);
      strategy += '+themes';
    }

    // Apply content summarization if needed
    if (context.contentSummary.length > 500) {
      optimizedPrompt = this.applyContentSummarization(optimizedPrompt, context);
      strategy += '+summary';
    }

    // Apply difficulty-specific optimization
    optimizedPrompt = this.applyDifficultyOptimization(optimizedPrompt, context.difficultyLevel);
    strategy += `+${context.difficultyLevel}`;

    const estimatedTokens = this.estimateTokens(optimizedPrompt);

    return {
      prompt: optimizedPrompt,
      estimatedTokens,
      optimizationStrategy: strategy
    };
  }

  /**
   * Extracts key terms from content for vocabulary optimization
   */
  extractKeyTerms(content: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'her', 'us', 'them'
    ]);

    // Extract words and filter
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !commonWords.has(word) && 
        /^[a-z]+$/.test(word)
      );

    // Count frequency and get top terms
    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.VOCABULARY_LIMIT)
      .map(([word]) => word);
  }

  /**
   * Summarizes content to reduce token consumption
   */
  summarizeContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Extract sentences
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    if (sentences.length <= 3) {
      return content.substring(0, maxLength);
    }

    // Score sentences by importance (length, position, keyword density)
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position score (first and last sentences are important)
      if (index === 0 || index === sentences.length - 1) {
        score += 2;
      }
      
      // Length score (moderate length preferred)
      const length = sentence.length;
      if (length > 50 && length < 200) {
        score += 1;
      }
      
      // Keyword density score
      const keywordCount = (sentence.match(/\b(important|key|main|primary|essential|significant)\b/gi) || []).length;
      score += keywordCount;

      return { sentence, score, index };
    });

    // Select top sentences and maintain order
    const selectedSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(sentences.length / 2))
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);

    const summary = selectedSentences.join('. ') + '.';
    
    return summary.length > maxLength 
      ? summary.substring(0, maxLength - 3) + '...'
      : summary;
  }

  /**
   * Batches multiple prompts for efficient API calls
   */
  batchPrompts(prompts: { section: string; prompt: string }[]): BatchedPrompt[] {
    if (prompts.length <= 1) {
      return prompts.map(p => ({
        prompts: [p.prompt],
        combinedPrompt: p.prompt,
        estimatedTokens: this.estimateTokens(p.prompt),
        sections: [p.section]
      }));
    }

    const batches: BatchedPrompt[] = [];
    let currentBatch: { section: string; prompt: string }[] = [];
    let currentTokens = 0;

    for (const promptData of prompts) {
      const promptTokens = this.estimateTokens(promptData.prompt);
      
      // If adding this prompt would exceed limit, finalize current batch
      if (currentTokens + promptTokens > this.MAX_PROMPT_TOKENS && currentBatch.length > 0) {
        batches.push(this.createBatch(currentBatch));
        currentBatch = [];
        currentTokens = 0;
      }

      currentBatch.push(promptData);
      currentTokens += promptTokens;
    }

    // Add remaining batch
    if (currentBatch.length > 0) {
      batches.push(this.createBatch(currentBatch));
    }

    return batches;
  }

  // Private helper methods
  private getBasePrompt(section: LessonSection): string {
    const prompts = {
      warmup: "Generate 3 engaging warmup questions that activate prior knowledge and introduce the topic.",
      vocabulary: "Create a vocabulary list with definitions and example sentences.",
      reading: "Generate a reading passage appropriate for the difficulty level.",
      comprehension: "Create comprehension questions about the reading passage.",
      dialogue: "Generate a natural dialogue that incorporates the vocabulary and themes.",
      grammar: "Create grammar exercises focusing on key structures from the content."
    };

    return prompts[section] || "Generate appropriate lesson content for this section.";
  }

  private applyVocabularyOptimization(prompt: string, context: SharedContext): string {
    const vocabList = context.keyVocabulary.slice(0, 10).join(', ');
    return `${prompt} Focus on these key terms: ${vocabList}.`;
  }

  private applyThemeOptimization(prompt: string, context: SharedContext): string {
    const themes = context.mainThemes.slice(0, 3).join(', ');
    return `${prompt} Incorporate these themes: ${themes}.`;
  }

  private applyContentSummarization(prompt: string, context: SharedContext): string {
    const shortSummary = context.contentSummary.substring(0, 200);
    return `${prompt} Based on this content: "${shortSummary}..."`;
  }

  private applyDifficultyOptimization(prompt: string, level: CEFRLevel): string {
    const levelGuidance = {
      A1: "Use simple vocabulary and basic sentence structures.",
      A2: "Use elementary vocabulary with some complex sentences.",
      B1: "Use intermediate vocabulary and varied sentence structures.",
      B2: "Use upper-intermediate vocabulary and complex grammar.",
      C1: "Use advanced vocabulary and sophisticated language structures."
    };

    return `${prompt} ${levelGuidance[level]}`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  private createBatch(prompts: { section: string; prompt: string }[]): BatchedPrompt {
    const sections = prompts.map(p => p.section);
    const promptTexts = prompts.map(p => p.prompt);
    
    const combinedPrompt = `Generate content for multiple lesson sections:
${prompts.map((p, i) => `${i + 1}. ${p.section.toUpperCase()}: ${p.prompt}`).join('\n')}

Please provide responses in the same order, clearly labeled by section.`;

    return {
      prompts: promptTexts,
      combinedPrompt,
      estimatedTokens: this.estimateTokens(combinedPrompt),
      sections
    };
  }
}

// Export singleton instance
export const aiOptimizer = new AIOptimizerImpl();