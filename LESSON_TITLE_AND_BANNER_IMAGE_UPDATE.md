# Lesson Title & Banner Image Enhancement

## Overview
Updated LinguaSpark to extract images from webpages and use a new title format that combines the original article title with an AI-generated lesson title.

## Changes Made

### 1. ✅ Lesson Title Format Update

**Old Format:**
```
"Discussion Lesson - B1 Level"
```

**New Format:**
```
"Original Article Title - AI Generated Lesson Title"
```

**Example:**
```
"Climate Change in the Arctic - Understanding Global Warming"
```

**Implementation:**
- Updated `lib/progressive-generator.ts` → `generateLessonTitle()` function
- Now combines metadata title with AI-generated Engoo-style title
- Fallback hierarchy:
  1. Original Title + AI Title (best)
  2. Original Title + Lesson Type
  3. Content-based title
  4. Generic fallback

### 2. 🖼️ Image Extraction (Pending)

**What Needs to Be Done:**

#### A. Update `content.js` - Add Image Extraction

Run the script:
```powershell
./add-image-extraction.ps1
```

This will add:
- Image extraction algorithm with scoring system
- Extracts top 5 images from the page
- Selects best image as `bannerImage`
- Scoring factors:
  - Image size (larger = better)
  - Position on page (higher = better)
  - Class names (featured, hero, banner)
  - Alt text quality
  - Parent element (article/main)
  - Open Graph / Twitter Card images (highest priority)

**Extracted Data Structure:**
```javascript
{
  text: "...",
  wordCount: 1250,
  images: [
    {
      url: "https://example.com/image.jpg",
      alt: "Image description",
      width: 1200,
      height: 800,
      score: 95,
      source: "og:image"
    },
    // ... up to 5 images
  ],
  bannerImage: "https://example.com/image.jpg" // Best image URL
}
```

#### B. Update Lesson Display Component

**File:** `components/lesson-generator.tsx`

Add banner image display at the top of the lesson:

```tsx
{lesson.bannerImage && (
  <div className="mb-8 rounded-lg overflow-hidden">
    <img 
      src={lesson.bannerImage} 
      alt={lesson.title}
      className="w-full h-auto max-h-96 object-cover"
      onError={(e) => {
        // Hide image if it fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
)}
```

#### C. Update TypeScript Interfaces

**Files to update:**
- `lib/progressive-generator.ts`
- `lib/lesson-ai-generator-server.ts`
- Any lesson type definitions

Add to lesson metadata:
```typescript
interface LessonMetadata {
  title: string;
  url?: string;
  bannerImage?: string;  // ADD THIS
  images?: Array<{       // ADD THIS
    url: string;
    alt: string;
    width: number;
    height: number;
    score: number;
    source: string;
  }>;
  // ... other fields
}
```

#### D. Update Export Functions

**File:** `lib/export-utils.ts`

Update PDF and Word export to include banner image:

```typescript
// In PDF export
if (lesson.bannerImage) {
  // Add image to PDF
  doc.addImage(lesson.bannerImage, 'JPEG', 10, 10, 190, 100);
}

// In Word export
if (lesson.bannerImage) {
  // Add image to Word document
  const imageResponse = await fetch(lesson.bannerImage);
  const imageBuffer = await imageResponse.arrayBuffer();
  doc.addImage({
    image: imageBuffer,
    width: 600,
    height: 400,
  });
}
```

## Testing Checklist

### Title Format Testing
- [ ] Generate lesson from BBC article
- [ ] Verify title shows: "BBC Article Title - AI Generated Title"
- [ ] Generate lesson from Wikipedia
- [ ] Verify title shows: "Wikipedia Title - AI Generated Title"
- [ ] Test with article that has no metadata title
- [ ] Verify fallback title is used

### Image Extraction Testing
- [ ] Extract content from article with images
- [ ] Verify `bannerImage` is populated in Chrome storage
- [ ] Verify `images` array contains top 5 images
- [ ] Check that Open Graph image gets highest score
- [ ] Verify small images (< 200x150) are filtered out
- [ ] Test with article that has no images
- [ ] Verify lesson generates without errors

### Display Testing
- [ ] Generate lesson with banner image
- [ ] Verify image displays at top of lesson
- [ ] Verify image is responsive
- [ ] Test image error handling (broken URL)
- [ ] Verify lesson displays correctly without image

### Export Testing
- [ ] Export lesson with banner image to PDF
- [ ] Verify image appears in PDF
- [ ] Export lesson with banner image to Word
- [ ] Verify image appears in Word document
- [ ] Export lesson without image
- [ ] Verify exports work without errors

## Implementation Steps

### Step 1: Add Image Extraction
```powershell
./add-image-extraction.ps1
```

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Click **RELOAD** on LinguaSpark
3. Close all old tabs
4. Open new tab and test extraction

### Step 3: Update Lesson Display
Edit `components/lesson-generator.tsx` to add banner image display

### Step 4: Update TypeScript Types
Add `bannerImage` and `images` to lesson metadata interfaces

### Step 5: Update Export Functions
Add banner image support to PDF and Word exports

### Step 6: Test End-to-End
1. Extract content from article with images
2. Generate lesson
3. Verify title format
4. Verify banner image displays
5. Export to PDF/Word
6. Verify image in exports

## Benefits

### For Users
- **Better Context**: Banner image provides visual context for the lesson
- **Professional Look**: Lessons look more polished and engaging
- **Clear Titles**: Combined title shows both source and lesson focus
- **Better Organization**: Easy to identify lesson source and topic

### For Tutors
- **Visual Engagement**: Images make lessons more engaging for students
- **Source Attribution**: Original title shows content source
- **Topic Clarity**: AI-generated title clarifies lesson focus
- **Professional Materials**: Export includes images for complete lesson packages

## Technical Details

### Image Scoring Algorithm
```javascript
Base Score: 50 points

Size Bonus:
- >= 800px width: +20 points
- >= 600px width: +15 points
- >= 400px width: +10 points

Position Bonus:
- Top 1000px: +15 points
- Top 2000px: +10 points
- Top 3000px: +5 points

Class/ID Bonus:
- Contains "featured", "hero", "banner": +25 points
- Contains "main", "primary": +15 points

Alt Text Bonus:
- > 10 characters: +10 points
- > 30 characters: +5 points

Parent Element Bonus:
- Inside article/main: +20 points

Special Sources:
- Open Graph image: 100 points (highest)
- Twitter Card image: 95 points
```

### Image Filtering
- Minimum size: 200x150 pixels
- Excludes: tracking pixels, ads, analytics
- Excludes: URLs containing "doubleclick", "analytics", "tracking", "pixel", "beacon"
- Maximum: Top 5 images by score

## Rollback Plan

If issues occur:

### Revert Title Format
```powershell
git checkout lib/progressive-generator.ts
```

### Remove Image Extraction
1. Remove image extraction code from `content.js`
2. Remove `bannerImage` from lesson display
3. Remove image support from exports

## Future Enhancements

- [ ] Allow users to select different image from extracted images
- [ ] Add image cropping/resizing options
- [ ] Support for image captions
- [ ] Image optimization for exports
- [ ] Fallback to stock images if no suitable image found
- [ ] Image attribution/credit display

## Notes

- Image extraction is non-blocking - lesson generation works without images
- Banner image is optional - lessons display fine without it
- Image URLs are stored as-is - no downloading/hosting required
- CORS may prevent some images from loading - error handling included
- Large images may slow down exports - consider size limits

## Status

- ✅ Title format updated
- ⏳ Image extraction script created (needs to be run)
- ⏳ Lesson display update needed
- ⏳ Export functions update needed
- ⏳ TypeScript interfaces update needed
- ⏳ Testing needed

## Questions?

If you encounter issues:
1. Check browser console for errors
2. Verify Chrome storage contains `bannerImage`
3. Check image URL is accessible
4. Verify CORS allows image loading
5. Test with different websites

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
