---
inclusion: always
---

# Product Overview

LinguaSpark is a Chrome extension that transforms any webpage into interactive language lesson material using AI-powered generation. It's designed for language tutors to create professional lessons from web content.

## Core Features & Implementation Guidelines

- **Content Extraction**: Extract text from webpages or selected content
  - Use content scripts for DOM interaction
  - Support both full page and text selection modes
- **AI-Powered Lesson Generation**: Uses Google AI APIs for intelligent lesson creation
  - Implement progressive generation to handle token limits
  - Use multi-model fallback strategy for reliability
  - Always validate AI responses before displaying
- **Multi-Level Support**: Supports CEFR levels A1-C1
  - Adapt vocabulary complexity based on selected level
  - Adjust grammar explanations and sentence structure accordingly
- **Multiple Lesson Types**: Discussion, Grammar, Travel, Business, and Pronunciation lessons
  - Each lesson type has specific validation requirements
  - Use structured prompts for consistent output format
- **Professional Export**: Export lessons as PDF or Word documents
  - Maintain consistent typography and spacing
  - Ensure responsive layout compatibility
- **Tutor Authentication**: Secure accounts with lesson storage via Supabase
  - Implement Row Level Security (RLS) policies
  - Auto-create tutor profiles on first login

## Development Conventions

### AI Integration Rules

- Never use fallback content - always generate fresh AI responses
- Implement proper error handling with user-friendly messages
- Use token optimization strategies to prevent quota issues
- Validate all AI-generated content before display

### Lesson Structure Standards

- All lessons must include: title, warmup, main content, and wrap-up
- Vocabulary words should be bolded in context
- Maintain consistent paragraph spacing and typography
- Include pronunciation guides for key vocabulary

### Error Handling Patterns

- Classify errors by type (quota, network, validation)
- Provide specific recovery suggestions
- Log detailed error information for debugging
- Never expose raw API errors to users

### Content Quality Requirements

- Validate lesson completeness before display
- Ensure contextual vocabulary selection
- Maintain appropriate complexity for target CEFR level
- Include clear instructions for each lesson section

## Target Users

Primary users are language tutors who need to quickly create structured lessons from online content. The extension provides a complete workflow from content discovery to lesson export.

## Key Value Proposition

Transforms the time-intensive process of manual lesson creation into an automated, AI-assisted workflow while maintaining professional quality and customization options.
