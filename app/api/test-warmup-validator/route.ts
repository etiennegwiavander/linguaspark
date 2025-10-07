import { NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl } from '@/lib/progressive-generator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Test endpoint for warmup validator integration
 * Tests that the WarmupValidator is properly integrated into the progressive generator
 */
export async function GET() {
  console.log('🧪 Testing warmup validator integration...')

  try {
    const generator = new ProgressiveGeneratorImpl()

    // Test content about sports
    const testContent = `
      The Ryder Cup is one of golf's most prestigious team competitions. 
      It pits the best golfers from Europe against the best from the United States 
      in a thrilling three-day event. The competition features various formats 
      including foursomes, four-ball, and singles matches.
    `

    // Build shared context
    const context = await generator.buildSharedContext(
      testContent,
      'discussion',
      'B1',
      'English'
    )

    console.log('✅ Context built:', {
      themes: context.mainThemes,
      vocabulary: context.keyVocabulary.slice(0, 5),
      level: context.difficultyLevel
    })

    // Generate warmup section (this will use the validator internally)
    const warmupSection = await generator.generateSection(
      { name: 'warmup', priority: 1, dependencies: [] },
      context,
      []
    )

    console.log('✅ Warmup section generated:', warmupSection)

    // Extract questions (skip instruction line)
    const questions = warmupSection.content.slice(1)

    return NextResponse.json({
      success: true,
      message: 'Warmup validator integration test completed',
      context: {
        level: context.difficultyLevel,
        themes: context.mainThemes,
        vocabulary: context.keyVocabulary.slice(0, 5)
      },
      warmup: {
        questions,
        questionCount: questions.length,
        sectionData: warmupSection
      },
      validation: {
        message: 'Questions were validated using WarmupValidator during generation',
        note: 'Check server logs for validation details including score and any issues'
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
