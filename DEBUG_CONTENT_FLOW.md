# 🔍 Debug Content Flow Issue

## Problem
The popup loads but the lesson generator shows empty fields instead of the extracted content.

## Debug Steps

### Step 1: Check Chrome Storage
Open browser console on the popup page and run:
```javascript
chrome.storage.local.get(['lessonConfiguration', 'extractedContent', 'selectedText', 'sourceUrl']).then(result => {
  console.log('=== STORAGE DEBUG ===');
  console.log('lessonConfiguration:', result.lessonConfiguration);
  console.log('extractedContent:', result.extractedContent);
  console.log('selectedText:', result.selectedText);
  console.log('sourceUrl:', result.sourceUrl);
});
```

### Step 2: Check Popup State
In popup console, check if the popup is loading the data:
```javascript
// This should show the popup's internal state
console.log('Popup selectedText length:', document.querySelector('textarea')?.value?.length || 0);
```

### Step 3: Check LessonInterfaceBridge
In popup console:
```javascript
// Check if bridge detects extraction source
LessonInterfaceBridge.isExtractionSource().then(result => {
  console.log('Is extraction source:', result);
});

// Check if configuration loads
LessonInterfaceBridge.loadExtractionConfiguration().then(config => {
  console.log('Bridge config:', config);
});
```

### Step 4: Manual Test
If storage has data but popup is empty, manually set the textarea:
```javascript
// Find the textarea and set content manually
const textarea = document.querySelector('textarea');
if (textarea) {
  textarea.value = 'Test content from manual input';
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}
```

## Expected Results

### If Working Correctly:
1. **Storage**: Should contain `lessonConfiguration` with `sourceContent`
2. **Popup Console**: Should show "Found lesson configuration"
3. **Bridge**: Should return `true` for `isExtractionSource()`
4. **Textarea**: Should be populated with extracted content

### If Broken:
1. **Storage Empty**: Content script didn't store data properly
2. **Bridge Returns False**: URL parameter or storage format issue
3. **Textarea Empty**: Props not passed or useEffect not triggered

## Quick Fix Test

Try this in the popup console to force populate:
```javascript
// Force set the lesson generator content
const event = new CustomEvent('forcePopulate', {
  detail: { 
    text: 'Language learning is the process by which humans acquire the capacity to perceive and comprehend language...',
    sourceUrl: 'https://en.wikipedia.org/wiki/Language_learning'
  }
});
window.dispatchEvent(event);
```

## Next Steps Based on Results

### If Storage is Empty:
- Check content script console for extraction errors
- Verify Sparky button click worked
- Check if content script stored data

### If Storage Has Data But Popup Empty:
- Check popup useEffect console logs
- Verify initialText prop is being passed
- Check lesson generator useEffect for initialText

### If Bridge Not Working:
- Check URL parameters (?source=extraction)
- Verify extractionSource in storage
- Check lesson interface bridge logic

Run these debug steps and report what you see! 🔍