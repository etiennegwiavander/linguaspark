import { type NextRequest, NextResponse } from "next/server"
import { ProgressiveGeneratorImpl } from "@/lib/progressive-generator"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing enhanced warm-up generation with level-specific prompts...")
    
    const generator = new ProgressiveGeneratorImpl()
    
    // Test data for different CEFR levels
    const testCases = [
      {
        level: "A1" as const,
        sourceText: "The Ryder Cup is a golf competition between teams from Europe and the United States. It happens every two years. Players compete for their team, not for money. The event is very exciting and popular with golf fans around the world.",
        expectedComplexity: "simple"
      },
      {
        level: "B1" as const,
        sourceText: "The Ryder Cup is a prestigious golf tournament that brings together the best players from Europe and the United States. Unlike most golf tournaments where players compete individually for prize money, the Ryder Cup is a team event where national pride is at stake.",
        expectedComplexity: "intermediate"
      },
      {
        level: "C1" as const,
        sourceText: "The Ryder Cup represents one of golf's most compelling spectacles, transcending the sport's typically individualistic nature to foster intense team competition. The biennial tournament's unique format, which eschews monetary prizes in favor of national prestige, has cultivated a passionate following and generated some of the sport's most memorable moments.",
        expectedComplexity: "advanced"
      }
    ]
    
    const results = []
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing ${testCase.level} level...`)
      
      // Build shared context
      const context = await generator.buildSharedContext(
        testCase.sourceText,
        "discussion",
        testCase.level,
        "english"
      )
      
      console.log(`✅ Context built for ${testCase.level}:`, {
        vocabularyCount: context.keyVocabulary.length,
        themesCount: context.mainThemes.length,
        themes: context.mainThemes
      })
      
      // Generate warm-up section
      const warmupSection = await generator.generateSection(
        { name: "warmup", priority: 1, dependencies: [] },
        context,
        []
      )
      
      const questions = warmupSection.content.slice(1) // Skip instruction
      
      console.log(`✅ Generated ${questions.length} questions for ${testCase.level}:`)
      questions.forEach((q: string, i: number) => {
        console.log(`   ${i + 1}. ${q}`)
      })
      
      // Analyze the questions
      const analysis = {
        level: testCase.level,
        questionCount: questions.length,
        questions: questions,
        expectedComplexity: testCase.expectedComplexity,
        validation: {
          hasProperNames: questions.some((q: string) => /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(q)),
          referencesSpecificEvents: questions.some((q: string) => 
            /what happened|in the (text|story|article)|according to|do you remember/i.test(q)
          ),
          endsWithQuestionMark: questions.every((q: string) => q.endsWith('?')),
          averageLength: Math.round(questions.reduce((sum: number, q: string) => sum + q.length, 0) / questions.length)
        }
      }
      
      results.push(analysis)
    }
    
    console.log("\n✅ All test cases completed")
    
    return NextResponse.json({
      success: true,
      message: "Enhanced warm-up generation test completed",
      results: results,
      summary: {
        totalTests: testCases.length,
        allPassed: results.every(r => 
          r.questionCount === 3 && 
          !r.validation.hasProperNames && 
          !r.validation.referencesSpecificEvents &&
          r.validation.endsWithQuestionMark
        )
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Enhanced warm-up test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
