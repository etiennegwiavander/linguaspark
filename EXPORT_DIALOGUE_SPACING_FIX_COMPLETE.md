# Export Dialogue Spacing and Background Fix Complete ✅

## Summary
Fixed three critical issues in PDF and Word exports for dialogue sections:
1. ✅ Background color no longer bleeds into dialogue content
2. ✅ Added 3px spacing between dialogue lines for better readability
3. ✅ Proper separation between instruction and dialogue content

## Issues Fixed

### 1. Background Bleeding into Dialogue
**Problem:** The instruction background color was extending into the first dialogue lines, making them appear highlighted.

**Solution:**
- Removed use of `addText()` for dialogue instructions
- Manually render instruction with precise background rectangle sizing
- Background rectangle now matches exactly the instruction text height
- Added 8px spacing after instruction before dialogue starts

### 2. No Spacing Between Dialogue Lines
**Problem:** Dialogue lines were cramped together with no visual separation between speakers.

**Solution:**
- **PDF Export:** Added `yPosition += 3` between dialogue lines (except first)
- **Word Export:** Added `spacing: { before: 60 }` (3pt) between lines (except first)
- Creates clear visual separation between each speaker's turn

### 3. Character Names Without Images
**Note:** PDF and Word formats don't easily support embedded images, so we're using:
- Bold character names (e.g., **Sam:**, **Asher:**)
- Avatar-enhanced names from the web display
- Clear visual hierarchy with bold names + normal text

## PDF Export Changes

### Dialogue Practice Section:
```typescript
// Manual instruction rendering (no addText)
pdf.setFillColor(238, 247, 220) // #EEF7DC
pdf.setFontSize(FONT_SIZES.INSTRUCTIONS)
pdf.setFont("helvetica", "italic")

// Precise background rectangle
pdf.rect(margin + 10, yPosition - 4, instructionWidth, instructionHeight, 'F')

// Render instruction text
for (const line of instructionLines) {
  pdf.text(line, margin + 10, yPosition)
  yPosition += lineHeight
}
yPosition += 8 // Clear separation before dialogue

// Add 3px spacing between dialogue lines
dialoguePracticeLines.forEach((line, index) => {
  if (index > 0) {
    yPosition += 3 // 3px gap
  }
  // ... render dialogue line
})
```

### Dialogue Fill-in-the-Gap Section:
- Same approach as Dialogue Practice
- Light blue background (#F1FAFF) instead of green
- 3px spacing between lines

## Word Export Changes

### Dialogue Practice Section:
```typescript
// Instruction with background (no changes needed - already correct)
new Paragraph({
  children: [new TextRun({ text: instruction, italics: true })],
  spacing: { after: 200 },
  shading: { fill: "EEF7DC" }
})

// Dialogue lines with spacing
dialogueLines.forEach((line, index) => {
  new Paragraph({
    children: [
      new TextRun({ text: `${line.character}: `, bold: true }),
      new TextRun({ text: line.line })
    ],
    spacing: { 
      before: index === 0 ? 0 : 60, // 3pt gap (60 Word units)
      after: 0 
    }
  })
})
```

### Dialogue Fill-in-the-Gap Section:
- Same spacing approach
- Light blue background (#F1FAFF)

## Visual Improvements

### Before:
```
Practice this conversation with your tutor:
Sam: Good morning! I'm quite interested...
Asher: Certainly. European royal families...
Sam: Ah, yes, the Queen of Portugal...
```
(No spacing, background bleeding into "Sam:")

### After:
```
Practice this conversation with your tutor:

Sam: Good morning! I'm quite interested...

Asher: Certainly. European royal families...

Sam: Ah, yes, the Queen of Portugal...
```
(Clean spacing, no background bleeding)

## Technical Details

### PDF Spacing Units:
- `yPosition += 3` = 3px gap between lines
- `yPosition += 8` = 8px gap after instruction
- `lineHeight = 7` = standard line height

### Word Spacing Units:
- `spacing: { before: 60 }` = 3pt (60 twentieths of a point)
- `spacing: { after: 200 }` = 10pt after instruction
- Word uses twentieths of a point (1pt = 20 units)

## Testing Instructions
1. Generate a lesson with dialogue sections
2. Export to PDF:
   - ✅ Verify instruction background doesn't touch dialogue
   - ✅ Verify clear spacing between each speaker's line
   - ✅ Verify character names are bold
3. Export to Word:
   - ✅ Verify instruction background is contained
   - ✅ Verify spacing between dialogue lines
   - ✅ Verify character names are bold

## Files Modified
- `lib/export-utils.ts` - Dialogue section rendering improvements

## Result
Dialogue sections in exports now have:
- ✅ Clean, contained instruction backgrounds
- ✅ Professional 3px spacing between speakers
- ✅ Clear visual hierarchy with bold character names
- ✅ Proper separation between instruction and content
- ✅ Matches the professional look of the web interface
