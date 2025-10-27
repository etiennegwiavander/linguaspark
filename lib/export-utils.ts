import jsPDF from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx"
import { enhanceDialogueWithAvatars } from "./avatar-utils"

/**
 * Strips markdown formatting from text while preserving content.
 * Handles bold syntax (**text**, __text__) and italic syntax (*text*, _text_).
 * Recursively processes nested markdown.
 * 
 * @param text - The text containing markdown syntax
 * @returns The text with markdown syntax removed
 */
export function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  let result = text

  // Remove bold syntax: **text** and __text__
  // Use non-greedy matching to handle nested markdown
  result = result.replace(/\*\*(.+?)\*\*/g, '$1')
  result = result.replace(/__(.+?)__/g, '$1')

  // Remove italic syntax: *text* and _text_
  // Use non-greedy matching to handle nested markdown
  result = result.replace(/\*(.+?)\*/g, '$1')
  result = result.replace(/_(.+?)_/g, '$1')

  return result
}

/**
 * Safely strips markdown formatting from text with error handling.
 * If stripping fails, returns the original text and logs the error.
 * This ensures export processes never break due to markdown stripping failures.
 * 
 * @param text - The text containing markdown syntax
 * @returns The text with markdown syntax removed, or original text if stripping fails
 */
export function safeStripMarkdown(text: string): string {
  try {
    return stripMarkdown(text)
  } catch (error) {
    console.error('Markdown stripping error:', error)
    console.error('Failed text:', text?.substring(0, 100))
    // Return original text if stripping fails to ensure export continues
    return text
  }
}

interface LessonData {
  lessonTitle: string
  lessonType: string
  studentLevel: string
  targetLanguage: string
  id?: string
  isPublicLesson?: boolean
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
      explanation?: {
        form?: string
        usage?: string
        levelNotes?: string
      }
      examples: string[]
      exercise?: string[]
      exercises?: Array<{
        prompt: string
        answer?: string
        explanation?: string
      }>
    }
    pronunciation: {
      instruction?: string
      word?: string
      ipa?: string
      practice?: string
      words?: Array<{
        word: string
        ipa: string
        difficultSounds?: string[]
        tips?: string[]
        practiceSentence?: string
      }>
      tongueTwisters?: Array<{
        text: string
        targetSounds?: string[]
      }>
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
      const addText = (text: string, fontSize = FONT_SIZES.MAIN_CONTENT, isBold = false, isItalic = false, indent = 0) => {
        try {
          // Sanitize text to prevent PDF errors and strip markdown formatting
          const sanitizedText = text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown (**text**)
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown (*text*)
            .replace(/__(.*?)__/g, '$1') // Remove bold markdown (__text__)
            .replace(/_(.*?)_/g, '$1') // Remove italic markdown (_text_)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ') // Replace special spaces
            .trim()

          if (!sanitizedText) {
            console.warn('Empty text after sanitization, skipping')
            return
          }

          console.log(`Adding text: "${sanitizedText.substring(0, 50)}${sanitizedText.length > 50 ? '...' : ''}"`)

          pdf.setFontSize(fontSize)
          // Set font style based on bold and italic flags
          let fontStyle = "normal"
          if (isBold && isItalic) {
            fontStyle = "bolditalic"
          } else if (isBold) {
            fontStyle = "bold"
          } else if (isItalic) {
            fontStyle = "italic"
          }
          pdf.setFont("helvetica", fontStyle)

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
      
      // Add attribution for public lessons
      if (lessonData.isPublicLesson) {
        addText('From LinguaSpark Public Library', FONT_SIZES.SUPPLEMENTARY, false, true)
      }
      
      yPosition += 10

      // Add sections based on enabled state
      if (enabledSections.warmup && lessonData.sections.warmup) {
        addSection("Warm-up Questions", () => {
          const warmupQuestions = Array.isArray(lessonData.sections.warmup) ? lessonData.sections.warmup : []
          warmupQuestions.forEach((question, index) => {
            // First item is the instruction with light green background (italic) - manual rendering
            if (index === 0) {
              pdf.setFillColor(238, 247, 220) // #EEF7DC
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "italic")
              
              const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
              const instructionLines = pdf.splitTextToSize(question, instructionWidth)
              const instructionHeight = instructionLines.length * lineHeight + 6
              
              // Draw background rectangle
              pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
              
              // Add instruction text
              for (const line of instructionLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8 // Extra spacing after instruction
            } else {
              // Rest are actual questions (renumber starting from 1)
              addText(`${index}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, false, 10)
            }
          })
        })
      }

      if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
        addSection("Key Vocabulary", () => {
          const vocabularyItems = Array.isArray(lessonData.sections.vocabulary) ? lessonData.sections.vocabulary : []
          let vocabIndex = 0 // Track actual vocabulary item numbering
          vocabularyItems.forEach((item, index) => {
            // First item might be an instruction
            if (index === 0 && item.word === "INSTRUCTION") {
              pdf.setFillColor(241, 250, 255) // #F1FAFF
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "italic")
              
              const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
              const instructionLines = pdf.splitTextToSize(item.meaning, instructionWidth)
              const instructionHeight = instructionLines.length * lineHeight + 6
              
              // Draw background rectangle
              pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
              
              // Add instruction text
              for (const line of instructionLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8 // Extra spacing after instruction
              return
            }

            vocabIndex++
            addText(`${vocabIndex}. ${item.word}`, FONT_SIZES.MAIN_CONTENT, true, false, 10)
            addText(`   Meaning: ${item.meaning}`, FONT_SIZES.MAIN_CONTENT, false, false, 15)

            // Handle both old format (example) and new format (examples array)
            if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
              addText(`   Examples:`, FONT_SIZES.INSTRUCTIONS, true, false, 15)
              const examples = Array.isArray(item.examples) ? item.examples : []
              examples.forEach((example, exIndex) => {
                addText(`   ${exIndex + 1}. "${example}"`, FONT_SIZES.SUPPLEMENTARY, false, false, 20)
              })
            } else if (item.example) {
              addText(`   Example: "${item.example}"`, FONT_SIZES.SUPPLEMENTARY, false, false, 15)
            }
            yPosition += 3
          })
        })
      }

      if (enabledSections.reading && lessonData.sections.reading) {
        addSection("Reading Passage", () => {
          const readingContent = lessonData.sections.reading
          const parts = readingContent.split('\n\n')

          // Check if first part is an instruction
          if (parts.length > 1 && parts[0].includes('Read the following text carefully')) {
            // Add instruction with light green background (italic) - manual rendering
            pdf.setFillColor(238, 247, 220) // #EEF7DC
            pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
            pdf.setFont("helvetica", "italic")
            
            const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
            const instructionLines = pdf.splitTextToSize(parts[0], instructionWidth)
            const instructionHeight = instructionLines.length * lineHeight + 6
            
            // Draw background rectangle
            pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
            
            // Add instruction text
            for (const line of instructionLines) {
              pdf.text(line, margin + 10, yPosition)
              yPosition += lineHeight
            }
            yPosition += 8 // Extra spacing after instruction

            // Add the rest of the reading passage
            addText(parts.slice(1).join('\n\n'), FONT_SIZES.MAIN_CONTENT, false, false, 10)
          } else {
            // No instruction, display as before
            addText(readingContent, FONT_SIZES.MAIN_CONTENT, false, false, 10)
          }
        })
      }

      if (enabledSections.comprehension && lessonData.sections.comprehension) {
        addSection("Reading Comprehension", () => {
          const comprehensionQuestions = Array.isArray(lessonData.sections.comprehension) ? lessonData.sections.comprehension : []
          comprehensionQuestions.forEach((question, index) => {
            // First item is the instruction with light blue background (italic) - manual rendering
            if (index === 0) {
              pdf.setFillColor(241, 250, 255) // #F1FAFF
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "italic")
              
              const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
              const instructionLines = pdf.splitTextToSize(question, instructionWidth)
              const instructionHeight = instructionLines.length * lineHeight + 6
              
              // Draw background rectangle
              pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
              
              // Add instruction text
              for (const line of instructionLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8 // Extra spacing after instruction
            } else {
              // Rest are actual questions (renumber starting from 1)
              addText(`${index}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, false, 10)
            }
          })
        })
      }

      if (enabledSections.discussion && lessonData.sections.discussion) {
        addSection("Discussion Questions", () => {
          const discussionQuestions = Array.isArray(lessonData.sections.discussion) ? lessonData.sections.discussion : []
          discussionQuestions.forEach((question, index) => {
            // First item is the instruction with light green background (italic) - manual rendering
            if (index === 0) {
              pdf.setFillColor(238, 247, 220) // #EEF7DC
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "italic")
              
              const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
              const instructionLines = pdf.splitTextToSize(question, instructionWidth)
              const instructionHeight = instructionLines.length * lineHeight + 6
              
              // Draw background rectangle
              pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
              
              // Add instruction text
              for (const line of instructionLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8 // Extra spacing after instruction
            } else {
              // Rest are actual questions (renumber starting from 1)
              addText(`${index}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, false, 10)
            }
          })
        })
      }

      if (enabledSections.dialoguePractice && lessonData.sections.dialoguePractice) {
        addSection("Dialogue Practice", () => {
          const dialogueSection = lessonData.sections.dialoguePractice!
          
          // Add instruction with light green background color (italic) - manually without addText
          pdf.setFillColor(238, 247, 220) // #EEF7DC
          pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
          pdf.setFont("helvetica", "italic")
          
          const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
          const instructionLines = pdf.splitTextToSize(dialogueSection.instruction, instructionWidth)
          const instructionHeight = instructionLines.length * lineHeight + 6
          
          // Draw background rectangle
          pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
          
          // Add instruction text
          for (const line of instructionLines) {
            pdf.text(line, margin + 10, yPosition)
            yPosition += lineHeight
          }
          yPosition += 8 // Extra spacing after instruction before dialogue starts
          
          // Enhance dialogue with avatar names
          const enhancedDialogue = enhanceDialogueWithAvatars(
            dialogueSection.dialogue,
            lessonData.id,
            'dialoguePractice'
          )
          
          // Add dialogue lines with character names and spacing
          const dialoguePracticeLines = Array.isArray(enhancedDialogue) ? enhancedDialogue : []
          dialoguePracticeLines.forEach((line, index) => {
            // Add 3px gap between dialogue lines (except first)
            if (index > 0) {
              yPosition += 3
            }
            
            // Character name in bold, then line
            pdf.setFontSize(FONT_SIZES.MAIN_CONTENT)
            pdf.setFont("helvetica", "bold")
            const charWidth = pdf.getTextWidth(`${line.character}: `)
            pdf.text(`${line.character}: `, margin + 10, yPosition)
            
            pdf.setFont("helvetica", "normal")
            const maxWidth = pdf.internal.pageSize.width - margin * 2 - 10 - charWidth
            const lineText = pdf.splitTextToSize(line.line, maxWidth)
            pdf.text(lineText[0], margin + 10 + charWidth, yPosition)
            yPosition += lineHeight
            
            // Handle wrapped lines
            for (let i = 1; i < lineText.length; i++) {
              if (yPosition > pageHeight - 30) {
                pdf.addPage()
                yPosition = 20
              }
              pdf.text(lineText[i], margin + 10 + charWidth, yPosition)
              yPosition += lineHeight
            }
          })
          
          if (dialogueSection.followUpQuestions && dialogueSection.followUpQuestions.length > 0) {
            yPosition += 5
            addText("Follow-up Questions:", FONT_SIZES.INSTRUCTIONS, true, false, 10)
            const followUpQuestions = Array.isArray(dialogueSection.followUpQuestions) ? dialogueSection.followUpQuestions : []
            followUpQuestions.forEach((question, index) => {
              addText(`${index + 1}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, false, 15)
            })
          }
        })
      }

      if (enabledSections.dialogueFillGap && lessonData.sections.dialogueFillGap) {
        addSection("Dialogue Fill-in-the-Gap", () => {
          const dialogueSection = lessonData.sections.dialogueFillGap!
          
          // Add instruction with light blue background color (italic) - manually without addText
          pdf.setFillColor(241, 250, 255) // #F1FAFF
          pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
          pdf.setFont("helvetica", "italic")
          
          const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
          const instructionLines = pdf.splitTextToSize(dialogueSection.instruction, instructionWidth)
          const instructionHeight = instructionLines.length * lineHeight + 6
          
          // Draw background rectangle
          pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
          
          // Add instruction text
          for (const line of instructionLines) {
            pdf.text(line, margin + 10, yPosition)
            yPosition += lineHeight
          }
          yPosition += 8 // Extra spacing after instruction before dialogue starts
          
          // Enhance dialogue with avatar names
          const enhancedDialogue = enhanceDialogueWithAvatars(
            dialogueSection.dialogue,
            lessonData.id,
            'dialogueFillGap'
          )
          
          // Add dialogue lines with character names and spacing
          const dialogueFillGapLines = Array.isArray(enhancedDialogue) ? enhancedDialogue : []
          dialogueFillGapLines.forEach((line, index) => {
            // Add 3px gap between dialogue lines (except first)
            if (index > 0) {
              yPosition += 3
            }
            
            // Character name in bold, then line
            pdf.setFontSize(FONT_SIZES.MAIN_CONTENT)
            pdf.setFont("helvetica", "bold")
            const charWidth = pdf.getTextWidth(`${line.character}: `)
            pdf.text(`${line.character}: `, margin + 10, yPosition)
            
            pdf.setFont("helvetica", "normal")
            const maxWidth = pdf.internal.pageSize.width - margin * 2 - 10 - charWidth
            const lineText = pdf.splitTextToSize(line.line, maxWidth)
            pdf.text(lineText[0], margin + 10 + charWidth, yPosition)
            yPosition += lineHeight
            
            // Handle wrapped lines
            for (let i = 1; i < lineText.length; i++) {
              if (yPosition > pageHeight - 30) {
                pdf.addPage()
                yPosition = 20
              }
              pdf.text(lineText[i], margin + 10 + charWidth, yPosition)
              yPosition += lineHeight
            }
          })
          
          if (dialogueSection.answers && dialogueSection.answers.length > 0) {
            yPosition += 5
            addText("Answer Key:", FONT_SIZES.INSTRUCTIONS, true, false, 10)
            addText(dialogueSection.answers.join(', '), FONT_SIZES.SUPPLEMENTARY, false, false, 15)
          }
        })
      }

      if (enabledSections.grammar && lessonData.sections.grammar) {
        addSection("Grammar Focus", () => {
          addText(lessonData.sections.grammar.focus, FONT_SIZES.MAIN_CONTENT, true, false, 10)
          yPosition += 5
          
          // Grammar Explanation (Form, Usage, Notes)
          if (lessonData.sections.grammar.explanation) {
            const explanation = lessonData.sections.grammar.explanation
            
            if (explanation.form) {
              const formWidth = pdf.internal.pageSize.width - margin * 2 - 20
              
              // Calculate heights for background
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              const formTitleLines = pdf.splitTextToSize("Form:", formWidth)
              const formTitleHeight = formTitleLines.length * lineHeight
              
              pdf.setFont("helvetica", "normal")
              const formLines = pdf.splitTextToSize(explanation.form, formWidth)
              const formContentHeight = formLines.length * lineHeight
              
              const totalFormHeight = formTitleHeight + formContentHeight + 8
              
              // Draw background rectangle
              pdf.setFillColor(241, 250, 255) // #F1FAFF light blue
              pdf.rect(margin + 10, yPosition - 4, formWidth, totalFormHeight, 'F')
              
              // Draw title text in black
              pdf.setTextColor(0, 0, 0) // Black text
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              pdf.text("Form:", margin + 10, yPosition)
              yPosition += lineHeight
              
              // Draw content text in black
              pdf.setFont("helvetica", "normal")
              for (const line of formLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 5
            }
            
            if (explanation.usage) {
              const usageWidth = pdf.internal.pageSize.width - margin * 2 - 20
              
              // Calculate heights for background
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              const usageTitleLines = pdf.splitTextToSize("Usage:", usageWidth)
              const usageTitleHeight = usageTitleLines.length * lineHeight
              
              pdf.setFont("helvetica", "normal")
              const usageLines = pdf.splitTextToSize(explanation.usage, usageWidth)
              const usageContentHeight = usageLines.length * lineHeight
              
              const totalUsageHeight = usageTitleHeight + usageContentHeight + 8
              
              // Draw background rectangle
              pdf.setFillColor(241, 250, 255) // #F1FAFF light blue
              pdf.rect(margin + 10, yPosition - 4, usageWidth, totalUsageHeight, 'F')
              
              // Draw title text in black
              pdf.setTextColor(0, 0, 0) // Black text
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              pdf.text("Usage:", margin + 10, yPosition)
              yPosition += lineHeight
              
              // Draw content text in black
              pdf.setFont("helvetica", "normal")
              for (const line of usageLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 5
            }
            
            if (explanation.levelNotes) {
              const noteWidth = pdf.internal.pageSize.width - margin * 2 - 20
              
              // Calculate heights for background
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              const noteTitleLines = pdf.splitTextToSize("Note:", noteWidth)
              const noteTitleHeight = noteTitleLines.length * lineHeight
              
              pdf.setFont("helvetica", "italic")
              const noteLines = pdf.splitTextToSize(explanation.levelNotes, noteWidth)
              const noteContentHeight = noteLines.length * lineHeight
              
              const totalNoteHeight = noteTitleHeight + noteContentHeight + 8
              
              // Draw background rectangle
              pdf.setFillColor(241, 250, 255) // #F1FAFF light blue
              pdf.rect(margin + 10, yPosition - 4, noteWidth, totalNoteHeight, 'F')
              
              // Draw title text in black
              pdf.setTextColor(0, 0, 0) // Black text
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "bold")
              pdf.text("Note:", margin + 10, yPosition)
              yPosition += lineHeight
              
              // Draw content text in black (italic)
              pdf.setFont("helvetica", "italic")
              for (const line of noteLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8
            }
          }
          
          // Examples
          addText("Examples:", FONT_SIZES.INSTRUCTIONS, true, false, 10)
          const grammarExamples = Array.isArray(lessonData.sections.grammar.examples) ? lessonData.sections.grammar.examples : []
          grammarExamples.forEach((example, index) => {
            addText(example, FONT_SIZES.MAIN_CONTENT, false, false, 15)
          })
          yPosition += 5
          
          // Practice Exercises
          addText("Practice Exercises:", FONT_SIZES.INSTRUCTIONS, true, false, 10)
          
          // Check for new format (exercises) or old format (exercise)
          if (lessonData.sections.grammar.exercises && Array.isArray(lessonData.sections.grammar.exercises)) {
            // New format with structured exercises
            lessonData.sections.grammar.exercises.forEach((exercise, index) => {
              addText(`${index + 1}. ${exercise.prompt}`, FONT_SIZES.MAIN_CONTENT, false, false, 15)
              if (exercise.answer) {
                addText(`Answer: ${exercise.answer}`, FONT_SIZES.SUPPLEMENTARY, false, false, 20)
              }
              if (exercise.explanation) {
                addText(exercise.explanation, FONT_SIZES.SUPPLEMENTARY, false, true, 20)
              }
              yPosition += 3
            })
          } else if (lessonData.sections.grammar.exercise && Array.isArray(lessonData.sections.grammar.exercise)) {
            // Old format
            const grammarExercises = lessonData.sections.grammar.exercise
            grammarExercises.forEach((exercise, index) => {
              addText(`${index + 1}. ${exercise}`, FONT_SIZES.MAIN_CONTENT, false, false, 15)
            })
          }
        })
      }

      if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
        addSection("Pronunciation Practice", () => {
          const pronSection = lessonData.sections.pronunciation
          
          // Add instruction if present
          if (pronSection.instruction) {
            const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 20
            
            // Calculate height for background
            pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
            pdf.setFont("helvetica", "italic")
            const instructionLines = pdf.splitTextToSize(pronSection.instruction, instructionWidth)
            const instructionHeight = instructionLines.length * lineHeight + 8
            
            // Draw background rectangle
            pdf.setFillColor(241, 250, 255) // #F1FAFF light blue
            pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
            
            // Draw instruction text in black
            pdf.setTextColor(0, 0, 0)
            for (const line of instructionLines) {
              pdf.text(line, margin + 10, yPosition)
              yPosition += lineHeight
            }
            yPosition += 8
          }
          
          // Handle both old format (single word) and new format (words array)
          if (pronSection.words && Array.isArray(pronSection.words) && pronSection.words.length > 0) {
            // New format with multiple words
            pronSection.words.forEach((wordItem, index) => {
              if (index > 0) yPosition += 8 // Spacing between words
              
              // Check for page break
              if (yPosition > pageHeight - 30) {
                pdf.addPage()
                yPosition = 20
              }
              
              // Word and IPA - use addText for proper wrapping and sanitization
              pdf.setTextColor(0, 0, 0)
              pdf.setFontSize(FONT_SIZES.MAIN_CONTENT)
              pdf.setFont("helvetica", "bold")
              
              const wordText = wordItem.word || 'N/A'
              const ipaText = wordItem.ipa || 'N/A'
              
              // Word on its own line (bold)
              const maxWidth = pdf.internal.pageSize.width - margin * 2 - 20
              const wordLines = pdf.splitTextToSize(wordText, maxWidth)
              wordLines.forEach(line => {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              })
              
              // IPA on next line (normal font, in brackets)
              pdf.setFont("helvetica", "normal")
              pdf.setFontSize(FONT_SIZES.SUPPLEMENTARY)
              const ipaLines = pdf.splitTextToSize(`IPA: [${ipaText}]`, maxWidth)
              ipaLines.forEach(line => {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              })
              yPosition += 3
              
              // Difficult Sounds
              if (wordItem.difficultSounds && wordItem.difficultSounds.length > 0) {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                
                pdf.setTextColor(0, 0, 0)
                pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
                pdf.setFont("helvetica", "normal")
                pdf.text("Difficult Sounds:", margin + 10, yPosition)
                yPosition += lineHeight
                
                pdf.setFontSize(FONT_SIZES.SUPPLEMENTARY)
                const soundsText = wordItem.difficultSounds.map(s => `/${s}/`).join('  ')
                const soundsMaxWidth = pdf.internal.pageSize.width - margin * 2 - 25
                const soundsLines = pdf.splitTextToSize(soundsText, soundsMaxWidth)
                
                soundsLines.forEach(line => {
                  if (yPosition > pageHeight - 30) {
                    pdf.addPage()
                    yPosition = 20
                  }
                  pdf.text(line, margin + 15, yPosition)
                  yPosition += lineHeight
                })
                yPosition += 3
              }
              
              // Pronunciation Tips
              if (wordItem.tips && wordItem.tips.length > 0) {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                
                pdf.setTextColor(0, 0, 0)
                pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
                pdf.setFont("helvetica", "normal")
                pdf.text("Pronunciation Tips:", margin + 10, yPosition)
                yPosition += lineHeight
                
                pdf.setFontSize(FONT_SIZES.SUPPLEMENTARY)
                pdf.setFont("helvetica", "normal")
                
                wordItem.tips.forEach(tip => {
                  // Wrap long tips properly
                  const tipMaxWidth = pdf.internal.pageSize.width - margin * 2 - 25
                  const tipLines = pdf.splitTextToSize(`• ${tip}`, tipMaxWidth)
                  
                  tipLines.forEach((line) => {
                    if (yPosition > pageHeight - 30) {
                      pdf.addPage()
                      yPosition = 20
                    }
                    pdf.text(line, margin + 15, yPosition)
                    yPosition += lineHeight
                  })
                })
                yPosition += 3
              }
              
              // Practice Sentence
              if (wordItem.practiceSentence) {
                if (yPosition > pageHeight - 30) {
                  pdf.addPage()
                  yPosition = 20
                }
                
                pdf.setTextColor(0, 0, 0)
                pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
                pdf.setFont("helvetica", "normal")
                pdf.text("Practice Sentence:", margin + 10, yPosition)
                yPosition += lineHeight
                
                pdf.setFontSize(FONT_SIZES.MAIN_CONTENT)
                const sentenceMaxWidth = pdf.internal.pageSize.width - margin * 2 - 25
                const sentenceLines = pdf.splitTextToSize(wordItem.practiceSentence, sentenceMaxWidth)
                
                sentenceLines.forEach(line => {
                  if (yPosition > pageHeight - 30) {
                    pdf.addPage()
                    yPosition = 20
                  }
                  pdf.text(line, margin + 15, yPosition)
                  yPosition += lineHeight
                })
                yPosition += 3
              }
            })
          } else if (pronSection.word) {
            // Old format with single word
            addText(`Word: ${pronSection.word || 'N/A'}`, FONT_SIZES.MAIN_CONTENT, true, false, 10)
            addText(`IPA: ${pronSection.ipa || 'N/A'}`, FONT_SIZES.SUPPLEMENTARY, false, false, 10)
            if (pronSection.practice) {
              addText(`Practice: "${pronSection.practice}"`, FONT_SIZES.MAIN_CONTENT, false, false, 10)
            }
          } else {
            addText("No pronunciation data available", FONT_SIZES.MAIN_CONTENT, false, false, 10)
          }
        })
      }

      if (enabledSections.wrapup && lessonData.sections.wrapup) {
        addSection("Lesson Wrap-up", () => {
          const wrapupQuestions = Array.isArray(lessonData.sections.wrapup) ? lessonData.sections.wrapup : []
          wrapupQuestions.forEach((question, index) => {
            // First item is the instruction - manual rendering (no numbering)
            if (index === 0) {
              pdf.setFillColor(238, 247, 220) // #EEF7DC
              pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
              pdf.setFont("helvetica", "italic")
              
              const instructionWidth = pdf.internal.pageSize.width - margin * 2 - 10
              const instructionLines = pdf.splitTextToSize(question, instructionWidth)
              const instructionHeight = instructionLines.length * lineHeight + 6
              
              // Draw background rectangle
              pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')
              
              // Add instruction text
              for (const line of instructionLines) {
                pdf.text(line, margin + 10, yPosition)
                yPosition += lineHeight
              }
              yPosition += 8 // Extra spacing after instruction
            } else {
              // Rest are actual questions (renumber starting from 1)
              addText(`${index}. ${question}`, FONT_SIZES.MAIN_CONTENT, false, false, 10)
            }
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
              text: safeStripMarkdown(lessonData.lessonTitle),
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
        const warmupContent = warmupQuestions.map((question, index) => {
          // First item is the instruction with light green background
          if (index === 0) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(question),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "EEF7DC", // Light green background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            })
          } else {
            // Rest are actual questions (renumber starting from 1)
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(`${index}. ${question}`),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            })
          }
        })
        addSection("Warm-up Questions", warmupContent)
      }

      if (enabledSections.vocabulary && lessonData.sections.vocabulary) {
        const vocabContent: any[] = []
        const vocabularyItems = Array.isArray(lessonData.sections.vocabulary) ? lessonData.sections.vocabulary : []
        vocabularyItems.forEach((item, index) => {
          // First item might be an instruction
          if (index === 0 && item.word === "INSTRUCTION") {
            vocabContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(item.meaning),
                    size: WORD_FONT_SIZES.INSTRUCTIONS,
                    italics: true,
                  }),
                ],
                spacing: { after: 200 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
            return
          }

          vocabContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${safeStripMarkdown(item.word)}`,
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
                  text: `   Meaning: ${safeStripMarkdown(item.meaning)}`,
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
                      text: `      ${exIndex + 1}. "${safeStripMarkdown(example)}"`,
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
                    text: `   Example: "${safeStripMarkdown(item.example)}"`,
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
        const readingText = lessonData.sections.reading
        const parts = readingText.split('\n\n')
        const readingContent: any[] = []

        // Check if first part is an instruction
        if (parts.length > 1 && parts[0].includes('Read the following text carefully')) {
          // Add instruction with light green background
          readingContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(parts[0]),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "EEF7DC", // Light green background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            }),
          )

          // Add the rest of the reading passage
          readingContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(parts.slice(1).join('\n\n')),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 200 },
            }),
          )
        } else {
          // No instruction, display as before
          readingContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(readingText),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 200 },
            }),
          )
        }

        addSection("Reading Passage", readingContent)
      }

      if (enabledSections.comprehension && lessonData.sections.comprehension) {
        const comprehensionQuestions = Array.isArray(lessonData.sections.comprehension) ? lessonData.sections.comprehension : []
        const comprehensionContent = comprehensionQuestions.map((question, index) => {
          // First item is the instruction with light blue background
          if (index === 0) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(question),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "F1FAFF", // Light blue background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            })
          } else {
            // Rest are actual questions (renumber starting from 1)
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(`${index}. ${question}`),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            })
          }
        })
        addSection("Reading Comprehension", comprehensionContent)
      }

      if (enabledSections.discussion && lessonData.sections.discussion) {
        const discussionQuestions = Array.isArray(lessonData.sections.discussion) ? lessonData.sections.discussion : []
        const discussionContent = discussionQuestions.map((question, index) => {
          // First item is the instruction with light green background
          if (index === 0) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(question),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "EEF7DC", // Light green background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            })
          } else {
            // Rest are actual questions (renumber starting from 1)
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(`${index}. ${question}`),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            })
          }
        })
        addSection("Discussion Questions", discussionContent)
      }

      if (enabledSections.dialoguePractice && lessonData.sections.dialoguePractice) {
        const dialoguePracticeContent: any[] = []
        const dialogueSection = lessonData.sections.dialoguePractice

        // Add instruction with light green background (#EEF7DC)
        dialoguePracticeContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeStripMarkdown(dialogueSection.instruction),
                size: WORD_FONT_SIZES.INSTRUCTIONS,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
            shading: {
              fill: "EEF7DC", // Light green background
            },
            border: {
              left: {
                color: "CCCCCC",
                size: 6,
                style: "single",
              },
            },
          }),
        )

        // Enhance dialogue with avatar names
        const enhancedDialogue = enhanceDialogueWithAvatars(
          dialogueSection.dialogue,
          lessonData.id,
          'dialoguePractice'
        )

        // Add dialogue lines with character names in bold and 3px spacing between lines
        const dialogueLines = Array.isArray(enhancedDialogue) ? enhancedDialogue : []
        dialogueLines.forEach((line, index) => {
          dialoguePracticeContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${safeStripMarkdown(line.character)}: `,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
                new TextRun({
                  text: safeStripMarkdown(line.line),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { 
                before: index === 0 ? 0 : 60, // 3px gap between lines (60 = 3pt in Word units)
                after: 0 
              },
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
                    text: safeStripMarkdown(`${index + 1}. ${question}`),
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

        // Add instruction with light blue background (#F1FAFF)
        dialogueFillGapContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeStripMarkdown(dialogueSection.instruction),
                size: WORD_FONT_SIZES.INSTRUCTIONS,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
            shading: {
              fill: "F1FAFF", // Light blue background
            },
            border: {
              left: {
                color: "CCCCCC",
                size: 6,
                style: "single",
              },
            },
          }),
        )

        // Enhance dialogue with avatar names
        const enhancedDialogue = enhanceDialogueWithAvatars(
          dialogueSection.dialogue,
          lessonData.id,
          'dialogueFillGap'
        )

        // Add dialogue lines with character names in bold and 3px spacing between lines
        const dialogueFillGapLines = Array.isArray(enhancedDialogue) ? enhancedDialogue : []
        dialogueFillGapLines.forEach((line, index) => {
          dialogueFillGapContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${safeStripMarkdown(line.character)}: `,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
                new TextRun({
                  text: safeStripMarkdown(line.line),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { 
                before: index === 0 ? 0 : 60, // 3px gap between lines (60 = 3pt in Word units)
                after: 0 
              },
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
                  text: safeStripMarkdown(dialogueSection.answers.join(', ')),
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
        
        // Grammar topic/focus
        grammarContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: safeStripMarkdown(lessonData.sections.grammar.focus),
                bold: true,
                size: WORD_FONT_SIZES.MAIN_CONTENT,
              }),
            ],
            spacing: { after: 200 },
          }),
        )
        
        // Grammar Explanation (Form, Usage, Notes)
        if (lessonData.sections.grammar.explanation) {
          const explanation = lessonData.sections.grammar.explanation
          
          if (explanation.form) {
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Form:",
                    bold: true,
                    size: WORD_FONT_SIZES.INSTRUCTIONS,
                  }),
                ],
                spacing: { after: 100 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(explanation.form),
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                ],
                spacing: { after: 150 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
          }
          
          if (explanation.usage) {
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Usage:",
                    bold: true,
                    size: WORD_FONT_SIZES.INSTRUCTIONS,
                  }),
                ],
                spacing: { after: 100 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(explanation.usage),
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                ],
                spacing: { after: 150 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
          }
          
          if (explanation.levelNotes) {
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Note:",
                    bold: true,
                    size: WORD_FONT_SIZES.INSTRUCTIONS,
                  }),
                ],
                spacing: { after: 100 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(explanation.levelNotes),
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                    italics: true,
                  }),
                ],
                spacing: { after: 200 },
                shading: {
                  fill: "F1FAFF", // Light blue background
                },
                border: {
                  left: {
                    color: "CCCCCC",
                    size: 6,
                    style: "single",
                  },
                },
              }),
            )
          }
        }
        
        // Examples
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
                  text: safeStripMarkdown(example),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 100 },
            }),
          )
        })
        
        // Practice Exercises
        grammarContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Practice Exercises:",
                bold: true,
                size: WORD_FONT_SIZES.INSTRUCTIONS,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        )
        
        // Check for new format (exercises) or old format (exercise)
        if (lessonData.sections.grammar.exercises && Array.isArray(lessonData.sections.grammar.exercises)) {
          // New format with structured exercises
          lessonData.sections.grammar.exercises.forEach((exercise, index) => {
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(`${index + 1}. ${exercise.prompt}`),
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                ],
                spacing: { after: 100 },
              }),
            )
            if (exercise.answer) {
              grammarContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Answer: ${safeStripMarkdown(exercise.answer)}`,
                      size: WORD_FONT_SIZES.SUPPLEMENTARY,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
              )
            }
            if (exercise.explanation) {
              grammarContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: safeStripMarkdown(exercise.explanation),
                      size: WORD_FONT_SIZES.SUPPLEMENTARY,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 150 },
                }),
              )
            }
          })
        } else if (lessonData.sections.grammar.exercise && Array.isArray(lessonData.sections.grammar.exercise)) {
          // Old format
          const grammarExercises = lessonData.sections.grammar.exercise
          grammarExercises.forEach((exercise, index) => {
            grammarContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: safeStripMarkdown(`${index + 1}. ${exercise}`),
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                ],
                spacing: { after: 100 },
              }),
            )
          })
        }
        
        addSection("Grammar Focus", grammarContent)
      }

      if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
        const pronSection = lessonData.sections.pronunciation
        const pronunciationContent: any[] = []
        
        // Add instruction if present
        if (pronSection.instruction) {
          pronunciationContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(pronSection.instruction),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "F1FAFF", // Light blue background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            }),
          )
        }
        
        // Handle both old format (single word) and new format (words array)
        if (pronSection.words && Array.isArray(pronSection.words) && pronSection.words.length > 0) {
          // New format with multiple words
          pronSection.words.forEach((wordItem, index) => {
            if (index > 0) {
              // Add spacing between words
              pronunciationContent.push(
                new Paragraph({
                  children: [new TextRun({ text: "" })],
                  spacing: { before: 300 },
                }),
              )
            }
            
            // Word and IPA
            pronunciationContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${safeStripMarkdown(wordItem.word || 'N/A')} `,
                    bold: true,
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                  }),
                  new TextRun({
                    text: `[${safeStripMarkdown(wordItem.ipa || 'N/A')}]`,
                    size: WORD_FONT_SIZES.SUPPLEMENTARY,
                  }),
                ],
                spacing: { after: 150 },
              }),
            )
            
            // Difficult Sounds
            if (wordItem.difficultSounds && wordItem.difficultSounds.length > 0) {
              pronunciationContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Difficult Sounds:",
                      size: WORD_FONT_SIZES.INSTRUCTIONS,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
              )
              pronunciationContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: wordItem.difficultSounds.map(s => `/${s}/`).join('  '),
                      size: WORD_FONT_SIZES.SUPPLEMENTARY,
                    }),
                  ],
                  spacing: { after: 150 },
                }),
              )
            }
            
            // Pronunciation Tips
            if (wordItem.tips && wordItem.tips.length > 0) {
              pronunciationContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Pronunciation Tips:",
                      size: WORD_FONT_SIZES.INSTRUCTIONS,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
              )
              
              wordItem.tips.forEach(tip => {
                pronunciationContent.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${safeStripMarkdown(tip)}`,
                        size: WORD_FONT_SIZES.SUPPLEMENTARY,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                )
              })
            }
            
            // Practice Sentence
            if (wordItem.practiceSentence) {
              pronunciationContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Practice Sentence:",
                      size: WORD_FONT_SIZES.INSTRUCTIONS,
                    }),
                  ],
                  spacing: { before: 150, after: 100 },
                }),
              )
              pronunciationContent.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: safeStripMarkdown(wordItem.practiceSentence),
                      size: WORD_FONT_SIZES.MAIN_CONTENT,
                    }),
                  ],
                  spacing: { after: 150 },
                }),
              )
            }
          })
        } else if (pronSection.word) {
          // Old format with single word
          pronunciationContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Word: ${safeStripMarkdown(pronSection.word || 'N/A')}`,
                  bold: true,
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            }),
          )
          
          pronunciationContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `IPA: ${safeStripMarkdown(pronSection.ipa || 'N/A')}`,
                  size: WORD_FONT_SIZES.SUPPLEMENTARY,
                }),
              ],
              spacing: { after: 150 },
            }),
          )
          
          if (pronSection.practice) {
            pronunciationContent.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Practice: "${safeStripMarkdown(pronSection.practice)}"`,
                    size: WORD_FONT_SIZES.MAIN_CONTENT,
                    italics: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
            )
          }
        } else {
          pronunciationContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "No pronunciation data available",
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 200 },
            }),
          )
        }
        
        addSection("Pronunciation Practice", pronunciationContent)
      }

      if (enabledSections.wrapup && lessonData.sections.wrapup) {
        const wrapupQuestions = Array.isArray(lessonData.sections.wrapup) ? lessonData.sections.wrapup : []
        const wrapupContent = wrapupQuestions.map((question, index) => {
          // First item is the instruction with light green background
          if (index === 0) {
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(question),
                  size: WORD_FONT_SIZES.INSTRUCTIONS,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
              shading: {
                fill: "EEF7DC", // Light green background
              },
              border: {
                left: {
                  color: "CCCCCC",
                  size: 6,
                  style: "single",
                },
              },
            })
          } else {
            // Rest are actual questions (renumber starting from 1)
            return new Paragraph({
              children: [
                new TextRun({
                  text: safeStripMarkdown(`${index}. ${question}`),
                  size: WORD_FONT_SIZES.MAIN_CONTENT,
                }),
              ],
              spacing: { after: 150 },
            })
          }
        })
        addSection("Lesson Wrap-up", wrapupContent)
      }

      // Footer
      const footerText = lessonData.isPublicLesson 
        ? "From LinguaSpark Public Library - Generated by LinguaSpark"
        : "Generated by LinguaSpark"
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: footerText,
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
