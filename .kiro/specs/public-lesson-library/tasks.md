# Implementation Plan

- [x] 1. Database schema and migration setup

  - Create migration script to add `is_admin` column to tutors table
  - Create `public_lessons` table with all required fields and constraints
  - Create indexes for performance optimization
  - Set up RLS policies for public lessons (read for all, insert/update for authenticated, delete for admins only)
  - Create trigger for `updated_at` timestamp
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 2. TypeScript type definitions and interfaces

  - Create `lib/types/public-lessons.ts` with PublicLesson interface
  - Define LessonCategory, CEFRLevel, and LessonType types
  - Define PublicLessonFilters interface
  - Define PublicLessonMetadata interface
  - Define AdminStats interface
  - _Requirements: 2.1, 2.3, 4.1, 4.2, 10.1, 11.1_

- [x] 3. Server-side utilities for public lessons

  - Create `lib/public-lessons-server.ts` with CRUD operations
  - Implement `getPublicLessons()` with filtering and cursor-based pagination
  - Implement `getPublicLesson()` for single lesson retrieval
  - Implement `createPublicLesson()` with validation
  - Implement `updatePublicLesson()` with authentication check
  - Implement `deletePublicLesson()` with admin verification
  - Implement `validatePublicLessonContent()` for content validation
  - _Requirements: 2.3, 2.4, 3.4, 7.3, 8.3, 8.4_

- [x] 4. Admin utilities and verification

  - Create `lib/admin-utils-server.ts` for admin-related functions
  - Implement `isAdmin()` function to check admin status
  - Implement `getAdminStats()` to retrieve admin statistics
  - Implement admin verification middleware
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 5. API route for listing public lessons

  - Create `app/api/public-lessons/list/route.ts`
  - Support query parameters for filtering (category, cefr_level, lesson_type, search)
  - Implement cursor-based pagination
  - Return lessons array and next cursor
  - Make endpoint publicly accessible (no auth required)
  - _Requirements: 2.3, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4_

- [x] 6. API route for getting single public lesson

  - Create `app/api/public-lessons/[id]/route.ts` for GET requests
  - Return full lesson data including content
  - Make endpoint publicly accessible (no auth required)
  - _Requirements: 5.3, 5.4, 6.2, 6.3, 6.4_

- [x] 7. API route for creating public lessons

  - Create `app/api/public-lessons/create/route.ts` for POST requests
  - Validate lesson content before saving

  - Store creator_id from authenticated user
  - Require authentication but allow any authenticated user to create
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.2_

- [x] 8. API route for updating public lessons

  - Create `app/api/public-lessons/update/[id]/route.ts` for PUT requests
  - Allow authenticated users to update any public lesson
  - Update `updated_at` timestamp
  - _Requirements: 7.3, 12.3_

- [x] 9. API route for deleting public lessons

  - Create `app/api/public-lessons/delete/[id]/route.ts` for DELETE requests
  - Verify admin status before allowing deletion
  - Return appropriate error for non-admin users
  - _Requirements: 8.2, 8.3, 12.4, 12.5_

- [x] 10. API route for admin statistics

  - Create `app/api/admin/stats/route.ts`
  - Return total lesson count by category
  - Return lessons by CEFR level
  - Return recent lessons
  - Return lessons created by current admin
  - Require admin authentication
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

-

- [x] 11. Public library page component

  - Create `app/public-library/page.tsx` as server component
  - Implement static generation with revalidation (5 minutes)
  - Display grid of lesson cards
  - Integrate filtering component
  - Implement pagination controls
  - Make page accessible without authentication
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4_

- [x] 12. Public lesson card component

  - Create `components/public-lesson-card.tsx`
  - Display banner image if available
  - Show title, category badge, CEFR level badge, lesson type badge
  - Display estimated duration
  - Show creation date
  - Implement hover preview/excerpt
  - Make card clickable to navigate to lesson view
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Public library filters component

  - Create `components/public-library-filters.tsx` as client component
  - Implement category checkboxes
  - Implement CEFR level radio buttons
  - Implement lesson type checkboxes
  - Add clear filters button

  - Show active filter count
  - Emit filter changes to parent component
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 14. Public lesson view page

  - Create `app/public-library/[id]/page.tsx`
  - Fetch and display full lesson content
  - Conditionally render workspace sidebar based on authentication status

  - Use existing lesson-display component for content rendering
  - Implement static generation with revalidation (1 hour)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.5_

- [x] 15. Modify workspace sidebar for public lessons

  - Update `components/workspace-sidebar.tsx` to accept lesson source type (personal/public)
  - Hide delete button for non-admin users viewing public lessons
  - Show delete button for admin users viewing public lessons
  - Maintain edit and export functionality for authenticated users

  - Update API calls to use public lesson endpoints when appropriate
  - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2_

- [x] 16. Admin lesson creation dialog component

  - Create `components/admin-lesson-creation-dialog.tsx`
  - Display after lesson generation for admin users
  - Prompt for category selection (dropdown)
  - Allow adding tags (multi-input)
  - Allow setting estimated duration (number input)
  - Show confirmation button to save to public library
  - _Requirements: 3.3, 4.1, 4.2_

- [x] 17. Admin stats panel component

  - Create `components/admin-stats-panel.tsx`
  - Display total lessons count
  - Show breakdown by category (chart or list)
  - Show breakdown by CEFR level (chart or list)
  - Display recent additions (list)
  - Show lessons created by current admin
  - Only render for admin users
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 18. Update public navbar with library link

  - Modify `components/public-navbar.tsx`
  - Add "Public Library" navigation link
  - Position link appropriately in navbar
  - Ensure link is visible to all users (authenticated and unauthenticated)
  - _Requirements: 5.1, 5.2_

- [x] 19. Chrome extension integration for admin users

  - Modify `popup.js` to check admin status
  - Add "Save to Public Library" option for admin users after content extraction
  - Set flag in chrome.storage when public library is selected
  - Show metadata dialog after lesson generation if saving to public
  - Call public lesson creation API instead of personal lesson API
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 20. Export functionality for public lessons

  - Update `lib/export-utils.ts` to handle public lessons
  - Include attribution to public library in exports
  - Ensure PDF export works for public lessons
  - Ensure Word export works for public lessons
  - Handle export errors gracefully
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 21. Unit tests for public lessons server utilities

  - Create `test/public-lessons-server.test.ts`
  - Test `createPublicLesson()` with valid and invalid content
  - Test `getPublicLessons()` with various filters
  - Test `updatePublicLesson()` with authentication
  - Test `deletePublicLesson()` with admin and non-admin users
  - Test `validatePublicLessonContent()` validation logic
  - _Requirements: All requirements (validation)_

- [x] 22. Unit tests for admin utilities

  - Create `test/admin-utils-server.test.ts`
  - Test `isAdmin()` function with admin and non-admin users
  - Test `getAdminStats()` data aggregation
  - Test admin verification logic
  - _Requirements: 1.3, 1.4, 8.1, 8.2, 11.1_

- [x] 23. Integration tests for public lesson API routes

  - Create `test/public-lessons-api-integration.test.ts`
  - Test unauthenticated access to list and get endpoints
  - Test authenticated user creating public lesson
  - Test authenticated user updating public lesson
  - Test non-admin user attempting to delete (should fail)
  - Test admin user deleting public lesson (should succeed)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 24. Component tests for public library UI

  - Create `test/public-library-components.test.tsx`
  - Test PublicLessonCard rendering with various data
  - Test PublicLibraryFilters interaction and filter emission
  - Test AdminLessonCreationDialog form submission
  - Test AdminStatsPanel data display
  - _Requirements: 4.1, 4.2, 9.1, 9.2, 10.1, 11.1_

- [x] 25. End-to-end integration test for public library workflow

  - Create `test/public-library-e2e.test.ts`
  - Test complete flow: browse → filter → view lesson (unauthenticated)
  - Test complete flow: browse → view → edit lesson (authenticated non-admin)
  - Test complete flow: create → view → delete lesson (admin)
  - Test export functionality from public lesson
  - _Requirements: All requirements (end-to-end validation)_
