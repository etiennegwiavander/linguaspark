import { type NextRequest, NextResponse } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sourceText, 
      lessonType = "discussion", 
      studentLevel = "A2", 
      targetLanguage = "english"
    } = body

    console.log("🧪 Testing smart template generation...")

    // Generate lesson using smart template system
    const lesson = await lessonAIServerGenerator.generateLesson({
      sourceText,
      lessonType,
      studentLevel,
      targetLanguage,
      sourceUrl: "test",
      contentMetadata: undefined,
      structuredContent: undefined,
      wordCount: sourceText.split(' ').length,
      readingTime: Math.ceil(sourceText.split(' ').length / 200)
    })

    console.log("✅ Smart template test complete!")

    return NextResponse.json({
      success: true,
      lesson: lesson,
      message: "Smart template generation successful"
    })
  } catch (error) {
    console.error("❌ Smart template test failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}