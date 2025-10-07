# Quick Test Instructions

## What We Fixed

### Problem
Lesson generation was failing with `MAX_TOKENS_EXCEEDED` error in the grammar section.

### Solution Applied

1. **Increased token limit** from 800 → 1500 tokens for grammar generation
2. **Accept partial responses** instead of throwing errors
3. **Added JSON repair function** to handle incomplete JSON from truncated responses
4. **Improved error handling** to be more resilient

## Test the Fix

### Prerequisites
- Development server running on `localhost:3000`
- Check with: `Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet`

### Run Test

```powershell
.\test-grammar-max-tokens-fix.ps1
```

### Expected Results

✅ **Success indicators:**
- Lesson generates without errors
- Grammar section is present and complete
- No MAX_TOKENS errors in console
- All lesson sections generated

❌ **If test fails:**
- Check server logs for detailed error messages
- Verify Gemini API key is valid
- Ensure you're using `gemini-2.5-flash` model

## Manual Test via UI

1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Login with your account
4. Paste test content (political news article)
5. Select:
   - Lesson Type: Travel (or any type)
   - Student Level: B2
   - Target Language: English
6. Click "Generate Lesson"
7. Wait for generation (may take 2-3 minutes)
8. Verify grammar section appears

## What to Look For

### In Terminal Logs
```
✅ Section grammar generated in XXXXms
✅ Context updated for grammar
```

### In Browser
- Grammar section with:
  - Grammar point name
  - Form explanation
  - Usage explanation
  - 3 examples
  - 3 exercises with answers

## Troubleshooting

### Still Getting MAX_TOKENS?
- The fix increases limit to 1500 tokens
- If still failing, check if prompt is too long
- Consider using `gemini-2.0-flash-exp` model

### JSON Parse Errors?
- JSON repair function should handle this
- Check if response is completely empty
- Verify API is returning content

### Other Errors?
- Check API key validity
- Verify network connection
- Review server logs for details

## Files Modified

- `lib/google-ai-server.ts` - MAX_TOKENS handling
- `lib/progressive-generator.ts` - Grammar generation + JSON repair
- `test-grammar-max-tokens-fix.ps1` - Test script
