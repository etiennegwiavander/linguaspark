/**
 * Content Extraction Validator
 * Integrates validation engine with error handling for complete extraction validation
 */

import { ContentValidationEngine, ValidationResult } from './content-validation-engine';
import { ExtractionErrorHandler, ExtractionError } from './extraction-error-handler';

export interface ExtractedContent {
  text: string;
  metadata?: {
    title?: string;
    url?: string;
    contentType?: string;
    language?: string;
    languageConfidence?: number;
    author?: string;
    publicationDate?: Date;
    sourceUrl?: string;
  };
}

export interface ValidationOptions {
  strictMode?: boolean;
  minWordCount?: number;
  minQualityScore?: number;
  enableRetry?: boolean;
  showTechnicalDetails?: boolean;
}

export interface ExtractionValidationResult {
  success: boolean;
  content?: ExtractedContent;
  validation?: ValidationResult;
  error?: ExtractionError;
  canProceed: boolean;
  needsUserAction: boolean;
}

export class ContentExtractionValidator {
  private validationEngine: ContentValidationEngine;
  private errorHandler: ExtractionErrorHandler;

  constructor(options?: ValidationOptions) {
    this.validationEngine = new ContentValidationEngine({
      minWordCount: options?.minWordCount || 200,
      minQualityScore: options?.minQualityScore || 60,
      strictMode: options?.strictMode || false,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh']
    });

    this.errorHandler = new ExtractionErrorHandler({
      enableRetry: options?.enableRetry !== false,
      showTechnicalDetails: options?.showTechnicalDetails || false,
      maxRetryAttempts: 3,
      retryDelay: 1000
    });
  }

  /**
   * Validate extracted content and provide comprehensive result
   */
  async validateExtractedContent(content: ExtractedContent): Promise<ExtractionValidationResult> {
    try {
      // Validate the content
      const validationResult = await this.validationEngine.validateContent(
        content.text,
        content.metadata
      );

      // If validation passes, return success
      if (validationResult.isValid && validationResult.meetsMinimumQuality) {
        return {
          success: true,
          content,
          validation: validationResult,
          canProceed: true,
          needsUserAction: false
        };
      }

      // If validation fails, handle the error
      const extractionError = this.errorHandler.handleValidationError(
        validationResult,
        content.metadata?.url
      );

      return {
        success: false,
        content,
        validation: validationResult,
        error: extractionError,
        canProceed: false,
        needsUserAction: true
      };

    } catch (error) {
      // Handle unexpected errors during validation
      const extractionError = this.errorHandler.handleExtractionError(
        error as Error,
        content.metadata?.url
      );

      return {
        success: false,
        content,
        error: extractionError,
        canProceed: false,
        needsUserAction: true
      };
    }
  }

  /**
   * Handle extraction errors (network, parsing, etc.)
   */
  handleExtractionFailure(error: Error, url?: string): ExtractionValidationResult {
    const extractionError = this.errorHandler.handleExtractionError(error, url);

    return {
      success: false,
      error: extractionError,
      canProceed: false,
      needsUserAction: true
    };
  }

  /**
   * Get user-friendly error message and recovery options
   */
  getErrorDetails(result: ExtractionValidationResult): {
    title: string;
    message: string;
    recoveryOptions: Array<{
      id: string;
      label: string;
      description: string;
      action: string;
      primary?: boolean;
    }>;
    canRetry: boolean;
  } | null {
    if (!result.error) {
      return null;
    }

    return this.errorHandler.formatErrorForDisplay(result.error);
  }

  /**
   * Check if content can be retried
   */
  canRetryExtraction(result: ExtractionValidationResult, sessionId?: string): boolean {
    if (!result.error) {
      return false;
    }

    return result.error.canRetry;
  }

  /**
   * Record retry attempt for session
   */
  recordRetryAttempt(sessionId: string): void {
    this.errorHandler.recordRetryAttempt(sessionId);
  }

  /**
   * Clear retry attempts for session
   */
  clearRetryAttempts(sessionId: string): void {
    this.errorHandler.clearRetryAttempts(sessionId);
  }

  /**
   * Get retry delay for session
   */
  getRetryDelay(sessionId: string): number {
    return this.errorHandler.getRetryDelay(sessionId);
  }

  /**
   * Get validation warnings and recommendations
   */
  getValidationFeedback(result: ExtractionValidationResult): {
    warnings: string[];
    recommendations: string[];
    score: number;
  } | null {
    if (!result.validation) {
      return null;
    }

    return {
      warnings: result.validation.warnings,
      recommendations: result.validation.recommendations,
      score: result.validation.score
    };
  }

  /**
   * Check if content meets minimum standards for lesson generation
   */
  meetsMinimumStandards(result: ExtractionValidationResult): boolean {
    return result.success && (result.validation?.meetsMinimumQuality || false);
  }

  /**
   * Get content quality assessment
   */
  getQualityAssessment(result: ExtractionValidationResult): {
    score: number;
    level: 'poor' | 'fair' | 'good' | 'excellent';
    issues: string[];
    strengths: string[];
  } | null {
    if (!result.validation) {
      return null;
    }

    const score = result.validation.score;
    let level: 'poor' | 'fair' | 'good' | 'excellent';

    if (score >= 80) {
      level = 'excellent';
    } else if (score >= 65) {
      level = 'good';
    } else if (score >= 45) {
      level = 'fair';
    } else {
      level = 'poor';
    }

    const issues = result.validation.issues
      .filter(issue => issue.severity === 'error')
      .map(issue => issue.message);

    const strengths: string[] = [];
    if (score >= 70) {
      strengths.push('Good content structure and readability');
    }
    if (result.validation.warnings.length === 0) {
      strengths.push('No quality warnings detected');
    }
    if (result.content && result.content.text.split(/\s+/).length > 300) {
      strengths.push('Substantial content length');
    }

    return {
      score,
      level,
      issues,
      strengths
    };
  }

  /**
   * Suggest improvements for content quality
   */
  suggestImprovements(result: ExtractionValidationResult): string[] {
    if (!result.validation) {
      return [];
    }

    const suggestions: string[] = [];

    // Add specific suggestions based on validation issues
    result.validation.issues.forEach(issue => {
      if (issue.recoverable && issue.suggestedAction) {
        suggestions.push(issue.suggestedAction);
      }
    });

    // Add general recommendations
    suggestions.push(...result.validation.recommendations);

    // Remove duplicates
    return Array.from(new Set(suggestions));
  }

  /**
   * Create a summary of the validation result
   */
  createValidationSummary(result: ExtractionValidationResult): {
    status: 'success' | 'warning' | 'error';
    message: string;
    details: string[];
    actionRequired: boolean;
  } {
    if (result.success) {
      return {
        status: 'success',
        message: 'Content is ready for lesson generation',
        details: result.validation?.warnings || [],
        actionRequired: false
      };
    }

    if (result.error) {
      return {
        status: 'error',
        message: result.error.userMessage,
        details: this.suggestImprovements(result),
        actionRequired: true
      };
    }

    return {
      status: 'warning',
      message: 'Content has quality issues but may still be usable',
      details: result.validation?.warnings || [],
      actionRequired: true
    };
  }
}