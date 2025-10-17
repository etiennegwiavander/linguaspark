import { describe, it, expect, beforeEach } from 'vitest';
import { ContentValidationEngine, ValidationResult, ValidationIssue } from '../lib/content-validation-engine';

describe('ContentValidationEngine', () => {
  let validator: ContentValidationEngine;

  beforeEach(() => {
    validator = new ContentValidationEngine();
  });

  describe('Content Length Validation', () => {
    it('should reject content that is too short', async () => {
      const shortContent = 'This is a very short piece of content with only a few words.';
      
      const result = await validator.validateContent(shortContent);
      
      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('insufficient_content');
      expect(result.issues[0].severity).toBe('error');
      expect(result.issues[0].recoverable).toBe(true);
    });

    it('should accept content with sufficient length', async () => {
      const longContent = `
        This is a comprehensive article about language learning that contains substantial content.
        Language learning is a complex process that involves multiple cognitive skills and strategies.
        Students must develop listening, speaking, reading, and writing abilities simultaneously.
        
        The process requires consistent practice and exposure to authentic materials.
        Research shows that immersion and contextual learning are highly effective approaches.
        Teachers can facilitate learning by providing structured lessons and meaningful activities.
        
        Assessment should be ongoing and include both formative and summative evaluations.
        Technology can enhance the learning experience through interactive tools and resources.
        Cultural understanding is also an important component of language acquisition.
        
        Successful language learners often employ various strategies and maintain motivation.
        The journey requires patience, persistence, and regular practice to achieve fluency.
        Different learning styles may require adapted teaching methods and materials.
      `.repeat(3);
      
      const result = await validator.validateContent(longContent, {
        language: 'en',
        languageConfidence: 0.95,
        contentType: 'article'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.meetsMinimumQuality).toBe(true);
      expect(result.score).toBeGreaterThan(60);
    });
  });

  describe('Language Validation', () => {
    it('should reject unsupported languages', async () => {
      const content = 'This is sufficient content for testing language validation purposes.'.repeat(10);
      
      const result = await validator.validateContent(content, {
        language: 'xyz',
        languageConfidence: 0.9
      });
      
      expect(result.isValid).toBe(false);
      const languageIssue = result.issues.find(issue => issue.type === 'unsupported_language');
      expect(languageIssue).toBeDefined();
      expect(languageIssue?.message).toContain('not currently supported');
    });

    it('should reject content with low language confidence', async () => {
      const content = 'This is sufficient content for testing language validation purposes.'.repeat(10);
      
      const result = await validator.validateContent(content, {
        language: 'en',
        languageConfidence: 0.5
      });
      
      expect(result.isValid).toBe(false);
      const languageIssue = result.issues.find(issue => issue.type === 'unsupported_language');
      expect(languageIssue).toBeDefined();
      expect(languageIssue?.message).toContain('confidence is too low');
    });

    it('should accept supported languages with high confidence', async () => {
      const content = 'This is sufficient content for testing language validation purposes.'.repeat(10);
      
      const result = await validator.validateContent(content, {
        language: 'en',
        languageConfidence: 0.95
      });
      
      const languageIssues = result.issues.filter(issue => issue.type === 'unsupported_language');
      expect(languageIssues).toHaveLength(0);
    });
  });

  describe('Content Quality Validation', () => {
    it('should detect social media content', async () => {
      const socialContent = `
        @user123 this is amazing! #trending #viral
        Posted 2 hours ago
        15 likes, 3 shares, 8 comments
        Reply to this post
        Like this content
      `.repeat(10);
      
      const result = await validator.validateContent(socialContent);
      
      expect(result.isValid).toBe(false);
      const socialIssue = result.issues.find(issue => issue.type === 'social_media_content');
      expect(socialIssue).toBeDefined();
    });

    it('should detect navigation-only content', async () => {
      const navContent = `
        Home
        About
        Contact
        Menu
        Next
        Previous
        Page 1
        Load More
        See All
      `.repeat(10);
      
      const result = await validator.validateContent(navContent);
      
      expect(result.isValid).toBe(false);
      const navIssue = result.issues.find(issue => issue.type === 'navigation_only');
      expect(navIssue).toBeDefined();
    });

    it('should detect high advertising content', async () => {
      const adContent = `
        Buy now! Special offer! Click here for amazing deals!
        Advertisement sponsored content sale discount promotion.
        Subscribe to our newsletter for exclusive offers and deals.
        Affiliate links and promotional content throughout this article.
        Don't miss this limited time offer - buy now before it's gone!
      `.repeat(15);
      
      const result = await validator.validateContent(adContent);
      
      expect(result.isValid).toBe(false);
      const adIssue = result.issues.find(issue => issue.type === 'too_much_advertising');
      expect(adIssue).toBeDefined();
    });

    it('should accept high-quality educational content', async () => {
      const educationalContent = `
        # Understanding Language Acquisition
        
        Language acquisition is a fascinating process that involves complex cognitive mechanisms.
        Research in linguistics and psychology has revealed important insights about how humans learn languages.
        
        ## Key Principles of Language Learning
        
        First, exposure to comprehensible input is crucial for language development.
        Students need to encounter language that is slightly above their current level.
        This concept, known as "i+1" was introduced by Stephen Krashen in his input hypothesis.
        
        Second, meaningful interaction plays a vital role in language acquisition.
        When learners engage in authentic communication, they develop both fluency and accuracy.
        The social aspect of language learning cannot be underestimated.
        
        ## Effective Teaching Strategies
        
        Teachers can employ various strategies to facilitate language learning:
        - Provide comprehensible input through graded materials
        - Create opportunities for meaningful interaction
        - Encourage risk-taking and experimentation with language
        - Offer constructive feedback on both content and form
        
        Research shows that these approaches lead to better learning outcomes.
        Students who receive this type of instruction demonstrate improved proficiency.
      `;
      
      const result = await validator.validateContent(educationalContent, {
        language: 'en',
        languageConfidence: 0.95,
        contentType: 'article',
        url: 'https://education.example.com/language-learning'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.meetsMinimumQuality).toBe(true);
      expect(result.score).toBeGreaterThan(70);
    });
  });

  describe('Error Messages and Recovery Options', () => {
    it('should provide helpful error messages', async () => {
      const shortContent = 'Too short.';
      
      const result = await validator.validateContent(shortContent);
      
      const errorMessage = validator.getErrorMessage(result.issues);
      expect(errorMessage).toContain('too short');
      expect(errorMessage).toContain('words required');
    });

    it('should provide recovery options', async () => {
      const shortContent = 'Too short.';
      
      const result = await validator.validateContent(shortContent);
      
      const recoveryOptions = validator.getRecoveryOptions(result.issues);
      expect(recoveryOptions.length).toBeGreaterThan(0);
      expect(recoveryOptions.some(option => option.includes('manually'))).toBe(true);
      expect(recoveryOptions.some(option => option.includes('copy and paste'))).toBe(true);
    });
  });

  describe('Validation Configuration', () => {
    it('should respect custom configuration', async () => {
      const customValidator = new ContentValidationEngine({
        minWordCount: 50,
        minQualityScore: 40,
        strictMode: false
      });
      
      const content = 'This is a moderate length content piece that should pass with relaxed settings.'.repeat(3);
      
      const result = await customValidator.validateContent(content, {
        language: 'en',
        languageConfidence: 0.9
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should be stricter in strict mode', async () => {
      const strictValidator = new ContentValidationEngine({
        minWordCount: 300,
        minQualityScore: 80,
        strictMode: true
      });
      
      const content = 'This is moderate content that might not pass strict validation.'.repeat(10);
      
      const result = await strictValidator.validateContent(content, {
        language: 'en',
        languageConfidence: 0.9
      });
      
      // Should be more likely to fail in strict mode
      expect(result.score).toBeLessThan(90);
    });
  });

  describe('Quality Metrics Calculation', () => {
    it('should calculate readability scores correctly', async () => {
      const readableContent = `
        This is a well-structured article with clear sentences.
        Each sentence contains an appropriate number of words.
        The content flows naturally and is easy to understand.
        Paragraphs are well-organized and contain related ideas.
      `.repeat(10);
      
      const result = await validator.validateContent(readableContent, {
        language: 'en',
        languageConfidence: 0.95
      });
      
      expect(result.score).toBeGreaterThan(50);
    });

    it('should penalize very long or very short sentences', async () => {
      const poorReadabilityContent = `
        Short. Very short sentences here. Not good. Bad flow. Choppy text.
        This is an extremely long sentence that goes on and on without any clear structure or purpose and contains way too many words which makes it very difficult to read and understand and process for language learners who need clear and concise content.
      `.repeat(10);
      
      const result = await validator.validateContent(poorReadabilityContent, {
        language: 'en',
        languageConfidence: 0.95
      });
      
      expect(result.score).toBeLessThan(70);
    });
  });
});