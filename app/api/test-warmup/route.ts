import { type NextRequest, NextResponse } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing contextual warm-up generation...")
    
    // Test data
    const testParams = {
      sourceText: "Remote work has become increasingly popular in the UK since the pandemic. Many companies are now offering hybrid working arrangements, allowing employees to split their time between home and office. This shift has changed how British workers approach work-life balance and productivity.",
      lessonType: "discussion",
      studentLevel: "B1",
      targetLanguage: "english",
      sourceUrl: "https://bbc.com/news/business",
      contentMetadata: {
        title: "Remote Work Trends in the UK",
        domain: "bbc.com",
        contentType: "news",
        author: "BBC News",
        description: "Analysis of remote work trends in British companies"
      },
      structuredContent: {
        headings: [
          { level: 1, text: "Remote Work Revolution" },
          { level: 2, text: "Hybrid Working Models" },
          { level: 2, text: "Impact on Productivity" }
        ]
      },
      wordCount: 150,
      readingTime: 1
    }
    
    console.log("📝 Test parameters:", {
      textLength: testParams.sourceText.length,
      level: testParams.studentLevel,
      contentType: testParams.contentMetadata.contentType,
      domain: testParams.contentMetadata.domain
    })
    
    // Generate lesson with contextual warm-up
    const lesson = await lessonAIServerGenerator.generateLesson(testParams)
    
    console.log("✅ Generated lesson with warm-up:", {
      hasWarmup: !!lesson.sections?.warmup,
      warmupQuestions: lesson.sections?.warmup?.length || 0,
      warmupContent: lesson.sections?.warmup,
      fullLesson: lesson
    })
    
    // Additional debugging
    if (!lesson.sections?.warmup || lesson.sections.warmup.length === 0) {
      console.error("❌ No warm-up questions generated!")
      console.log("🔍 Lesson sections:", Object.keys(lesson.sections || {}))
      console.log("🔍 Full lesson structure:", JSON.stringify(lesson, null, 2))
    }
    
    return NextResponse.json({
      success: true,
      message: "Contextual warm-up generation test completed",
      warmupQuestions: lesson.sections?.warmup || [],
      lessonType: lesson.lessonType,
      studentLevel: lesson.studentLevel,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Warm-up generation test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}