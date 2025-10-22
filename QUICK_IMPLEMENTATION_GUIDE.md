# Quick Implementation Guide: Title & Banner Image

## What Changed

### ✅ DONE: Lesson Title Format
**Old:** `"Discussion Lesson - B1 Level"`  
**New:** `"Article Title - AI Generated Lesson Title"`

**File Updated:** `lib/progressive-generator.ts`

---

## What You Need to Do

### 1. Run Image Extraction Script
```powershell
./add-image-extraction.ps1
```

This adds image extraction to `content.js`

### 2. Reload Chrome Extension
1. Go to `chrome://extensions/`
2. Click **RELOAD** on LinguaSpark
3. Test on a webpage with images

### 3. Update Lesson Display (Manual)

**File:** `components/lesson-generator.tsx`

Add this near the top of the lesson display (after title, before content):

```tsx
{/* Banner Image */}
{lesson.bannerImage && (
  <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
    <img 
      src={lesson.bannerImage} 
      alt={lesson.title}
      className="w-full h-auto max-h-96 object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
)}
```

### 4. Update TypeScript Interface (Manual)

Find the lesson metadata interface and add:

```typescript
interface LessonMetadata {
  // ... existing fields
  bannerImage?: string;
  images?: Array<{
    url: string;
    alt: string;
    width: number;
    height: number;
    score: number;
    source: string;
  }>;
}
```

### 5. Test It!

1. Click ghost button on an article with images
2. Generate a lesson
3. Check:
   - Title shows: "Article Title - Lesson Title"
   - Banner image appears at top
   - Image is responsive
   - Lesson works without image too

---

## That's It!

The title format is already working. Just add image extraction and display, and you're done!

See `LESSON_TITLE_AND_BANNER_IMAGE_UPDATE.md` for full details.
