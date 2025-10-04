/**
 * Error Classification System for AI-Only Lesson Generation
 * 
 * This module provides error classification and message generation
 * for AI failures in the lesson generation system.
 */

import { randomUUID } from 'crypto';

// Error types based on requirements 3.1-3.4
export type ErrorType = 
  | 'QUOTA_EXCEEDED' 
  | 'CONTENT_ISSUE' 
  | 'NETWORK_ERROR' 
  | 'UNKNOWN';

// Base AI error interface
export interface AIError extends Error {
  code?: string;
  status?: number;
  response?: any;
}

// Error context for debugging and support
export interface ErrorContext {
  userId?: string;
  contentLength?: number;
  lessonType?: string;
  timestamp: Date;
  requestId?: string;
  apiEndpoint?: string;
}

// Classified error with additional metadata
export interface ClassifiedError {
  type: ErrorType;
  originalError: Error;
  context: ErrorContext;
  errorId: string;
}

// User-facing error message
export interface UserErrorMessage {
  title: string;
  message: string;
  actionableSteps: string[];
  errorId: string;
  supportContact?: string;
}

// Support error message with technical details
export interface SupportErrorMessage {
  errorId: string;
  type: ErrorType;
  technicalDetails: string;
  context: ErrorContext;
  stackTrace?: string;
  timestamp: Date;
}

// Error classifier interface
export interface IErrorClassifier {
  classifyError(error: AIError, context?: Partial<ErrorContext>): ClassifiedError;
  generateUserMessage(error: ClassifiedError): UserErrorMessage;
  generateSupportMessage(error: ClassifiedError): SupportErrorMessage;
}

/**
 * Implementation of the error classification system
 */
export class ErrorClassifier implements IErrorClassifier {
  
  /**
   * Classifies an AI error based on error properties and context
   */
  classifyError(error: AIError, context: Partial<ErrorContext> = {}): ClassifiedError {
    const errorId = this.generateErrorId();
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      ...context
    };

    const type = this.determineErrorType(error);

    return {
      type,
      originalError: error,
      context: fullContext,
      errorId
    };
  }

  /**
   * Generates user-friendly error messages with actionable steps
   */
  generateUserMessage(error: ClassifiedError): UserErrorMessage {
    switch (error.type) {
      case 'QUOTA_EXCEEDED':
        return {
          title: 'API Quota Exceeded',
          message: 'API quota exceeded, please try again later',
          actionableSteps: [
            'Wait a few minutes before trying again',
            'Try generating a shorter lesson',
            'Contact support if the issue persists'
          ],
          errorId: error.errorId,
          supportContact: 'support@linguaspark.com'
        };

      case 'CONTENT_ISSUE':
        return {
          title: 'Content Processing Error',
          message: 'Unable to process this content, please try different text',
          actionableSteps: [
            'Ensure the content has at least 100 words',
            'Try selecting different text from the webpage',
            'Check that the content is in a supported language',
            'Remove any special characters or formatting'
          ],
          errorId: error.errorId
        };

      case 'NETWORK_ERROR':
        return {
          title: 'Connection Error',
          message: 'Connection error, please check your internet and try again',
          actionableSteps: [
            'Check your internet connection',
            'Try refreshing the page',
            'Wait a moment and try again',
            'Contact support if the problem continues'
          ],
          errorId: error.errorId
        };

      case 'UNKNOWN':
      default:
        return {
          title: 'Service Temporarily Unavailable',
          message: 'AI service temporarily unavailable, please try again later',
          actionableSteps: [
            'Wait a few minutes and try again',
            'Try refreshing the page',
            'Contact support with the error ID below'
          ],
          errorId: error.errorId,
          supportContact: 'support@linguaspark.com'
        };
    }
  }

  /**
   * Generates detailed support messages for debugging
   */
  generateSupportMessage(error: ClassifiedError): SupportErrorMessage {
    return {
      errorId: error.errorId,
      type: error.type,
      technicalDetails: this.extractTechnicalDetails(error.originalError),
      context: error.context,
      stackTrace: error.originalError.stack,
      timestamp: error.context.timestamp
    };
  }

  /**
   * Determines error type based on error properties
   */
  private determineErrorType(error: AIError): ErrorType {
    // Check for quota/rate limit errors
    if (this.isQuotaError(error)) {
      return 'QUOTA_EXCEEDED';
    }

    // Check for network/connection errors
    if (this.isNetworkError(error)) {
      return 'NETWORK_ERROR';
    }

    // Check for content-related errors
    if (this.isContentError(error)) {
      return 'CONTENT_ISSUE';
    }

    // Default to unknown for unclassified errors
    return 'UNKNOWN';
  }

  /**
   * Checks if error is related to API quota/rate limits
   */
  private isQuotaError(error: AIError): boolean {
    const quotaIndicators = [
      'quota',
      'rate limit',
      'too many requests',
      'limit exceeded',
      '429',
      'RESOURCE_EXHAUSTED'
    ];

    const errorText = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    const status = error.status;

    return (
      status === 429 ||
      quotaIndicators.some(indicator => 
        errorText.includes(indicator) || errorCode.includes(indicator)
      )
    );
  }

  /**
   * Checks if error is network/connection related
   */
  private isNetworkError(error: AIError): boolean {
    const networkIndicators = [
      'network',
      'connection',
      'timeout',
      'fetch',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorText = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    const status = error.status;

    return (
      status === 0 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      networkIndicators.some(indicator => 
        errorText.includes(indicator) || errorCode.includes(indicator)
      )
    );
  }

  /**
   * Checks if error is content-related
   */
  private isContentError(error: AIError): boolean {
    const contentIndicators = [
      'invalid input',
      'content too short',
      'unsupported format',
      'parsing error',
      'invalid content',
      'content validation',
      'INVALID_ARGUMENT'
    ];

    const errorText = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    const status = error.status;

    return (
      status === 400 ||
      contentIndicators.some(indicator => 
        errorText.includes(indicator) || errorCode.includes(indicator)
      )
    );
  }

  /**
   * Extracts technical details from error for support
   */
  private extractTechnicalDetails(error: Error): string {
    const details = [];
    
    if (error.message) {
      details.push(`Message: ${error.message}`);
    }
    
    if ('code' in error && error.code) {
      details.push(`Code: ${error.code}`);
    }
    
    if ('status' in error && error.status) {
      details.push(`Status: ${error.status}`);
    }
    
    if ('response' in error && error.response) {
      details.push(`Response: ${JSON.stringify(error.response, null, 2)}`);
    }

    return details.join('\n');
  }

  /**
   * Generates unique error ID for support tracking
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomUUID().split('-')[0];
    return `ERR_${timestamp}_${random}`.toUpperCase();
  }
}

// Export singleton instance
export const errorClassifier = new ErrorClassifier();