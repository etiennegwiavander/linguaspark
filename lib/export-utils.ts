import jsPDF from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx"

interface LessonData {
  lessonTitle: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example?: string; examples?: string[] }>
    reading: string
    comprehension: string[]
    discussion: string[]
    dialoguePractice?: {
      instruction: string
      dialogue: Array<{ character: string; line: string }>
      followUpQuestions: string[]
    }
    dialogueFillGap?: {
      instruction: string
      dialogue: Array<{ character: string; line: string; isGap?: boolean }>
      answers: string[]
    }
    grammar: {
      focus: string
      examples: string[]
      exercise: string[]
    }
    pronunciation: {
      word: string
      ipa: string
      practice: string
    }
    wrapup: string[]
  }
}

export class LessonExporter {
  private formatDate(): string {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }



  private validateLessonData(lessonData: LessonData): void {
    console.log('Validating lesson data:', lessonData)

    if (!lessonData) {
      throw new Error('Lesson data is required')
    }
    if (!lessonData.lessonTitle) {
      throw new Error('AI-generated lesson title is required')
    }
    if (!lessonData.lessonType) {
      throw new Error('Lesson type is required')
    }
    if (!lessonData.studentLevel) {
      throw new Error('Student level is required')
    }
    if (!lessonData.targetLanguage) {
      throw new Error('Target language is required')
    }
    if (!lessonData.sections) {
      throw new Error('Lesson sections are required')
    }

    // Validate sections structure with detailed logging
    const sections = lessonData.sections
    console.log('Validating section types:', {
      warmup: { type: typeof sections.warmup, isArray: Array.isArray(sections.warmup), value: sections.warmup },
      vocabulary: { type: typeof sections.vocabulary, isArray: Array.isArray(sections.vocabulary), length: sections.vocabulary?.length },
      reading: { type: typeof sections.reading, length: sections.reading?.length },
      comprehension: { type: typeof sections.comprehension, isArray: Array.isArray(sections.comprehension), length: sections.comprehension?.length },
      discussion: { type: typeof sections.discussion, isArray: Array.isArray(sections.discussion), length: sections.discussion?.length },
      grammar: { type: typeof sections.grammar, hasFocus: !!sections.grammar?.focus },
      pronunciation: { type: typeof sections.pronunciation, hasWord: !!sections.pronunciation?.word },
      wrapup: { type: typeof sections.wrapup, isArray: Array.isArray(sections.wrapup), length: sections.wrapup?.length }
    })

    if (!Array.isArray(sections.warmup)) {
      console.warn('Warmup section is not an array:', sections.warmup)
    }
    if (!Array.isArray(sections.vocabulary)) {
      console.warn('Vocabulary section is not an array:', sections.vocabulary)
    }
    if (typeof sections.reading !== 'string') {
      console.warn('Reading section is not a string:', sections.reading)
    }
    if (!Array.isArray(sections.comprehension)) {
      console.warn('Comprehension section is not an array:', sections.comprehension)
    }
    if (!Array.isArray(sections.discussion)) {
      console.warn('Discussion section is not an array:', sections.discussion)
    }
    if (!sections.grammar || !sections.grammar.focus) {
      console.warn('Grammar section is malformed:', sections.grammar)
    }
    if (!sections.pronunciation || !sections.pronunciation.word) {
      console.warn('Pronunciation section is malformed:', sections.pronunciation)
    }
    if (!Array.isArray(sections.wrapup)) {
      console.warn('Wrapup section is not an array:', sections.wrapup)
    }

    console.log('Lesson data validation completed')
  }

  async exportToPDF(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    try {
      console.log('Starting PDF export with data:', { lessonData, enabledSections })

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF export is only available in browser environment')
      }

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        throw new Error('jsPDF library is not available')
      }

      console.log('Environment checks passed')
      this.validateLessonData(lessonData)

      // Additional validation for enabled sections
      if (!enabledSections || Object.keys(enabledSections).length === 0) {
        throw new Error('No sections enabled for export')
      }

      console.log('Creating jsPDF instance...')
      const pdf = new jsPDF()
      console.log('jsPDF instance created successfully')

      let yPosition = 20
      const pageHeight = pdf.internal.pageSize.height
      const margin = 20
      const lineHeight = 7

      console.log('PDF dimensions:', { pageHeight, margin, lineHeight })

      // Typography hierarchy constants (matching web interface)
      const FONT_SIZES = {
        LESSON_TITLE: 32,      // Primary heading
        SECTION_HEADER: 28,    // Secondary headings
        MAIN_CONTENT: 16,      // Body text
        INSTRUCTIONS: 15,      // Guidance text
        SUPPLEMENTARY: 14      // Answer keys, explanations
      }

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize = FONT_SIZES.MAIN_CONTENT, isBold = false, indent = 0) => {
        try {
          // Sanitize text to prevent PDF errors
          const sanitizedText = text
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ') // Replace special spaces
            .trim()

          if (!sanitizedText) {
            console.warn('Empty text after sanitization, skipping')
            return
          }

          console.log(`Adding text: "${sanitizedText.substring(0, 50)}${sanitizedText.length > 50 ? '...' : ''}"`)

          pdf.setFontSize(fontSize)
          pdf.setFont("helvetica", isBold ? "bold" : "normal")

          const maxWidth = pdf.internal.pageSize.width - margin * 2 - indent
          const lines = pdf.splitTextToSize(sanitizedText, maxWidth)

          for (const line of lines) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage()
              yPosition = 20
            }
            pdf.text(line, margin + indent, yPosition)
            yPosition += lineHeight
          }
          yPosition += 3 // Extra spacing after text block
        } catch (error) {
          console.error('Error adding text to PDF:', error, 'Text:', text)
          throw error
        }
      }

      const addSection = (title: string, content: () => void) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = 20
        }
        addText(title, FONT_SIZES.SECTION_HEADER, true)
        yPosition += 5
        content()
        yPosition += 10
      }

      // Title and metadata
      addText(lessonData.lessonTitle, FONT_SIZES.LESSON_TITLE, true)
      addText(
        `Target Language: ${lessonData.targetLanguage.charAt(0).toUpperCase() + lessonData.targetLanguage.slice(1)}`,
        FONT_SIZES.SUPPLEMENTARY,
      )
      addText(`Generated on: ${this.formatDate()}`, FONT_SIZES.SUPPLEMENTARY)
      yPosition += 10

      // Add sections based on enabled state
      if (enabledSections.warmup && lessonData.sections.warmup) {
        addSection("Warm-up Questions", () => {
          const warmupQuestions = Array.isArray(lessonData.sections.warmup) ? lessonData.sections.warmup : []
          warmupQuestions.forEach((question, index) => {
            addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
        })
      }

      if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
        addSection("Key Vocabulary", () => {
          const vocabularyItems = Array.isArray(lessonData.sections.vocabulary) ? lessonData.sections.vocabulary : []
          vocabularyItems.forEach((item, index) => {
            addText(`${index + 1}. ${item.word}`, FONT_SIZES.MAIN_CONTENT, true, 10)
            addText(`   Meaning: ${item.meaning}`, FONT_SIZES.MAIN_CONTENT, false, 15)

            // Handle both old format (example) and new format (examples array)
            if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
              addText(`   Examples:`, FONT_SIZES.INSTRUCTIONS, true, 15)
              const examples = Array.isArray(item.examples) ? item.examples : []
              examples.forEach((example, exIndex) => {
                addText(`   ${exIndex + 1}. "${example}"`, FONT_SIZES.SUPPLEMENTARY, false, 20)
              })
            } else if (item.example) {
              addText(`   Example: "${item.example}"`, FONT_SIZES.SUPPLEMENTARY, false, 15)
            }
            yPosition += 3
          })
        })
      }

      if (enabledSections.reading && lessonData.sections.reading) {
        addSection("Reading Passage", () => {
          addText(lessonData.sections.reading, FONT_SIZES.MAIN_CONTENT, false, 10)
        })
      }

      if (enabledSections.comprehension && lessonData.sections.comprehension) {
        addSection("Reading Comprehension", () => {
          const comprehensionQuestions = Array.isArray(lessonData.sections.comprehension) ? lessonData.sections.comprehension : []
          comprehensionQuestions.forEach((question, index) => {
            addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
        })
      }

      if (enabledSections.discussion && lessonData.sections.discussion) {
        addSection("Discussion Questions", () => {
          const discussionQuestions = Array.isArray(lessonData.sections.discussion) ? lessonData.sections.discussion : []
          discussionQuestions.forEach((question, index) => {
            addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
        })
      }

      if (enabledSections.dialoguePractice && lessonData.sections.dialoguePractice) {
        addSection("Dialogue Practice", () => {
          const dialogueSection = lessonData.sections.dialoguePractice!
          addText(dialogueSection.instruction, FONT_SIZES.INSTRUCTIONS, false, 10)
          yPosition += 3
          const dialoguePracticeLines = Array.isArray(dialogueSection.dialogue) ? dialogueSection.dialogue : []
          dialoguePracticeLines.forEach((line) => {
            addText(`${line.character}: ${line.line}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
          if (dialogueSection.followUpQuestions && dialogueSection.followUpQuestions.length > 0) {
            yPosition += 5
            addText("Follow-up Questions:", FONT_SIZES.INSTRUCTIONS, true, 10)
            const followUpQuestions = Array.isArray(dialogueSection.followUpQuestions) ? dialogueSection.followUpQuestions : []
            followUpQuestions.forEach((question, index) => {
              addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 15)
            })
          }
        })
      }

      if (enabledSections.dialogueFillGap && lessonData.sections.dialogueFillGap) {
        addSection("Dialogue Fill-in-the-Gap", () => {
          const dialogueSection = lessonData.sections.dialogueFillGap!
          addText(dialogueSection.instruction, FONT_SIZES.INSTRUCTIONS, false, 10)
          yPosition += 3
          const dialogueFillGapLines = Array.isArray(dialogueSection.dialogue) ? dialogueSection.dialogue : []
          dialogueFillGapLines.forEach((line) => {
            addText(`${line.character}: ${line.line}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
          if (dialogueSection.answers && dialogueSection.answers.length > 0) {
            yPosition += 5
            addText("Answer Key:", FONT_SIZES.INSTRUCTIONS, true, 10)
            addText(dialogueSection.answers.join(', '), FONT_SIZES.SUPPLEMENTARY, false, 15)
          }
        })
      }

      if (enabledSections.grammar && lessonData.sections.grammar) {
        addSection("Grammar Focus", () => {
          addText(`Focus: ${lessonData.sections.grammar.focus}`, FONT_SIZES.MAIN_CONTENT, true, 10)
          yPosition += 3
          addText("Examples:", FONT_SIZES.INSTRUCTIONS, true, 10)
          const grammarExamples = Array.isArray(lessonData.sections.grammar.examples) ? lessonData.sections.grammar.examples : []
          grammarExamples.forEach((example, index) => {
            addText(`• ${example}`, FONT_SIZES.SUPPLEMENTARY, false, 15)
          })
          yPosition += 3
          addText("Practice Exercise:", FONT_SIZES.INSTRUCTIONS, true, 10)
          const grammarExercises = Array.isArray(lessonData.sections.grammar.exercise) ? lessonData.sections.grammar.exercise : []
          grammarExercises.forEach((exercise, index) => {
            addText(`${index + 1}. ${exercise}`, FONT_SIZES.MAIN_CONTENT, false, 15)
          })
        })
      }

      if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
        addSection("Pronunciation Practice", () => {
          addText(`Word: ${lessonData.sections.pronunciation.word}`, FONT_SIZES.MAIN_CONTENT, true, 10)
          addText(`IPA: ${lessonData.sections.pronunciation.ipa}`, FONT_SIZES.SUPPLEMENTARY, false, 10)
          addText(`Practice: "${lessonData.sections.pronunciation.practice}"`, FONT_SIZES.MAIN_CONTENT, false, 10)
        })
      }

      if (enabledSections.wrapup && lessonData.sections.wrapup) {
        addSection("Lesson Wrap-up", () => {
          const wrapupQuestions = Array.isArray(lessonData.sections.wrapup) ? lessonData.sections.wrapup : []
          wrapupQuestions.forEach((question, index) => {
            addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
          })
        })
      }

      // Footer
      const pageCount = (pdf as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        pdf.text(`Generated by LinguaSpark - Page ${i} of ${pageCount}`, margin, pageHeight - 10)
      }

      // Download the PDF
      try {
        const fileName = `${lessonData.lessonType}-lesson-${lessonData.studentLevel}-${Date.now()}.pdf`
        console.log('Saving PDF with filename:', fileName)
        pdf.save(fileName)
        console.log('PDF export completed successfully')
      } catch (saveError) {
        console.error('Error saving PDF:', saveError)
        throw new Error(`Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'Unknown save error'}`)
      }
    } catch (error) {
      console.error('PDF export error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        lessonDataKeys: lessonData ? Object.keys(lessonData) : 'No lesson data',
        sectionsKeys: lessonData?.sections ? Object.keys(lessonData.sections) : 'No sections',
        enabledSectionsKeys: enabledSections ? Object.keys(enabledSections) : 'No enabled sections'
      })
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async exportToWord(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    try {
      console.log('Starting Word export with data:', { lessonData, enabledSections })
      this.validateLessonData(lessonData)

      // Additional validation for enabled sections
      if (!enabledSections || Object.keys(enabledSections).length === 0) {
        throw new Error('No sections enabled for export')
      }

      const children: any[] = []

      // Typography hierarchy constants (in half-points for Word - multiply by 2)
      // 32px = 24pt, 28px = 21pt, 16px = 12pt, 15px = 11.25pt, 14px = 10.5pt
      const WORD_FONT_SIZES = {
        LESSON_TITLE: 48,      // 24pt (32px equivalent)
        SECTION_HEADER: 42,    // 21pt (28px equivalent)  
        MAIN_CONTENT: 24,      // 12pt (16px equivalent)
        INSTRUCTIONS: 23,      // 11.5pt (15px equivalent)
        SUPPLEMENTARY: 21      // 10.5pt (14px equivalent)
      }

      // Title and metadata
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: lessonData.lessonTitle,
              bold: true,
              size: WORD_FONT_SIZES.LESSON_TITLE,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Target Language: ${lessonData.targetLanguage.charAt(0).toUpperCase() + lessonData.targetLanguage.slice(1)}`,
              size: WORD_FONT_SIZES.SUPPLEMENTARY,
            }),
          ],
          spacing: { after: 200 },
        }),
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${this.formatDate()}`,
              size: WORD_FONT_SIZES.SUPPLEMENTARY,
            }),
          ],
          spacing: { after: 400 },
        }),
      )

      // Helper function to add section
      const addSection = (title: string, content: any[]) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: WORD_FONT_SIZES.SECTION_HEADER,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
        )
        children.push(...content)
      }

      // Add sections based on enabled state
      if (enabledSections.warmup && lessonData.sections.warmup) {
        const warmupQuestions = Array.isArray(lessonData.sections.warmup) ? lessonData.sections.warmup : []
        const warmupContent = warmupQuestions.map(
          (question, index) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${question}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            }),
        )
        addSection("Warm-up Questions", warmupContent)
      }

      if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
        const vocabContent: any[] = []
        const vocabularyItems = Array.isArray(lessonData.sections.vocabulary) ? lessonData.sections.vocabulary : []
        vocabularyItems.forEach((item, index) => {
          vocabContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${item.word}`,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
          vocabContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `   Meaning: ${item.meaning}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )

          // Handle both old format (example) and new format (examples array)
          if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
            vocabContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   Examples:`,
                    size: WORD_FONT_SIZES.INSTRUCTIONS,
                    bold: true,
                  }),
                ],
                spacing: { after: 100 },
              }),
            )
            // Additional safety check before forEach
            const examples = Array.isArray(item.examples) ? item.examples : []
            examples.forEach((example, exIndex) => {
              vocabContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `      ${exIndex + 1}. "${example}"`,
                      size: WORD_FONT_SIZES.SUPPLEMENTARY,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
              )
            })
            vocabContent.push(
              new Paragraph({
                children: [new TextRun({ text: "" })],
                spacing: { after: 100 },
              }),
            )
          } else if (item.example) {
            vocabContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   Example: "${item.example}"`,
                    size: WORD_FONT_SIZES.SUPPLEMENTARY,
                    italics: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
            )
          }
        })
        addSection("Key Vocabulary", vocabContent)
      }

      if (enabledSections.reading && lessonData.sections.reading) {
        const readingContent = [
          new Paragraph({
            children: [
              new TextRun({
                text: lessonData.sections.reading,
                size: WORD_FONT_SIZES.MAIN_CONTENT,
              }),
            ],
            spacing: { after: 200 },
          }),
        ]
        addSection("Reading Passage", readingContent)
      }

      if (enabledSections.comprehension && lessonData.sections.comprehension) {
        const comprehensionQuestions = Array.isArray(lessonData.sections.comprehension) ? lessonData.sections.comprehension : []
        const comprehensionContent = comprehensionQuestions.map(
          (question, index) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${question}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            }),
        )
        addSection("Reading Comprehension", comprehensionContent)
      }

      if (enabledSections.discussion && lessonData.sections.discussion) {
        const discussionQuestions = Array.isArray(lessonData.sections.discussion) ? lessonData.sections.discussion : []
        const discussionContent = discussionQuestions.map(
          (question, index) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${question}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            }),
        )
        addSection("Discussion Questions", discussionContent)
      }

      if (enabledSections.dialoguePractice && lessonData.sections.dialoguePractice) {
        const dialoguePracticeContent: any[] = []
        const dialogueSection = lessonData.sections.dialoguePractice

        // Add instruction
        dialoguePracticeContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dialogueSection.instruction,
                size: WORD_FONT_SIZES.INSTRUCTIONS,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
        )

        // Add dialogue lines
        const dialogueLines = Array.isArray(dialogueSection.dialogue) ? dialogueSection.dialogue : []
        dialogueLines.forEach((line) => {
          dialoguePracticeContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${line.character}: `,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
                new TextRun({
                  text: line.line,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        })

        // Add follow-up questions if any
        if (dialogueSection.followUpQuestions && dialogueSection.followUpQuestions.length > 0) {
          dialoguePracticeContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Follow-up Questions:",
                  bold: true,
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
          )
          const followUpQuestions = Array.isArray(dialogueSection.followUpQuestions) ? dialogueSection.followUpQuestions : []
          followUpQuestions.forEach((question, index) => {
            dialoguePracticeContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${question}`,
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                ],
                spacing: { after: 100 },
              }),
            )
          })
        }

        addSection("Dialogue Practice", dialoguePracticeContent)
      }

      if (enabledSections.dialogueFillGap && lessonData.sections.dialogueFillGap) {
        const dialogueFillGapContent: any[] = []
        const dialogueSection = lessonData.sections.dialogueFillGap

        // Add instruction
        dialogueFillGapContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dialogueSection.instruction,
                size: WORD_FONT_SIZES.INSTRUCTIONS,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
        )

        // Add dialogue lines
        const dialogueFillGapLines = Array.isArray(dialogueSection.dialogue) ? dialogueSection.dialogue : []
        dialogueFillGapLines.forEach((line) => {
          dialogueFillGapContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${line.character}: `,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
                new TextRun({
                  text: line.line,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        })

        // Add answer key if any
        if (dialogueSection.answers && dialogueSection.answers.length > 0) {
          dialogueFillGapContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Answer Key:",
                  bold: true,
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
          )
          dialogueFillGapContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: dialogueSection.answers.join(', '),
                  size: WORD_FONT_SIZES.SUPPLEMENTARY,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        }

        addSection("Dialogue Fill-in-the-Gap", dialogueFillGapContent)
      }

      if (enabledSections.grammar && lessonData.sections.grammar) {
        const grammarContent: any[] = []
        grammarContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Focus: ${lessonData.sections.grammar.focus}`,
                bold: true,
                size: WORD_FONT_SIZES.MAIN_CONTENT,
              }),
            ],
            spacing: { after: 200 },
          }),
        )
        grammarContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Examples:",
                bold: true,
                size: WORD_FONT_SIZES.INSTRUCTIONS,
              }),
            ],
            spacing: { after: 100 },
          }),
        )
        const grammarExamples = Array.isArray(lessonData.sections.grammar.examples) ? lessonData.sections.grammar.examples : []
        grammarExamples.forEach((example) => {
          grammarContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${example}`,
                  size: WORD_FONT_SIZES.SUPPLEMENTARY,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        })
        grammarContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Practice Exercise:",
                bold: true,
                size: WORD_FONT_SIZES.INSTRUCTIONS,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        )
        const grammarExercises = Array.isArray(lessonData.sections.grammar.exercise) ? lessonData.sections.grammar.exercise : []
        grammarExercises.forEach((exercise, index) => {
          grammarContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${exercise}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        })
        addSection("Grammar Focus", grammarContent)
      }

      if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
        const pronunciationContent = [
          new Paragraph({
            children: [
              new TextRun({
                text: `Word: ${lessonData.sections.pronunciation.word}`,
                bold: true,
                size: WORD_FONT_SIZES.MAIN_CONTENT,
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `IPA: ${lessonData.sections.pronunciation.ipa}`,
                size: WORD_FONT_SIZES.SUPPLEMENTARY,
              }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Practice: "${lessonData.sections.pronunciation.practice}"`,
                size: WORD_FONT_SIZES.MAIN_CONTENT,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
        ]
        addSection("Pronunciation Practice", pronunciationContent)
      }

      if (enabledSections.wrapup && lessonData.sections.wrapup) {
        const wrapupQuestions = Array.isArray(lessonData.sections.wrapup) ? lessonData.sections.wrapup : []
        const wrapupContent = wrapupQuestions.map(
          (question, index) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${question}`,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            }),
        )
        addSection("Lesson Wrap-up", wrapupContent)
      }

      // Footer
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Generated by LinguaSpark",
              size: WORD_FONT_SIZES.SUPPLEMENTARY,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
        }),
      )

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      })

      // Generate and download
      console.log('Creating Word document...')
      const buffer = await Packer.toBuffer(doc)
      console.log('Document buffer created, size:', buffer.byteLength)

      const blob = new Blob([buffer as any], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
      const url = URL.createObjectURL(blob)
      const fileName = `${lessonData.lessonType}-lesson-${lessonData.studentLevel}-${Date.now()}.docx`

      console.log('Downloading Word document with filename:', fileName)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log('Word export completed successfully')
    } catch (error) {
      console.error('Word export error:', error)
      throw new Error(`Word export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const lessonExporter = new LessonExporter()
