# 🔧 Sparky CSP Fix Applied

## ✅ Issues Fixed

1. **Content Security Policy Violation**: Removed inline scripts from popup.html
2. **Better Error Handling**: Added proper error handling for extraction
3. **Improved Popup**: Created separate popup.js file

## 🚀 Next Steps to Test

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find **LinguaSpark** extension
3. Click **"Reload"** button

### Step 2: Make Sure Dev Server is Running
```bash
npm run dev
```
**This is crucial!** The extraction tries to connect to `http://localhost:3000`

### Step 3: Test Sparky Again
1. Go back to the BBC page
2. Click the Sparky button
3. It should now work without CSP errors

## 🔍 If Still Having Issues

### Check Console for New Errors
1. Press F12 on the BBC page
2. Click Sparky button
3. Look for any new error messages

### Manual Test Commands
Run these in the console to debug:

```javascript
// Test content extraction
window.linguaSparkDebug.getContentInfo()

// Test storage
chrome.storage.local.set({test: 'data'}).then(() => console.log('Storage works'))

// Check if dev server is running
fetch('http://localhost:3000').then(r => console.log('Dev server:', r.status)).catch(e => console.log('Dev server not running:', e))
```

## 🎯 Expected Behavior Now

1. **Click Sparky** → Shows loading spinner
2. **Content Extracted** → Shows success checkmark  
3. **New Tab Opens** → Goes to `http://localhost:3000/popup?source=extraction`
4. **Lesson Interface** → Pre-populated with extracted content

## ⚠️ Common Issues

### "Dev server not running"
**Solution**: Run `npm run dev` in your project directory

### "Storage quota exceeded"
**Solution**: Clear extension storage in `chrome://extensions/` → LinguaSpark → "Clear storage"

### "Tab doesn't open"
**Solution**: Check if popup blocker is enabled

Let me know if you see any new errors after reloading the extension!