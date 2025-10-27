# Quick Start: Public Lessons Migration

## TL;DR - Run the Migration

1. **Open Supabase SQL Editor** in your project dashboard

2. **Copy and paste** the entire contents of `scripts/006_create_public_lessons.sql`

3. **Click Run** - The script will:
   - Add `is_admin` column to tutors table
   - Create `public_lessons` table
   - Create 7 indexes
   - Set up 4 RLS policies
   - Create update trigger
   - Show verification results

4. **Make yourself an admin**:
   ```sql
   UPDATE tutors
   SET is_admin = true
   WHERE email = 'your-email@example.com';
   ```

5. **Verify** by running `scripts/006_test_public_lessons.sql`

## That's It!

You're ready to proceed with Task 2 (TypeScript types) and beyond.

## Need More Details?

- Full guide: `scripts/006_PUBLIC_LESSONS_MIGRATION_README.md`
- Rollback: `scripts/006_rollback_public_lessons.sql`
- Tests: `scripts/006_test_public_lessons.sql`
- Summary: `scripts/006_MIGRATION_COMPLETE.md`

