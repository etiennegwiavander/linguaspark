import { describe, it, expect } from 'vitest'
import { 
  ProgressiveGeneratorImpl, 
  DEFAULT_PHASE_WEIGHTS,
  type PhaseWeights 
} from '../lib/progressive-generator'

describe('Phase Weight Configuration', () => {
  describe('DEFAULT_PHASE_WEIGHTS', () => {
    it('should define weights for all standard sections', () => {
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('warmup')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('vocabulary')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('reading')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('comprehension')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('discussion')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('dialogue')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('grammar')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('pronunciation')
      expect(DEFAULT_PHASE_WEIGHTS).toHaveProperty('wrapup')
    })

    it('should have positive weights for all sections', () => {
      Object.values(DEFAULT_PHASE_WEIGHTS).forEach(weight => {
        expect(weight).toBeGreaterThan(0)
      })
    })

    it('should have appropriate relative weights', () => {
      // Reading should be one of the heavier sections
      expect(DEFAULT_PHASE_WEIGHTS.reading).toBeGreaterThanOrEqual(15)
      
      // Warmup and wrapup should be lighter
      expect(DEFAULT_PHASE_WEIGHTS.warmup).toBeLessThan(DEFAULT_PHASE_WEIGHTS.reading)
      expect(DEFAULT_PHASE_WEIGHTS.wrapup).toBeLessThan(DEFAULT_PHASE_WEIGHTS.reading)
      
      // Main content sections should have substantial weight
      expect(DEFAULT_PHASE_WEIGHTS.vocabulary).toBeGreaterThanOrEqual(10)
      expect(DEFAULT_PHASE_WEIGHTS.grammar).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Progress Calculation', () => {
    let generator: ProgressiveGeneratorImpl

    beforeEach(() => {
      generator = new ProgressiveGeneratorImpl()
    })

    it('should calculate 0% progress when no sections completed', () => {
      const progress = generator.calculateProgress([], 'warmup', 'discussion')
      expect(progress).toBe(0)
    })

    it('should calculate 100% progress when all sections completed', () => {
      const allSections = ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion', 'wrapup']
      const progress = generator.calculateProgress(allSections, 'wrapup', 'discussion')
      expect(progress).toBe(100)
    })

    it('should calculate proportional progress based on weights', () => {
      // For discussion lesson: warmup, vocabulary, reading, comprehension, discussion, wrapup
      // Weights: 10 + 15 + 20 + 10 + 10 + 5 = 70 total
      
      // After warmup (10/70)
      const progress1 = generator.calculateProgress(['warmup'], 'vocabulary', 'discussion')
      expect(progress1).toBe(14) // 10/70 = 14.3% rounded to 14
      
      // After warmup + vocabulary (25/70)
      const progress2 = generator.calculateProgress(['warmup', 'vocabulary'], 'reading', 'discussion')
      expect(progress2).toBe(36) // 25/70 = 35.7% rounded to 36
      
      // After warmup + vocabulary + reading (45/70)
      const progress3 = generator.calculateProgress(['warmup', 'vocabulary', 'reading'], 'comprehension', 'discussion')
      expect(progress3).toBe(64) // 45/70 = 64.3% rounded to 64
    })

    it('should handle grammar lesson type correctly', () => {
      // Grammar lesson includes: warmup, vocabulary, reading, comprehension, grammar, wrapup
      // Weights: 10 + 15 + 20 + 10 + 15 + 5 = 75 total
      
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading'], 
        'comprehension', 
        'grammar'
      )
      
      // 10 + 15 + 20 = 45/75 = 60%
      expect(progress).toBe(60)
    })

    it('should handle pronunciation lesson type correctly', () => {
      // Pronunciation lesson includes: warmup, vocabulary, reading, comprehension, pronunciation, wrapup
      // Weights: 10 + 15 + 20 + 10 + 15 + 5 = 75 total
      
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary'], 
        'reading', 
        'pronunciation'
      )
      
      // 10 + 15 = 25/75 = 33.3% rounded to 33
      expect(progress).toBe(33)
    })

    it('should handle travel/dialogue lesson type correctly', () => {
      // Travel lesson includes: warmup, vocabulary, reading, comprehension, dialogue, wrapup
      // Weights: 10 + 15 + 20 + 10 + 15 + 5 = 75 total
      
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension'], 
        'dialogue', 
        'travel'
      )
      
      // 10 + 15 + 20 + 10 = 55/75 = 73.3% rounded to 73
      expect(progress).toBe(73)
    })

    it('should ignore completed sections not in lesson type', () => {
      // Discussion lesson doesn't include grammar
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'grammar'], // grammar should be ignored
        'reading', 
        'discussion'
      )
      
      // Only warmup (10) + vocabulary (15) = 25/70 = 35.7% rounded to 36
      expect(progress).toBe(36)
    })

    it('should handle custom phase weights', () => {
      const customWeights: PhaseWeights = {
        warmup: 5,
        vocabulary: 10,
        reading: 30,
        comprehension: 10,
        discussion: 10,
        wrapup: 5
      }
      
      // Total for discussion: 5 + 10 + 30 + 10 + 10 + 5 = 70
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading'], 
        'comprehension', 
        'discussion',
        customWeights
      )
      
      // 5 + 10 + 30 = 45/70 = 64.3% rounded to 64
      expect(progress).toBe(64)
    })

    it('should never exceed 100% progress', () => {
      const allSections = ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion', 'wrapup', 'extra']
      const progress = generator.calculateProgress(allSections, 'complete', 'discussion')
      expect(progress).toBeLessThanOrEqual(100)
    })

    it('should handle unknown lesson types with base sections', () => {
      // Unknown lesson type should use base sections only
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary'], 
        'reading', 
        'unknown-type'
      )
      
      // Base sections: warmup, vocabulary, reading, comprehension, wrapup
      // Weights: 10 + 15 + 20 + 10 + 5 = 60 total
      // Completed: 10 + 15 = 25/60 = 41.7% rounded to 42
      expect(progress).toBe(42)
    })

    it('should handle empty completed sections array', () => {
      const progress = generator.calculateProgress([], 'warmup', 'discussion')
      expect(progress).toBe(0)
    })

    it('should calculate progress for business lesson type', () => {
      // Business lesson includes dialogue like travel
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading'], 
        'comprehension', 
        'business'
      )
      
      // Same as travel: 10 + 15 + 20 = 45/75 = 60%
      expect(progress).toBe(60)
    })
  })

  describe('Active Sections for Lesson Types', () => {
    let generator: ProgressiveGeneratorImpl

    beforeEach(() => {
      generator = new ProgressiveGeneratorImpl()
    })

    it('should include base sections for all lesson types', () => {
      const baseSections = ['warmup', 'vocabulary', 'reading', 'comprehension', 'wrapup']
      
      // Test each lesson type includes base sections
      const lessonTypes = ['discussion', 'grammar', 'pronunciation', 'travel', 'business']
      
      lessonTypes.forEach(lessonType => {
        // We can't directly test the private method, but we can verify through progress calculation
        const progress = generator.calculateProgress(baseSections, 'complete', lessonType)
        expect(progress).toBeGreaterThan(0) // Should have progress if base sections are included
      })
    })

    it('should include discussion section for discussion lessons', () => {
      // Verify discussion section is counted
      const withDiscussion = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion'], 
        'wrapup', 
        'discussion'
      )
      
      const withoutDiscussion = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension'], 
        'wrapup', 
        'discussion'
      )
      
      expect(withDiscussion).toBeGreaterThan(withoutDiscussion)
    })

    it('should include grammar section for grammar lessons', () => {
      const withGrammar = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'grammar'], 
        'wrapup', 
        'grammar'
      )
      
      const withoutGrammar = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension'], 
        'wrapup', 
        'grammar'
      )
      
      expect(withGrammar).toBeGreaterThan(withoutGrammar)
    })

    it('should include pronunciation section for pronunciation lessons', () => {
      const withPronunciation = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'pronunciation'], 
        'wrapup', 
        'pronunciation'
      )
      
      const withoutPronunciation = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension'], 
        'wrapup', 
        'pronunciation'
      )
      
      expect(withPronunciation).toBeGreaterThan(withoutPronunciation)
    })

    it('should include dialogue section for travel lessons', () => {
      const withDialogue = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'dialogue'], 
        'wrapup', 
        'travel'
      )
      
      const withoutDialogue = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension'], 
        'wrapup', 
        'travel'
      )
      
      expect(withDialogue).toBeGreaterThan(withoutDialogue)
    })
  })

  describe('Edge Cases', () => {
    let generator: ProgressiveGeneratorImpl

    beforeEach(() => {
      generator = new ProgressiveGeneratorImpl()
    })

    it('should handle case-insensitive lesson types', () => {
      const progress1 = generator.calculateProgress(['warmup'], 'vocabulary', 'DISCUSSION')
      const progress2 = generator.calculateProgress(['warmup'], 'vocabulary', 'discussion')
      const progress3 = generator.calculateProgress(['warmup'], 'vocabulary', 'Discussion')
      
      expect(progress1).toBe(progress2)
      expect(progress2).toBe(progress3)
    })

    it('should handle sections with zero weight gracefully', () => {
      const customWeights: PhaseWeights = {
        warmup: 0,
        vocabulary: 10,
        reading: 20,
        comprehension: 10,
        discussion: 10,
        wrapup: 5
      }
      
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary'], 
        'reading', 
        'discussion',
        customWeights
      )
      
      // Warmup has 0 weight, so only vocabulary counts: 10/55 = 18.2% rounded to 18
      expect(progress).toBe(18)
    })

    it('should return 0 if all weights are zero', () => {
      const zeroWeights: PhaseWeights = {
        warmup: 0,
        vocabulary: 0,
        reading: 0,
        comprehension: 0,
        discussion: 0,
        wrapup: 0
      }
      
      const progress = generator.calculateProgress(
        ['warmup', 'vocabulary'], 
        'reading', 
        'discussion',
        zeroWeights
      )
      
      expect(progress).toBe(0)
    })

    it('should handle duplicate sections in completed array', () => {
      const progress = generator.calculateProgress(
        ['warmup', 'warmup', 'vocabulary', 'vocabulary'], 
        'reading', 
        'discussion'
      )
      
      // Should count each section only once
      // 10 + 15 = 25/70 = 35.7% rounded to 36
      expect(progress).toBe(36)
    })
  })
})
