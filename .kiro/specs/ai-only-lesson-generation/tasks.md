# Implementation Plan

## Phase 1: Enhanced Warm-up Questions (Requirements 1.1-1.5)

- [x] - Create `buildWarmupPrompt` method in progressive generator with CEFR-specific instructions
  - Add content assumption detection logic to avoid referencing specific events/people
  - Implement prompts that focus on personal experience and general knowledge
  - Add validation to ensure questions activate prior knowledge without content familiarity
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add warm-up quality validator

  - Create validation method to check questions don't reference specific content details
  - Implement checks for appropriate CEFR level complexity
  - Add validation for question count and format
  - Implement regeneration logic if validation fails
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 2: Level-Appropriate Vocabulary (Requirements 2.1-2.7)

- [x] 3. Implement vocabulary example count rules by CEFR level

  - Update `generateVocabularyWithContext` to generate correct number of examples per level
  - A1/A2: 5 examples per word
  - B1: 4 examples per word
  - B2: 3 examples per word
  - C1: 2 examples per word
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Enhance vocabulary example generation with contextual relevance

  - Implement AI prompts that generate examples from source material context
  - Add complexity matching for each CEFR level
  - Ensure examples use appropriate grammar structures for level
  - Add validation for example quality and relevance
  - _Requirements: 2.6, 2.7_

## Phase 3: Enhanced Dialogue Sections (Requirements 3.1-3.7)

- [x] 5. Implement dialogue length requirements

  - Update dialogue generation to create minimum 12 lines for both practice and fill-in-gap
  - Add validation to ensure minimum line count is met
  - Implement regeneration if line count is insufficient
  - _Requirements: 3.1, 3.2_

- [x] 6. Implement CEFR-appropriate dialogue complexity

  - Create level-specific dialogue prompts with vocabulary and structure guidance
  - A1/A2: Simple vocabulary, basic sentence structures
  - B1: Intermediate vocabulary, varied sentence structures
  - B2/C1: Advanced vocabulary, complex sentence structures
  - Ensure natural conversational flow at each level
  - Integrate lesson vocabulary into dialogue
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

## Phase 4: Expanded Discussion Questions (Requirements 4.1-4.6)

- [x] 7. Implement 5-question discussion generation

  - Update `generateDiscussionWithContext` to create exactly 5 questions
  - Add validation to ensure question count is exactly 5
  - Implement regeneration if count is incorrect
  - _Requirements: 4.1_

- [x] 8. Implement CEFR-appropriate question complexity

  - Create level-specific question type prompts
  - A1/A2: Simple question structures, familiar topics
  - B1: Opinion questions and comparisons
  - B2/C1: Analytical and evaluative questions
  - Ensure questions relate to source material
  - Encourage extended responses appropriate to level
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

## Phase 5: Elaborate Grammar Focus (Requirements 5.1-5.7)

- [x] 9. Implement comprehensive grammar section generation

  - Update `generateGrammarWithContext` to identify relevant grammar from source
  - Generate clear explanation of grammar rule
  - Include multiple example sentences demonstrating the grammar point
  - Create practice exercises with minimum 5 items
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Add form and usage explanations to grammar section

  - Implement prompts that generate both form and usage explanations
  - Adapt complexity to CEFR level
  - Ensure examples are context-relevant from source material
  - Add validation for completeness of grammar section
  - _Requirements: 5.5, 5.6, 5.7_

## Phase 6: Enhanced Pronunciation Practice (Requirements 6.1-6.6)

- [x] 11. Implement enhanced pronunciation section generation

  - Update `generatePronunciationWithContext` to include minimum 5 advanced words
  - Generate IPA transcription for each word
  - Include pronunciation tips for difficult sounds
  - Create minimum 2 tongue twisters related to lesson topic
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12. Add pronunciation word selection logic

  - Implement logic to select words with challenging sounds for target language learners
  - Generate practice sentences using the target words
  - Ensure words are from the lesson vocabulary
  - Add validation for pronunciation section completeness
  - _Requirements: 6.5, 6.6_

## Phase 7: Quality Validation Integration

- [x] 13. Integrate quality validators into lesson generation flow

  - Add validation checks after each section generation
  - Implement regeneration logic for failed validations (max 2 attempts)
  - Add quality metrics tracking for each section
  - Update lesson assembly to use enhanced sections
  - _Requirements: All requirements_

## Phase 8: Testing and Validation

- [x] 14. Create unit tests for enhanced section generators

  - Test warm-up question generation and validation
  - Test vocabulary example count by CEFR level
  - Test dialogue length and complexity validation
  - Test discussion question count and complexity
  - Test grammar section completeness
  - Test pronunciation section requirements
  - _Requirements: All requirements validation_

- [x] 15. Create integration tests for complete lesson generation

  - Test end-to-end lesson generation at each CEFR level
  - Verify all sections meet quality standards
  - Test regeneration logic when validation fails
  - Validate CEFR level consistency across sections
  - _Requirements: All requirements validation_
