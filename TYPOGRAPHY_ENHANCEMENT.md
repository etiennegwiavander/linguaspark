# Typography Enhancement Implementation

## Typography Scale

Based on the requirements:
- **Lesson Title**: 32px (text-3xl lg:text-4xl) - AI-generated contextual title
- **Main Lesson Topics**: 28px (text-xl lg:text-2xl) - Section headers
- **Lesson Contents**: 16px (text-base) - Main content text
- **Instructions**: 15px (text-[15px]) - Instructional text
- **Suggested Answers**: 14px (text-sm) - Answer text and hints

## Implementation Plan

### 1. Lesson Title (32px)
```tsx
<h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2 leading-tight">
  {safeLesson.lessonTitle}
</h1>
```

### 2. Section Headers (28px)
```tsx
<CardTitle className="text-xl lg:text-2xl font-semibold flex items-center gap-3 text-foreground">
  <section.icon className="h-6 w-6 lg:h-7 lg:w-7" />
  {section.title}
</CardTitle>
```

### 3. Content Text (16px)
```tsx
<p className="text-base">{content}</p>
```

### 4. Instructions (15px)
```tsx
<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 bg-muted/30 rounded-r">
  {instruction}
</p>
```

### 5. Answers/Hints (14px)
```tsx
<p className="text-sm text-muted-foreground">{answer}</p>
```

## Changes Applied

### Header Section
- ✅ Added AI-generated lesson title at 32px
- ✅ Improved layout with proper spacing
- ✅ Enhanced metadata display

### Section Headers
- ✅ Updated to 28px (text-xl lg:text-2xl)
- ✅ Increased icon sizes
- ✅ Better visual hierarchy

### Content Areas
- 🔄 Need to update all content to 16px (text-base)
- 🔄 Need to update instructions to 15px (text-[15px])
- 🔄 Need to update answers to 14px (text-sm)

## Sections to Update

1. **Warmup Questions**
   - Instructions: 15px
   - Questions: 16px
   - Numbers: 15px

2. **Vocabulary**
   - Instructions: 15px
   - Words: 16px
   - Meanings: 16px
   - Examples: 16px

3. **Reading**
   - Instructions: 15px
   - Content: 16px

4. **Comprehension**
   - Instructions: 15px
   - Questions: 16px

5. **Discussion**
   - Instructions: 15px
   - Questions: 16px

6. **Grammar**
   - Instructions: 15px
   - Content: 16px
   - Examples: 16px
   - Answers: 14px

7. **Pronunciation**
   - Instructions: 15px
   - Content: 16px
   - Tips: 16px
   - Practice sentences: 16px

8. **Dialogue**
   - Instructions: 15px
   - Dialogue lines: 16px
   - Character names: 15px

## Responsive Considerations

- Use `lg:` prefix for larger screens
- Maintain readability on mobile
- Ensure proper line heights
- Consider touch targets

## Implementation Status

- ✅ Lesson title generation (AI)
- ✅ Interface updates
- ✅ Header typography
- ✅ Section header typography
- 🔄 Content typography (in progress)
- 🔄 Instruction typography (in progress)
- 🔄 Answer typography (in progress)