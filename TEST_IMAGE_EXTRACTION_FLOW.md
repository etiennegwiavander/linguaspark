# Test Image Extraction Flow

## What We Fixed

1. ✅ Added `bannerImage` and `images` to `lessonConfiguration.metadata` in `content.js`
2. ✅ Added logging in `background.js` to verify images are being stored
3. ✅ Added logging in `app/popup/page.tsx` to verify images are being retrieved

## Testing Steps

### Step 1: Reload Extension
```
1. Go to chrome://extensions/
2. Find LinguaSpark
3. Click RELOAD button
4. Close ALL old tabs (including popup tabs)
```

### Step 2: Open BBC Article
```
https://www.bbc.com/news/articles/c203w85d0qyo
```

### Step 3: Open Browser Console
```
Press F12 or Right-click → Inspect
Go to Console tab
```

### Step 4: Click Ghost Button

**Expected Console Logs (on BBC page):**
```
[DEBUG] Extracting banner images...
[DEBUG] Found 5 images, selected 3 for banner
[LinguaSpark] ✅ Storage completed successfully
```

### Step 5: Check Background Script Console

**How to access:**
```
1. Go to chrome://extensions/
2. Find LinguaSpark
3. Click "service worker" or "background page" link
4. Check console
```

**Expected Logs:**
```
[LinguaSpark Background] Content stored in API for session: session_xxx
[LinguaSpark Background] Content length: 1874 characters
[LinguaSpark Background] 📸 Banner image: https://...
[LinguaSpark Background] 🖼️ Images count: 3
```

### Step 6: Check Popup Console

**Expected Logs:**
```
[LinguaSpark Popup] ✅ Retrieved content from API, length: 1874
[LinguaSpark Popup] 📸 Banner image: https://...
[LinguaSpark Popup] 🖼️ Images count: 3
[LinguaSpark Popup] First image: {url: "...", alt: "...", ...}
```

## Troubleshooting

### If images show as "None" or count is 0:

**Check 1: Verify extraction on BBC page**
```javascript
// In BBC page console, run:
const content = extractCleanContent();
console.log('Banner:', content.bannerImage);
console.log('Images:', content.images);
```

**Check 2: Verify Chrome storage**
```javascript
// In BBC page console after clicking button:
chrome.storage.local.get(['lessonConfiguration'], (result) => {
  console.log('Stored metadata:', result.lessonConfiguration?.metadata);
});
```

**Check 3: Verify API storage**
- Check background script console for storage logs
- Check popup console for retrieval logs

### If extraction doesn't work:

**Reload everything:**
```
1. Reload extension
2. Close ALL tabs
3. Open new BBC article tab
4. Try again
```

## Success Criteria

✅ BBC page console shows: `Found 5 images, selected 3 for banner`
✅ Background console shows: `Banner image: https://...`
✅ Background console shows: `Images count: 3`
✅ Popup console shows: `Banner image: https://...`
✅ Popup console shows: `Images count: 3`
✅ Popup console shows: `First image: {url: ...}`

## Next Steps After Verification

Once images are confirmed in popup console:

### 1. Display Banner Image in Lesson

Edit `components/lesson-generator.tsx`:

```tsx
// Add near the top, after title
{lesson.metadata?.bannerImage && (
  <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
    <img 
      src={lesson.metadata.bannerImage} 
      alt={lesson.title}
      className="w-full h-auto max-h-96 object-cover"
      onError={(e) => {
        console.log('Banner image failed to load');
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
)}
```

### 2. Pass Images to Lesson Generator

The images are in `metadata`, so they should be accessible via:
```typescript
lesson.metadata.bannerImage
lesson.metadata.images
```

### 3. Include in Exports

Update `lib/export-utils.ts` to include banner image in PDF/Word exports.

## Common Issues

### Issue: "Found 0 images"
**Cause:** Page has no suitable images or all filtered out
**Solution:** Test on different article with images

### Issue: Images not in storage
**Cause:** `extractedContent` missing images field
**Solution:** Check `content.js` line ~540 for image assignment

### Issue: Images not in popup
**Cause:** API not passing through images
**Solution:** Check `app/api/get-extracted-content/route.ts`

## Files Modified

1. ✅ `content.js` - Added images to lessonConfiguration.metadata
2. ✅ `background.js` - Added image logging
3. ✅ `app/popup/page.tsx` - Added image logging
4. ⏳ `components/lesson-generator.tsx` - Need to add banner display
5. ⏳ TypeScript interfaces - Need to add image types

---

**Status:** READY FOR TESTING
**Last Updated:** 2025-10-22
