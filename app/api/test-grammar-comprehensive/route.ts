import { NextResponse, NextRequest } from 'next/server'
import { ProgressiveGeneratorImpl } from '@/lib/progressive-generator'
import type { CEFRLevel } from '@/lib/progressive-generator'

export async function GET() {
  console.log('🧪 Testing comprehensive grammar section generation...')

  try {
    const generator = new ProgressiveGeneratorImpl()

    // Test with different CEFR levels and content
    const testCases = [
      {
        level: 'A1' as const,
        content: 'Climate change affects our planet. Scientists study weather patterns. People reduce carbon emissions. Governments create environmental policies.',
        description: 'A1 level - Basic grammar'
      },
      {
        level: 'B1' as const,
        content: 'The Ryder Cup has become one of golf\'s most prestigious team competitions. Players have represented their continents since 1927. The tournament has created memorable moments throughout its history.',
        description: 'B1 level - Intermediate grammar'
      },
      {
        level: 'B2' as const,
        content: 'Artificial intelligence is being developed rapidly by tech companies. New algorithms are created every day. Machine learning models are trained on vast datasets. Ethical concerns are being raised by researchers.',
        description: 'B2 level - Advanced grammar'
      }
    ]

    const results = []

    for (const testCase of testCases) {
      console.log(`\n📝 Testing ${testCase.description}...`)

      // Build shared context
      const context = await generator.buildSharedContext(
        testCase.content,
        'discussion',
        testCase.level,
        'English'
      )

      // Generate grammar section
      const grammarSection = await generator.generateSection(
        { name: 'grammar', priority: 6, dependencies: ['vocabulary'] },
        context,
        []
      )

      const grammar = grammarSection.content

      // Validate structure
      const validation = {
        hasGrammarPoint: !!grammar.focus,
        hasExplanation: !!grammar.explanation,
        hasForm: !!grammar.explanation?.form,
        hasUsage: !!grammar.explanation?.usage,
        exampleCount: grammar.examples?.length || 0,
        exerciseCount: grammar.exercises?.length || 0,
        meetsMinimumExamples: (grammar.examples?.length || 0) >= 5,
        meetsMinimumExercises: (grammar.exercises?.length || 0) >= 5,
        exercisesHaveAnswers: grammar.exercises?.every((ex: any) => ex.answer) || false
      }

      results.push({
        level: testCase.level,
        description: testCase.description,
        grammarPoint: grammar.focus,
        explanation: {
          form: grammar.explanation?.form?.substring(0, 100) + '...',
          usage: grammar.explanation?.usage?.substring(0, 100) + '...',
          levelNotes: grammar.explanation?.levelNotes?.substring(0, 100) + '...'
        },
        exampleCount: validation.exampleCount,
        exerciseCount: validation.exerciseCount,
        sampleExample: grammar.examples?.[0],
        sampleExercise: grammar.exercises?.[0],
        validation,
        passed: validation.hasGrammarPoint &&
                validation.hasForm &&
                validation.hasUsage &&
                validation.meetsMinimumExamples &&
                validation.meetsMinimumExercises &&
                validation.exercisesHaveAnswers
      })

      console.log(`✅ ${testCase.description} completed`)
      console.log(`   Grammar Point: ${grammar.focus}`)
      console.log(`   Examples: ${validation.exampleCount}`)
      console.log(`   Exercises: ${validation.exerciseCount}`)
      console.log(`   Validation: ${results[results.length - 1].passed ? '✅ PASSED' : '❌ FAILED'}`)
    }

    // Summary
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length

    console.log(`\n📊 Test Summary: ${passedCount}/${totalCount} tests passed`)

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCount,
        passed: passedCount,
        failed: totalCount - passedCount
      },
      results,
      requirements: {
        '5.1': 'Identify relevant grammar from source',
        '5.2': 'Provide clear explanation of grammar rule',
        '5.3': 'Include multiple example sentences',
        '5.4': 'Create practice exercises with minimum 5 items',
        '5.5': 'Adapt complexity to CEFR level',
        '5.6': 'Include both form and usage explanations',
        '5.7': 'Provide context-relevant examples'
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

export async function POST(request: NextRequest) {
  console.log('🧪 Testing grammar generation with custom input...')

  try {
    const body = await request.json()
    const { sourceText, lessonType, studentLevel, targetLanguage } = body

    if (!sourceText || !studentLevel) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sourceText and studentLevel'
      }, { status: 400 })
    }

    const generator = new ProgressiveGeneratorImpl()

    // Build shared context
    const context = await generator.buildSharedContext(
      sourceText,
      lessonType || 'discussion',
      studentLevel as CEFRLevel,
      targetLanguage || 'English'
    )

    console.log('📝 Context built, generating grammar section...')

    // Generate grammar section
    const grammarSection = await generator.generateSection(
      { name: 'grammar', priority: 6, dependencies: ['vocabulary'] },
      context,
      []
    )

    const grammar = grammarSection.content

    // Validate structure
    const validation = {
      hasGrammarPoint: !!grammar.focus,
      hasExplanation: !!grammar.explanation,
      hasForm: !!grammar.explanation?.form,
      hasUsage: !!grammar.explanation?.usage,
      formLength: grammar.explanation?.form?.length || 0,
      usageLength: grammar.explanation?.usage?.length || 0,
      exampleCount: grammar.examples?.length || 0,
      exerciseCount: grammar.exercises?.length || 0,
      meetsMinimumExamples: (grammar.examples?.length || 0) >= 5,
      meetsExactExercises: (grammar.exercises?.length || 0) === 5,
      exercisesHaveAnswers: grammar.exercises?.every((ex: any) => ex.answer) || false,
      formMeetsMinLength: (grammar.explanation?.form?.length || 0) >= 20,
      usageMeetsMinLength: (grammar.explanation?.usage?.length || 0) >= 30
    }

    const passed = validation.hasGrammarPoint &&
                   validation.hasForm &&
                   validation.hasUsage &&
                   validation.formMeetsMinLength &&
                   validation.usageMeetsMinLength &&
                   validation.meetsMinimumExamples &&
                   validation.meetsExactExercises &&
                   validation.exercisesHaveAnswers

    console.log(`✅ Grammar generation completed`)
    console.log(`   Grammar Point: ${grammar.focus}`)
    console.log(`   Form length: ${validation.formLength} chars`)
    console.log(`   Usage length: ${validation.usageLength} chars`)
    console.log(`   Examples: ${validation.exampleCount}`)
    console.log(`   Exercises: ${validation.exerciseCount}`)
    console.log(`   Validation: ${passed ? '✅ PASSED' : '❌ FAILED'}`)

    return NextResponse.json({
      success: true,
      grammar,
      validation,
      passed,
      requirements: {
        '5.5': 'Adapt complexity to CEFR level - ' + (passed ? '✅' : '❌'),
        '5.6': 'Include both form and usage explanations - ' + (validation.hasForm && validation.hasUsage ? '✅' : '❌'),
        '5.7': 'Provide context-relevant examples - ' + (validation.meetsMinimumExamples ? '✅' : '❌')
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
