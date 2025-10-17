/**
 * Error Handler for Content Extraction
 * Provides user-friendly error messages and recovery options
 */

import { ValidationResult, ValidationIssue } from './content-validation-engine';

export interface ExtractionError {
  type: ExtractionErrorType;
  message: string;
  userMessage: string;
  recoveryOptions: RecoveryOption[];
  canRetry: boolean;
  technicalDetails?: string;
}

export type ExtractionErrorType =
  | 'validation_failed'
  | 'network_error'
  | 'parsing_error'
  | 'permission_denied'
  | 'content_blocked'
  | 'timeout_error'
  | 'unknown_error';

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: RecoveryAction;
  primary?: boolean;
}

export type RecoveryAction =
  | 'retry_extraction'
  | 'manual_selection'
  | 'copy_paste_fallback'
  | 'try_different_page'
  | 'adjust_settings'
  | 'contact_support';

export interface ErrorHandlingConfig {
  showTechnicalDetails: boolean;
  enableRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

export class ExtractionErrorHandler {
  private config: ErrorHandlingConfig;
  private retryAttempts: Map<string, number> = new Map();

  constructor(config?: Partial<ErrorHandlingConfig>) {
    this.config = {
      showTechnicalDetails: false,
      enableRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Handle validation errors and provide user-friendly messages
   */
  handleValidationError(validationResult: ValidationResult, url?: string): ExtractionError {
    const errors = validationResult.issues.filter(issue => issue.severity === 'error');
    const primaryError = errors[0];

    if (!primaryError) {
      return this.createSuccessResult();
    }

    const recoveryOptions = this.getValidationRecoveryOptions(validationResult.issues);
    
    return {
      type: 'validation_failed',
      message: this.getValidationErrorMessage(errors),
      userMessage: this.getUserFriendlyValidationMessage(primaryError),
      recoveryOptions,
      canRetry: this.canRetryValidation(errors),
      technicalDetails: this.config.showTechnicalDetails ? 
        `Validation score: ${validationResult.score}, Issues: ${errors.length}` : undefined
    };
  }

  /**
   * Handle extraction errors (network, parsing, etc.)
   */
  handleExtractionError(error: Error, url?: string): ExtractionError {
    const errorType = this.classifyError(error);
    const sessionId = url ? this.getSessionId(url) : 'unknown';
    
    const canRetry = this.canRetryExtraction(errorType, sessionId);
    const recoveryOptions = this.getExtractionRecoveryOptions(errorType, canRetry);

    return {
      type: errorType,
      message: error.message,
      userMessage: this.getUserFriendlyErrorMessage(errorType, error),
      recoveryOptions,
      canRetry,
      technicalDetails: this.config.showTechnicalDetails ? error.stack : undefined
    };
  }

  /**
   * Get recovery options for validation issues
   */
  private getValidationRecoveryOptions(issues: ValidationIssue[]): RecoveryOption[] {
    const options: RecoveryOption[] = [];
    const issueTypes = new Set(issues.map(issue => issue.type));

    // Manual selection option for most validation issues
    if (issueTypes.has('insufficient_content') || 
        issueTypes.has('no_main_content') ||
        issueTypes.has('too_much_advertising')) {
      options.push({
        id: 'manual_selection',
        label: 'Select Text Manually',
        description: 'Highlight and select the specific text you want to use for the lesson',
        action: 'manual_selection',
        primary: true
      });
    }

    // Copy-paste fallback for any validation issue
    options.push({
      id: 'copy_paste',
      label: 'Copy & Paste Content',
      description: 'Copy the content and paste it directly into the lesson generator',
      action: 'copy_paste_fallback'
    });

    // Different page suggestion for content quality issues
    if (issueTypes.has('poor_quality') || 
        issueTypes.has('social_media_content') ||
        issueTypes.has('navigation_only')) {
      options.push({
        id: 'different_page',
        label: 'Try Different Content',
        description: 'Look for articles, blog posts, or news stories with better structure',
        action: 'try_different_page'
      });
    }

    // Language-specific options
    if (issueTypes.has('unsupported_language')) {
      options.push({
        id: 'supported_language',
        label: 'Find Supported Language Content',
        description: 'Look for content in English, Spanish, French, German, or other supported languages',
        action: 'try_different_page'
      });
    }

    return options;
  }

  /**
   * Get recovery options for extraction errors
   */
  private getExtractionRecoveryOptions(errorType: ExtractionErrorType, canRetry: boolean): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    // Retry option for recoverable errors
    if (canRetry && this.config.enableRetry) {
      options.push({
        id: 'retry',
        label: 'Try Again',
        description: 'Attempt to extract the content again',
        action: 'retry_extraction',
        primary: true
      });
    }

    // Manual selection for parsing, content, or permission issues
    if (errorType === 'parsing_error' || errorType === 'content_blocked' || errorType === 'permission_denied') {
      options.push({
        id: 'manual_selection',
        label: 'Select Text Manually',
        description: 'Highlight the text you want to extract',
        action: 'manual_selection',
        primary: !canRetry
      });
    }

    // Copy-paste fallback (always available)
    options.push({
      id: 'copy_paste',
      label: 'Copy & Paste Instead',
      description: 'Copy the content and paste it into the lesson generator',
      action: 'copy_paste_fallback'
    });

    // Different page for permission or blocking issues
    if (errorType === 'permission_denied' || errorType === 'content_blocked') {
      options.push({
        id: 'different_page',
        label: 'Try Different Website',
        description: 'Some websites block content extraction. Try a different source.',
        action: 'try_different_page'
      });
    }

    return options;
  }

  /**
   * Classify error type based on error details
   */
  private classifyError(error: Error): ExtractionErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    
    if (message.includes('permission') || message.includes('cors')) {
      return 'permission_denied';
    }
    
    if (message.includes('timeout')) {
      return 'timeout_error';
    }
    
    if (message.includes('parse') || message.includes('syntax')) {
      return 'parsing_error';
    }
    
    if (message.includes('blocked') || message.includes('forbidden')) {
      return 'content_blocked';
    }

    return 'unknown_error';
  }

  /**
   * Get user-friendly error messages
   */
  private getUserFriendlyErrorMessage(errorType: ExtractionErrorType, error: Error): string {
    switch (errorType) {
      case 'network_error':
        return 'Unable to connect to the website. Please check your internet connection and try again.';
      
      case 'permission_denied':
        return 'This website doesn\'t allow content extraction. Try copying the content manually or use a different source.';
      
      case 'content_blocked':
        return 'This website has blocked automatic content extraction. You can still copy and paste the content manually.';
      
      case 'timeout_error':
        return 'The extraction took too long and timed out. The website might be slow or overloaded.';
      
      case 'parsing_error':
        return 'Unable to understand the page structure. The content might be in an unusual format.';
      
      case 'validation_failed':
        return 'The extracted content doesn\'t meet the requirements for lesson generation.';
      
      default:
        return 'An unexpected error occurred during content extraction. Please try again or use manual copy-paste.';
    }
  }

  /**
   * Get user-friendly validation error messages
   */
  private getUserFriendlyValidationMessage(issue: ValidationIssue): string {
    switch (issue.type) {
      case 'insufficient_content':
        return 'This page doesn\'t have enough content for a quality lesson. Try finding a longer article or selecting additional text.';
      
      case 'poor_quality':
        return 'The content quality is too low for effective lesson generation. Look for well-written articles or educational content.';
      
      case 'unsupported_language':
        return 'The content language is not supported or couldn\'t be detected. Try content in English, Spanish, French, German, or other supported languages.';
      
      case 'no_main_content':
        return 'Unable to find substantial content on this page. Try selecting the main article text manually.';
      
      case 'too_much_advertising':
        return 'This page has too much advertising content. Try educational websites, news articles, or blogs with less advertising.';
      
      case 'social_media_content':
        return 'Social media content isn\'t suitable for lessons. Try articles, blog posts, or news stories instead.';
      
      case 'navigation_only':
        return 'Only navigation links were found. Try selecting the main article content instead of menu areas.';
      
      case 'low_readability':
        return 'The content is difficult to read and may not be suitable for language learning. Try finding clearer, better-structured content.';
      
      default:
        return issue.message;
    }
  }

  /**
   * Get validation error message for multiple issues
   */
  private getValidationErrorMessage(errors: ValidationIssue[]): string {
    if (errors.length === 1) {
      return errors[0].message;
    }
    
    const primaryTypes = errors.map(e => e.type);
    
    if (primaryTypes.includes('insufficient_content')) {
      return 'Content is too short and has quality issues';
    }
    
    if (primaryTypes.includes('unsupported_language')) {
      return 'Language not supported and content has quality issues';
    }
    
    return `Multiple validation issues: ${errors.length} problems found`;
  }

  /**
   * Check if validation can be retried
   */
  private canRetryValidation(errors: ValidationIssue[]): boolean {
    // Validation errors typically can't be retried unless they're warnings
    return errors.every(error => error.severity === 'warning');
  }

  /**
   * Check if extraction can be retried
   */
  private canRetryExtraction(errorType: ExtractionErrorType, sessionId: string): boolean {
    if (!this.config.enableRetry) {
      return false;
    }

    // Don't retry permission or blocking errors
    if (errorType === 'permission_denied' || errorType === 'content_blocked') {
      return false;
    }

    // Check retry attempts
    const attempts = this.retryAttempts.get(sessionId) || 0;
    if (attempts >= this.config.maxRetryAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Record retry attempt
   */
  recordRetryAttempt(sessionId: string): void {
    const attempts = this.retryAttempts.get(sessionId) || 0;
    this.retryAttempts.set(sessionId, attempts + 1);
  }

  /**
   * Clear retry attempts for session
   */
  clearRetryAttempts(sessionId: string): void {
    this.retryAttempts.delete(sessionId);
  }

  /**
   * Get session ID from URL
   */
  private getSessionId(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Create success result (no errors)
   */
  private createSuccessResult(): ExtractionError {
    return {
      type: 'validation_failed', // This shouldn't be used for success
      message: 'Validation passed',
      userMessage: 'Content is ready for lesson generation',
      recoveryOptions: [],
      canRetry: false
    };
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(sessionId: string): number {
    const attempts = this.retryAttempts.get(sessionId) || 0;
    return this.config.retryDelay * Math.pow(2, attempts);
  }

  /**
   * Format error for display in UI
   */
  formatErrorForDisplay(error: ExtractionError): {
    title: string;
    message: string;
    actions: RecoveryOption[];
    canRetry: boolean;
  } {
    return {
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      actions: error.recoveryOptions,
      canRetry: error.canRetry
    };
  }

  /**
   * Get appropriate error title
   */
  private getErrorTitle(errorType: ExtractionErrorType): string {
    switch (errorType) {
      case 'validation_failed':
        return 'Content Not Suitable';
      case 'network_error':
        return 'Connection Problem';
      case 'permission_denied':
        return 'Access Denied';
      case 'content_blocked':
        return 'Content Blocked';
      case 'timeout_error':
        return 'Request Timed Out';
      case 'parsing_error':
        return 'Content Format Issue';
      default:
        return 'Extraction Failed';
    }
  }
}