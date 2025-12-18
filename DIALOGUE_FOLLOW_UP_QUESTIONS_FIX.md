# Dialogue Follow-up Questions Fix

## Issue Identified

The follow-up questions in the Dialogue Practice section were not matching the actual dialogue content because:

1. **Separate Generation Process**: Follow-up questions were generated using a generic prompt that didn't reference the actual dialogue content
2. **Missing Context**: The follow-up questions prompt only used the general topic, not the specific points discussed in the dialogue
3. **Template Fallbacks**: When AI generation failed, the system used generic template dialogues with pre-written follow-up questions

## Root Cause Analysis

### Original Problematic Flow:
1. Generate dialogue using detailed prompt with source content context
2. Generate follow-up questions using generic prompt: `"Create 3 follow-up discussion questions for ${level} level students about the dialogue topic"`
3. The follow-up questions had no knowledge of what was actually discussed in the dialogue

### Template System Issues:
- Template dialogues used generic follow-up questions like "What surprised you the most?" without referencing the specific topic
- Questions were too generic and didn't connect to the dialogue content

## Fixes Applied

### 1. Enhanced AI Follow-up Questions Generation

**Before:**
```typescript
const followUpPrompt = `Create 3 follow-up discussion questions for ${context.difficultyLevel} level students about the dialogue topic. Return only questions, one per line:`
```

**After:**
```typescript
const dialogueText = dialogueLines.map(line => `${line.speaker}: ${line.text}`).join('\n')
const followUpPrompt = `Based on this specific dialogue conversation, create 3 follow-up discussion questions for ${context.difficultyLevel} level students.

DIALOGUE:
${dialogueText}

REQUIREMENTS:
- Questions must relate directly to the ideas, topics, and points discussed in this specific dialogue
- Questions should encourage students to expand on what was said in the conversation
- Use vocabulary and complexity appropriate for ${context.difficultyLevel} level
- Questions should help students think deeper about the specific points raised in the dialogue
- Return only the questions, one per line, no numbering or extra text

Follow-up questions:`
```

### 2. Improved Template Follow-up Questions

Enhanced all template dialogue follow-up questions to be more specific and topic-relevant:

**Before:**
```typescript
followUpQuestions: [
  "What surprised you the most?",
  "What would you like to know more about?",
  "How can this help you in daily life?"
]
```

**After:**
```typescript
followUpQuestions: [
  `What surprised you the most about ${topic}?`,
  `What would you like to know more about ${topic}?`,
  `How can understanding ${topic} help you in daily life?`
]
```

### 3. Better Question Parsing

Added better parsing to remove numbering and formatting from AI-generated questions:

```typescript
.map(line => line.replace(/^\d+\.?\s*/, '').replace(/^-\s*/, '').trim())
```

## Expected Improvements

1. **Contextual Relevance**: Follow-up questions now directly relate to the specific dialogue content
2. **Better Flow**: Questions build upon what was actually discussed in the conversation
3. **Topic Integration**: Even template questions now properly reference the specific topic
4. **Educational Value**: Questions encourage deeper thinking about the specific points raised

## Testing Recommendations

1. Generate lessons with different topics and CEFR levels
2. Verify that follow-up questions reference specific points from the dialogue
3. Check that questions are appropriate for the target language level
4. Ensure questions encourage meaningful discussion about the dialogue content

## Impact

This fix addresses the core issue where follow-up questions felt disconnected from the dialogue content, making lessons more coherent and educationally effective.