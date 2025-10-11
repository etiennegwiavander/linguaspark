# Implementation Plan

- [x] 1. Update lesson title typography to use proper responsive sizing

  - Modify the lesson title h1 element to use 32px font size on large screens (lg breakpoint and above)
  - Ensure responsive scaling maintains readability on smaller screens
  - Verify the title uses semantic HTML structure (h1) for accessibility
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 2. Standardize section header typography across all lesson sections

  - Update all section titles (CardTitle elements) to use consistent 28px font size
  - Apply the text-xl class (which equals 20px) and update to text-2xl (24px) or custom 28px sizing
  - Ensure section headers maintain proper hierarchy as h2 elements
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Verify and standardize main content typography

  - Audit all main content text elements to ensure consistent 16px font size (text-base class)
  - Update vocabulary definitions, reading passages, and other main content to use text-base
  - Preserve existing formatting (bold, italic) while maintaining 16px base size
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Update instructional text typography to 15px sizing

  - Modify all instructional text elements currently using text-[15px] to maintain consistency
  - Ensure instructions are visually distinct from main content through size and styling
  - Verify instructional text appears consistently across all lesson sections
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Implement supplementary content typography at 14px

  - Update suggested answers, explanations, and answer keys to use 14px font size (text-sm class)
  - Ensure supplementary content is visually secondary while remaining readable
  - Apply consistent styling to grammar exercise answers and pronunciation tips
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Enhance contextual lesson title generation integration

  - Verify the progressive generator's lesson title generation is properly integrated
  - Ensure fallback title generation works when AI generation fails
  - Test that contextual titles reflect the source content appropriately
  - _Requirements: 1.1_

- [x] 7. Implement responsive typography testing and validation

  - Test typography scaling across different screen sizes (mobile, tablet, desktop)
  - Verify font sizes remain readable and proportional on all devices
  - Ensure accessibility compliance with browser zoom and screen readers
  - Test high-DPI screen rendering for text clarity
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Update export utilities to reflect new typography hierarchy

  - Modify PDF export formatting to use the new typography scale
  - Update Word document export to maintain consistent font sizing
  - Ensure exported documents reflect the same visual hierarchy as the web interface
  - _Requirements: 1.4, 2.2, 3.2_
