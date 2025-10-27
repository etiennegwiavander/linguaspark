# Public Lessons Migration Guide

## Overview

This migration adds the Public Lesson Library feature to LinguaSpark, enabling admin users to create and manage publicly accessible lesson materials.

## What This Migration Does

### 1. Extends Tutors Table
- Adds `is_admin` boolean column (defaults to `false`)
- Creates index for efficient admin lookups

### 2. Creates Public Lessons Table
The `public_lessons` table includes:
- **Core fields**: id, created_at, updated_at, creator_id
- **Content fields**: title, content (JSONB), source_url, source_title, banner_image_url
- **Categorization**: category, cefr_level, lesson_type
- **Metadata**: tags (array), estimated_duration_minutes
- **Search**: Full-text search vector for title and source_title

### 3. Performance Optimization
Creates 7 indexes:
- `idx_public_lessons_category` - Filter by category
- `idx_public_lessons_cefr_level` - Filter by CEFR level
- `idx_public_lessons_lesson_type` - Filter by lesson type
- `idx_public_lessons_creator` - Filter by creator
- `idx_public_lessons_search` - Full-text search (GIN index)
- `idx_public_lessons_created_at` - Sort by creation date
- `idx_public_lessons_category_level` - Composite filter index

### 4. Row Level Security (RLS)
Implements 4 policies:
1. **SELECT**: Public read access (authenticated and unauthenticated users)
2. **INSERT**: Authenticated users can create public lessons
3. **UPDATE**: Authenticated users can update any public lesson
4. **DELETE**: Only admin users can delete public lessons

### 5. Automatic Timestamp Updates
Creates trigger to automatically update `updated_at` on row modifications.

## How to Run the Migration

### Prerequisites
- Access to Supabase SQL Editor
- Database backup (recommended)

### Steps

1. **Backup your database** (recommended)
   ```bash
   # Use Supabase dashboard or CLI to create a backup
   ```

2. **Open Supabase SQL Editor**
   - Navigate to your Supabase project
   - Go to SQL Editor

3. **Run the migration script**
   - Copy the contents of `006_create_public_lessons.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Verify the migration**
   The script includes verification queries at the end that will show:
   - The new `is_admin` column in tutors table
   - All columns in the new `public_lessons` table
   - All created indexes
   - RLS status and policies
   - The created trigger

5. **Check for errors**
   - Review the output for any error messages
   - All verification queries should return expected results

## Setting Admin Users

After running the migration, you can designate admin users:

```sql
-- Make a specific user an admin
UPDATE tutors
SET is_admin = true
WHERE email = 'admin@example.com';

-- Verify admin status
SELECT id, email, full_name, is_admin
FROM tutors
WHERE is_admin = true;
```

## Testing the Migration

### Test 1: Verify Table Structure
```sql
-- Check public_lessons table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'public_lessons'
ORDER BY ordinal_position;
```

### Test 2: Test RLS Policies
```sql
-- As unauthenticated user, you should be able to read
SELECT COUNT(*) FROM public_lessons;

-- As authenticated user, you should be able to insert
-- (Test this through the application)
```

### Test 3: Test Admin Deletion
```sql
-- Only admins should be able to delete
-- (Test this through the application)
```

## Rollback Instructions

If you need to undo this migration:

1. **Backup any public lessons data** (if you want to preserve it)
   ```sql
   -- Export public lessons to JSON
   COPY (SELECT * FROM public_lessons) TO '/tmp/public_lessons_backup.json';
   ```

2. **Run the rollback script**
   - Copy the contents of `006_rollback_public_lessons.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify rollback**
   - Check that `public_lessons` table no longer exists
   - Check that `is_admin` column was removed from tutors

**⚠️ WARNING**: Rollback will permanently delete all public lessons data!

## Troubleshooting

### Issue: "relation already exists"
**Solution**: The migration is idempotent. If the table already exists, the script will skip creation. You can safely re-run it.

### Issue: "permission denied"
**Solution**: Ensure you're running the script with sufficient database privileges (typically as the postgres user or database owner).

### Issue: RLS policies not working
**Solution**: 
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'public_lessons';`
2. Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'public_lessons';`
3. Verify user authentication is working correctly

### Issue: Indexes not being used
**Solution**: 
1. Run `ANALYZE public_lessons;` to update statistics
2. Check query plans with `EXPLAIN ANALYZE` to verify index usage

## Migration Checklist

- [ ] Database backup created
- [ ] Migration script reviewed
- [ ] Migration script executed successfully
- [ ] Verification queries passed
- [ ] At least one admin user designated
- [ ] RLS policies tested (read, insert, update, delete)
- [ ] Application code updated to use new table
- [ ] API endpoints tested
- [ ] UI components tested

## Related Files

- **Migration**: `scripts/006_create_public_lessons.sql`
- **Rollback**: `scripts/006_rollback_public_lessons.sql`
- **Requirements**: `.kiro/specs/public-lesson-library/requirements.md`
- **Design**: `.kiro/specs/public-lesson-library/design.md`
- **Tasks**: `.kiro/specs/public-lesson-library/tasks.md`

## Support

If you encounter issues:
1. Check the verification queries in the migration script
2. Review Supabase logs for detailed error messages
3. Consult the design document for architecture details
4. Check the requirements document for expected behavior

