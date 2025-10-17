import { describe, it, expect, beforeEach } from 'vitest';
import { ContentExtractionValidator, ExtractedContent, ExtractionValidationResult } from '../lib/content-extraction-validator';

describe('ContentExtractionValidator Integration', () => {
  let validator: ContentExtractionValidator;

  beforeEach(() => {
    validator = new ContentExtractionValidator();
  });

  describe('Complete Validation Flow', () => {
    it('should successfully validate high-quality educational content', async () => {
      const content: ExtractedContent = {
        text: `
          # Understanding Machine Learning
          
          Machine learning is a subset of artificial intelligence that enables computers to learn
          and make decisions from data without being explicitly programmed for every scenario.
          This revolutionary technology has transformed numerous industries and continues to evolve rapidly.
          
          ## Core Concepts
          
          At its foundation, machine learning relies on algorithms that can identify patterns
          in large datasets. These patterns allow systems to make predictions or decisions
          about new, unseen data. The process typically involves training a model on historical
          data and then testing its performance on new examples.
          
          There are three main types of machine learning:
          - Supervised learning uses labeled data to train models
          - Unsupervised learning finds patterns in unlabeled data
          - Reinforcement learning learns through trial and error
          
          ## Applications and Impact
          
          Machine learning applications are everywhere in modern life. From recommendation
          systems on streaming platforms to fraud detection in banking, these technologies
          have become integral to how we interact with digital services.
          
          The healthcare industry has particularly benefited from machine learning advances.
          Diagnostic tools can now analyze medical images with remarkable accuracy,
          helping doctors detect diseases earlier and more reliably than ever before.
        `,
        metadata: {
          title: 'Understanding Machine Learning',
          language: 'en',
          languageConfidence: 0.95,
          contentType: 'article',
          url: 'https://education.example.com/ml-basics',
          author: 'Dr. Jane Smith',
          publicationDate: new Date('2024-01-15')
        }
      };

      const result = await validator.validateExtractedContent(content);

      expect(result.success).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.needsUserAction).toBe(false);
      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.meetsMinimumQuality).toBe(true);
      expect(result.validation?.score).toBeGreaterThan(70);
      expect(result.error).toBeUndefined();

      const qualityAssessment = validator.getQualityAssessment(result);
      expect(qualityAssessment?.level).toMatch(/good|excellent/);
      expect(qualityAssessment?.score).toBeGreaterThan(70);
    });

    it('should handle insufficient content with appropriate error handling', async () => {
      const content: ExtractedContent = {
        text: 'This is way too short for any meaningful lesson generation.',
        metadata: {
          language: 'en',
          languageConfidence: 0.9,
          url: 'https://example.com/short-article'
        }
      };

      const result = await validator.validateExtractedContent(content);

      expect(result.success).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.needsUserAction).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('validation_failed');

      const errorDetails = validator.getErrorDetails(result);
      expect(errorDetails?.title).toBe('Content Not Suitable');
      expect(errorDetails?.message).toContain('enough content');
      expect(errorDetails?.recoveryOptions.length).toBeGreaterThan(0);

      const manualOption = errorDetails?.recoveryOptions.find(opt => 
        opt.action === 'manual_selection'
      );
      expect(manualOption).toBeDefined();
      expect(manualOption?.primary).toBe(true);

      const summary = validator.createValidationSummary(result);
      expect(summary.status).toBe('error');
      expect(summary.actionRequired).toBe(true);
    });

    it('should detect and handle social media content', async () => {
      const content: ExtractedContent = {
        text: `
          @techguru just posted an amazing thread! 🧵 #AI #MachineLearning
          Posted 3 hours ago • 127 likes • 45 retweets • 23 comments
          
          Reply to @techguru: "This is so insightful! Thanks for sharing 🙏"
          Like this tweet • Retweet • Share • Follow @techguru
          
          Trending now: #TechTalk #Innovation #FutureOfAI
          See what's happening in your area • Discover more tweets
          
          Promoted tweet: "Learn AI in 30 days! Click here for our course 👆"
          Advertisement • Sponsored content • Learn more
        `.repeat(8),
        metadata: {
          language: 'en',
          languageConfidence: 0.85,
          contentType: 'social',
          url: 'https://twitter.com/techguru/status/123'
        }
      };

      const result = await validator.validateExtractedContent(content);

      expect(result.success).toBe(false);
      expect(result.needsUserAction).toBe(true);

      const socialMediaIssue = result.validation?.issues.find(issue => 
        issue.type === 'social_media_content'
      );
      expect(socialMediaIssue).toBeDefined();

      const errorDetails = validator.getErrorDetails(result);
      expect(errorDetails?.message).toContain('Social media');

      const differentPageOption = errorDetails?.recoveryOptions.find(opt => 
        opt.action === 'try_different_page'
      );
      expect(differentPageOption).toBeDefined();
    });

    it('should handle unsupported language content', async () => {
      const content: ExtractedContent = {
        text: `
          Dette er en lang artikkel skrevet på norsk som systemet ikke støtter.
          Språkgjenkjenning bør oppdage at dette er norsk og gi en passende feilmelding.
          Artikkelen inneholder nok tekst til å være en god leksjon, men språket støttes ikke.
          Systemet bør foreslå å finne innhold på et støttet språk i stedet.
          Brukeren bør få klare instruksjoner om hvilke språk som er tilgjengelige.
        `.repeat(15),
        metadata: {
          language: 'no',
          languageConfidence: 0.95,
          contentType: 'article',
          url: 'https://norsk.example.com/artikkel'
        }
      };

      const result = await validator.validateExtractedContent(content);

      expect(result.success).toBe(false);

      const languageIssue = result.validation?.issues.find(issue => 
        issue.type === 'unsupported_language'
      );
      expect(languageIssue).toBeDefined();
      expect(languageIssue?.message).toContain('not currently supported');

      const errorDetails = validator.getErrorDetails(result);
      expect(errorDetails?.message).toContain('language is not supported');

      const languageOption = errorDetails?.recoveryOptions.find(opt => 
        opt.description.includes('supported languages')
      );
      expect(languageOption).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle extraction failures with network errors', () => {
      const networkError = new Error('Failed to fetch: Network timeout');
      const url = 'https://example.com/article';

      const result = validator.handleExtractionFailure(networkError, url);

      expect(result.success).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.needsUserAction).toBe(true);
      expect(result.error?.type).toBe('network_error');
      expect(result.error?.canRetry).toBe(true);

      const errorDetails = validator.getErrorDetails(result);
      expect(errorDetails?.title).toBe('Connection Problem');
      expect(errorDetails?.canRetry).toBe(true);

      const retryOption = errorDetails?.recoveryOptions.find(opt => 
        opt.action === 'retry_extraction'
      );
      expect(retryOption).toBeDefined();
      expect(retryOption?.primary).toBe(true);
    });

    it('should handle permission denied errors without retry', () => {
      const permissionError = new Error('CORS policy: No Access-Control-Allow-Origin header');
      const url = 'https://blocked.example.com/article';

      const result = validator.handleExtractionFailure(permissionError, url);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('permission_denied');
      expect(result.error?.canRetry).toBe(false);

      const errorDetails = validator.getErrorDetails(result);
      expect(errorDetails?.canRetry).toBe(false);

      const retryOption = errorDetails?.recoveryOptions.find(opt => 
        opt.action === 'retry_extraction'
      );
      expect(retryOption).toBeUndefined();

      const manualOption = errorDetails?.recoveryOptions.find(opt => 
        opt.action === 'manual_selection'
      );
      expect(manualOption).toBeDefined();
    });
  });

  describe('Retry Logic Integration', () => {
    it('should manage retry attempts correctly', () => {
      const sessionId = 'example.com';

      // Initial state
      expect(validator.getRetryDelay(sessionId)).toBe(1000);

      // First retry
      validator.recordRetryAttempt(sessionId);
      expect(validator.getRetryDelay(sessionId)).toBe(2000);

      // Second retry
      validator.recordRetryAttempt(sessionId);
      expect(validator.getRetryDelay(sessionId)).toBe(4000);

      // Clear attempts
      validator.clearRetryAttempts(sessionId);
      expect(validator.getRetryDelay(sessionId)).toBe(1000);
    });

    it('should respect retry limits', () => {
      const limitedValidator = new ContentExtractionValidator({
        enableRetry: true
      });

      const sessionId = 'example.com';
      const networkError = new Error('Network timeout');
      const url = 'https://example.com/article';

      // First few retries should be allowed
      for (let i = 0; i < 3; i++) {
        limitedValidator.recordRetryAttempt(sessionId);
        const result = limitedValidator.handleExtractionFailure(networkError, url);
        
        if (i < 2) {
          expect(result.error?.canRetry).toBe(true);
        } else {
          expect(result.error?.canRetry).toBe(false);
        }
      }
    });
  });

  describe('Quality Assessment Integration', () => {
    it('should provide comprehensive quality assessment', async () => {
      const content: ExtractedContent = {
        text: `
          # Climate Change and Environmental Impact
          
          Climate change represents one of the most significant challenges facing humanity today.
          The scientific consensus is clear: human activities are the primary driver of recent
          climate changes, particularly through greenhouse gas emissions from fossil fuel combustion.
          
          ## Understanding the Science
          
          The greenhouse effect is a natural process that keeps Earth warm enough to support life.
          However, human activities have intensified this effect by increasing concentrations
          of greenhouse gases in the atmosphere. Carbon dioxide levels have risen by over 40%
          since pre-industrial times, primarily due to burning fossil fuels.
          
          Temperature records show that the last decade was the warmest on record globally.
          This warming trend is accompanied by melting ice sheets, rising sea levels,
          and more frequent extreme weather events including hurricanes, droughts, and floods.
        `,
        metadata: {
          language: 'en',
          languageConfidence: 0.92,
          contentType: 'article'
        }
      };

      const result = await validator.validateExtractedContent(content);
      const qualityAssessment = validator.getQualityAssessment(result);

      expect(qualityAssessment).toBeDefined();
      expect(qualityAssessment?.score).toBeGreaterThan(50);
      expect(qualityAssessment?.level).toMatch(/fair|good|excellent/);
      expect(qualityAssessment?.strengths.length).toBeGreaterThan(0);

      const feedback = validator.getValidationFeedback(result);
      expect(feedback).toBeDefined();
      expect(feedback?.score).toBe(qualityAssessment?.score);

      const summary = validator.createValidationSummary(result);
      expect(summary.status).toMatch(/success|warning/);
    });

    it('should suggest improvements for low-quality content', async () => {
      const content: ExtractedContent = {
        text: `
          Buy now! Sale! Discount! Click here for deals!
          Advertisement content with lots of promotional material.
          Subscribe now! Limited time offer! Don't miss out!
          Sponsored content and affiliate marketing links everywhere.
          More sales pitches and advertising copy here.
        `.repeat(10),
        metadata: {
          language: 'en',
          languageConfidence: 0.9,
          contentType: 'product'
        }
      };

      const result = await validator.validateExtractedContent(content);
      const improvements = validator.suggestImprovements(result);

      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(suggestion => 
        suggestion.includes('educational') || suggestion.includes('advertising')
      )).toBe(true);

      const qualityAssessment = validator.getQualityAssessment(result);
      expect(qualityAssessment?.level).toMatch(/poor|fair/);
      expect(qualityAssessment?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom validation options', async () => {
      const relaxedValidator = new ContentExtractionValidator({
        minWordCount: 50,
        minQualityScore: 30,
        strictMode: false
      });

      const content: ExtractedContent = {
        text: 'This is a shorter piece of content that might pass with relaxed settings for testing purposes.',
        metadata: {
          language: 'en',
          languageConfidence: 0.9
        }
      };

      const result = await relaxedValidator.validateExtractedContent(content);
      expect(result.success).toBe(true);
    });

    it('should be stricter with strict mode enabled', async () => {
      const strictValidator = new ContentExtractionValidator({
        minWordCount: 300,
        minQualityScore: 80,
        strictMode: true
      });

      const content: ExtractedContent = {
        text: 'This moderate content might not pass strict validation requirements even though it has reasonable quality.'.repeat(8),
        metadata: {
          language: 'en',
          languageConfidence: 0.9
        }
      };

      const result = await strictValidator.validateExtractedContent(content);
      expect(result.validation?.score).toBeLessThan(90);
    });
  });
});