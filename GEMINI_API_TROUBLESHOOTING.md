# Gemini API Troubleshooting Guide

## Current Issue
Getting "404 Not Found" error when testing AI connection, indicating the API endpoint is not accessible.

## Possible Causes & Solutions

### 1. API Endpoint Format Issues
**Problem**: The Gemini API endpoint format might be incorrect.

**Current API Key**: `AIzaSyAkDCpwWTPKYftoc1Fdm77P6B00Lj89Lio`
**Base URL**: `https://generativelanguage.googleapis.com`

**Testing Multiple Endpoints**: The updated code now tries multiple endpoint formats:
- `/v1beta/models/gemini-1.5-flash:generateContent`
- `/v1/models/gemini-1.5-flash:generateContent`
- `/v1beta/models/gemini-pro:generateContent`
- `/v1/models/gemini-pro:generateContent`

### 2. API Key Issues
**Check if API key is valid**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Verify the API key exists and is active
3. Check if there are any restrictions on the key

**Common API Key Problems**:
- Key is expired or revoked
- Key has domain/IP restrictions
- Key doesn't have access to Generative AI API

### 3. Google Cloud Console Setup
**Required Steps**:
1. **Enable the API**: Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Navigate to**: APIs & Services > Library
3. **Search for**: "Generative Language API" or "AI Platform API"
4. **Enable the API** for your project
5. **Set up billing** (required for API access)

### 4. Model Availability
**Check Available Models**:
The API might not support the model names we're using. Common model names:
- `gemini-pro`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `text-bison-001`

### 5. API Quotas and Limits
**Check Quotas**:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Quotas
3. Look for Generative Language API quotas
4. Ensure you haven't exceeded limits

## Testing Steps

### Step 1: Test API Key Directly
Run the verification script:
```bash
node verify-api-key.js
```

This will test multiple endpoints and show which ones work.

### Step 2: Check Browser Console
1. Open browser developer tools
2. Click "Test AI Connection" button
3. Check console logs for detailed error information

### Step 3: Test in Extension
1. Generate a lesson and watch console logs
2. Look for specific error messages
3. Check if fallback content is being used

## Expected Console Output

### If Working:
```
🧪 Testing Google AI API connection...
🔑 API Key present: true
🌐 Base URL: https://generativelanguage.googleapis.com
🌐 Testing URL 1: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=API_KEY_HIDDEN
📡 Response 1: 200 OK
✅ Direct API call successful!
```

### If Failing:
```
🧪 Testing Google AI API connection...
🔑 API Key present: true
🌐 Testing URL 1: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=API_KEY_HIDDEN
📡 Response 1: 404 Not Found
❌ URL 1 failed: 404 Not Found: Model not found
```

## Alternative Solutions

### Option 1: Use Different Model
If `gemini-1.5-flash` doesn't work, try:
- `gemini-pro`
- `gemini-1.5-pro`
- `text-bison-001`

### Option 2: Use Google AI Studio API
Instead of the Generative Language API, use the Google AI Studio API:
- Base URL: `https://generativelanguage.googleapis.com`
- Different authentication method
- Different endpoint structure

### Option 3: Fallback to Template Generation
If AI doesn't work, the system will use enhanced template-based generation with:
- Content-aware vocabulary extraction
- Topic-based question generation
- Contextual lesson structure

## Quick Fixes to Try

### Fix 1: Update Model Name
```typescript
private model: string = "gemini-pro" // Instead of "gemini-1.5-flash"
```

### Fix 2: Try Different API Version
```typescript
const url = `${this.config.baseUrl}/v1/models/${this.model}:generateContent?key=${this.config.apiKey}`
// Instead of v1beta
```

### Fix 3: Check API Key Format
Ensure the API key:
- Starts with "AIza"
- Is exactly 39 characters long
- Has no extra spaces or characters

## Verification Checklist

- [ ] API key is correct and active
- [ ] Generative Language API is enabled in Google Cloud
- [ ] Billing is set up and active
- [ ] No quota limits exceeded
- [ ] Model name is correct and available
- [ ] API endpoint format is correct
- [ ] No network/firewall issues

## Next Steps

1. **Run the verification script** to test API endpoints
2. **Check Google Cloud Console** for API status
3. **Try the updated test endpoint** with multiple URL formats
4. **Monitor console logs** for detailed error information
5. **Consider using fallback generation** if API issues persist

The system is designed to work with or without AI, so lesson generation will continue to function even if the API is not accessible.