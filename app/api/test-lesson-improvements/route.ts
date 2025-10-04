import { type NextRequest, NextResponse } from "next/server"
import { lessonAIServerGenerator } from "@/lib/lesson-ai-generator-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing lesson generation improvements...")
    
    const testData = {
      sourceText: "Flutterwave, an online payment company, announced important changes. This happened on September 19, 2025, in San Francisco. They are reorganizing the company. This means changing some top leaders. New people will manage risks, company rules, and legal issues. This is a smart move for Flutterwave. The announcement came after months of planning. The leadership team believes these changes will help the company grow faster. They want to improve their services and compete better in the global market. The reorganization will affect different departments. Some employees will get new roles and responsibilities. The company expects the transition to be completed by the end of the year. Industry experts think this is a positive step for the payment industry. Flutterwave has been growing rapidly in recent years. They serve millions of customers across Africa and beyond. The new structure should help them handle this growth more effectively. Customer service and product development will be key focus areas. The company plans to invest more in technology and innovation. They also want to expand to new markets in Asia and Europe. This reorganization shows Flutterwave's commitment to long-term success. Many other fintech companies are watching these changes closely. The payment industry is becoming more competitive every day. Companies need to adapt quickly to survive and thrive. Flutterwave's bold move could inspire other businesses to make similar changes.",
      lessonType: "Business",
      studentLevel: "B1",
      targetLanguage: "English",
      contentMetadata: {
        title: "Flutterwave Announces Major Reorganization",
        contentType: "business news",
        domain: "business.com"
      }
    }
    
    console.log("📝 Generating lesson with improved algorithm...")
    const lesson = await lessonAIServerGenerator.generateLesson(testData)
    
    // Analyze the results
    const analysis = {
      readingPassageLength: lesson.sections.reading.length,
      readingWordCount: lesson.sections.reading.split(' ').length,
      readingParagraphs: lesson.sections.reading.split('\n\n').length,
      vocabularyCount: lesson.sections.vocabulary.length,
      vocabularyWords: lesson.sections.vocabulary.map(v => v.word),
      dialoguePracticeLines: lesson.sections.dialoguePractice.dialogue.length,
      dialogueFillGapLines: lesson.sections.dialogueFillGap.dialogue.length,
      dialogueFillGapAnswers: lesson.sections.dialogueFillGap.answers.length,
      hasGaps: lesson.sections.dialogueFillGap.dialogue.some(d => d.isGap)
    }
    
    console.log("📊 Lesson analysis:", analysis)
    
    return NextResponse.json({
      success: true,
      message: "Lesson generation improvements tested successfully!",
      lesson: lesson,
      analysis: analysis,
      improvements: {
        readingPassage: {
          status: analysis.readingWordCount >= 200 ? "✅ FIXED" : "❌ Still too short",
          wordCount: analysis.readingWordCount,
          paragraphs: analysis.readingParagraphs
        },
        vocabulary: {
          status: analysis.vocabularyWords.some(w => ['announcement', 'reorganizing', 'leadership', 'company'].includes(w.toLowerCase())) ? "✅ IMPROVED" : "❌ Still basic words",
          words: analysis.vocabularyWords
        },
        dialoguePractice: {
          status: analysis.dialoguePracticeLines >= 8 ? "✅ ENHANCED" : "❌ Still too short",
          lines: analysis.dialoguePracticeLines
        },
        dialogueFillGap: {
          status: analysis.dialogueFillGapLines >= 6 && analysis.hasGaps ? "✅ FIXED" : "❌ Still empty or no gaps",
          lines: analysis.dialogueFillGapLines,
          hasGaps: analysis.hasGaps,
          answers: analysis.dialogueFillGapAnswers
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Lesson improvement test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to test lesson generation improvements",
    endpoint: "/api/test-lesson-improvements"
  })
}