import { NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl } from '@/lib/progressive-generator'

export async function GET() {
  console.log('🧪 Testing AI-powered grammar generation...')

  try {
    const generator = new ProgressiveGeneratorImpl()

    // Test with realistic content that should trigger AI generation
    const testContent = `The Ryder Cup has become one of golf's most prestigious team competitions since its inception in 1927. 
    Players have represented their continents with pride and passion. The tournament has created countless memorable moments 
    throughout its history. Teams have competed fiercely, and fans have witnessed incredible performances. 
    The competition has evolved significantly over the decades, and it continues to captivate audiences worldwide.`

    console.log('📝 Building shared context...')
    const context = await generator.buildSharedContext(
      testContent,
      'discussion',
      'B1',
      'English'
    )

    console.log('🎯 Generating grammar section with AI...')
    const grammarSection = await generator.generateSection(
      { name: 'grammar', priority: 6, dependencies: ['vocabulary'] },
      context,
      []
    )

    const grammar = grammarSection.content

    // Detailed validation
    const validation = {
      hasGrammarPoint: !!grammar.focus && grammar.focus.length > 5,
      hasExplanation: !!grammar.explanation,
      hasForm: !!grammar.explanation?.form && grammar.explanation.form.length > 20,
      hasUsage: !!grammar.explanation?.usage && grammar.explanation.usage.length > 30,
      hasLevelNotes: !!grammar.explanation?.levelNotes,
      exampleCount: grammar.examples?.length || 0,
      exerciseCount: grammar.exercises?.length || 0,
      meetsMinimumExamples: (grammar.examples?.length || 0) >= 5,
      meetsMinimumExercises: (grammar.exercises?.length || 0) >= 5,
      exercisesHaveStructure: grammar.exercises?.every((ex: any) => 
        ex.prompt && ex.answer
      ) || false,
      exercisesHaveExplanations: grammar.exercises?.some((ex: any) => 
        ex.explanation
      ) || false,
      isContextuallyRelevant: false
    }

    // Check contextual relevance
    if (grammar.examples && Array.isArray(grammar.examples)) {
      const hasGolfContext = grammar.examples.some((ex: string) => 
        /golf|ryder|cup|tournament|competition|team|player/i.test(ex)
      )
      validation.isContextuallyRelevant = hasGolfContext
    }

    const allRequirementsMet = 
      validation.hasGrammarPoint &&
      validation.hasForm &&
      validation.hasUsage &&
      validation.meetsMinimumExamples &&
      validation.meetsMinimumExercises &&
      validation.exercisesHaveStructure

    console.log('📊 Validation Results:')
    console.log('  Grammar Point:', grammar.focus)
    console.log('  Has Form Explanation:', validation.hasForm)
    console.log('  Has Usage Explanation:', validation.hasUsage)
    console.log('  Example Count:', validation.exampleCount)
    console.log('  Exercise Count:', validation.exerciseCount)
    console.log('  Contextually Relevant:', validation.isContextuallyRelevant)
    console.log('  All Requirements Met:', allRequirementsMet)

    return NextResponse.json({
      success: true,
      grammarPoint: grammar.focus,
      explanation: grammar.explanation,
      exampleCount: validation.exampleCount,
      exerciseCount: validation.exerciseCount,
      sampleExample: grammar.examples?.[0],
      sampleExercise: grammar.exercises?.[0],
      validation,
      allRequirementsMet,
      fullGrammarSection: grammar,
      requirements: {
        '5.1': {
          requirement: 'Identify relevant grammar from source',
          met: validation.hasGrammarPoint && validation.isContextuallyRelevant
        },
        '5.2': {
          requirement: 'Provide clear explanation of grammar rule',
          met: validation.hasForm && validation.hasUsage
        },
        '5.3': {
          requirement: 'Include multiple example sentences',
          met: validation.meetsMinimumExamples
        },
        '5.4': {
          requirement: 'Create practice exercises with minimum 5 items',
          met: validation.meetsMinimumExercises
        }
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
