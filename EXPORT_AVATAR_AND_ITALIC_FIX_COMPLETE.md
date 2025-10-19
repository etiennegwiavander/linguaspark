# Export Avatar Names and Italic Instructions Complete ✅

## Summary
Successfully updated PDF and Word exports to use proper avatar character names and make all instructions italic.

## Changes Applied

### 1. Avatar Character Names in Dialogues
- **Imported `enhanceDialogueWithAvatars`** from `avatar-utils.ts`
- Dialogue sections now use the same character names as the web display
- Character names are replaced with avatar names (e.g., "Student" → "Bethy", "Tutor" → "John")
- Consistent avatar assignment across exports using lesson ID
- Applied to both:
  - Dialogue Practice
  - Dialogue Fill-in-the-Gap

### 2. Italic Instructions
- **Updated `addText` helper function** to support italic text
- Added `isItalic` parameter (4th parameter)
- Font styles now support: normal, bold, italic, and bolditalic
- All instruction text now displays in italic format

### 3. Instruction Styling Fixed
- Background colors apply ONLY to instruction text
- No background bleeding into content sections
- Instructions properly separated from content items

## PDF Export Updates

### Updated Sections:
1. ✅ Warmup Questions - Italic instruction with light green background
2. ✅ Key Vocabulary - Italic instruction with light blue background (when present)
3. ✅ Reading Passage - Italic instruction with light green background (when present)
4. ✅ Reading Comprehension - Italic instruction with light blue background
5. ✅ Dialogue Practice - Italic instruction + avatar character names
6. ✅ Dialogue Fill-in-the-Gap - Italic instruction + avatar character names
7. ✅ Discussion Questions - Italic instruction with light green background

### Technical Changes:
- `addText()` function signature: `(text, fontSize, isBold, isItalic, indent)`
- Font style logic: `"normal"`, `"bold"`, `"italic"`, `"bolditalic"`
- Avatar enhancement: `enhanceDialogueWithAvatars(dialogue, lessonData.id, sectionName)`

## Word Export Updates

### Updated Sections:
1. ✅ All instruction paragraphs now have `italics: true` in TextRun
2. ✅ Dialogue Practice uses avatar names
3. ✅ Dialogue Fill-in-the-Gap uses avatar names
4. ✅ Background colors (shading) apply only to instruction paragraphs
5. ✅ Left border styling maintained for instructions

### Technical Changes:
- TextRun properties: `{ text, size, italics: true }`
- Avatar enhancement before rendering dialogue lines
- Consistent with PDF export implementation

## Interface Updates
- Added `id?: string` to `LessonData` interface
- Supports lesson ID for consistent avatar assignment

## Character Name Examples
Before:
- Student: Hello, how are you?
- Tutor: I'm fine, thank you.

After:
- Bethy: Hello, how are you?
- John: I'm fine, thank you.

## Testing Instructions
1. Generate a lesson with dialogue sections
2. Export to PDF:
   - Verify instructions are in italic
   - Verify character names match web display (e.g., Bethy, John)
   - Verify background colors only on instructions
3. Export to Word:
   - Verify instructions are in italic
   - Verify character names match web display
   - Verify background colors only on instructions

## Files Modified
- `lib/export-utils.ts` - Complete export functionality overhaul

## Result
PDF and Word exports now perfectly match the web interface with:
- ✅ Proper avatar character names in dialogues
- ✅ Italic instruction text throughout
- ✅ Clean background color application (instructions only)
- ✅ Professional, consistent formatting
