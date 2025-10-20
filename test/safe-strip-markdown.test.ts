import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeStripMarkdown } from '../lib/export-utils'

describe('safeStripMarkdown', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should successfully strip markdown from valid text', () => {
    expect(safeStripMarkdown('This is **bold** text')).toBe('This is bold text')
  })

  it('should handle bold markdown', () => {
    expect(safeStripMarkdown('**Important** information')).toBe('Important information')
  })

  it('should handle italic markdown', () => {
    expect(safeStripMarkdown('*Emphasized* text')).toBe('Emphasized text')
  })

  it('should handle mixed markdown', () => {
    expect(safeStripMarkdown('**Bold** and *italic* text')).toBe('Bold and italic text')
  })

  it('should not throw when processing text', () => {
    // Test that the function handles all inputs gracefully
    const testText = 'Test **text** with markdown'
    expect(() => safeStripMarkdown(testText)).not.toThrow()
    const result = safeStripMarkdown(testText)
    expect(result).toBe('Test text with markdown')
  })

  it('should handle errors gracefully without throwing', () => {
    // Test that the function handles all inputs gracefully without throwing
    const testCases = [
      'Test text',
      '**Bold** text',
      '*Italic* text',
      '**Complex** *nested* __markdown__'
    ]
    
    testCases.forEach(testCase => {
      expect(() => safeStripMarkdown(testCase)).not.toThrow()
    })
  })

  it('should handle empty string safely', () => {
    expect(safeStripMarkdown('')).toBe('')
  })

  it('should handle null/undefined safely', () => {
    expect(safeStripMarkdown(null as any)).toBe(null)
    expect(safeStripMarkdown(undefined as any)).toBe(undefined)
  })

  it('should handle very long text', () => {
    const longText = '**Bold** '.repeat(1000)
    const result = safeStripMarkdown(longText)
    expect(result).toBe('Bold '.repeat(1000))
  })

  it('should handle special characters', () => {
    expect(safeStripMarkdown('**Text with émojis 🎉**')).toBe('Text with émojis 🎉')
  })

  it('should handle text with line breaks', () => {
    const multilineText = '**First line**\n*Second line*\n__Third line__'
    const expected = 'First line\nSecond line\nThird line'
    expect(safeStripMarkdown(multilineText)).toBe(expected)
  })

  it('should handle malformed markdown gracefully', () => {
    expect(safeStripMarkdown('**Unclosed bold')).toBe('**Unclosed bold')
    expect(safeStripMarkdown('*Unclosed italic')).toBe('*Unclosed italic')
  })

  it('should preserve text structure', () => {
    const text = 'Paragraph 1\n\n**Paragraph 2**\n\nParagraph 3'
    const expected = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
    expect(safeStripMarkdown(text)).toBe(expected)
  })
})

describe('safeStripMarkdown error handling', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should not break export process on error', () => {
    // Test that the function always returns a value
    const inputs = [
      'Normal **text**',
      '',
      null,
      undefined,
      '**Complex** *nested* __markdown__',
      'Text with\nnewlines\nand **formatting**'
    ]

    inputs.forEach(input => {
      expect(() => safeStripMarkdown(input as any)).not.toThrow()
    })
  })

  it('should handle edge cases without throwing', () => {
    const edgeCases = [
      '***Triple asterisks***',
      '___Triple underscores___',
      '**Bold *and italic* together**',
      '*Italic **and bold** together*',
      '**',
      '*',
      '__',
      '_',
      '****',
      '**Bold** *italic* __bold2__ _italic2_'
    ]

    edgeCases.forEach(testCase => {
      expect(() => safeStripMarkdown(testCase)).not.toThrow()
      const result = safeStripMarkdown(testCase)
      expect(result).toBeDefined()
    })
  })

  it('should return original text for non-string types', () => {
    const nonStringInputs = [
      123,
      true,
      false,
      {},
      [],
      () => {}
    ]

    nonStringInputs.forEach(input => {
      const result = safeStripMarkdown(input as any)
      expect(result).toBe(input)
    })
  })
})

describe('safeStripMarkdown integration scenarios', () => {
  it('should handle lesson title with markdown', () => {
    const title = '**Advanced English Grammar**: *Present Perfect Tense*'
    const result = safeStripMarkdown(title)
    expect(result).toBe('Advanced English Grammar: Present Perfect Tense')
  })

  it('should handle vocabulary examples with markdown', () => {
    const example = 'The **cat** sat on the *mat*.'
    const result = safeStripMarkdown(example)
    expect(result).toBe('The cat sat on the mat.')
  })

  it('should handle dialogue lines with markdown', () => {
    const dialogue = '**John**: *Hello*, how are you?'
    const result = safeStripMarkdown(dialogue)
    expect(result).toBe('John: Hello, how are you?')
  })

  it('should handle grammar focus with markdown', () => {
    const focus = 'Using **modal verbs** for *possibility* and __necessity__'
    const result = safeStripMarkdown(focus)
    expect(result).toBe('Using modal verbs for possibility and necessity')
  })

  it('should handle instructions with markdown', () => {
    const instruction = '**Read** the following text carefully and answer the questions in *complete sentences*.'
    const result = safeStripMarkdown(instruction)
    expect(result).toBe('Read the following text carefully and answer the questions in complete sentences.')
  })

  it('should handle pronunciation practice with markdown', () => {
    const practice = 'Practice saying **"through"** with the *correct* pronunciation.'
    const result = safeStripMarkdown(practice)
    expect(result).toBe('Practice saying "through" with the correct pronunciation.')
  })
})
