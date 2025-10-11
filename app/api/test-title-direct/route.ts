import { NextRequest, NextResponse } from "next/server"
import { createGoogleAIServerService } from "@/lib/google-ai-server"

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

    console.log("🧪 Testing direct title generation...")
    console.log("Source text:", sourceText.substring(0, 100) + "...")
    console.log("Lesson type:", lessonType)
    console.log("Student level:", studentLevel)

    // Use the exact same prompt as in the progressive generator
    const prompt = `Create a compelling, contextual lesson title based on this content for a ${studentLevel} level ${lessonType} lesson.

Content: ${sourceText.substring(0, 300)}

Requirements:
- 3-8 words maximum
- Engaging and descriptive
- Appropriate for ${studentLevel} level
- Reflects the main topic
- Professional tone

Return only the title, no quotes or extra text.`

    console.log("📝 Prompt:", prompt)

    const googleAI = createGoogleAIServerService()

    try {
      console.log("🤖 Calling Google AI...")
      const response = await googleAI.prompt(prompt, { maxTokens: 100 })
      console.log("✅ AI Response received:", response)
      
      const title = response.trim().replace(/['"]/g, '').substring(0, 80)
      console.log("🎯 Processed title:", title)
      
      // Check title validity
      const isValid = title.length > 5 && title.length < 80
      console.log("📊 Title valid:", isValid, "Length:", title.length)

      return NextResponse.json({
        success: true,
        rawResponse: response,
        processedTitle: title,
        isValid: isValid,
        titleLength: title.length
      })

    } catch (aiError) {
      console.error("❌ AI call failed:", aiError)
      return NextResponse.json({
        success: false,
        error: "AI call failed",
        details: aiError instanceof Error ? aiError.message : "Unknown AI error"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("❌ Direct title test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}