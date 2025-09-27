import jsPDF from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx"

interface LessonData {
  lessonType: string
  studentLevel: string
  targetLanguage: string
  sections: {
    warmup: string[]
    vocabulary: Array<{ word: string; meaning: string; example: string }>
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

  async exportToPDF(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    const pdf = new jsPDF()
    let yPosition = 20
    const pageHeight = pdf.internal.pageSize.height
    const margin = 20
    const lineHeight = 7

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 12, isBold = false, indent = 0) => {
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
      addText(title, 14, true)
      yPosition += 5
      content()
      yPosition += 10
    }

    // Title and metadata
    addText(this.formatTitle(lessonData), 18, true)
    addText(
      `Target Language: ${lessonData.targetLanguage.charAt(0).toUpperCase() + lessonData.targetLanguage.slice(1)}`,
      12,
    )
    addText(`Generated on: ${this.formatDate()}`, 12)
    yPosition += 10

    // Add sections based on enabled state
    if (enabledSections.warmup && lessonData.sections.warmup) {
      addSection("Warm-up Questions", () => {
        lessonData.sections.warmup.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, 11, false, 10)
        })
      })
    }

    if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
      addSection("Key Vocabulary", () => {
        lessonData.sections.vocabulary.forEach((item, index) => {
          addText(`${index + 1}. ${item.word}`, 12, true, 10)
          addText(`   Meaning: ${item.meaning}`, 11, false, 15)
          addText(`   Example: "${item.example}"`, 11, false, 15)
          yPosition += 3
        })
      })
    }

    if (enabledSections.reading && lessonData.sections.reading) {
      addSection("Reading Passage", () => {
        addText(lessonData.sections.reading, 11, false, 10)
      })
    }

    if (enabledSections.comprehension && lessonData.sections.comprehension) {
      addSection("Reading Comprehension", () => {
        lessonData.sections.comprehension.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, 11, false, 10)
        })
      })
    }

    if (enabledSections.discussion && lessonData.sections.discussion) {
      addSection("Discussion Questions", () => {
        lessonData.sections.discussion.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, 11, false, 10)
        })
      })
    }

    if (enabledSections.grammar && lessonData.sections.grammar) {
      addSection("Grammar Focus", () => {
        addText(`Focus: ${lessonData.sections.grammar.focus}`, 12, true, 10)
        yPosition += 3
        addText("Examples:", 11, true, 10)
        lessonData.sections.grammar.examples.forEach((example, index) => {
          addText(`• ${example}`, 11, false, 15)
        })
        yPosition += 3
        addText("Practice Exercise:", 11, true, 10)
        lessonData.sections.grammar.exercise.forEach((exercise, index) => {
          addText(`${index + 1}. ${exercise}`, 11, false, 15)
        })
      })
    }

    if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
      addSection("Pronunciation Practice", () => {
        addText(`Word: ${lessonData.sections.pronunciation.word}`, 12, true, 10)
        addText(`IPA: ${lessonData.sections.pronunciation.ipa}`, 11, false, 10)
        addText(`Practice: "${lessonData.sections.pronunciation.practice}"`, 11, false, 10)
      })
    }

    if (enabledSections.wrapup && lessonData.sections.wrapup) {
      addSection("Lesson Wrap-up", () => {
        lessonData.sections.wrapup.forEach((question, index) => {
          addText(`${index + 1}. ${question}`, 11, false, 10)
        })
      })
    }

    // Footer
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Generated by LinguaSpark - Page ${i} of ${pageCount}`, margin, pageHeight - 10)
    }

    // Download the PDF
    const fileName = `${lessonData.lessonType}-lesson-${lessonData.studentLevel}-${Date.now()}.pdf`
    pdf.save(fileName)
  }

  async exportToWord(lessonData: LessonData, enabledSections: Record<string, boolean>): Promise<void> {
    const children: any[] = []

    // Title and metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: this.formatTitle(lessonData),
            bold: true,
            size: 32,
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
            size: 24,
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
            size: 24,
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
              size: 28,
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
                size: 22,
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
                size: 24,
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
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),
        )
        vocabContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   Example: "${item.example}"`,
                size: 22,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
        )
      })
      addSection("Key Vocabulary", vocabContent)
    }

    if (enabledSections.reading && lessonData.sections.reading) {
      const readingContent = [
        new Paragraph({
          children: [
            new TextRun({
              text: lessonData.sections.reading,
              size: 22,
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
                size: 22,
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
                size: 22,
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
              size: 24,
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
              size: 22,
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
                size: 22,
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
              size: 22,
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
                size: 22,
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
              size: 24,
            }),
          ],
          spacing: { after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `IPA: ${lessonData.sections.pronunciation.ipa}`,
              size: 22,
            }),
          ],
          spacing: { after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Practice: "${lessonData.sections.pronunciation.practice}"`,
              size: 22,
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
                size: 22,
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
            size: 18,
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
    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${lessonData.lessonType}-lesson-${lessonData.studentLevel}-${Date.now()}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const lessonExporter = new LessonExporter()
