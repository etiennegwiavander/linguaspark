import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing OpenRouter API with DeepSeek V3...');

    const apiKey = process.env.OPEN_ROUTER_KEY;
    const baseUrl = process.env.OPEN_ROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const model = process.env.OPEN_ROUTER_MODEL || 'deepseek/deepseek-chat';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPEN_ROUTER_KEY not found in environment variables'
      }, { status: 500 });
    }

    console.log('📋 Configuration:');
    console.log('  Base URL:', baseUrl);
    console.log('  Model:', model);
    console.log('  Site URL:', siteUrl);

    // Test lesson generation prompt
    const testPrompt = `Create a short English lesson for A2 level students about daily routines.

Include:
1. A brief title
2. 2-3 warmup questions
3. A short reading passage (100 words)
4. 3 vocabulary words with definitions
5. A simple wrap-up activity

Format the response as JSON with this structure:
{
  "title": "lesson title",
  "warmup": ["question 1", "question 2"],
  "reading": "passage text",
  "vocabulary": [{"word": "word", "definition": "definition"}],
  "wrapup": "activity description"
}`;

    console.log('🚀 Sending request to OpenRouter...');
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'LinguaSpark'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response time: ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', errorText);
      return NextResponse.json({
        success: false,
        error: `OpenRouter API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Received response from OpenRouter');

    // Extract the generated content
    const generatedContent = result.choices?.[0]?.message?.content;
    
    if (!generatedContent) {
      console.error('❌ No content in response');
      return NextResponse.json({
        success: false,
        error: 'No content generated',
        rawResponse: result
      }, { status: 500 });
    }

    console.log('📝 Generated content length:', generatedContent.length, 'characters');
    console.log('💰 Token usage:', result.usage);

    // Try to parse as JSON
    let parsedLesson = null;
    try {
      parsedLesson = JSON.parse(generatedContent);
      console.log('✅ Successfully parsed lesson as JSON');
    } catch (e) {
      console.warn('⚠️  Content is not valid JSON, returning as text');
    }

    return NextResponse.json({
      success: true,
      message: 'OpenRouter API test successful!',
      responseTime: `${responseTime}ms`,
      model: model,
      tokenUsage: result.usage,
      generatedContent: generatedContent,
      parsedLesson: parsedLesson,
      rawResponse: result
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OpenRouter API Test Endpoint',
    instructions: 'Send a POST request to test the OpenRouter API with DeepSeek V3',
    configuration: {
      baseUrl: process.env.OPEN_ROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPEN_ROUTER_MODEL || 'deepseek/deepseek-chat',
      hasApiKey: !!process.env.OPEN_ROUTER_KEY
    }
  });
}
