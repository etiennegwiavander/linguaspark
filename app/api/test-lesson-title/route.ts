import { NextRequest, NextResponse } from "next/server"
import { ProgressiveGeneratorImpl, type CEFRLevel } from "@/lib/progressive-generator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceText, lessonType, studentLevel } = body

    if (!sourceText || !lessonType || !studentLevel) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: sourceText, lessonType, studentLevel"
      }, { status: 400 })
    }

    console.log("🧪 Testing lesson title generation...")
    console.log("Source text:", sourceText.substring(0, 100) + "...")
    console.log("Lesson type:", lessonType)
    console.log("Student level:", studentLevel)

    const progressiveGenerator = new ProgressiveGeneratorImpl()

    // Test the shared context building which includes title generation
    const sharedContext = await progressiveGenerator.buildSharedContext(
      sourceText,
      lessonType,
      studentLevel as CEFRLevel,
      "english"
    )

    console.log("✅ Shared context built successfully")
    console.log("Generated title:", sharedContext.lessonTitle)

    return NextResponse.json({
      success: true,
      lessonTitle: sharedContext.lessonTitle,
      keyVocabulary: sharedContext.keyVocabulary,
      mainThemes: sharedContext.mainThemes,
      contentSummary: sharedContext.contentSummary
    })

  } catch (error) {
    console.error("❌ Lesson title test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}