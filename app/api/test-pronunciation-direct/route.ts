import { NextResponse } from 'next/server'
import { createGoogleAIServerService } from '@/lib/google-ai-server'

export async function POST(request: Request) {
  try {
    const { word } = await request.json()

    if (!word) {
      return NextResponse.json(
        { error: 'Missing required field: word' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing direct pronunciation generation for word:', word)

    const googleAI = createGoogleAIServerService()

    const prompt = `Create pronunciation practice for the word "${word}" for B1 level students about sports.

Provide the following information in this exact format:

WORD: ${word}
IPA: [provide IPA transcription]
DIFFICULT_SOUNDS: [list 2-3 difficult sounds separated by commas]
TIP_1: [first pronunciation tip]
TIP_2: [second pronunciation tip]
PRACTICE: [a sentence using "${word}" related to sports]

Example for "through":
WORD: through
IPA: /θruː/
DIFFICULT_SOUNDS: /θ/, /uː/
TIP_1: Place your tongue between your teeth for the 'th' sound
TIP_2: Round your lips for the long 'oo' sound
PRACTICE: The athlete ran through the finish line with determination.`

    console.log('📤 Sending prompt to AI...')
    const response = await googleAI.prompt(prompt)
    console.log('📥 Received response:', response)

    return NextResponse.json({
      success: true,
      word,
      prompt,
      response,
      responseLength: response.length
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
