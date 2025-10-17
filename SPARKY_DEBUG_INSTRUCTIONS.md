# Sparky Debug Instructions

## Current Status ✅
- Extension error is gone (storage is working)
- Content extraction works (13,725 characters from BBC)
- Storage operations work (no more localStorage errors)

## Issues Remaining ❌
1. **Debug functions not accessible** - `linguaSparkDebug is not defined`
2. **Pre-filling not working** - Content stored but not loaded in lesson interface

## Debug Steps

### Step 1: Test Storage End-to-End
1. Visit: `http://localhost:3000/test-complete-flow.html`
2. Click "Simulate Extraction" 
3. Click "Test Interface Loading"
4. Click "Open Lesson Interface"
5. **Expected**: Interface opens with content pre-filled

### Step 2: Test on BBC Page
1. Go to: `https://www.bbc.com/worklife/article/20251008-why-big-tech-is-going-nuclear`
2. Open browser console
3. Check if content script loaded: `console.log('Content script check')`
4. Look for: `[LinguaSpark] Content script loaded on: https://www.bbc.com/...`

### Step 3: Manual Debug on BBC Page
If `linguaSparkDebug` is not defined, try these manual commands:

```javascript
// Check if Sparky button exists
document.querySelector('#linguaspark-extract-button')

// Check localStorage directly
localStorage.getItem('linguaspark_lesson_config')

// Manual storage test
localStorage.setItem('test', 'hello')
localStorage.getItem('test')

// Check if content script variables exist
typeof handleExtractClick
typeof extractCleanContent
```

### Step 4: Force Content Script Reload
1. Go to `chrome://extensions/`
2. Find LinguaSpark extension
3. Click "Reload" button
4. Go back to BBC page
5. Refresh the page
6. Try debug commands again

### Step 5: Check Extension Console
1. Go to `chrome://extensions/`
2. Click "Details" on LinguaSpark
3. Click "Inspect views: background page"
4. Check for any errors in background script console

## Expected Working Flow

### On BBC Page:
```
[LinguaSpark] Content script loaded on: https://www.bbc.com/...
[LinguaSpark] Initializing extract button system...
[LinguaSpark] Content analysis: {wordCount: 2891, contentType: "news"}
[LinguaSpark] Floating button created and shown
```

### When Sparky is Clicked:
```
[LinguaSpark] handleExtractClick called
[LinguaSpark] Clean content extracted: {textLength: 13725, wordCount: 2891}
[LinguaSpark] safeStorageSet called with data keys: [lessonConfiguration, extractedContent, ...]
[LinguaSpark] ✅ localStorage.setItem completed successfully
[LinguaSpark] ✅ Storage completed successfully
```

### In Lesson Interface:
```
[LinguaSpark Popup] Direct localStorage check: Found data
[LinguaSpark Popup] Using localStorage data directly
[LinguaSpark Popup] Setting selectedText to: 13725 characters
```

## Quick Fix Test

If debug functions don't work, try clicking Sparky directly and check:

1. **Does Sparky show success animation?** (green checkmark)
2. **Does lesson interface open?** 
3. **Check localStorage manually:**
   ```javascript
   const data = localStorage.getItem('linguaspark_lesson_config')
   if (data) {
     const parsed = JSON.parse(data)
     console.log('Content length:', parsed.lessonConfiguration?.sourceContent?.length)
   }
   ```

## Most Likely Issues

1. **Content script not loading** - Extension needs reload
2. **Timing issue** - Storage happens after interface opens
3. **Data format mismatch** - Interface expects different format
4. **Cross-origin issue** - BBC page vs localhost:3000

## Next Steps

Run the debug steps above and report:
1. Which step fails?
2. What console messages appear?
3. Does the test-complete-flow.html work?
4. Does manual localStorage test work?