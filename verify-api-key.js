// Simple script to verify Google AI API key
// Run with: node verify-api-key.js

const API_KEY = "AIzaSyAkDCpwWTPKYftoc1Fdm77P6B00Lj89Lio"
const BASE_URL = "https://generativelanguage.googleapis.com"

async function testGeminiAPI() {
  console.log("🧪 Testing Gemini API Key...")
  console.log("🔑 API Key:", API_KEY.substring(0, 10) + "...")
  console.log("🌐 Base URL:", BASE_URL)
  
  // Based on the error, we need to use the correct model names
  const modelsToTest = [
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-pro-latest',
    'models/gemini-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ]
  
  const testUrls = []
  
  // Generate test URLs for different models and API versions
  for (const model of modelsToTest) {
    testUrls.push(`${BASE_URL}/v1beta/models/${model}:generateContent?key=${API_KEY}`)
    testUrls.push(`${BASE_URL}/v1/models/${model}:generateContent?key=${API_KEY}`)
  }
  
  const requestBody = {
    contents: [{
      parts: [{
        text: "Hello, please respond with 'API is working' if you can understand this."
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    }
  }
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i]
    console.log(`\n🌐 Testing URL ${i + 1}:`)
    console.log(url.replace(API_KEY, 'API_KEY_HIDDEN'))
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log("✅ SUCCESS!")
        console.log("📥 Response:", JSON.stringify(result, null, 2))
        
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          console.log("🎉 AI Response:", result.candidates[0].content.parts[0].text)
          return true
        }
      } else {
        const errorText = await response.text()
        console.log("❌ Error:", errorText)
      }
    } catch (error) {
      console.log("❌ Exception:", error.message)
    }
  }
  
  console.log("\n❌ All API endpoints failed")
  return false
}

// Also test if we can list models
async function listModels() {
  console.log("\n🔍 Testing model listing...")
  
  const listUrls = [
    `${BASE_URL}/v1beta/models?key=${API_KEY}`,
    `${BASE_URL}/v1/models?key=${API_KEY}`
  ]
  
  for (const url of listUrls) {
    console.log(`\n🌐 Testing: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`)
    
    try {
      const response = await fetch(url)
      console.log(`📡 Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log("✅ Available models:")
        if (result.models) {
          result.models.forEach(model => {
            console.log(`  - ${model.name}`)
          })
        }
        return true
      } else {
        const errorText = await response.text()
        console.log("❌ Error:", errorText)
      }
    } catch (error) {
      console.log("❌ Exception:", error.message)
    }
  }
  
  return false
}

async function main() {
  console.log("🚀 Starting Google AI API verification...\n")
  
  const apiWorking = await testGeminiAPI()
  const modelsWorking = await listModels()
  
  console.log("\n📊 Results:")
  console.log("API Working:", apiWorking ? "✅" : "❌")
  console.log("Models Accessible:", modelsWorking ? "✅" : "❌")
  
  if (!apiWorking && !modelsWorking) {
    console.log("\n💡 Troubleshooting tips:")
    console.log("1. Verify API key is correct")
    console.log("2. Check if Generative AI API is enabled in Google Cloud Console")
    console.log("3. Verify billing is set up")
    console.log("4. Check API quotas and limits")
  }
}

main().catch(console.error)