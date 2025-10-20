import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LessonExporter, stripMarkdown, safeStripMarkdown } from '../lib/export-utils'

describe('Export Consistency - PDF and Word', () => {
  let exporter: LessonExporter
  let mockLessonData: any

  beforeEach(() => {
    exporter = new LessonExporter()
    
    // Create comprehensive lesson data with various markdown patterns
    mockLessonData = {
      lessonTitle: '**Bold Title** with *italic* and __underline__ and _emphasis_',
      lessonType: 'discussion',
      studentLevel: 'B1',
      targetLanguage: 'spanish',
      id: 'test-lesson-123',
      sections: {
        warmup: [
          'Think about **bold concepts** and *italic ideas*',
          'What is your **favorite** _activity_?',
          'How do you feel about __important__ topics?'
        ],
        vocabulary: [
          {
            word: '**vocabulary** with *markdown*',
            meaning: 'A __definition__ with _emphasis_',
            example: 'This is an **example** with *formatting*',
            examples: [
              'First **bold** example',
              'Second *italic* example',
              'Third __underline__ example'
            ]
          },
          {
            word: 'simple',
            meaning: 'No markdown here',
            example: 'Plain text example'
          }
        ],
        reading: '**Introduction**: This is a *reading passage* with __various__ _markdown_ patterns.\n\nThe **second paragraph** contains *more* __formatting__ _examples_.',
        comprehension: [
          'Answer these **comprehension** questions',
          'What is the **main idea** of the *passage*?',
          'How does the author use __emphasis__ in _writing_?'
        ],
        discussion: [
          'Discuss the following **topics** with *your partner*',
          'What do you think about **climate change** and _sustainability_?',
          'How can we promote __equality__ in *society*?'
        ],
        dialoguePractice: {
          instruction: 'Practice this **dialogue** with *your partner*',
          dialogue: [
            { character: '**Maria**', line: 'Hello, how are you doing *today*?' },
            { character: '__John__', line: 'I am doing _great_, thanks!' }
          ],
          followUpQuestions: [
            'What is **Maria** asking about?',
            'How does _John_ respond?'
          ]
        },
        dialogueFillGap: {
          instruction: 'Fill in the **gaps** with *appropriate* words',
          dialogue: [
            { character: 'Teacher', line: 'What is your **favorite** _____?', isGap: true },
            { character: 'Student', line: 'My favorite is __reading__ *books*.' }
          ],
          answers: ['**hobby**', '*subject*', '__activity__']
        },
        grammar: {
          focus: '**Present Perfect** vs *Simple Past*',
          examples: [
            'I have **visited** Spain *three times*',
            'She __went__ to the _store_ yesterday'
          ],
          exercise: [
            'Complete: I _____ (see) that **movie** *already*',
            'Fill in: They ____ (finish) their _homework_'
          ]
        },
        pronunciation: {
          word: '**difficult**',
          ipa: '/ˈdɪfɪkəlt/',
          practice: 'This is a *difficult* __word__ to _pronounce_',
          words: [
            {
              word: '**pronunciation**',
              ipa: '/prəˌnʌnsiˈeɪʃən/',
              practiceSentence: 'The **pronunciation** is *important*',
              tips: [
                'Focus on the **stress** pattern',
                'Practice the *vowel* sounds'
              ]
            }
          ]
        },
        wrapup: [
          'Reflect on what you **learned** *today*',
          'What was the most __interesting__ _topic_?',
          'How will you **apply** this *knowledge*?'
        ]
      }
    }
  })

  describe('stripMarkdown utility', () => {
    it('should remove bold markdown (**text**)', () => {
      expect(stripMarkdown('**bold text**')).toBe('bold text')
      expect(stripMarkdown('before **bold** after')).toBe('before bold after')
    })

    it('should remove bold markdown (__text__)', () => {
      expect(stripMarkdown('__bold text__')).toBe('bold text')
      expect(stripMarkdown('before __bold__ after')).toBe('before bold after')
    })

    it('should remove italic markdown (*text*)', () => {
      expect(stripMarkdown('*italic text*')).toBe('italic text')
      expect(stripMarkdown('before *italic* after')).toBe('before italic after')
    })

    it('should remove italic markdown (_text_)', () => {
      expect(stripMarkdown('_italic text_')).toBe('italic text')
      expect(stripMarkdown('before _italic_ after')).toBe('before italic after')
    })

    it('should handle nested markdown', () => {
      expect(stripMarkdown('**bold with *italic* inside**')).toBe('bold with italic inside')
      expect(stripMarkdown('__bold with _emphasis_ inside__')).toBe('bold with emphasis inside')
    })

    it('should handle multiple markdown patterns', () => {
      const input = '**bold** and *italic* and __underline__ and _emphasis_'
      const expected = 'bold and italic and underline and emphasis'
      expect(stripMarkdown(input)).toBe(expected)
    })

    it('should handle empty strings', () => {
      expect(stripMarkdown('')).toBe('')
    })

    it('should handle text without markdown', () => {
      expect(stripMarkdown('plain text')).toBe('plain text')
    })

    it('should handle malformed markdown gracefully', () => {
      expect(stripMarkdown('**incomplete')).toBe('**incomplete')
      expect(stripMarkdown('*incomplete')).toBe('*incomplete')
    })
  })

  describe('safeStripMarkdown utility', () => {
    it('should strip markdown successfully', () => {
      expect(safeStripMarkdown('**bold**')).toBe('bold')
    })

    it('should handle errors gracefully', () => {
      // Mock stripMarkdown to throw an error
      const originalStripMarkdown = stripMarkdown
      vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Test with null/undefined
      expect(safeStripMarkdown(null as any)).toBe(null)
      expect(safeStripMarkdown(undefined as any)).toBe(undefined)
      
      vi.restoreAllMocks()
    })

    it('should return original text if stripping fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Test with non-string input
      const result = safeStripMarkdown(123 as any)
      expect(result).toBe(123)
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('PDF Export Markdown Stripping', () => {
    beforeEach(() => {
      // Mock jsPDF
      global.jsPDF = vi.fn().mockImplementation(() => ({
        internal: {
          pageSize: { width: 210, height: 297 },
          getNumberOfPages: () => 1
        },
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        splitTextToSize: vi.fn((text) => [text]),
        addPage: vi.fn(),
        setPage: vi.fn(),
        save: vi.fn(),
        setFillColor: vi.fn(),
        rect: vi.fn(),
        getTextWidth: vi.fn(() => 10)
      })) as any
    })

    it('should strip markdown from lesson title in PDF', async () => {
      const enabledSections = {
        warmup: false,
        vocabulary: false,
        reading: false,
        comprehension: false,
        discussion: false,
        dialoguePractice: false,
        dialogueFillGap: false,
        grammar: false,
        pronunciation: false,
        wrapup: false
      }

      await exporter.exportToPDF(mockLessonData, enabledSections)
      
      // Verify that text method was called with stripped markdown
      const pdfInstance = (global.jsPDF as any).mock.results[0].value
      const textCalls = pdfInstance.text.mock.calls
      
      // Find the title call (should be first)
      const titleCall = textCalls.find((call: any[]) => 
        call[0].includes('Bold Title') && !call[0].includes('**')
      )
      expect(titleCall).toBeDefined()
    })

    it('should strip markdown from all section types in PDF', async () => {
      const enabledSections = {
        warmup: true,
        vocabulary: true,
        reading: true,
        comprehension: true,
        discussion: true,
        dialoguePractice: true,
        dialogueFillGap: true,
        grammar: true,
        pronunciation: true,
        wrapup: true
      }

      await exporter.exportToPDF(mockLessonData, enabledSections)
      
      const pdfInstance = (global.jsPDF as any).mock.results[0].value
      const textCalls = pdfInstance.text.mock.calls
      
      // Verify no markdown syntax remains in any text calls
      textCalls.forEach((call: any[]) => {
        const text = call[0]
        if (typeof text === 'string') {
          expect(text).not.toMatch(/\*\*.*?\*\*/)
          expect(text).not.toMatch(/__.*?__/)
          expect(text).not.toMatch(/\*.*?\*/)
          expect(text).not.toMatch(/_.*?_/)
        }
      })
    })
  })

  describe('Word Export Markdown Stripping', () => {
    beforeEach(() => {
      // Mock docx library
      vi.mock('docx', () => ({
        Document: vi.fn(),
        Packer: {
          toBlob: vi.fn().mockResolvedValue(new Blob())
        },
        Paragraph: vi.fn((config) => config),
        TextRun: vi.fn((config) => config),
        HeadingLevel: {
          TITLE: 'TITLE',
          HEADING_2: 'HEADING_2'
        },
        AlignmentType: {
          CENTER: 'CENTER'
        },
        UnderlineType: {
          SINGLE: 'SINGLE'
        }
      }))

      // Mock file download
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn()
      } as any

      global.document = {
        createElement: vi.fn(() => ({
          click: vi.fn(),
          href: '',
          download: ''
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      } as any
    })

    it('should strip markdown from lesson title in Word', async () => {
      const enabledSections = {
        warmup: false,
        vocabulary: false,
        reading: false,
        comprehension: false,
        discussion: false,
        dialoguePractice: false,
        dialogueFillGap: false,
        grammar: false,
        pronunciation: false,
        wrapup: false
      }

      // Spy on safeStripMarkdown
      const stripSpy = vi.spyOn({ safeStripMarkdown }, 'safeStripMarkdown')

      await exporter.exportToWord(mockLessonData, enabledSections)
      
      // Verify safeStripMarkdown was called with the title
      expect(stripSpy).toHaveBeenCalledWith(expect.stringContaining('Bold Title'))
    })

    it('should strip markdown from all section types in Word', async () => {
      const enabledSections = {
        warmup: true,
        vocabulary: true,
        reading: true,
        comprehension: true,
        discussion: true,
        dialoguePractice: true,
        dialogueFillGap: true,
        grammar: true,
        pronunciation: true,
        wrapup: true
      }

      // Track all TextRun creations
      const textRuns: any[] = []
      const { TextRun } = await import('docx')
      vi.mocked(TextRun).mockImplementation((config: any) => {
        textRuns.push(config)
        return config
      })

      await exporter.exportToWord(mockLessonData, enabledSections)
      
      // Verify no markdown syntax remains in any TextRun
      textRuns.forEach((run) => {
        if (run.text && typeof run.text === 'string') {
          expect(run.text).not.toMatch(/\*\*.*?\*\*/)
          expect(run.text).not.toMatch(/__.*?__/)
          expect(run.text).not.toMatch(/\*.*?\*/)
          expect(run.text).not.toMatch(/_.*?_/)
        }
      })
    })
  })

  describe('Export Format Consistency', () => {
    it('should apply identical markdown stripping logic in both formats', () => {
      const testCases = [
        '**bold text**',
        '*italic text*',
        '__underline text__',
        '_emphasis text_',
        '**bold** and *italic*',
        'nested **bold with *italic* inside**',
        'multiple **bold** and __underline__ and *italic* and _emphasis_'
      ]

      testCases.forEach(testCase => {
        const stripped = stripMarkdown(testCase)
        
        // Verify no markdown remains
        expect(stripped).not.toMatch(/\*\*/)
        expect(stripped).not.toMatch(/__/)
        expect(stripped).not.toMatch(/\*/)
        expect(stripped).not.toMatch(/_/)
        
        // Verify content is preserved
        expect(stripped.length).toBeGreaterThan(0)
        expect(stripped).not.toBe(testCase) // Should be different from input
      })
    })

    it('should handle special characters identically', () => {
      const specialCases = [
        '**text with "quotes"**',
        '*text with \'apostrophes\'*',
        '__text with & ampersand__',
        '_text with < and > symbols_'
      ]

      specialCases.forEach(testCase => {
        const stripped = stripMarkdown(testCase)
        
        // Verify markdown is removed but special chars remain
        expect(stripped).not.toMatch(/\*\*/)
        expect(stripped).not.toMatch(/__/)
        expect(stripped).toMatch(/[\"\'&<>]/) // Special chars should remain
      })
    })

    it('should preserve text content without markdown', () => {
      const plainTexts = [
        'This is plain text',
        'No formatting here',
        'Just regular words'
      ]

      plainTexts.forEach(text => {
        expect(stripMarkdown(text)).toBe(text)
        expect(safeStripMarkdown(text)).toBe(text)
      })
    })
  })

  describe('Comprehensive Section Coverage', () => {
    it('should strip markdown from warmup questions', () => {
      mockLessonData.sections.warmup.forEach((question: string) => {
        const stripped = safeStripMarkdown(question)
        expect(stripped).not.toMatch(/\*\*|\*|__|_/)
      })
    })

    it('should strip markdown from vocabulary items', () => {
      mockLessonData.sections.vocabulary.forEach((item: any) => {
        expect(safeStripMarkdown(item.word)).not.toMatch(/\*\*|\*|__|_/)
        expect(safeStripMarkdown(item.meaning)).not.toMatch(/\*\*|\*|__|_/)
        if (item.example) {
          expect(safeStripMarkdown(item.example)).not.toMatch(/\*\*|\*|__|_/)
        }
        if (item.examples) {
          item.examples.forEach((ex: string) => {
            expect(safeStripMarkdown(ex)).not.toMatch(/\*\*|\*|__|_/)
          })
        }
      })
    })

    it('should strip markdown from reading passage', () => {
      const stripped = safeStripMarkdown(mockLessonData.sections.reading)
      expect(stripped).not.toMatch(/\*\*|\*|__|_/)
    })

    it('should strip markdown from comprehension questions', () => {
      mockLessonData.sections.comprehension.forEach((question: string) => {
        const stripped = safeStripMarkdown(question)
        expect(stripped).not.toMatch(/\*\*|\*|__|_/)
      })
    })

    it('should strip markdown from discussion questions', () => {
      mockLessonData.sections.discussion.forEach((question: string) => {
        const stripped = safeStripMarkdown(question)
        expect(stripped).not.toMatch(/\*\*|\*|__|_/)
      })
    })

    it('should strip markdown from dialogue practice', () => {
      const dialogue = mockLessonData.sections.dialoguePractice
      expect(safeStripMarkdown(dialogue.instruction)).not.toMatch(/\*\*|\*|__|_/)
      
      dialogue.dialogue.forEach((line: any) => {
        expect(safeStripMarkdown(line.character)).not.toMatch(/\*\*|\*|__|_/)
        expect(safeStripMarkdown(line.line)).not.toMatch(/\*\*|\*|__|_/)
      })
      
      dialogue.followUpQuestions.forEach((q: string) => {
        expect(safeStripMarkdown(q)).not.toMatch(/\*\*|\*|__|_/)
      })
    })

    it('should strip markdown from dialogue fill gap', () => {
      const dialogue = mockLessonData.sections.dialogueFillGap
      expect(safeStripMarkdown(dialogue.instruction)).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      
      dialogue.dialogue.forEach((line: any) => {
        expect(safeStripMarkdown(line.character)).not.toMatch(/\*\*.*?\*\*|__.*?__/)
        // Note: Single underscores used as blanks (e.g., "_____") should be preserved
        const stripped = safeStripMarkdown(line.line)
        expect(stripped).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      })
      
      dialogue.answers.forEach((answer: string) => {
        expect(safeStripMarkdown(answer)).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      })
    })

    it('should strip markdown from grammar section', () => {
      const grammar = mockLessonData.sections.grammar
      expect(safeStripMarkdown(grammar.focus)).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      
      grammar.examples.forEach((ex: string) => {
        expect(safeStripMarkdown(ex)).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      })
      
      grammar.exercise.forEach((ex: string) => {
        // Note: Single underscores used as blanks (e.g., "_____") should be preserved
        const stripped = safeStripMarkdown(ex)
        expect(stripped).not.toMatch(/\*\*.*?\*\*|__.*?__/)
      })
    })

    it('should strip markdown from pronunciation section', () => {
      const pron = mockLessonData.sections.pronunciation
      expect(safeStripMarkdown(pron.word)).not.toMatch(/\*\*|\*|__|_/)
      expect(safeStripMarkdown(pron.practice)).not.toMatch(/\*\*|\*|__|_/)
      
      if (pron.words) {
        pron.words.forEach((wordItem: any) => {
          expect(safeStripMarkdown(wordItem.word)).not.toMatch(/\*\*|\*|__|_/)
          expect(safeStripMarkdown(wordItem.practiceSentence)).not.toMatch(/\*\*|\*|__|_/)
          
          if (wordItem.tips) {
            wordItem.tips.forEach((tip: string) => {
              expect(safeStripMarkdown(tip)).not.toMatch(/\*\*|\*|__|_/)
            })
          }
        })
      }
    })

    it('should strip markdown from wrapup questions', () => {
      mockLessonData.sections.wrapup.forEach((question: string) => {
        const stripped = safeStripMarkdown(question)
        expect(stripped).not.toMatch(/\*\*|\*|__|_/)
      })
    })
  })
})
