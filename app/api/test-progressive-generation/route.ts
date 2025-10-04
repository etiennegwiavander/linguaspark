import { NextRequest, NextResponse } from 'next/server'
import { ProgressiveGeneratorImpl, type CEFRLevel } from '@/lib/progressive-generator'

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing Progressive Generation System...")

    const testContent = `
    The Ryder Cup is one of golf's most prestigious team competitions. 
    It takes place every two years, alternating between venues in Europe and the United States. 
    The tournament features the best professional golfers from Europe competing against 
    the top players from the United States. The format includes various match play competitions 
    over three days, creating intense rivalry and excitement for golf fans worldwide.
    `

    const progressiveGen = new ProgressiveGeneratorImpl()

    // Test 1: Build shared context
    console.log("🏗️ Test 1: Building shared context...")
    const sharedContext = await progressiveGen.buildSharedContext(
      testContent,
      'discussion',
      'B1',
      'English'
    )

    console.log("✅ Shared context built:", {
      vocabularyCount: sharedContext.keyVocabulary.length,
      themesCount: sharedContext.mainThemes.length,
      summaryLength: sharedContext.contentSummary.length
    })

    // Test 2: Generate individual sections
    console.log("🎯 Test 2: Generating individual sections...")
    
    const sections = [
      { name: 'warmup', priority: 1, dependencies: [] },
      { name: 'vocabulary', priority: 2, dependencies: [] },
      { name: 'reading', priority: 3, dependencies: ['vocabulary'] }
    ]

    const generatedSections = []
    let currentContext = sharedContext

    for (const section of sections) {
      console.log(`🔄 Generating ${section.name}...`)
      
      const generatedSection = await progressiveGen.generateSection(
        section,
        currentContext,
        generatedSections
      )
      
      generatedSections.push(generatedSection)
      currentContext = progressiveGen.updateContext(currentContext, generatedSection)
      
      console.log(`✅ ${section.name} generated:`, {
        tokensUsed: generatedSection.tokensUsed,
        strategy: generatedSection.generationStrategy,
        contentType: typeof generatedSection.content
      })
    }

    // Test 3: Verify context updates
    console.log("🔄 Test 3: Verifying context updates...")
    console.log("Final context vocabulary:", currentContext.keyVocabulary.length)
    console.log("Final context themes:", currentContext.mainThemes.length)

    return NextResponse.json({
      success: true,
      message: "Progressive generation system test completed successfully",
      results: {
        sharedContext: {
          vocabularyCount: sharedContext.keyVocabulary.length,
          themesCount: sharedContext.mainThemes.length,
          summaryLength: sharedContext.contentSummary.length,
          keyVocabulary: sharedContext.keyVocabulary,
          mainThemes: sharedContext.mainThemes
        },
        generatedSections: generatedSections.map(s => ({
          name: s.sectionName,
          tokensUsed: s.tokensUsed,
          strategy: s.generationStrategy,
          contentPreview: typeof s.content === 'string' ? 
            s.content.substring(0, 100) + '...' : 
            Array.isArray(s.content) ? `Array with ${s.content.length} items` : 
            'Object'
        })),
        finalContext: {
          vocabularyCount: currentContext.keyVocabulary.length,
          themesCount: currentContext.mainThemes.length
        }
      }
    })

  } catch (error) {
    console.error("❌ Progressive generation test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Progressive Generation Test API",
    usage: "Send POST request to test the progressive generation system",
    testSections: ["warmup", "vocabulary", "reading"]
  })
}