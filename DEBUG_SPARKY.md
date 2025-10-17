# 🔍 Debug Sparky - Troubleshooting Guide

## Quick Debugging Steps

### Step 1: Check Extension Status
1. Go to `chrome://extensions/`
2. Find **LinguaSpark** extension
3. Make sure it's **enabled**
4. Click **"Reload"** button to refresh the extension

### Step 2: Check Console on BBC Page
1. Go back to the BBC page: https://www.bbc.com/news/articles/cj07ley3jnpo
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for messages starting with `[LinguaSpark]`

You should see something like:
```
[LinguaSpark] Content script loaded on: https://www.bbc.com/news/articles/cj07ley3jnpo
[LinguaSpark] Initializing extract button system...
[LinguaSpark] Page analysis result: {...}
```

### Step 3: Manual Debug Commands
In the console, try these commands:

```javascript
// Check if debug functions are available
window.linguaSparkDebug

// Analyze the current page
window.linguaSparkDebug.analyzeCurrentPage()

// Get content information
window.linguaSparkDebug.getContentInfo()

// Force show the button (for testing)
window.linguaSparkDebug.showButton()
```

### Step 4: Check What the Analysis Found
Run this in the console:
```javascript
window.linguaSparkDebug.analyzeCurrentPage().then(result => {
  console.log('Should show button:', result.shouldShow);
  console.log('Reason:', result.reason);
  console.log('Word count:', result.wordCount);
  console.log('Content type:', result.contentType);
});
```

## Common Issues and Solutions

### Issue 1: "Content script loaded" but no analysis
**Solution**: Reload the extension and refresh the page

### Issue 2: "Insufficient content" message
**Solution**: The page might not have enough text. Try a longer article.

### Issue 3: "Site is in exclusion list"
**Solution**: BBC should not be excluded. Check if the URL detection is working correctly.

### Issue 4: No console messages at all
**Solution**: 
1. Extension might not be loaded properly
2. Go to `chrome://extensions/`
3. Click **"Reload"** on LinguaSpark
4. Refresh the BBC page

### Issue 5: Button appears but doesn't work
**Solution**: Check if your development server is running (`npm run dev`)

## Expected Behavior on BBC News

For the BBC article, you should see:
- ✅ Word count > 200
- ✅ Content type: "news"
- ✅ Not excluded site
- ✅ Educational content detected
- ✅ Button should appear

## Force Show Button for Testing

If analysis is working but button isn't showing, try:
```javascript
window.linguaSparkDebug.showButton()
```

This will force create the button regardless of analysis results.

## Next Steps After Debugging

1. **If console shows errors**: Share the error messages
2. **If analysis fails**: Check the analysis result details
3. **If button appears but doesn't work**: Check if `npm run dev` is running
4. **If nothing happens**: Extension might need to be reloaded

## Quick Fix Commands

Run these in the browser console on the BBC page:

```javascript
// 1. Check if extension loaded
console.log('Extension loaded:', !!window.linguaSparkDebug);

// 2. Force analyze page
window.linguaSparkDebug?.analyzeCurrentPage();

// 3. Force show button
window.linguaSparkDebug?.showButton();

// 4. Check content extraction
window.linguaSparkDebug?.getContentInfo();
```

Let me know what you see in the console and we can fix any issues!