# 🔍 Extraction Diagnostic Steps

## Problem
Debug panel shows `selectedText length = 0` and empty `sourceUrl`, indicating content extraction is failing.

## Diagnostic Steps

### Step 1: Test Content Extraction Manually
Go to Wikipedia and open console, then run:

```javascript
// Test if extractCleanContent works
if (typeof extractCleanContent === 'function') {
  const content = extractCleanContent();
  console.log('Basic content test:', {
    textLength: content.text?.length || 0,
    wordCount: content.wordCount || 0,
    title: content.metadata?.title
  });
} else {
  console.log('extractCleanContent function not found');
}
```

### Step 2: Test Enhanced Extraction
```javascript
// Test if extractEnhancedContent works
if (typeof extractEnhancedContent === 'function') {
  const enhanced = extractEnhancedContent();
  console.log('Enhanced content test:', {
    textLength: enhanced.text?.length || 0,
    isValid: enhanced.validation?.isValid,
    issues: enhanced.validation?.issues
  });
} else {
  console.log('extractEnhancedContent function not found');
}
```

### Step 3: Test Storage After Extraction
```javascript
// Check what's in storage after clicking Sparky
chrome.storage.local.get(['lessonConfiguration', 'extractedContent']).then(result => {
  console.log('=== STORAGE DIAGNOSTIC ===');
  console.log('lessonConfiguration exists:', !!result.lessonConfiguration);
  console.log('sourceContent length:', result.lessonConfiguration?.sourceContent?.length || 0);
  console.log('extractedContent exists:', !!result.extractedContent);
  console.log('text length:', result.extractedContent?.text?.length || 0);
});
```

### Step 4: Test Manual Storage
```javascript
// Manually store test content to verify storage works
const testConfig = {
  sourceContent: 'Language learning is the process by which humans acquire the capacity to perceive and comprehend language.',
  suggestedType: 'discussion',
  suggestedLevel: 'B1',
  metadata: {
    title: 'Test Title',
    sourceUrl: window.location.href,
    domain: window.location.hostname,
    extractedAt: new Date(),
    wordCount: 100,
    readingTime: 1,
    complexity: 'intermediate',
    suitabilityScore: 0.8
  },
  extractionSource: 'webpage',
  allowContentEditing: true,
  userCanModifySettings: true,
  attribution: 'Test content'
};

chrome.storage.local.set({
  lessonConfiguration: testConfig,
  extractionSource: 'webpage'
}).then(() => {
  console.log('Test content stored successfully');
  // Now refresh the popup to see if it loads
});
```

## Expected Results

### If Working:
- **Basic content**: Should show text length > 0, word count > 0
- **Enhanced content**: Should show validation.isValid = true
- **Storage**: Should contain lessonConfiguration with sourceContent
- **Popup**: Should load with test content after manual storage

### If Broken:
- **Function not found**: Extension not loaded properly
- **Text length = 0**: Page content extraction failing
- **Validation failed**: Content doesn't meet minimum requirements
- **Storage empty**: Chrome storage API not working

## Quick Fix Test

If extraction is failing, try this simple version:

```javascript
// Simple manual extraction test
const simpleText = document.body.innerText.substring(0, 1000);
const simpleConfig = {
  sourceContent: simpleText,
  suggestedType: 'discussion',
  suggestedLevel: 'B1',
  metadata: {
    title: document.title,
    sourceUrl: window.location.href,
    domain: window.location.hostname,
    extractedAt: new Date(),
    wordCount: simpleText.split(' ').length,
    readingTime: 1,
    complexity: 'intermediate',
    suitabilityScore: 0.8
  },
  extractionSource: 'webpage',
  allowContentEditing: true,
  userCanModifySettings: true,
  attribution: `Extracted from ${document.title}`
};

chrome.storage.local.set({
  lessonConfiguration: simpleConfig,
  extractionSource: 'webpage'
}).then(() => {
  console.log('Simple extraction stored, refresh popup');
});
```

## Next Steps

1. **Run diagnostics** on Wikipedia page
2. **Check console** for error messages
3. **Test manual storage** to isolate the issue
4. **Report results** - which step fails?

The key is to identify whether the issue is:
- ❌ **Content extraction** (functions not working)
- ❌ **Content validation** (content rejected as invalid)  
- ❌ **Storage operation** (Chrome storage API failing)
- ❌ **Popup loading** (storage exists but popup can't read it)

Run these tests and let me know what you find! 🔍