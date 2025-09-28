import { type NextRequest, NextResponse } from "next/server"
import { createGoogleAIServerService } from "@/lib/google-ai-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing Google AI API connection...")
    
    // Check environment variables first
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_AI_BASE_URL || "https://generativelanguage.googleapis.com"
    
    console.log("🔑 API Key present:", !!apiKey)
    console.log("🌐 Base URL:", baseUrl)
    console.log("🔑 API Key format:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING")
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Google AI API key is not configured",
        details: "Check NEXT_PUBLIC_GOOGLE_AI_API_KEY in .env.local",
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    // First, let's list available models
    console.log("📋 Listing available models...")
    
    const listUrls = [
      `${baseUrl}/v1beta/models?key=${apiKey}`,
      `${baseUrl}/v1/models?key=${apiKey}`
    ]
    
    let availableModels = []
    
    for (const listUrl of listUrls) {
      try {
        console.log(`🔍 Checking models at: ${listUrl.replace(apiKey, 'API_KEY_HIDDEN')}`)
        const response = await fetch(listUrl)
        
        if (response.ok) {
          const result = await response.json()
          console.log("✅ Models list retrieved successfully")
          
          if (result.models) {
            availableModels = result.models.map(model => model.name)
            console.log("📋 Available models:", availableModels)
            break
          }
        } else {
          const errorText = await response.text()
          console.log(`❌ Models list failed: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Models list exception: ${error.message}`)
      }
    }
    
    // Test with available models or fallback to common ones
    const modelsToTest = availableModels.length > 0 ? availableModels : [
      'models/gemini-1.5-flash-latest',
      'models/gemini-1.5-pro-latest', 
      'models/gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ]
    
    console.log("🧪 Testing models:", modelsToTest.slice(0, 5))
    
    const testUrls = []
    
    // Generate test URLs for different API versions and models
    for (const model of modelsToTest.slice(0, 5)) {
      testUrls.push(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`)
      testUrls.push(`${baseUrl}/v1/models/${model}:generateContent?key=${apiKey}`)
    }
    
    const requestBody = {
      contents: [{
        parts: [{
          text: "Say 'Hello, I am working!' if you can understand this message."
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50,
      }
    }
    
    let lastError = null
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i]
      console.log(`🌐 Testing URL ${i + 1}: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`)
      
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
        
        console.log(`📡 Response ${i + 1}: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const result = await response.json()
          console.log("✅ Direct API call successful!")
          
          if (result.candidates && result.candidates[0] && result.candidates[0].content) {
            const aiResponse = result.candidates[0].content.parts[0].text
            
            return NextResponse.json({
              success: true,
              message: "Google AI API is working!",
              response: aiResponse,
              workingUrl: url.replace(apiKey, 'API_KEY_HIDDEN'),
              timestamp: new Date().toISOString()
            })
          }
        } else {
          const errorText = await response.text()
          lastError = `${response.status} ${response.statusText}: ${errorText}`
          console.warn(`❌ URL ${i + 1} failed:`, lastError)
        }
      } catch (error) {
        lastError = error.message
        console.warn(`❌ URL ${i + 1} exception:`, lastError)
      }
    }
    
    // If we get here, all direct calls failed, try the service
    console.log("🔄 Direct calls failed, trying service wrapper...")
    
    const googleAI = createGoogleAIServerService()
    const response = await googleAI.prompt("Say 'Hello, I am working!' if you can understand this message.", {
      temperature: 0.1,
      maxTokens: 50,
    })
    
    return NextResponse.json({
      success: true,
      message: "Google AI API is working via service!",
      response: response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Google AI API test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: "Check console logs for detailed error information",
      apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
      baseUrl: process.env.NEXT_PUBLIC_GOOGLE_AI_BASE_URL || "https://generativelanguage.googleapis.com",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}