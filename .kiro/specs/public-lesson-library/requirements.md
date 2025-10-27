# Requirements Document

## Introduction

This feature introduces a public lesson library system that allows admin users to create and manage publicly accessible lesson materials. The system enables admin users to generate lessons using the existing Sparky workflow, but saves them to a public library instead of their personal library. These public lessons are accessible to both authenticated and unauthenticated users, with categorization for easy discovery. Admin users retain full editing capabilities through the sidebar interface, while regular users view lessons in a read-only format without the sidebar.

## Requirements

### Requirement 1: Admin User Role Management

**User Story:** As a system administrator, I want to designate specific users as admins, so that they can create and manage public lesson content.

#### Acceptance Criteria

1. WHEN a tutor profile is created THEN the system SHALL include an `is_admin` boolean field defaulting to false
2. WHEN an admin flag is set on a user THEN the system SHALL persist this designation in the database
3. WHEN a user logs in THEN the system SHALL retrieve their admin status along with their profile
4. IF a user has admin privileges THEN the system SHALL display admin-specific UI elements

### Requirement 2: Public Lesson Library Database Schema

**User Story:** As a developer, I want a dedicated database table for public lessons, so that they are properly separated from personal lesson libraries.

#### Acceptance Criteria

1. WHEN the database is initialized THEN the system SHALL create a `public_lessons` table with fields for lesson data, category, difficulty level, and metadata
2. WHEN a public lesson is created THEN the system SHALL store the admin user ID as the creator
3. WHEN querying public lessons THEN the system SHALL support filtering by category, CEFR level, and lesson type
4. WHEN a public lesson is saved THEN the system SHALL include timestamps for creation and last modification
5. IF a lesson is marked as public THEN the system SHALL enforce read access for all users regardless of authentication status

### Requirement 3: Admin Lesson Creation Workflow

**User Story:** As an admin user, I want to create lessons using Sparky that save to the public library, so that I can build a collection of publicly available materials.

#### Acceptance Criteria

1. WHEN an admin user clicks Sparky THEN the system SHALL present an option to save to either personal or public library
2. WHEN an admin selects public library mode THEN the system SHALL follow the existing lesson generation flow
3. WHEN lesson generation completes THEN the system SHALL prompt for category assignment
4. WHEN the admin saves the lesson THEN the system SHALL store it in the `public_lessons` table
5. WHEN saving to public library THEN the system SHALL validate that the user has admin privileges

### Requirement 4: Public Lesson Categorization

**User Story:** As an admin user, I want to categorize public lessons, so that users can easily find relevant content.

#### Acceptance Criteria

1. WHEN creating a public lesson THEN the system SHALL require category selection from predefined options
2. WHEN displaying public lessons THEN the system SHALL group them by category
3. WHEN a user browses the public library THEN the system SHALL show category filters
4. IF a lesson has multiple applicable categories THEN the system SHALL support tagging with multiple categories
5. WHEN categories are displayed THEN the system SHALL show lesson count per category

### Requirement 5: Public Library Navigation

**User Story:** As any user (authenticated or not), I want to access the public lesson library from the navbar, so that I can discover available learning materials.

#### Acceptance Criteria

1. WHEN the navbar is rendered THEN the system SHALL display a "Public Library" link
2. WHEN a user clicks the Public Library link THEN the system SHALL navigate to the public library page
3. WHEN the public library page loads THEN the system SHALL display lessons without requiring authentication
4. WHEN an unauthenticated user views the page THEN the system SHALL show all public lessons
5. WHEN an authenticated non-admin user views the page THEN the system SHALL show all public lessons in read-only mode

### Requirement 6: Public Lesson Display for Unauthenticated Users

**User Story:** As an unauthenticated user, I want to view public lessons without the sidebar, so that I have a clean, focused reading experience.

#### Acceptance Criteria

1. WHEN an unauthenticated user views a public lesson THEN the system SHALL hide the workspace sidebar
2. WHEN displaying a public lesson THEN the system SHALL render the full lesson content with proper formatting
3. WHEN a user views a public lesson THEN the system SHALL display the lesson title, category, and difficulty level
4. WHEN rendering public lessons THEN the system SHALL use the same typography and styling as personal lessons
5. IF a user is unauthenticated THEN the system SHALL still allow full lesson viewing without requiring login

### Requirement 7: Authenticated User Edit Access

**User Story:** As an authenticated user, I want to see the sidebar with editing capabilities when viewing public lessons, so that I can edit and export public content.

#### Acceptance Criteria

1. WHEN an authenticated user views a public lesson THEN the system SHALL display the workspace sidebar
2. WHEN an authenticated non-admin user opens the sidebar THEN the system SHALL show edit and export options but hide the delete option
3. WHEN an authenticated user edits a public lesson THEN the system SHALL update the `public_lessons` table
4. WHEN an authenticated non-admin user attempts to delete a public lesson THEN the system SHALL deny access
5. WHEN the sidebar is displayed THEN the system SHALL maintain the same editing behavior as in personal lessons

### Requirement 8: Admin Delete Privileges

**User Story:** As an admin user, I want to have full editing and deletion capabilities on public lessons, so that I can manage and curate the public library.

#### Acceptance Criteria

1. WHEN an admin user views a public lesson THEN the system SHALL display the workspace sidebar with full editing and deletion capabilities
2. WHEN an admin opens the sidebar THEN the system SHALL show edit, delete, and export options
3. WHEN an admin deletes a public lesson THEN the system SHALL remove it from the public library
4. WHEN an admin creates a public lesson THEN the system SHALL mark them as the creator in the database
5. WHEN viewing admin statistics THEN the system SHALL show lessons created by that admin and overall library metrics

### Requirement 9: Public Library Filtering and Search

**User Story:** As any user, I want to filter public lessons by category and difficulty, so that I can find content appropriate for my needs.

#### Acceptance Criteria

1. WHEN the public library page loads THEN the system SHALL display filter controls for category, CEFR level, and lesson type
2. WHEN a user applies filters THEN the system SHALL update the displayed lessons accordingly
3. WHEN multiple filters are selected THEN the system SHALL apply them cumulatively
4. WHEN no lessons match the filters THEN the system SHALL display an appropriate message
5. WHEN filters are cleared THEN the system SHALL show all public lessons

### Requirement 10: Public Lesson Metadata Display

**User Story:** As any user, I want to see metadata about public lessons, so that I can make informed decisions about which lessons to view.

#### Acceptance Criteria

1. WHEN browsing the public library THEN the system SHALL display lesson title, category, CEFR level, and lesson type for each lesson
2. WHEN viewing a lesson card THEN the system SHALL show the creation date
3. WHEN hovering over a lesson THEN the system SHALL display a preview or excerpt
4. WHEN lessons are listed THEN the system SHALL show the estimated reading time or lesson duration
5. IF a lesson has a banner image THEN the system SHALL display it in the lesson card

### Requirement 11: Admin Dashboard for Public Content

**User Story:** As an admin user, I want to see statistics about public lessons, so that I can understand content usage and gaps.

#### Acceptance Criteria

1. WHEN an admin views the public library THEN the system SHALL display admin-specific statistics
2. WHEN statistics are shown THEN the system SHALL include total lesson count by category
3. WHEN an admin reviews content THEN the system SHALL show which lessons they created
4. WHEN viewing statistics THEN the system SHALL display lessons needing updates or review
5. IF there are category gaps THEN the system SHALL highlight underrepresented categories

### Requirement 12: Row Level Security for Public Lessons

**User Story:** As a developer, I want proper RLS policies on the public lessons table, so that data access is secure and appropriate.

#### Acceptance Criteria

1. WHEN RLS policies are created THEN the system SHALL allow read access to all users (authenticated and unauthenticated) for public lessons
2. WHEN an authenticated user attempts to insert a public lesson THEN the system SHALL allow the operation
3. WHEN an authenticated user attempts to update a public lesson THEN the system SHALL allow the operation
4. WHEN an authenticated user with admin privileges attempts to delete a public lesson THEN the system SHALL allow the operation
5. WHEN an authenticated non-admin user attempts to delete a public lesson THEN the system SHALL deny access
6. WHEN an unauthenticated user attempts to insert, update, or delete a public lesson THEN the system SHALL deny access

### Requirement 13: Public Lesson Export Capabilities

**User Story:** As any user, I want to export public lessons to PDF or Word, so that I can use them offline or in my teaching practice.

#### Acceptance Criteria

1. WHEN viewing a public lesson THEN the system SHALL display export options
2. WHEN a user clicks export THEN the system SHALL generate the lesson in the selected format
3. WHEN exporting THEN the system SHALL include proper attribution to the public library
4. WHEN export completes THEN the system SHALL download the file to the user's device
5. IF export fails THEN the system SHALL display an appropriate error message
