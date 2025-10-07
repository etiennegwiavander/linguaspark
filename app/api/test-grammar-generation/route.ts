import { NextResponse } from "next/server"
import { createGoogleAIServerService } from "@/lib/google-ai-server"

/**
 * Test endpoint for grammar generation without authentication
 * This is for testing MAX_TOKENS fixes only
 */
export async function GET() {
  try {
    console.log("🧪 Testing grammar generation with MAX_TOKENS fix...")
    
    const googleAI = createGoogleAIServerService()
    
    // Test content
    const testContext = {
      sourceText: "British Prime Minister Rishi Sunak has unexpectedly announced his resignation following a series of political setbacks.",
      difficultyLevel: "B2" as const,
      targetLanguage: "english",
      vocabulary: ["political", "resignation", "unexpected"],
      themes: ["politics", "leadership", "change"]
    }
    
    // Build grammar prompt (same as in progressive-generator)
    const levelPoints = {
      'A1': 'present simple, articles, basic prepositions',
      'A2': 'past simple, comparatives, modal verbs',
      'B1': 'present perfect, conditionals, passive voice',
      'B2': 'relative clauses, advanced conditionals, reported speech',
      'C1': 'subjunctive, cleft sentences, inversion'
    }
    
    const prompt = `Identify ONE grammar point from this text for ${testContext.difficultyLevel} level.

Text: ${testContext.sourceText.substring(0, 200)}

Suggested: ${levelPoints[testContext.difficultyLevel]}

Return CONCISE JSON (brief explanations, 3 examples, 3 exercises):
{
  "grammarPoint": "Name",
  "explanation": {
    "form": "How to form (1 sentence)",
    "usage": "When to use (1 sentence)",
    "levelNotes": "Level note (1 sentence)"
  },
  "examples": ["example 1", "example 2", "example 3"],
  "exercises": [
    {"prompt": "Exercise 1", "answer": "Answer 1", "explanation": "Why"},
    {"prompt": "Exercise 2", "answer": "Answer 2", "explanation": "Why"},
    {"prompt": "Exercise 3", "answer": "Answer 3", "explanation": "Why"}
  ]
}`

    console.log("📝 Prompt length:", prompt.length, "characters")
    
    // Test with increased token limit (1500)
    const startTime = Date.now()
    const response = await googleAI.prompt(prompt, { maxTokens: 1500 })
    const duration = Date.now() - startTime
    
    console.log("✅ Response received in", duration, "ms")
    console.log("📝 Response length:", response.length, "characters")
    
    // Try to parse JSON
    let grammarData: any
    try {
      const cleanResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
        
        // Check if incomplete
        if (!jsonStr.trim().endsWith('}')) {
          console.log("⚠️ JSON appears incomplete, attempting repair...")
          // Simple repair
          const openBraces = (jsonStr.match(/\{/g) || []).length
          const closeBraces = (jsonStr.match(/\}/g) || []).length
          for (let i = 0; i < openBraces - closeBraces; i++) {
            jsonStr += '}'
          }
        }
        
        grammarData = JSON.parse(jsonStr)
        console.log("✅ JSON parsed successfully")
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError)
      return NextResponse.json({
        success: false,
        error: "Failed to parse JSON response",
        rawResponse: response.substring(0, 500)
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Grammar generation test completed successfully",
      duration: `${duration}ms`,
      responseLength: response.length,
      grammarData: {
        grammarPoint: grammarData.grammarPoint,
        hasExplanation: !!grammarData.explanation,
        examplesCount: grammarData.examples?.length || 0,
        exercisesCount: grammarData.exercises?.length || 0
      },
      fullResponse: grammarData
    })
    
  } catch (error: any) {
    console.error("❌ Test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}
