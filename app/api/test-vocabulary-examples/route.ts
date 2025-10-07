import { NextResponse } from "next/server"
import { ProgressiveGeneratorImpl, type SharedContext, type CEFRLevel } from "@/lib/progressive-generator"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = (searchParams.get("level") || "B1") as CEFRLevel

  console.log(`🧪 Testing vocabulary example count for ${level} level`)

  try {
    const generator = new ProgressiveGeneratorImpl()

    // Create a test shared context
    const testContext: SharedContext = {
      keyVocabulary: ["competition", "tournament", "victory", "challenge"],
      mainThemes: ["sports", "competition"],
      difficultyLevel: level,
      contentSummary: "A text about sports competitions and tournaments where teams compete for victory.",
      sourceText: "The Ryder Cup is a prestigious golf tournament where teams from Europe and the United States compete in a thrilling competition. The tournament represents the ultimate challenge in professional golf, with players striving for victory and glory.",
      lessonType: "discussion",
      targetLanguage: "english"
    }

    console.log(`📚 Generating vocabulary for ${level} level...`)
    
    // Generate vocabulary section
    const vocabularySection = await generator.generateSection(
      { name: 'vocabulary', priority: 2, dependencies: [] },
      testContext,
      []
    )

    // Analyze the results
    const vocabulary = vocabularySection.content
    const instruction = vocabulary[0]
    const words = vocabulary.slice(1)

    // Count examples per word
    const exampleCounts = words.map((item: any) => ({
      word: item.word,
      exampleCount: item.examples ? item.examples.length : 0,
      examples: item.examples || []
    }))

    // Expected count based on level
    const expectedCounts: Record<CEFRLevel, number> = {
      'A1': 5,
      'A2': 5,
      'B1': 4,
      'B2': 3,
      'C1': 2
    }
    const expectedCount = expectedCounts[level]

    // Check if all words have the correct number of examples
    const allCorrect = exampleCounts.every((item: any) => item.exampleCount === expectedCount)

    return NextResponse.json({
      success: true,
      level: level,
      expectedExamplesPerWord: expectedCount,
      vocabularyGenerated: words.length,
      exampleCounts: exampleCounts,
      allCorrect: allCorrect,
      instruction: instruction,
      sampleWord: words[0] || null,
      message: allCorrect 
        ? `✅ All vocabulary words have ${expectedCount} examples as expected for ${level} level`
        : `⚠️ Some vocabulary words don't have the expected ${expectedCount} examples for ${level} level`
    })

  } catch (error) {
    console.error("❌ Test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
