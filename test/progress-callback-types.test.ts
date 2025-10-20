import { describe, it, expect } from 'vitest'
import type { ProgressUpdate, ProgressCallback, GenerateOptions } from '../lib/progressive-generator'

describe('Progress Callback Types', () => {
  it('should define ProgressUpdate interface with required fields', () => {
    const update: ProgressUpdate = {
      step: 'Generating vocabulary',
      progress: 25,
      phase: 'vocabulary'
    }

    expect(update.step).toBe('Generating vocabulary')
    expect(update.progress).toBe(25)
    expect(update.phase).toBe('vocabulary')
  })

  it('should support optional section field in ProgressUpdate', () => {
    const update: ProgressUpdate = {
      step: 'Generating vocabulary',
      progress: 25,
      phase: 'vocabulary',
      section: 'examples'
    }

    expect(update.section).toBe('examples')
  })

  it('should define ProgressCallback as a function type', () => {
    const callback: ProgressCallback = (update: ProgressUpdate) => {
      console.log(`${update.step}: ${update.progress}%`)
    }

    expect(typeof callback).toBe('function')
  })

  it('should allow GenerateOptions with onProgress callback', () => {
    const callback: ProgressCallback = (update) => {
      console.log(update.step)
    }

    const options: GenerateOptions = {
      content: 'Test content',
      level: 'B1',
      lessonType: 'discussion',
      onProgress: callback
    }

    expect(options.onProgress).toBe(callback)
  })

  it('should allow GenerateOptions without onProgress callback (optional)', () => {
    const options: GenerateOptions = {
      content: 'Test content',
      level: 'A2',
      lessonType: 'grammar'
    }

    expect(options.onProgress).toBeUndefined()
  })

  it('should support all CEFR levels in GenerateOptions', () => {
    const levels: Array<GenerateOptions['level']> = ['A1', 'A2', 'B1', 'B2', 'C1']

    levels.forEach(level => {
      const options: GenerateOptions = {
        content: 'Test',
        level,
        lessonType: 'discussion'
      }
      expect(options.level).toBe(level)
    })
  })

  it('should support optional targetLanguage and metadata in GenerateOptions', () => {
    const options: GenerateOptions = {
      content: 'Test content',
      level: 'B1',
      lessonType: 'discussion',
      targetLanguage: 'Spanish',
      metadata: { title: 'Test Lesson' }
    }

    expect(options.targetLanguage).toBe('Spanish')
    expect(options.metadata).toEqual({ title: 'Test Lesson' })
  })

  it('should invoke callback with correct ProgressUpdate structure', () => {
    let capturedUpdate: ProgressUpdate | null = null

    const callback: ProgressCallback = (update) => {
      capturedUpdate = update
    }

    const update: ProgressUpdate = {
      step: 'Generating warmup',
      progress: 10,
      phase: 'warmup'
    }

    callback(update)

    expect(capturedUpdate).toEqual(update)
  })
})
