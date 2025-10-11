import jsPDF from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx"

interface LessonData {
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example?: string; examples?: string[] }>
    reading: string
    comprehension: string[]
    discussion: string[]
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

  private formatTitle(lessonData: LessonData): string {
    return `${lessonData.lessonType.charAt(0).toUpperCase() + lessonData.lessonType.slice(1)} Lesson - ${lessonData.studentLevel} Level`
  }

  private validateLessonData(lessonData: LessonData): void {
    if (!lessonData) {
      throw new Error('Lesson data is required')
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
  }

  async exportToPDF(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    try {
      console.log('Starting PDF export with data:', { lessonData, enabledSections })
      this.validateLessonData(lessonData)
      
      const pdf = new jsPDF()
      let yPosition = 20
      const pageHeight = pdf.internal.pageSize.height
      const margin = 20
      const lineHeight = 7

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
      pdf.setFontSize(fontSize)
      pdf.setFont("helvetica", isBold ? "bold" : "normal")

      const maxWidth = pdf.internal.pageSize.width - margin * 2 - indent
      const lines = pdf.splitTextToSize(text, maxWidth)

      for (const line of lines) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, margin + indent, yPosition)
        yPosition += lineHeight
      }
      yPosition += 3 // Extra spacing after text block
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
    addText(this.formatTitle(lessonData), FONT_SIZES.LESSON_TITLE, true)
    addText(
      `Target Language: ${lessonData.targetLanguage.charAt(0).toUpperCase() + lessonData.targetLanguage.slice(1)}`,
      FONT_SIZES.SUPPLEMENTARY,
    )
    addText(`Generated on: ${this.formatDate()}`, FONT_SIZES.SUPPLEMENTARY)
    yPosition += 10

    // Add sections based on enabled state
    if (enabledSections.warmup && lessonData.sections.warmup) {
      addSection("Warm-up Questions", () => {
        lessonData.sections.warmup.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
        })
      })
    }

    if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
      addSection("Key Vocabulary", () => {
        lessonData.sections.vocabulary.forEach((item, index) => {
          addText(`${index + 1}. ${item.word}`, FONT_SIZES.MAIN_CONTENT, true, 10)
          addText(`   Meaning: ${item.meaning}`, FONT_SIZES.MAIN_CONTENT, false, 15)
          
          // Handle both old format (example) and new format (examples array)
          if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
            addText(`   Examples:`, FONT_SIZES.INSTRUCTIONS, true, 15)
            item.examples.forEach((example, exIndex) => {
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
        lessonData.sections.comprehension.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
        })
      })
    }

    if (enabledSections.discussion && lessonData.sections.discussion) {
      addSection("Discussion Questions", () => {
        lessonData.sections.discussion.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, 10)
        })
      })
    }

    if (enabledSections.grammar && lessonData.sections.grammar) {
      addSection("Grammar Focus", () => {
        addText(`Focus: ${lessonData.sections.grammar.focus}`, FONT_SIZES.MAIN_CONTENT, true, 10)
        yPosition += 3
        addText("Examples:", FONT_SIZES.INSTRUCTIONS, true, 10)
        lessonData.sections.grammar.examples.forEach((example, index) => {
          addText(`• ${example}`, FONT_SIZES.SUPPLEMENTARY, false, 15)
        })
        yPosition += 3
        addText("Practice Exercise:", FONT_SIZES.INSTRUCTIONS, true, 10)
        lessonData.sections.grammar.exercise.forEach((exercise, index) => {
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
        lessonData.sections.wrapup.forEach((question, index) => {
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
    const fileName = `${lessonData.lessonType}-lesson-${lessonData.studentLevel}-${Date.now()}.pdf`
    console.log('Saving PDF with filename:', fileName)
    pdf.save(fileName)
    console.log('PDF export completed successfully')
    } catch (error) {
      console.error('PDF export error:', error)
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async exportToWord(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    try {
      console.log('Starting Word export with data:', { lessonData, enabledSections })
      this.validateLessonData(lessonData)
      
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
            text: this.formatTitle(lessonData),
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
      const warmupContent = lessonData.sections.warmup.map(
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
      lessonData.sections.vocabulary.forEach((item, index) => {
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
          item.examples.forEach((example, exIndex) => {
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
      const comprehensionContent = lessonData.sections.comprehension.map(
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
      const discussionContent = lessonData.sections.discussion.map(
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
      lessonData.sections.grammar.examples.forEach((example) => {
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
      lessonData.sections.grammar.exercise.forEach((exercise, index) => {
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
      const wrapupContent = lessonData.sections.wrapup.map(
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
