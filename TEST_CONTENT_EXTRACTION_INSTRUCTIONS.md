# Testing Content Extraction Fix

## Quick Test Steps

### 1. Reload the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Find "LinguaSpark" extension
3. Click the reload button (circular arrow icon)
4. Verify no errors appear

### 2. Test on a Real Website
1. Go to a news article (e.g., BBC, CNN, or any article with substantial text)
2. Look for the Sparky button (blue circular button with star icon) in the bottom-right corner
3. If you don't see it, check the browser console (F12) for any errors

### 3. Test Content Extraction
1. Click the Sparky button
2. Watch for the loading animation (spinning icon)
3. The button should turn green with a checkmark when successful
4. A new tab should open with the LinguaSpark lesson interface

### 4. Verify Lesson Interface
1. Check that the "Source Content" field is populated with extracted text
2. Verify that "Lesson Type" and "Student Level" are pre-selected
3. Confirm the content is not empty (should show character count > 0)

### 5. Test Fallback Behavior
If the extension context is invalid:
1. The extraction should still work
2. Content should be stored in localStorage
3. Lesson interface should open in a new tab
4. All fields should still be populated

## Expected Results

### ✅ Success Indicators
- Sparky button appears on content-rich pages
- Button shows loading animation when clicked
- Button turns green with checkmark after extraction
- Lesson interface opens with populated fields
- Source Content field shows extracted text
- Lesson Type and Student Level are pre-selected
- No "Extension context invalidated" errors

### ❌ Failure Indicators
- Sparky button doesn't appear
- Button shows red error state
- Lesson interface opens with empty fields
- Console shows "Extension context invalidated" errors
- Source Content field shows "0 characters"

## Debugging

### Check Browser Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for LinguaSpark log messages
4. Check for any error messages

### Check Extension Console
1. Go to `chrome://extensions/`
2. Find LinguaSpark extension
3. Click "Inspect views: background page"
4. Check for any errors in the background script

### Check Storage
1. In Developer Tools, go to Application tab
2. Check Local Storage for `linguaspark_lesson_config`
3. Verify data is being stored correctly

## Test URLs
Try these URLs for testing:
- https://www.bbc.com/news (any article)
- https://en.wikipedia.org/wiki/Renewable_energy
- https://www.cnn.com (any article)
- Any blog post or article with 200+ words

## Troubleshooting

### If Sparky Button Doesn't Appear
1. Check if the page has enough content (200+ words)
2. Verify the extension is loaded and active
3. Check browser console for errors
4. Try refreshing the page

### If Extraction Fails
1. Check browser console for error messages
2. Try reloading the extension
3. Test on a different website
4. Verify the Next.js development server is running

### If Lesson Interface is Empty
1. Check if content was stored in localStorage
2. Verify the URL parameters are correct
3. Check the lesson interface bridge is working
4. Test the storage fallback mechanism

## Next Steps After Testing
1. If tests pass: Content extraction is fixed ✅
2. If tests fail: Check console errors and report specific issues
3. Test on multiple websites to ensure robustness
4. Verify lesson generation works with extracted content