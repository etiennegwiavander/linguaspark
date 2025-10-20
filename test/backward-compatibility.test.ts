import { describe, it, expect, vi } from 'vitest'
import { safeProgressCallback, DEFAULT_PHASE_WEIGHTS, type ProgressUpdate, type ProgressCallback } from '../lib/progressive-generator'
import { stripMarkdown, safeStripMarkdown } from '../lib/export-utils'

describe('Backward Compatibility', () => {
  describe('Progress Callback Compatibility', () => {
    it('should handle undefined callback without errors', () => {
      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      expect(() => safeProgressCallback(undefined, update)).not.toThrow()
    })

    it('should invoke callback when provided', () => {
      const mockCallback = vi.fn()
      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      safeProgressCallback(mockCallback, update)
      expect(mockCallback).toHaveBeenCalledWith(update)
    })

    it('should not throw when callback throws error', () => {
      const failingCallback: ProgressCallback = () => {
        throw new Error('Test error')
      }

      const update: ProgressUpdate = {
        step: 'Test',
        progress: 50,
        phase: 'test'
      }

      expect(() => safeProgressCallback(failingCallback, update)).not.toThrow()
    })
  })

  describe('Export Markdown Compatibility', () => {
    it('should handle plain text without markdown', () => {
      const text = 'Plain text'
      expect(stripMarkdown(text)).toBe(text)
    })

    it('should strip bold markdown', () => {
      expect(stripMarkdown('**bold**')).toBe('bold')
      expect(stripMarkdown('__bold__')).toBe('bold')
    })

    it('should strip italic markdown', () => {
      expect(stripMarkdown('*italic*')).toBe('italic')
      expect(stripMarkdown('_italic_')).toBe('italic')
    })

    it('should handle null and undefined', () => {
      expect(stripMarkdown(null as any)).toBe(null)
      expect(stripMarkdown(undefined as any)).toBe(undefined)
    })

    it('should handle empty string', () => {
      expect(stripMarkdown('')).toBe('')
    })

    it('should safely strip markdown with error handling', () => {
      const text = 'Test **bold** text'
      const result = safeStripMarkdown(text)
      expect(result).toBe('Test bold text')
    })
  })

  describe('Phase Weights Configuration', () => {
    it('should have all required phase weights', () => {
      expect(DEFAULT_PHASE_WEIGHTS).toBeDefined()
      expect(DEFAULT_PHASE_WEIGHTS.warmup).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.vocabulary).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.reading).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.comprehension).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.discussion).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.grammar).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.pronunciation).toBeGreaterThan(0)
      expect(DEFAULT_PHASE_WEIGHTS.wrapup).toBeGreaterThan(0)
    })
  })

  describe('Data Structure Compatibility', () => {
    it('should maintain lesson structure with markdown stripping', () => {
      const title = '**Bold Title**'
      const word = '**vocabulary**'
      
      expect(stripMarkdown(title)).toBe('Bold Title')
      expect(stripMarkdown(word)).toBe('vocabulary')
    })

    it('should handle complex lesson data', () => {
      const lessonData = {
        title: '**Lesson** Title',
        vocabulary: [
          { word: '**word1**', meaning: '*meaning*' },
          { word: '__word2__', meaning: '_meaning_' }
        ]
      }

      expect(stripMarkdown(lessonData.title)).toBe('Lesson Title')
      expect(stripMarkdown(lessonData.vocabulary[0].word)).toBe('word1')
      expect(stripMarkdown(lessonData.vocabulary[0].meaning)).toBe('meaning')
      expect(stripMarkdown(lessonData.vocabulary[1].word)).toBe('word2')
      expect(stripMarkdown(lessonData.vocabulary[1].meaning)).toBe('meaning')
    })
  })

  describe('Error Handling', () => {
    it('should handle problematic markdown gracefully', () => {
      const inputs = [
        '**unclosed',
        '*unclosed',
        '***triple***',
        '____quad____'
      ]

      inputs.forEach(input => {
        expect(() => safeStripMarkdown(input)).not.toThrow()
      })
    })
  })

  describe('Performance', () => {
    it('should strip markdown efficiently', () => {
      const longText = '**Bold** and *italic* '.repeat(100)
      
      const start = Date.now()
      const result = stripMarkdown(longText)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      expect(result).not.toContain('**')
      expect(result).not.toContain('*')
    })
  })
})
