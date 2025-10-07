import { NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl } from '@/lib/progressive-generator'

export async function POST(request: Request) {
  try {
    const { sourceText, level } = await request.json()

    if (!sourceText || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceText, level' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing enhanced pronunciation generation...')
    console.log('Level:', level)
    console.log('Source text length:', sourceText.length)

    const generator = new ProgressiveGeneratorImpl()

    // Build shared context
    console.log('📋 Building shared context...')
    const sharedContext = await generator.buildSharedContext(
      sourceText,
      'discussion',
      level,
      'English'
    )

    console.log('✅ Shared context built:', {
      vocabularyCount: sharedContext.keyVocabulary.length,
      themesCount: sharedContext.mainThemes.length,
      level: sharedContext.difficultyLevel
    })

    // Generate pronunciation section
    console.log('🗣️ Generating pronunciation section...')
    const pronunciationSection = await generator.generateSection(
      { name: 'pronunciation', priority: 7, dependencies: [] },
      sharedContext,
      []
    )

    console.log('✅ Pronunciation section generated')

    // Validate the section
    const content = pronunciationSection.content
    const validation = {
      hasInstruction: !!content.instruction,
      wordCount: content.words?.length || 0,
      tongueTwisterCount: content.tongueTwisters?.length || 0,
      meetsMinWords: (content.words?.length || 0) >= 5,
      meetsTongueTwisters: (content.tongueTwisters?.length || 0) >= 2,
      allWordsHaveIPA: content.words?.every((w: any) => w.ipa) || false,
      allWordsHaveTips: content.words?.every((w: any) => w.tips && w.tips.length > 0) || false,
      allWordsHavePracticeSentence: content.words?.every((w: any) => w.practiceSentence) || false,
      allTwistersHaveTargetSounds: content.tongueTwisters?.every((t: any) => t.targetSounds && t.targetSounds.length > 0) || false
    }

    const allChecksPassed = 
      validation.hasInstruction &&
      validation.meetsMinWords &&
      validation.meetsTongueTwisters &&
      validation.allWordsHaveIPA &&
      validation.allWordsHaveTips &&
      validation.allWordsHavePracticeSentence &&
      validation.allTwistersHaveTargetSounds

    return NextResponse.json({
      success: true,
      pronunciationSection: content,
      validation,
      allChecksPassed,
      message: allChecksPassed 
        ? '✅ All pronunciation requirements met!' 
        : '⚠️ Some requirements not met - see validation details'
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
