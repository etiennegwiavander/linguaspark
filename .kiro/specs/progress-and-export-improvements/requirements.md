# Requirements Document

## Introduction

This specification addresses two critical improvements to the LinguaSpark lesson generation and export system:

1. **Real Progress Tracking**: Replace the current simulated progress updates with actual progress callbacks from the AI generation process, providing users with accurate, real-time feedback during lesson creation.

2. **Markdown Stripping in Word Exports**: Systematically apply markdown formatting removal to all text fields in Word document exports to ensure clean, professional output without visible markdown syntax.

These improvements will enhance user experience by providing transparent progress feedback and ensuring export quality consistency across both PDF and Word formats.

## Requirements

### Requirement 1: Real-Time Progress Tracking

**User Story:** As a language tutor generating a lesson, I want to see accurate progress updates that reflect the actual AI generation stages, so that I understand what's happening and can estimate completion time.

#### Acceptance Criteria

1. WHEN the lesson generation process starts THEN the system SHALL display progress based on actual AI generation callbacks, not simulated delays
2. WHEN each lesson section begins generation THEN the system SHALL update the progress indicator with the specific section being generated
3. WHEN a section completes generation THEN the system SHALL increment the progress percentage based on actual completion
4. IF the generator supports progress callbacks THEN the streaming API SHALL pass these callbacks through to the frontend
5. WHEN multiple AI calls are made for a single lesson THEN the system SHALL aggregate progress across all calls proportionally
6. WHEN an error occurs during generation THEN the system SHALL report the progress state at the time of failure

### Requirement 2: Callback-Based Generator Architecture

**User Story:** As a developer maintaining the lesson generation system, I want the generator to accept progress callbacks, so that I can provide accurate feedback to users without coupling the generator to specific UI implementations.

#### Acceptance Criteria

1. WHEN the progressive generator is invoked THEN it SHALL accept an optional progress callback function parameter
2. WHEN a generation phase begins THEN the generator SHALL invoke the callback with phase information (name, percentage, section)
3. WHEN a generation phase completes THEN the generator SHALL invoke the callback with updated completion percentage
4. IF no callback is provided THEN the generator SHALL function normally without progress reporting
5. WHEN the callback is invoked THEN it SHALL receive structured data including: step name, progress percentage, phase identifier, and section identifier
6. WHEN generating lesson sections THEN the generator SHALL calculate progress proportionally based on section complexity and token usage

### Requirement 3: Systematic Markdown Stripping in Word Exports

**User Story:** As a language tutor exporting lessons to Word format, I want all markdown formatting to be removed from the exported document, so that the lesson appears professional and clean without visible syntax markers.

#### Acceptance Criteria

1. WHEN exporting to Word format THEN the system SHALL strip all markdown bold syntax (`**text**` and `__text__`) from all text fields
2. WHEN exporting to Word format THEN the system SHALL strip all markdown italic syntax (`*text*` and `_text_`) from all text fields
3. WHEN exporting lesson titles THEN the system SHALL apply markdown stripping before rendering
4. WHEN exporting section instructions THEN the system SHALL apply markdown stripping before rendering
5. WHEN exporting vocabulary items THEN the system SHALL apply markdown stripping to words, meanings, and examples
6. WHEN exporting reading passages THEN the system SHALL apply markdown stripping to all paragraph text
7. WHEN exporting comprehension questions THEN the system SHALL apply markdown stripping to each question
8. WHEN exporting discussion questions THEN the system SHALL apply markdown stripping to each question
9. WHEN exporting dialogue lines THEN the system SHALL apply markdown stripping to character names and dialogue text
10. WHEN exporting grammar content THEN the system SHALL apply markdown stripping to focus, examples, and exercises
11. WHEN exporting pronunciation content THEN the system SHALL apply markdown stripping to words, IPA, practice sentences, and tips
12. WHEN exporting wrap-up questions THEN the system SHALL apply markdown stripping to each question
13. IF text contains nested markdown THEN the system SHALL recursively strip all markdown syntax
14. WHEN markdown is stripped THEN the system SHALL preserve the actual text content without the formatting markers

### Requirement 4: Export Consistency

**User Story:** As a language tutor exporting lessons, I want both PDF and Word exports to handle markdown consistently, so that I get the same clean output regardless of export format.

#### Acceptance Criteria

1. WHEN comparing PDF and Word exports THEN both SHALL apply identical markdown stripping logic
2. WHEN markdown stripping is updated THEN the system SHALL apply changes to both export formats
3. WHEN special characters are present THEN both export formats SHALL handle them identically
4. IF new markdown syntax is added to lessons THEN both export formats SHALL strip it consistently

### Requirement 5: Non-Breaking Implementation

**User Story:** As a developer implementing these improvements, I want to ensure existing functionality continues to work, so that users experience no disruption during the upgrade.

#### Acceptance Criteria

1. WHEN progress callbacks are added THEN existing lesson generation without callbacks SHALL continue to function
2. WHEN markdown stripping is applied THEN lessons without markdown SHALL export unchanged
3. WHEN the streaming API is updated THEN non-streaming generation SHALL remain functional
4. IF progress tracking fails THEN lesson generation SHALL complete successfully without progress updates
5. WHEN exports are generated THEN all existing section types SHALL continue to render correctly
