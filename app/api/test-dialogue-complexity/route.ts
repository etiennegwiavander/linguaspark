import { NextRequest, NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl, type SharedContext, type CEFRLevel } from '@/lib/progressive-generator'

/**
 * Test endpoint for CEFR-appropriate dialogue complexity
 * Tests Requirements 3.3, 3.4, 3.5, 3.6, 3.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, lessonType, studentLevel, targetLanguage } = body

    if (!content || !studentLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: content, studentLevel' },
        { status: 400 }
      )
    }

    console.log(`\n🧪 Testing dialogue complexity for ${studentLevel} level...`)

    // Initialize progressive generator
    const progressiveGen = new ProgressiveGeneratorImpl()

    // Build shared context
    const sharedContext: SharedContext = await progressiveGen.buildSharedContext(
      content,
      lessonType || 'discussion',
      studentLevel as CEFRLevel,
      targetLanguage || 'English'
    )

    console.log('📊 Shared context built:', {
      vocabularyCount: sharedContext.keyVocabulary.length,
      themesCount: sharedContext.mainThemes.length,
      level: sharedContext.difficultyLevel
    })

    // Generate dialogue practice
    console.log('\n🎭 Generating dialogue practice...')
    const dialoguePractice = await progressiveGen.generateDialoguePracticeWithContext(
      sharedContext,
      []
    )

    // Generate dialogue fill-in-gap
    console.log('\n🎭 Generating dialogue fill-in-gap...')
    const dialogueFillGap = await progressiveGen.generateDialogueFillGapWithContext(
      sharedContext,
      []
    )

    // Perform complexity analysis
    const complexityAnalysis = {
      vocabularyIntegration: checkVocabularyIntegration(
        dialoguePractice.dialogue,
        sharedContext.keyVocabulary
      ),
      vocabularyComplexity: checkVocabularyComplexity(
        dialoguePractice.dialogue,
        studentLevel as CEFRLevel
      ),
      grammarComplexity: checkGrammarComplexity(
        dialoguePractice.dialogue,
        studentLevel as CEFRLevel
      ),
      averageWordCount: calculateAverageWordCount(dialoguePractice.dialogue),
      wordCountRange: calculateWordCountRange(dialoguePractice.dialogue)
    }

    // Validate dialogues
    const practiceValidation = validateDialogue(
      dialoguePractice.dialogue,
      sharedContext,
      'practice'
    )

    const fillGapValidation = validateDialogue(
      dialogueFillGap.dialogue,
      sharedContext,
      'fill-in-gap'
    )

    console.log('\n✅ Dialogue generation complete!')
    console.log('📊 Complexity Analysis:', complexityAnalysis)

    return NextResponse.json({
      success: true,
      level: studentLevel,
      sharedContext: {
        keyVocabulary: sharedContext.keyVocabulary,
        mainThemes: sharedContext.mainThemes,
        difficultyLevel: sharedContext.difficultyLevel
      },
      dialoguePractice: {
        ...dialoguePractice,
        validation: practiceValidation
      },
      dialogueFillGap: {
        ...dialogueFillGap,
        validation: fillGapValidation
      },
      complexityAnalysis
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Helper functions for complexity analysis

function checkVocabularyIntegration(
  dialogueLines: Array<{ character: string; line: string }>,
  vocabularyWords: string[]
): { hasIntegration: boolean; integratedWords: string[] } {
  const allText = dialogueLines.map(line => line.line.toLowerCase()).join(' ')
  const integratedWords = vocabularyWords.filter(word => 
    allText.includes(word.toLowerCase())
  )

  return {
    hasIntegration: integratedWords.length >= 2,
    integratedWords
  }
}

function checkVocabularyComplexity(
  dialogueLines: Array<{ character: string; line: string }>,
  level: CEFRLevel
): { isAppropriate: boolean; warnings: string[] } {
  const warnings: string[] = []
  const allText = dialogueLines.map(line => line.line.toLowerCase()).join(' ')

  // Check for overly complex words at lower levels
  if (level === 'A1' || level === 'A2') {
    const complexWords = [
      'sophisticated', 'comprehensive', 'multifaceted', 'nuanced', 'intricate',
      'elaborate', 'substantial', 'considerable', 'significant', 'fundamental',
      'nevertheless', 'furthermore', 'consequently', 'subsequently', 'whereby'
    ]
    
    const foundComplexWords = complexWords.filter(word => allText.includes(word))
    if (foundComplexWords.length > 0) {
      warnings.push(`Found complex vocabulary inappropriate for ${level}: ${foundComplexWords.join(', ')}`)
    }
  }

  // Check for overly simple vocabulary at higher levels
  if (level === 'B2' || level === 'C1') {
    const allWords = allText.split(/\s+/)
    const verySimpleWords = ['good', 'bad', 'nice', 'big', 'small', 'like', 'want', 'go', 'come', 'get']
    const simpleWordCount = allWords.filter(word => verySimpleWords.includes(word)).length
    const simpleWordRatio = simpleWordCount / allWords.length

    if (simpleWordRatio > 0.15) {
      warnings.push(`Vocabulary may be too simple for ${level} level (${Math.round(simpleWordRatio * 100)}% basic words)`)
    }
  }

  return {
    isAppropriate: warnings.length === 0,
    warnings
  }
}

function checkGrammarComplexity(
  dialogueLines: Array<{ character: string; line: string }>,
  level: CEFRLevel
): { isAppropriate: boolean; warnings: string[]; features: string[] } {
  const warnings: string[] = []
  const features: string[] = []
  const allText = dialogueLines.map(line => line.line).join(' ')

  // Check for complex grammar at lower levels (should be avoided)
  if (level === 'A1' || level === 'A2') {
    // Check for present perfect
    if (/\b(have|has)\s+\w+ed\b/i.test(allText) || /\b(have|has)\s+(been|gone|done|seen|made)\b/i.test(allText)) {
      warnings.push(`Present perfect tense may be too complex for ${level} level`)
    }
    
    // Check for passive voice
    if (/\b(is|are|was|were|been)\s+\w+ed\b/i.test(allText)) {
      warnings.push(`Passive voice may be too complex for ${level} level`)
    }
  }

  // Check for complex grammar at higher levels (should be present)
  if (level === 'B2' || level === 'C1') {
    // Check for relative clauses
    if (/\b(which|that|who|whom|whose)\b/i.test(allText)) {
      features.push('relative clauses')
    }
    
    // Check for conditionals
    if (/\b(if|unless|provided|assuming)\b.*\b(would|could|might)\b/i.test(allText)) {
      features.push('conditionals')
    }
    
    // Check for perfect tenses
    if (/\b(have|has|had)\s+(been|gone|done|seen|made)\b/i.test(allText)) {
      features.push('perfect tenses')
    }

    if (features.length === 0 && dialogueLines.length >= 12) {
      warnings.push(`Dialogue lacks complex grammar structures expected for ${level} level`)
    }
  }

  return {
    isAppropriate: warnings.length === 0,
    warnings,
    features
  }
}

function calculateAverageWordCount(
  dialogueLines: Array<{ character: string; line: string }>
): number {
  const totalWords = dialogueLines.reduce((sum, line) => {
    return sum + line.line.split(/\s+/).length
  }, 0)
  
  return Math.round(totalWords / dialogueLines.length)
}

function calculateWordCountRange(
  dialogueLines: Array<{ character: string; line: string }>
): { min: number; max: number } {
  const wordCounts = dialogueLines.map(line => line.line.split(/\s+/).length)
  
  return {
    min: Math.min(...wordCounts),
    max: Math.max(...wordCounts)
  }
}

function validateDialogue(
  dialogueLines: Array<{ character: string; line: string }>,
  context: SharedContext,
  type: 'practice' | 'fill-in-gap'
): { isValid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = []
  const warnings: string[] = []

  // Check minimum line count
  const minLines = 12
  if (dialogueLines.length < minLines) {
    issues.push(`Insufficient dialogue lines: expected at least ${minLines}, got ${dialogueLines.length}`)
  }

  // Check alternating speakers
  for (let i = 0; i < dialogueLines.length - 1; i++) {
    if (dialogueLines[i].character === dialogueLines[i + 1].character) {
      warnings.push(`Lines ${i + 1} and ${i + 2} have the same speaker`)
    }
  }

  // Check that dialogue starts with Student
  if (dialogueLines.length > 0 && dialogueLines[0].character !== 'Student') {
    warnings.push('Dialogue should start with Student speaking')
  }

  // For fill-in-gap, check that there are gaps
  if (type === 'fill-in-gap') {
    const gapCount = dialogueLines.filter(line => line.line.includes('_____')).length
    if (gapCount < 3) {
      warnings.push(`Fill-in-gap dialogue should have at least 3 gaps, found ${gapCount}`)
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  }
}
