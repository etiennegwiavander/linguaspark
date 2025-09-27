import { type NextRequest, NextResponse } from "next/server"
import { createGoogleAIServerService } from "@/lib/google-ai-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing Google AI API connection...")
    
    const googleAI = createGoogleAIServerService()
    
    // Simple test prompt
    const testPrompt = "Say 'Hello, I am working!' if you can understand this message."
    
    console.log("📤 Sending test prompt:", testPrompt)
    
    const response = await googleAI.prompt(testPrompt, {
      temperature: 0.1,
      maxTokens: 50,
    })
    
    console.log("📥 Received response:", response)
    
    return NextResponse.json({
      success: true,
      message: "Google AI API is working!",
      response: response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Google AI API test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}