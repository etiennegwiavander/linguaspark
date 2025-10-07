import { NextRequest, NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl } from '@/lib/progressive-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceText, studentLevel = 'B1', testType = 'both' } = body

    if (!sourceText) {
      return NextResponse.json(
        { error: 'Source text is required' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing dialogue length requirements...')
    console.log(`Level: ${studentLevel}`)
    console.log(`Test type: ${testType}`)
    console.log(`Source text length: ${sourceText.length} characters`)

    const progressiveGen = new ProgressiveGeneratorImpl()

    // Build shared context (fast)
    console.log('🏗️ Building shared context...')
    const sharedContext = await progressiveGen.buildSharedContext(
      sourceText,
      'discussion',
      studentLevel,
      'English'
    )

    // Create mock vocabulary section to avoid slow generation
    const mockVocabularySection = {
      sectionName: 'vocabulary',
      content: [
        { word: 'INSTRUCTION', meaning: 'Study these words', examples: [] },
        { word: 'competition', meaning: 'A contest between people or teams', examples: [] },
        { word: 'prestigious', meaning: 'Having high status or respect', examples: [] },
        { word: 'emphasize', meaning: 'To give special importance to something', examples: [] },
        { word: 'alternate', meaning: 'To take turns or switch between', examples: [] },
        { word: 'camaraderie', meaning: 'Friendship and trust among people', examples: [] }
      ],
      tokensUsed: 0,
      generationStrategy: 'mock'
    }

    const previousSections = [mockVocabularySection]

    let dialoguePractice = null
    let dialogueFillGap = null

    // Test dialogue practice generation
    if (testType === 'both' || testType === 'practice') {
      console.log('\n🎭 Testing Dialogue Practice Generation...')
      dialoguePractice = await progressiveGen.generateDialoguePracticeWithContext(
        sharedContext,
        previousSections
      )

      console.log(`✅ Dialogue Practice Generated:`)
      console.log(`   - Lines: ${dialoguePractice.dialogue.length}`)
      console.log(`   - Follow-up questions: ${dialoguePractice.followUpQuestions.length}`)
    }

    // Test dialogue fill-in-gap generation
    if (testType === 'both' || testType === 'fill-gap') {
      console.log('\n🎭 Testing Dialogue Fill-in-Gap Generation...')
      dialogueFillGap = await progressiveGen.generateDialogueFillGapWithContext(
        sharedContext,
        previousSections
      )

      console.log(`✅ Dialogue Fill-in-Gap Generated:`)
      console.log(`   - Lines: ${dialogueFillGap.dialogue.length}`)
      console.log(`   - Gaps: ${dialogueFillGap.dialogue.filter((l: any) => l.isGap).length}`)
      console.log(`   - Answers: ${dialogueFillGap.answers.length}`)
    }

    // Validation checks
    const validationResults: any = {}

    if (dialoguePractice) {
      validationResults.dialoguePractice = {
        meetsMinimumLines: dialoguePractice.dialogue.length >= 12,
        lineCount: dialoguePractice.dialogue.length,
        hasFollowUpQuestions: dialoguePractice.followUpQuestions.length >= 3,
        startsWithStudent: dialoguePractice.dialogue[0]?.character === 'Student',
        alternatesSpeakers: checkAlternation(dialoguePractice.dialogue)
      }

      console.log('\n📊 Validation Results - Dialogue Practice:')
      console.log(`   ✓ Meets minimum 12 lines: ${validationResults.dialoguePractice.meetsMinimumLines}`)
      console.log(`   ✓ Has follow-up questions: ${validationResults.dialoguePractice.hasFollowUpQuestions}`)
      console.log(`   ✓ Starts with Student: ${validationResults.dialoguePractice.startsWithStudent}`)
      console.log(`   ✓ Alternates speakers: ${validationResults.dialoguePractice.alternatesSpeakers}`)
    }
    
    if (dialogueFillGap) {
      validationResults.dialogueFillGap = {
        meetsMinimumLines: dialogueFillGap.dialogue.length >= 12,
        lineCount: dialogueFillGap.dialogue.length,
        hasGaps: dialogueFillGap.dialogue.some((l: any) => l.isGap),
        gapCount: dialogueFillGap.dialogue.filter((l: any) => l.isGap).length,
        hasAnswers: dialogueFillGap.answers.length > 0,
        startsWithStudent: dialogueFillGap.dialogue[0]?.character === 'Student',
        alternatesSpeakers: checkAlternation(dialogueFillGap.dialogue)
      }

      console.log('\n📊 Validation Results - Dialogue Fill-in-Gap:')
      console.log(`   ✓ Meets minimum 12 lines: ${validationResults.dialogueFillGap.meetsMinimumLines}`)
      console.log(`   ✓ Has gaps: ${validationResults.dialogueFillGap.hasGaps}`)
      console.log(`   ✓ Has answers: ${validationResults.dialogueFillGap.hasAnswers}`)
      console.log(`   ✓ Starts with Student: ${validationResults.dialogueFillGap.startsWithStudent}`)
      console.log(`   ✓ Alternates speakers: ${validationResults.dialogueFillGap.alternatesSpeakers}`)
    }

    return NextResponse.json({
      success: true,
      dialoguePractice,
      dialogueFillGap,
      validation: validationResults,
      context: {
        level: studentLevel,
        themes: sharedContext.mainThemes,
        vocabularyCount: sharedContext.keyVocabulary.length
      }
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

function checkAlternation(dialogue: Array<{ character: string; line: string }>): boolean {
  for (let i = 0; i < dialogue.length - 1; i++) {
    if (dialogue[i].character === dialogue[i + 1].character) {
      return false
    }
  }
  return true
}
