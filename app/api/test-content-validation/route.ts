import { type NextRequest, NextResponse } from "next/server"
import { contentValidator } from "@/lib/content-validator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Test content validation
    const validationResult = contentValidator.validateContent(content)
    const qualityScore = contentValidator.checkContentQuality(content)
    const minimumWordCount = contentValidator.getMinimumWordCount()

    return NextResponse.json({
      validation: validationResult,
      quality: qualityScore,
      minimumWordCount,
      contentLength: content.length,
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length
    })
  } catch (error) {
    console.error("Error testing content validation:", error)
    return NextResponse.json({ error: "Failed to validate content" }, { status: 500 })
  }
}