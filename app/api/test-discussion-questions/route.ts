import { NextRequest, NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl, type CEFRLevel, type SharedContext } from '@/lib/progressive-generator'

export async function POST(request: NextRequest) {
  try {
    const { content, studentLevel, lessonType = 'discussion', targetLanguage = 'English' } = await request.json()
    const level = studentLevel // Support both parameter names

    if (!content || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: content, studentLevel (or level)' },
        { status: 400 }
      )
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing Discussion Question Generation - Level: ${level}`)
    console.log('='.repeat(60))

    const generator = new ProgressiveGeneratorImpl()
    const startTime = Date.now()

    // Build shared context
    console.log('Building shared context...')
    const sharedContext = await generator.buildSharedContext(
      content,
      lessonType,
      level as CEFRLevel,
      targetLanguage
    )

    console.log('Shared context built:', {
      themes: sharedContext.mainThemes,
      vocabularyCount: sharedContext.keyVocabulary.length,
      level: sharedContext.difficultyLevel
    })

    // Generate discussion questions
    console.log('\nGenerating discussion questions...')
    const discussionSection = await generator.generateSection(
      { name: 'discussion', priority: 5, dependencies: [] },
      sharedContext,
      []
    )

    const generationTime = Date.now() - startTime

    // Extract questions (first item is instruction)
    const allContent = discussionSection.content as string[]
    const instruction = allContent[0]
    const questions = allContent.slice(1)

    console.log(`\n✅ Generated ${questions.length} questions in ${generationTime}ms`)
    console.log('\nQuestions:')
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`)
    })

    // Perform validation check
    const validation = validateDiscussionOutput(questions, level as CEFRLevel)

    return NextResponse.json({
      success: true,
      level,
      instruction,
      questions,
      questionCount: questions.length,
      validation,
      metadata: {
        generationTime,
        sharedContext: {
          themes: sharedContext.mainThemes,
          vocabularyCount: sharedContext.keyVocabulary.length
        }
      }
    })

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * Validate discussion question output
 */
function validateDiscussionOutput(
  questions: string[],
  level: CEFRLevel
): { isValid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = []
  const warnings: string[] = []

  // Check exact count
  if (questions.length !== 5) {
    issues.push(`Expected exactly 5 questions, got ${questions.length}`)
  }

  // Check each question
  questions.forEach((question, i) => {
    if (!question.endsWith('?')) {
      issues.push(`Question ${i + 1} does not end with question mark`)
    }
    if (question.length < 15) {
      issues.push(`Question ${i + 1} is too short`)
    }
    if (!/^[A-Z]/.test(question)) {
      issues.push(`Question ${i + 1} should start with capital letter`)
    }
  })

  // Check for diversity
  const questionStarts = questions.map(q => q.split(/\s+/)[0].toLowerCase())
  const uniqueStarts = new Set(questionStarts)
  if (uniqueStarts.size < 3) {
    warnings.push(`Questions lack diversity (only ${uniqueStarts.size} unique question types)`)
  }

  // Check complexity for level
  const wordCounts = questions.map(q => q.split(/\s+/).length)
  const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length

  const expectedRanges: Record<CEFRLevel, { min: number; max: number }> = {
    'A1': { min: 4, max: 12 },
    'A2': { min: 5, max: 15 },
    'B1': { min: 6, max: 18 },
    'B2': { min: 8, max: 22 },
    'C1': { min: 10, max: 25 }
  }

  const range = expectedRanges[level]
  if (avgWordCount < range.min) {
    warnings.push(`Average question length (${avgWordCount.toFixed(1)} words) may be too short for ${level}`)
  } else if (avgWordCount > range.max) {
    warnings.push(`Average question length (${avgWordCount.toFixed(1)} words) may be too long for ${level}`)
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  }
}
