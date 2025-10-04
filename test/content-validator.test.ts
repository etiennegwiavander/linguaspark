import { describe, it, expect, beforeEach } from 'vitest'
import { ContentValidator } from '@/lib/content-validator'

describe('ContentValidator', () => {
  let validator: ContentValidator

  beforeEach(() => {
    validator = new ContentValidator()
  })

  describe('validateContent', () => {
    it('should validate content with sufficient word count', () => {
      const content = 'This is a test content with more than fifty words to ensure that it meets the minimum requirements for lesson generation. The content should be meaningful and provide enough context for AI to generate quality lessons. This text contains educational value and can be used to create vocabulary, reading passages, and comprehension questions effectively.'
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(result.suggestions).toBeUndefined()
    })

    it('should reject content with insufficient word count', () => {
      const content = 'This is too short'
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Content must be at least 50 words long')
      expect(result.suggestions).toContain('Try selecting more text from the webpage')
    })

    it('should reject empty content', () => {
      const content = ''
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Content cannot be empty')
      expect(result.suggestions).toContain('Please select some text from the webpage')
    })

    it('should reject content with only whitespace', () => {
      const content = '   \n\t   '
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Content cannot be empty')
    })

    it('should handle content with special characters and numbers', () => {
      const content = 'This content has numbers 123 and special characters @#$% but still contains enough meaningful words to be valid for lesson generation. The AI should be able to process this type of content effectively and create educational materials from it.'
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(true)
    })

    it('should reject content that is mostly numbers or special characters', () => {
      const content = '123 456 789 @#$ %^& *() 111 222 333 444 555 666 777 888 999 000'
      
      const result = validator.validateContent(content)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Content must contain meaningful text, not just numbers or symbols')
    })
  })

  describe('getMinimumWordCount', () => {
    it('should return the correct minimum word count', () => {
      expect(validator.getMinimumWordCount()).toBe(50)
    })
  })

  describe('checkContentQuality', () => {
    it('should return high quality score for educational content', () => {
      const content = 'Climate change is one of the most pressing issues of our time. Scientists have observed significant changes in global temperatures, weather patterns, and sea levels over the past century. These changes are primarily attributed to human activities, particularly the emission of greenhouse gases from burning fossil fuels.'
      
      const score = validator.checkContentQuality(content)
      
      expect(score.score).toBeGreaterThan(0.7)
      expect(score.factors.hasEducationalValue).toBe(true)
      expect(score.factors.hasVariedVocabulary).toBe(true)
    })

    it('should return low quality score for repetitive content', () => {
      const content = 'Test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test'
      
      const score = validator.checkContentQuality(content)
      
      expect(score.score).toBeLessThan(0.5)
      expect(score.factors.hasVariedVocabulary).toBe(false)
    })

    it('should identify content with good sentence structure', () => {
      const content = 'The Renaissance was a period of cultural rebirth in Europe. It began in Italy during the 14th century and spread throughout Europe. Artists, scientists, and philosophers made significant contributions during this time. Leonardo da Vinci exemplified the Renaissance ideal of the universal genius.'
      
      const score = validator.checkContentQuality(content)
      
      expect(score.factors.hasGoodStructure).toBe(true)
      expect(score.factors.hasEducationalValue).toBe(true)
    })

    it('should detect content suitable for language learning', () => {
      const content = 'Learning a new language opens doors to different cultures and opportunities. It enhances cognitive abilities and improves communication skills. Regular practice through reading, speaking, and listening is essential for language acquisition. Immersion in the target language environment accelerates the learning process significantly.'
      
      const score = validator.checkContentQuality(content)
      
      expect(score.score).toBeGreaterThan(0.8)
      expect(score.factors.suitableForLanguageLearning).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle very long content', () => {
      const longContent = 'This is a very long piece of content. '.repeat(1000)
      
      const result = validator.validateContent(longContent)
      
      expect(result.isValid).toBe(true)
    })

    it('should handle content with mixed languages', () => {
      const mixedContent = 'This is English text mixed with some français words and español términos. The content should still be valid for lesson generation as it contains sufficient meaningful text in the primary language.'
      
      const result = validator.validateContent(mixedContent)
      
      expect(result.isValid).toBe(true)
    })

    it('should handle content with HTML tags stripped', () => {
      const htmlContent = 'This content originally had HTML tags but they have been removed. It should still be valid for processing and lesson generation purposes.'
      
      const result = validator.validateContent(htmlContent)
      
      expect(result.isValid).toBe(true)
    })
  })
})