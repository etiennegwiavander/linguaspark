import { NextRequest, NextResponse } from 'next/server'
import { LessonAIServerGenerator } from '@/lib/lesson-ai-generator-server'

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing Full Progressive Lesson Generation...")

    const testContent = `
    The Ryder Cup is one of golf's most prestigious team competitions. 
    It takes place every two years, alternating between venues in Europe and the United States. 
    The tournament features the best professional golfers from Europe competing against 
    the top players from the United States. The format includes various match play competitions 
    over three days, creating intense rivalry and excitement for golf fans worldwide.
    Teams are selected based on points earned throughout the season, and captains play 
    a crucial role in strategy and team motivation.
    `

    const generator = new LessonAIServerGenerator()

    console.log("🚀 Starting full lesson generation with progressive system...")
    
    const lesson = await generator.generateLesson({
      sourceText: testContent,
      lessonType: 'discussion',
      studentLevel: 'B1',
      targetLanguage: 'English',
      contentMetadata: {
        title: 'The Ryder Cup Golf Tournament',
        contentType: 'sports article'
      }
    })

    console.log("✅ Full lesson generated successfully!")

    // Verify all sections are present
    const expectedSections = [
      'warmup', 'vocabulary', 'reading', 'comprehension', 
      'discussion', 'grammar', 'pronunciation', 'wrapup',
      'dialoguePractice', 'dialogueFillGap'
    ]

    const missingSections = expectedSections.filter(section => !lesson.sections[section])
    const presentSections = expectedSections.filter(section => lesson.sections[section])

    return NextResponse.json({
      success: true,
      message: "Full progressive lesson generation completed successfully",
      results: {
        lessonType: lesson.lessonType,
        studentLevel: lesson.studentLevel,
        targetLanguage: lesson.targetLanguage,
        sectionsGenerated: presentSections.length,
        totalSections: expectedSections.length,
        presentSections,
        missingSections,
        sectionDetails: {
          warmup: {
            type: Array.isArray(lesson.sections.warmup) ? 'array' : typeof lesson.sections.warmup,
            count: Array.isArray(lesson.sections.warmup) ? lesson.sections.warmup.length : 1,
            preview: Array.isArray(lesson.sections.warmup) ? 
              lesson.sections.warmup[0]?.substring(0, 100) + '...' : 
              lesson.sections.warmup?.toString().substring(0, 100) + '...'
          },
          vocabulary: {
            type: Array.isArray(lesson.sections.vocabulary) ? 'array' : typeof lesson.sections.vocabulary,
            count: Array.isArray(lesson.sections.vocabulary) ? lesson.sections.vocabulary.length : 1,
            words: Array.isArray(lesson.sections.vocabulary) ? 
              lesson.sections.vocabulary.slice(0, 5).map((v: any) => v.word || v) : 
              'Not array'
          },
          reading: {
            type: typeof lesson.sections.reading,
            length: lesson.sections.reading?.toString().length || 0,
            preview: lesson.sections.reading?.toString().substring(0, 150) + '...'
          },
          comprehension: {
            type: Array.isArray(lesson.sections.comprehension) ? 'array' : typeof lesson.sections.comprehension,
            count: Array.isArray(lesson.sections.comprehension) ? lesson.sections.comprehension.length : 1
          },
          discussion: {
            type: Array.isArray(lesson.sections.discussion) ? 'array' : typeof lesson.sections.discussion,
            count: Array.isArray(lesson.sections.discussion) ? lesson.sections.discussion.length : 1
          }
        }
      }
    })

  } catch (error) {
    console.error("❌ Full progressive lesson generation failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Full Progressive Lesson Generation Test API",
    usage: "Send POST request to test complete lesson generation with progressive system"
  })
}