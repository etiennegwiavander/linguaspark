# 🚨 CRITICAL: How to Test the Three Features

## ⚠️ IMPORTANT: You MUST Extract Content from a Webpage!

The three features (title format, banner image, source attribution) **ONLY work when you extract content from a webpage using Sparky**. They will NOT work if you just type text directly into the lesson generator.

---

## ✅ CORRECT Testing Method

### Step 1: Navigate to a News Article
```
Examples:
- https://www.bbc.com/news
- https://www.cnn.com
- https://en.wikipedia.org/wiki/Main_Page
```

### Step 2: Click Sparky Mascot
- Look for the floating Sparky button on the webpage
- Click it to extract content
- Wait for extraction to complete
- You should see: "Content extracted successfully"

### Step 3: Generate Lesson from Extracted Content
- The popup should open automatically
- Content should be pre-populated
- Click "Generate Lesson"
- Wait for generation to complete

### Step 4: Verify Features
- ✅ Title: "Original Article Title - AI Generated Title"
- ✅ Banner: Image from article displayed at top
- ✅ Source: "Article from [Site]" link at bottom

---

## ❌ INCORRECT Testing Method (Won't Work!)

### What NOT to Do:
```
❌ Opening the extension popup directly
❌ Typing or pasting text manually
❌ Using the "Extract from Page" button without being on an article
❌ Generating lessons without extraction
```

**Why it won't work:**
- No webpage = No images to extract
- No extraction = No metadata (title, domain, URL)
- No metadata = No banner images, no source attribution
- Manual text = Generic title format

---

## 🔍 How to Check if Extraction Worked

### In Browser Console (F12):
```javascript
// Check Chrome storage for extraction data
chrome.storage.local.get(['lessonConfiguration'], (result) => {
  console.log('Has extraction config:', !!result.lessonConfiguration);
  console.log('Has metadata:', !!result.lessonConfiguration?.metadata);
  console.log('Has banner images:', !!result.lessonConfiguration?.metadata?.bannerImages);
  console.log('Banner images:', result.lessonConfiguration?.metadata?.bannerImages);
  console.log('Source URL:', result.lessonConfiguration?.metadata?.sourceUrl);
  console.log('Domain:', result.lessonConfiguration?.metadata?.domain);
});
```

### Expected Output (if extraction worked):
```javascript
{
  Has extraction config: true
  Has metadata: true
  Has banner images: true
  Banner images: [
    {
      url: "https://example.com/image.jpg",
      alt: "Article image",
      type: "meta",
      priority: 100
    }
  ]
  Source URL: "https://www.bbc.com/news/article-123"
  Domain: "www.bbc.com"
}
```

---

## 📊 Understanding the Terminal Output

### What You Saw:
```
hasMetadata: true
hasBannerImages: false  ← This is the problem!
```

### What This Means:
- ✅ Metadata is being passed through the system
- ❌ But the metadata doesn't contain banner images
- **Reason:** You didn't extract from a webpage with images

### What You Should See (after proper extraction):
```
hasMetadata: true
hasBannerImages: true  ← Should be true!
metadataKeys: ['title', 'domain', 'sourceUrl', 'bannerImages', ...]
bannerImagesCount: 3  ← Should have images
```

---

## 🎯 Complete Test Flow

### 1. Prepare
```
1. Open Chrome
2. Go to chrome://extensions/
3. Find LinguaSpark extension
4. Click "Reload" button
5. Clear browser cache (Ctrl+Shift+Delete)
```

### 2. Navigate to Article
```
1. Go to: https://www.bbc.com/news
2. Click on any article
3. Wait for page to load completely
4. Open browser console (F12)
```

### 3. Extract Content
```
1. Look for Sparky mascot button (floating on page)
2. Click Sparky button
3. Watch console for:
   - "[DEBUG] Extracting banner images..."
   - "Banner images extracted: X"
   - "Content extraction complete"
```

### 4. Verify Extraction
```javascript
// In console:
chrome.storage.local.get(['lessonConfiguration'], (result) => {
  console.log('Extraction data:', result.lessonConfiguration);
});
```

### 5. Generate Lesson
```
1. Extension popup should open automatically
2. Verify content is pre-populated
3. Verify "Source: bbc.com" is shown
4. Click "Generate Lesson"
5. Wait for generation (may take 1-2 minutes)
```

### 6. Check Terminal Output
```
Look for in terminal:
✅ hasMetadata: true
✅ hasBannerImages: true  ← Must be true!
✅ bannerImagesCount: 3   ← Should have count
✅ metadataKeys: ['title', 'domain', 'sourceUrl', 'bannerImages', ...]
```

### 7. Verify Features in UI
```
✅ Title Format:
   - Should show: "Article Title - AI Generated Title"
   - NOT: "Pronunciation Lesson - B2 Level"

✅ Banner Image:
   - Should display below title
   - Full width, rounded corners
   - Image from the article

✅ Source Attribution:
   - Scroll to bottom of lesson
   - Should show: "Article from BBC 🔗"
   - Click link → Opens original article
```

---

## 🐛 Troubleshooting

### Problem: "hasBannerImages: false"

**Cause:** Content not extracted from webpage

**Solution:**
1. Make sure you're on an actual article page (not homepage)
2. Click Sparky mascot button (don't use manual text entry)
3. Wait for extraction to complete
4. Check console for "Banner images extracted"

### Problem: "No Sparky button visible"

**Cause:** Extension not loaded or content script not injected

**Solution:**
1. Reload extension in chrome://extensions/
2. Refresh the webpage
3. Check console for errors
4. Try a different article

### Problem: "Old title format still showing"

**Cause 1:** Not using extracted content
**Solution:** Extract from webpage using Sparky

**Cause 2:** Metadata doesn't have original title
**Solution:** Check that article has a proper title tag

### Problem: "No banner image displaying"

**Cause 1:** Article has no images
**Solution:** Try a different article with images

**Cause 2:** Images failed to extract
**Solution:** Check console for image extraction errors

**Cause 3:** Image URL is broken
**Solution:** Check network tab for failed image requests

### Problem: "No source attribution at bottom"

**Cause:** extractionSource not being added to lesson

**Solution:**
1. Verify extraction config has sourceUrl and domain
2. Check that lesson-generator.tsx is adding extractionSource
3. Look for console errors in lesson generation

---

## 📝 Quick Checklist

Before reporting issues, verify:

- [ ] I extracted content using Sparky mascot button
- [ ] I was on an actual article page (not homepage)
- [ ] Console shows "Banner images extracted: X"
- [ ] Chrome storage has extraction config with bannerImages
- [ ] Terminal shows "hasBannerImages: true"
- [ ] I waited for full lesson generation to complete
- [ ] I checked the actual lesson display (not just terminal)

---

## 🎬 Video Walkthrough (Text Version)

```
1. Open Chrome → Go to BBC News
2. Click any article → Wait for page load
3. Press F12 → Open console
4. Click Sparky button → Watch console logs
5. Verify: "Banner images extracted: 3"
6. Popup opens → Content pre-filled
7. Click "Generate Lesson" → Wait 1-2 minutes
8. Check terminal: "hasBannerImages: true"
9. View lesson → Verify all three features
10. Success! 🎉
```

---

## 💡 Key Takeaway

**The three features ONLY work with webpage extraction!**

If you're typing text manually or not using Sparky to extract from a webpage, the features won't work because there's no source data (images, URL, domain, original title) to use.

**Always test by:**
1. Going to a real article
2. Clicking Sparky
3. Generating from extracted content

---

**Last Updated:** 2025-10-22
**Status:** Ready for proper testing with webpage extraction

