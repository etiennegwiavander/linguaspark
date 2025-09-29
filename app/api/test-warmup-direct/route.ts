import { type NextRequest, NextResponse } from "next/server"
import { createGoogleAIServerService } from "@/lib/google-ai-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing direct warm-up generation...")
    
    const googleAI = createGoogleAIServerService()
    
    // Simple test prompt
    const testPrompt = `Generate 3 contextual warm-up questions for a B1 level student learning English.

CONTENT CONTEXT:
- Title: Remote Work Trends in the UK
- Source: United Kingdom (bbc.com)
- Content Type: news
- Main Topics: remote work, hybrid working, productivity
- Key Vocabulary: remote, hybrid, productivity, arrangements
- Cultural Context: British English context

LEVEL REQUIREMENTS:
Create 3 warm-up questions for B1 (intermediate) level:
- Ask for opinions with "What do you think...?"
- Include comparisons between countries/cultures
- Ask students to explain reasons with "because" or "why"
- Discuss advantages and disadvantages
- Use more varied vocabulary but keep structure clear
Example: "What do you think about [topic]? How is it different in your country?"

CONTENT PREVIEW: "Remote work has become increasingly popular in the UK since the pandemic. Many companies are now offering hybrid working arrangements..."

Generate 3 warm-up questions that:
1. Reference specific details from the content (title, topics, or key concepts)
2. Connect to the student's personal experience and cultural background
3. Are appropriate for B1 level complexity
4. Prepare students for the vocabulary and concepts they'll encounter
5. Create curiosity about the specific material

Return only the 3 questions, one per line:`
    
    console.log("📤 Sending direct prompt to AI...")
    
    const response = await googleAI.prompt(testPrompt, {
      temperature: 0.6,
      maxTokens: 300,
    })
    
    console.log("📥 Raw AI response:", response)
    
    // Parse the response
    const questions = response
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3)
    
    console.log("✅ Parsed questions:", questions)
    
    return NextResponse.json({
      success: true,
      message: "Direct warm-up generation test completed",
      rawResponse: response,
      parsedQuestions: questions,
      questionCount: questions.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Direct warm-up test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}