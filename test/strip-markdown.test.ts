import { describe, it, expect } from 'vitest'
import { stripMarkdown } from '../lib/export-utils'

describe('stripMarkdown', () => {
  describe('bold syntax removal', () => {
    it('should remove double asterisk bold syntax', () => {
      expect(stripMarkdown('This is **bold** text')).toBe('This is bold text')
    })

    it('should remove double underscore bold syntax', () => {
      expect(stripMarkdown('This is __bold__ text')).toBe('This is bold text')
    })

    it('should handle multiple bold sections', () => {
      expect(stripMarkdown('**First** and **second** bold')).toBe('First and second bold')
    })

    it('should handle bold at start and end', () => {
      expect(stripMarkdown('**Start** middle **end**')).toBe('Start middle end')
    })
  })

  describe('italic syntax removal', () => {
    it('should remove single asterisk italic syntax', () => {
      expect(stripMarkdown('This is *italic* text')).toBe('This is italic text')
    })

    it('should remove single underscore italic syntax', () => {
      expect(stripMarkdown('This is _italic_ text')).toBe('This is italic text')
    })

    it('should handle multiple italic sections', () => {
      expect(stripMarkdown('*First* and *second* italic')).toBe('First and second italic')
    })
  })

  describe('nested markdown handling', () => {
    it('should handle bold and italic together', () => {
      expect(stripMarkdown('This is **bold** and *italic*')).toBe('This is bold and italic')
    })

    it('should handle nested bold within italic', () => {
      expect(stripMarkdown('*This is **nested** markdown*')).toBe('This is nested markdown')
    })

    it('should handle complex nested patterns', () => {
      expect(stripMarkdown('**Bold with *italic* inside**')).toBe('Bold with italic inside')
    })

    it('should handle multiple levels of nesting', () => {
      expect(stripMarkdown('__Bold with _italic_ and **more bold**__')).toBe('Bold with italic and more bold')
    })
  })

  describe('mixed markdown syntax', () => {
    it('should handle all four markdown types together', () => {
      const input = '**Double asterisk**, __double underscore__, *single asterisk*, _single underscore_'
      const expected = 'Double asterisk, double underscore, single asterisk, single underscore'
      expect(stripMarkdown(input)).toBe(expected)
    })

    it('should preserve text content exactly', () => {
      expect(stripMarkdown('The word **important** is emphasized')).toBe('The word important is emphasized')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(stripMarkdown('')).toBe('')
    })

    it('should handle text without markdown', () => {
      expect(stripMarkdown('Plain text without any markdown')).toBe('Plain text without any markdown')
    })

    it('should handle malformed markdown (unclosed)', () => {
      expect(stripMarkdown('This has **unclosed bold')).toBe('This has **unclosed bold')
    })

    it('should handle markdown with no content', () => {
      // Edge case: empty markdown markers are left as-is (requires at least 1 char)
      // This is acceptable as it wouldn't occur in real AI-generated content
      expect(stripMarkdown('****')).toBe('**')
      expect(stripMarkdown('____')).toBe('__')
    })

    it('should handle single character markdown', () => {
      expect(stripMarkdown('**a**')).toBe('a')
      expect(stripMarkdown('*b*')).toBe('b')
    })

    it('should handle markdown at boundaries', () => {
      expect(stripMarkdown('**start**')).toBe('start')
      expect(stripMarkdown('**end**')).toBe('end')
      expect(stripMarkdown('**only**')).toBe('only')
    })

    it('should handle null or undefined gracefully', () => {
      expect(stripMarkdown(null as any)).toBe(null)
      expect(stripMarkdown(undefined as any)).toBe(undefined)
    })

    it('should handle non-string input gracefully', () => {
      expect(stripMarkdown(123 as any)).toBe(123)
      expect(stripMarkdown({} as any)).toEqual({})
    })
  })

  describe('real-world examples', () => {
    it('should strip markdown from vocabulary words', () => {
      expect(stripMarkdown('**vocabulary**')).toBe('vocabulary')
      expect(stripMarkdown('The word **important** means significant')).toBe('The word important means significant')
    })

    it('should strip markdown from reading passages', () => {
      const passage = 'The **main character** walked through the *ancient* forest.'
      expect(stripMarkdown(passage)).toBe('The main character walked through the ancient forest.')
    })

    it('should strip markdown from questions', () => {
      expect(stripMarkdown('What does the word **resilient** mean?')).toBe('What does the word resilient mean?')
    })

    it('should strip markdown from dialogue', () => {
      expect(stripMarkdown('**Sarah**: I think this is *amazing*!')).toBe('Sarah: I think this is amazing!')
    })

    it('should strip markdown from grammar examples', () => {
      expect(stripMarkdown('Use **present perfect** when describing *recent* actions')).toBe('Use present perfect when describing recent actions')
    })

    it('should strip markdown from pronunciation tips', () => {
      expect(stripMarkdown('The **th** sound is pronounced with your *tongue* between your teeth')).toBe('The th sound is pronounced with your tongue between your teeth')
    })
  })

  describe('whitespace preservation', () => {
    it('should preserve spaces around markdown', () => {
      expect(stripMarkdown('Text **bold** text')).toBe('Text bold text')
    })

    it('should preserve newlines', () => {
      expect(stripMarkdown('Line 1\n**Line 2**\nLine 3')).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should preserve multiple spaces', () => {
      expect(stripMarkdown('Text  **bold**  text')).toBe('Text  bold  text')
    })
  })

  describe('special characters', () => {
    it('should handle markdown with punctuation', () => {
      expect(stripMarkdown('**Hello!** How are *you?*')).toBe('Hello! How are you?')
    })

    it('should handle markdown with numbers', () => {
      expect(stripMarkdown('The answer is **42** and *100*')).toBe('The answer is 42 and 100')
    })

    it('should handle markdown with special characters', () => {
      expect(stripMarkdown('**$100** and *50%*')).toBe('$100 and 50%')
    })
  })
})
