import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Received body:", JSON.stringify(body, null, 2))
    
    const { sourceText, lessonType, studentLevel, targetLanguage } = body
    
    console.log("📊 Parsed fields:", {
      sourceTextType: typeof sourceText,
      sourceTextLength: sourceText ? sourceText.length : 'undefined',
      lessonType,
      studentLevel,
      targetLanguage
    })

    // Test basic validation
    if (!sourceText || typeof sourceText !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: "Invalid sourceText",
        debug: {
          sourceText: sourceText,
          type: typeof sourceText,
          length: sourceText ? sourceText.length : 'N/A'
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Basic validation passed!",
      data: {
        sourceTextLength: sourceText.length,
        lessonType,
        studentLevel,
        targetLanguage
      }
    })

  } catch (error) {
    console.error("❌ Simple test failed:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Simple validation test endpoint ready"
  })
}