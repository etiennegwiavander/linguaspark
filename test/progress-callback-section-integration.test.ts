import { describe, it, expect, vi } from 'vitest'
import { 
  ProgressiveGeneratorImpl, 
  type ProgressUpdate, 
  type ProgressCallback,
  safeProgressCallback,
  DEFAULT_PHASE_WEIGHTS
} from '../lib/progressive-generator'

describe('Progress Callback Section Integration', () => {
  describe('safeProgressCallback', () => {
    it('should invoke callback with progress update', () => {
      const updates: ProgressUpdate[] = []
      const callback: ProgressCallback = (update) => {
        updates.push(update)
      }

      const update: ProgressUpdate = {
        step: 'Generating warmup',
        progress: 10,
        phase: 'warmup',
        section: 'warmup'
      }

      safeProgressCallback(callback, update)

      expect(updates).toHaveLength(1)
      expect(updates[0]).toEqual(update)
    })

    it('should not throw if callback is undefined', () => {
      const update: ProgressUpdate = {
        step: 'Generating warmup',
        progress: 10,
        phase: 'warmup'
      }

      expect(() => {
        safeProgressCallback(undefined, update)
      }).not.toThrow()
    })

    it('should catch and log callback errors without throwing', () => {
      const errorCallback: ProgressCallback = () => {
        throw new Error('Callback error')
      }

      const update: ProgressUpdate = {
        step: 'Generating warmup',
        progress: 10,
        phase: 'warmup'
      }

      // Should not throw even though callback throws
      expect(() => {
        safeProgressCallback(errorCallback, update)
      }).not.toThrow()
    })
  })

  describe('ProgressiveGeneratorImpl callback setup', () => {
    it('should set progress callback and lesson type', () => {
      const generator = new ProgressiveGeneratorImpl()
      const callback: ProgressCallback = vi.fn()

      generator.setProgressCallback(callback, 'discussion')

      // Verify the callback was set (we can't directly test private fields,
      // but we can verify it doesn't throw)
      expect(() => {
        generator.setProgressCallback(callback, 'discussion')
      }).not.toThrow()
    })

    it('should handle undefined callback', () => {
      const generator = new ProgressiveGeneratorImpl()

      expect(() => {
        generator.setProgressCallback(undefined, 'discussion')
      }).not.toThrow()
    })
  })

  describe('Progress calculation', () => {
    it('should calculate progress based on completed sections', () => {
      const generator = new ProgressiveGeneratorImpl()

      // Calculate progress with no completed sections
      const progress0 = generator.calculateProgress(
        [],
        'warmup',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )
      expect(progress0).toBe(0)

      // Calculate progress with warmup completed
      const progress1 = generator.calculateProgress(
        ['warmup'],
        'vocabulary',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )
      expect(progress1).toBeGreaterThan(0)
      expect(progress1).toBeLessThan(100)

      // Calculate progress with multiple sections completed
      const progress2 = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading'],
        'comprehension',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )
      expect(progress2).toBeGreaterThan(progress1)
      expect(progress2).toBeLessThan(100)
    })

    it('should calculate 100% when all sections are completed', () => {
      const generator = new ProgressiveGeneratorImpl()

      const allSections = ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion', 'wrapup']
      const progress = generator.calculateProgress(
        allSections,
        'wrapup',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )

      expect(progress).toBe(100)
    })

    it('should handle different lesson types with different sections', () => {
      const generator = new ProgressiveGeneratorImpl()

      // Grammar lesson includes grammar section
      const grammarProgress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'grammar'],
        'wrapup',
        'grammar',
        DEFAULT_PHASE_WEIGHTS
      )
      expect(grammarProgress).toBeGreaterThan(0)
      expect(grammarProgress).toBeLessThan(100)

      // Discussion lesson doesn't include grammar
      const discussionProgress = generator.calculateProgress(
        ['warmup', 'vocabulary', 'reading', 'comprehension', 'discussion'],
        'wrapup',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )
      expect(discussionProgress).toBeGreaterThan(0)
      expect(discussionProgress).toBeLessThan(100)
    })

    it('should not count duplicate completed sections', () => {
      const generator = new ProgressiveGeneratorImpl()

      // With duplicates
      const progressWithDupes = generator.calculateProgress(
        ['warmup', 'warmup', 'vocabulary', 'vocabulary'],
        'reading',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )

      // Without duplicates
      const progressWithoutDupes = generator.calculateProgress(
        ['warmup', 'vocabulary'],
        'reading',
        'discussion',
        DEFAULT_PHASE_WEIGHTS
      )

      expect(progressWithDupes).toBe(progressWithoutDupes)
    })

    it('should use custom phase weights', () => {
      const generator = new ProgressiveGeneratorImpl()

      const customWeights = {
        warmup: 50,  // Much higher weight
        vocabulary: 10,
        reading: 10,
        comprehension: 10,
        discussion: 10,
        wrapup: 10
      }

      const progress = generator.calculateProgress(
        ['warmup'],
        'vocabulary',
        'discussion',
        customWeights
      )

      // With warmup having 50% weight, completing it should give ~50% progress
      expect(progress).toBeGreaterThan(40)
      expect(progress).toBeLessThan(60)
    })
  })

  describe('Phase weights configuration', () => {
    it('should have default weights for all standard sections', () => {
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

    it('should have reasonable weight distribution', () => {
      const totalWeight = Object.values(DEFAULT_PHASE_WEIGHTS).reduce((sum, w) => sum + w, 0)
      
      // Total weight should be reasonable (not 0 or negative)
      expect(totalWeight).toBeGreaterThan(0)
      
      // Each weight should be positive
      Object.values(DEFAULT_PHASE_WEIGHTS).forEach(weight => {
        expect(weight).toBeGreaterThan(0)
      })
    })
  })
})
