import { NextRequest, NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl, type CEFRLevel, type SharedContext } from '@/lib/progressive-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Test endpoint for enhanced contextual vocabulary generation
 * Tests the improved prompt engineering and validation for vocabulary examples
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { sourceText, lessonType, studentLevel, targetLanguage } = body

    if (!sourceText || !studentLevel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sourceText, studentLevel' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing Enhanced Contextual Vocabulary Generation')
    console.log(`📊 Level: ${studentLevel}`)
    console.log(`📝 Source length: ${sourceText.length} characters`)

    // Initialize progressive generator
    const generator = new ProgressiveGeneratorImpl()

    // Build shared context
    console.log('🏗️ Building shared context...')
    const context = await generator.buildSharedContext(
      sourceText,
      lessonType || 'discussion',
      studentLevel as CEFRLevel,
      targetLanguage || 'English'
    )

    console.log('✅ Context built:', {
      themes: context.mainThemes,
      vocabulary: context.keyVocabulary,
      level: context.difficultyLevel
    })

    // Generate vocabulary section
    console.log('📚 Generating vocabulary with enhanced contextual relevance...')
    const vocabularySection = await generator.generateSection(
      { name: 'vocabulary', priority: 2, dependencies: [] },
      context,
      []
    )

    const vocabulary = vocabularySection.content
    console.log(`✅ Generated ${vocabulary.length} vocabulary items`)

    // Collect validation results for analysis
    const validationResults = vocabulary
      .filter((item: any) => item.word !== 'INSTRUCTION')
      .map((item: any) => {
        // Re-validate to get detailed results
        const validation = (generator as any).validateVocabularyExamples(
          item.word,
          item.examples,
          context,
          item.examples.length
        )
        
        return {
          word: item.word,
          exampleCount: item.examples.length,
          isValid: validation.isValid,
          issues: validation.issues
        }
      })

    const totalTime = Date.now() - startTime
    const passedValidation = validationResults.filter((v: any) => v.isValid).length
    const validationPassRate = validationResults.length > 0 
      ? Math.round((passedValidation / validationResults.length) * 100)
      : 0

    console.log(`📊 Validation: ${passedValidation}/${validationResults.length} passed (${validationPassRate}%)`)
    console.log(`⏱️ Total time: ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      context: {
        difficultyLevel: context.difficultyLevel,
        mainThemes: context.mainThemes,
        keyVocabulary: context.keyVocabulary,
        contentSummary: context.contentSummary
      },
      vocabulary,
      validationResults,
      metrics: {
        totalTime,
        wordsGenerated: vocabulary.length - 1, // Exclude instruction
        validationPassRate,
        passedValidation,
        totalValidated: validationResults.length
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
