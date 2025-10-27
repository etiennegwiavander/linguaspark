import { enhanceDialogueWithAvatars } from "./avatar-utils"

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

/**
 * Strips markdown formatting from text
 */
function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
}

/**
 * Generates inline CSS for HTML export
 */
function generateInlineCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .lesson-header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .lesson-title {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.75rem;
    }
    
    .lesson-meta {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    
    .export-actions {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    .section {
      margin-bottom: 2.5rem;
      page-break-inside: avoid;
    }
    
    .section-header {
      font-size: 1.75rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .instruction {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      font-style: italic;
      color: #166534;
      border-radius: 0.25rem;
    }
    
    .instruction-blue {
      background: #eff6ff;
      border-left-color: #3b82f6;
      color: #1e40af;
    }
    
    .content-item {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    
    .vocab-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .vocab-word {
      font-size: 1.125rem;
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }
    
    .vocab-meaning {
      color: #475569;
      margin-bottom: 0.5rem;
    }
    
    .vocab-examples {
      margin-top: 0.75rem;
      padding-left: 1rem;
    }
    
    .vocab-example {
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    
    .reading-passage {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      line-height: 1.8;
    }
    
    .reading-passage p {
      margin-bottom: 1rem;
    }
    
    .dialogue-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }
    
    .dialogue-line {
      margin-bottom: 0.75rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .dialogue-avatar {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      width: 60px;
    }
    
    .dialogue-avatar img {
      width: 48px;
      height: 48px;
      border-radius: 0.375rem;
      border: 2px solid #e2e8f0;
      object-fit: cover;
    }
    
    .dialogue-avatar-name {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
      text-align: center;
    }
    
    .dialogue-character {
      font-weight: 600;
      color: #3b82f6;
      min-width: 100px;
    }
    
    .dialogue-text {
      flex: 1;
    }
    
    .grammar-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .grammar-label {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    
    .example-box {
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      border-radius: 0.25rem;
    }
    
    @media print {
      body {
        padding: 1rem;
      }
      
      .export-actions {
        display: none;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .section-header {
        page-break-after: avoid;
      }
    }
  `
}

/**
 * Exports lesson as standalone HTML file
 */
export async function exportToHTML(
  lessonData: LessonData,
  enabledSections: Record<string, boolean>
): Promise<void> {
  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stripMarkdown(lessonData.lessonTitle)}</title>
  <style>${generateInlineCSS()}</style>
</head>
<body>
  <div class="lesson-header">
    <h1 class="lesson-title">${stripMarkdown(lessonData.lessonTitle)}</h1>
    <div class="lesson-meta">Target Language: ${lessonData.targetLanguage.charAt(0).toUpperCase() + lessonData.targetLanguage.slice(1)}</div>
    <div class="lesson-meta">Level: ${lessonData.studentLevel} | Type: ${lessonData.lessonType}</div>
    <div class="lesson-meta">Generated on: ${formatDate()}</div>
    ${lessonData.isPublicLesson ? '<div class="lesson-meta" style="font-style: italic;">From LinguaSpark Public Library</div>' : ''}
  </div>`

  // Add banner image if available
  const bannerImage = (lessonData as any).bannerImage || (lessonData as any).metadata?.bannerImages?.[0]?.src
  if (bannerImage) {
    html += `
  <div style="margin: 1.5rem 0;">
    <img src="${bannerImage}" alt="${stripMarkdown(lessonData.lessonTitle)}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />
  </div>`
  }

  html += `
  
  <div class="export-actions">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print to PDF</button>
    <button class="btn btn-primary" onclick="alert('Select File > Save As to save this HTML file')">💾 Save HTML</button>
  </div>
`

  // Warmup
  if (enabledSections.warmup && lessonData.sections.warmup?.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-header">Warm-up Questions</h2>`

    lessonData.sections.warmup.forEach((question, index) => {
      if (index === 0) {
        html += `<div class="instruction">${stripMarkdown(question)}</div>`
      } else {
        html += `<div class="content-item">${index}. ${stripMarkdown(question)}</div>`
      }
    })

    html += `</div>`
  }

  // Vocabulary
  if (enabledSections.vocabulary && lessonData.sections.vocabulary?.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-header">Key Vocabulary</h2>`

    let vocabIndex = 0
    lessonData.sections.vocabulary.forEach((item, index) => {
      if (index === 0 && item.word === "INSTRUCTION") {
        html += `<div class="instruction instruction-blue">${stripMarkdown(item.meaning)}</div>`
        return
      }

      vocabIndex++
      const examples = item.examples || (item.example ? [item.example] : [])

      html += `
    <div class="vocab-card">
      <div class="vocab-word">${vocabIndex}. ${stripMarkdown(item.word)}</div>
      <div class="vocab-meaning">${stripMarkdown(item.meaning)}</div>`

      if (examples.length > 0) {
        html += `<div class="vocab-examples">`
        examples.forEach((ex, i) => {
          html += `<div class="vocab-example">• ${stripMarkdown(ex)}</div>`
        })
        html += `</div>`
      }

      html += `</div>`
    })

    html += `</div>`
  }

  // Reading
  if (enabledSections.reading && lessonData.sections.reading) {
    html += `
  <div class="section">
    <h2 class="section-header">Reading Passage</h2>`

    const parts = lessonData.sections.reading.split('\n\n')
    if (parts.length > 1 && parts[0].includes('Read the following text carefully')) {
      html += `<div class="instruction">${stripMarkdown(parts[0])}</div>`
      html += `<div class="reading-passage">`
      parts.slice(1).forEach(para => {
        html += `<p>${stripMarkdown(para)}</p>`
      })
      html += `</div>`
    } else {
      html += `<div class="reading-passage">`
      parts.forEach(para => {
        html += `<p>${stripMarkdown(para)}</p>`
      })
      html += `</div>`
    }

    html += `</div>`
  }

  // Comprehension
  if (enabledSections.comprehension && lessonData.sections.comprehension?.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-header">Reading Comprehension</h2>`

    lessonData.sections.comprehension.forEach((question, index) => {
      if (index === 0) {
        html += `<div class="instruction instruction-blue">${stripMarkdown(question)}</div>`
      } else {
        html += `<div class="content-item">${index}. ${stripMarkdown(question)}</div>`
      }
    })

    html += `</div>`
  }

  // Discussion
  if (enabledSections.discussion && lessonData.sections.discussion?.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-header">Discussion Questions</h2>`

    lessonData.sections.discussion.forEach((question, index) => {
      if (index === 0) {
        html += `<div class="instruction">${stripMarkdown(question)}</div>`
      } else {
        html += `<div class="content-item">${index}. ${stripMarkdown(question)}</div>`
      }
    })

    html += `</div>`
  }

  // Dialogue Practice
  if (enabledSections.dialoguePractice && lessonData.sections.dialoguePractice) {
    html += `
  <div class="section">
    <h2 class="section-header">Dialogue Practice</h2>
    <div class="instruction">${stripMarkdown(lessonData.sections.dialoguePractice.instruction)}</div>
    <div class="dialogue-container">`

    const enhancedDialogue = enhanceDialogueWithAvatars(
      lessonData.sections.dialoguePractice.dialogue,
      lessonData.id,
      'dialoguePractice'
    )

    enhancedDialogue.forEach(line => {
      html += `
      <div class="dialogue-line">`

      // Add avatar if available - use initials as fallback
      if (line.avatar) {
        const initial = line.avatar.name.charAt(0).toUpperCase()
        html += `
        <div class="dialogue-avatar">
          <div style="width: 48px; height: 48px; border-radius: 0.375rem; border: 2px solid #e2e8f0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 20px;">
            ${initial}
          </div>
          <div class="dialogue-avatar-name">${line.avatar.name}</div>
        </div>`
      }

      html += `
        <div style="flex: 1;">
          <div class="dialogue-character">${line.character}:</div>
          <div class="dialogue-text">${stripMarkdown(line.line)}</div>
        </div>
      </div>`
    })

    html += `</div>`

    if (lessonData.sections.dialoguePractice.followUpQuestions?.length > 0) {
      html += `<div style="margin-top: 1rem;"><strong>Follow-up Questions:</strong></div>`
      lessonData.sections.dialoguePractice.followUpQuestions.forEach((q, i) => {
        html += `<div class="content-item">${i + 1}. ${stripMarkdown(q)}</div>`
      })
    }

    html += `</div>`
  }

  // Dialogue Fill-in-the-Gap
  if (enabledSections.dialogueFillGap && lessonData.sections.dialogueFillGap) {
    html += `
  <div class="section">
    <h2 class="section-header">Dialogue Fill-in-the-Gap</h2>
    <div class="instruction instruction-blue">${stripMarkdown(lessonData.sections.dialogueFillGap.instruction)}</div>
    <div class="dialogue-container">`

    const enhancedDialogueFillGap = enhanceDialogueWithAvatars(
      lessonData.sections.dialogueFillGap.dialogue,
      lessonData.id,
      'dialogueFillGap'
    )

    enhancedDialogueFillGap.forEach(line => {
      const lineText = line.isGap
        ? line.line.replace(/_____/g, '<span style="display: inline-block; width: 80px; border-bottom: 2px solid #3b82f6; margin: 0 4px;"></span>')
        : stripMarkdown(line.line)

      html += `
      <div class="dialogue-line">`

      // Add avatar if available - use initials as fallback
      if (line.avatar) {
        const initial = line.avatar.name.charAt(0).toUpperCase()
        html += `
        <div class="dialogue-avatar">
          <div style="width: 48px; height: 48px; border-radius: 0.375rem; border: 2px solid #e2e8f0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 20px;">
            ${initial}
          </div>
          <div class="dialogue-avatar-name">${line.avatar.name}</div>
        </div>`
      }

      html += `
        <div style="flex: 1;">
          <div class="dialogue-character">${line.character}:</div>
          <div class="dialogue-text">${lineText}</div>
        </div>
      </div>`
    })

    html += `</div>`

    if (lessonData.sections.dialogueFillGap.answers?.length > 0) {
      html += `<div style="margin-top: 1rem;"><strong>Answer Key:</strong></div>`
      html += `<div style="margin-left: 1.5rem; color: #64748b;">${lessonData.sections.dialogueFillGap.answers.join(', ')}</div>`
    }

    html += `</div>`
  }

  // Grammar
  if (enabledSections.grammar && lessonData.sections.grammar) {
    html += `
  <div class="section">
    <h2 class="section-header">Grammar Focus</h2>
    <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">${stripMarkdown(lessonData.sections.grammar.focus)}</h3>`

    if (lessonData.sections.grammar.explanation) {
      const exp = lessonData.sections.grammar.explanation

      if (exp.form) {
        html += `
    <div class="grammar-box">
      <div class="grammar-label">Form:</div>
      <div>${stripMarkdown(exp.form)}</div>
    </div>`
      }

      if (exp.usage) {
        html += `
    <div class="grammar-box">
      <div class="grammar-label">Usage:</div>
      <div>${stripMarkdown(exp.usage)}</div>
    </div>`
      }

      if (exp.levelNotes) {
        html += `
    <div class="grammar-box">
      <div class="grammar-label">Note:</div>
      <div style="font-style: italic;">${stripMarkdown(exp.levelNotes)}</div>
    </div>`
      }
    }

    if (lessonData.sections.grammar.examples?.length > 0) {
      html += `<div style="margin-top: 1rem;"><strong>Examples:</strong></div>`
      lessonData.sections.grammar.examples.forEach(ex => {
        html += `<div class="example-box">${stripMarkdown(ex)}</div>`
      })
    }

    html += `</div>`
  }

  // Pronunciation
  if (enabledSections.pronunciation && lessonData.sections.pronunciation) {
    html += `
  <div class="section">
    <h2 class="section-header">Pronunciation Practice</h2>`

    if (lessonData.sections.pronunciation.instruction) {
      html += `<div class="instruction instruction-blue">${stripMarkdown(lessonData.sections.pronunciation.instruction)}</div>`
    }

    if (lessonData.sections.pronunciation.words?.length > 0) {
      lessonData.sections.pronunciation.words.forEach(word => {
        html += `
    <div class="vocab-card">
      <div class="vocab-word">${word.word} <span style="font-family: monospace; color: #64748b;">${word.ipa}</span></div>`

        if (word.tips?.length > 0) {
          html += `<div style="margin-top: 0.5rem;"><strong style="font-size: 0.875rem;">Tips:</strong></div>`
          word.tips.forEach(tip => {
            html += `<div style="margin-left: 1rem; color: #475569;">• ${stripMarkdown(tip)}</div>`
          })
        }

        if (word.practiceSentence) {
          html += `<div style="margin-top: 0.5rem; font-style: italic; color: #64748b;">"${stripMarkdown(word.practiceSentence)}"</div>`
        }

        html += `</div>`
      })
    }

    html += `</div>`
  }

  // Wrap-up
  if (enabledSections.wrapup && lessonData.sections.wrapup?.length > 0) {
    html += `
  <div class="section">
    <h2 class="section-header">Wrap-up</h2>`

    lessonData.sections.wrapup.forEach((item, index) => {
      if (index === 0) {
        html += `<div class="instruction">${stripMarkdown(item)}</div>`
      } else {
        html += `<div class="content-item">${index}. ${stripMarkdown(item)}</div>`
      }
    })

    html += `</div>`
  }

  html += `
</body>
</html>`

  // Download HTML file
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${lessonData.lessonTitle.replace(/[^a-z0-9]/gi, '_')}_lesson.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Note: PowerPoint export has been removed due to build compatibility issues.
 * Users can convert HTML exports to PowerPoint using online tools or Microsoft Word.
 * 
 * Recommended workflow:
 * 1. Export as HTML
 * 2. Open HTML in browser
 * 3. Print to PDF or use online HTML-to-PPTX converters
 */
