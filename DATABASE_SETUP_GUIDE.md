# Database Setup Guide for LinguaSpark

## Issue

The Lesson Library is not working because the database tables haven't been created in Supabase yet.

## Solution

You need to run the SQL migration scripts in your Supabase database.

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your LinguaSpark project
4. Click on **"SQL Editor"** in the left sidebar (or go to Database → SQL Editor)

### 2. Run Migration Scripts

Run each script in order:

#### Script 1: Create Tables (REQUIRED)
**File**: `scripts/001_create_tables.sql`

1. Open the SQL Editor
2. Click **"New Query"**
3. Copy the entire contents of `scripts/001_create_tables.sql`
4. Paste into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Wait for "Success" message

This creates:
- ✅ `tutors` table
- ✅ `students` table  
- ✅ `lessons` table
- ✅ `lesson_exports` table
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance

#### Script 2: Fix Tutor Insert Policy (REQUIRED)
**File**: `scripts/002_fix_tutor_insert_policy.sql`

1. Click **"New Query"** again
2. Copy contents of `scripts/002_fix_tutor_insert_policy.sql`
3. Paste and **Run**

#### Script 3: Complete RLS Fix (REQUIRED)
**File**: `scripts/003_complete_rls_fix.sql`

1. Click **"New Query"**
2. Copy contents of `scripts/003_complete_rls_fix.sql`
3. Paste and **Run**

#### Script 4: Auto Create Tutor Profile (REQUIRED)
**File**: `scripts/004_auto_create_tutor_profile.sql`

1. Click **"New Query"**
2. Copy contents of `scripts/004_auto_create_tutor_profile.sql`
3. Paste and **Run**

### 3. Verify Tables Were Created

1. In Supabase, go to **"Table Editor"** (left sidebar)
2. You should see these tables:
   - `tutors`
   - `students`
   - `lessons`
   - `lesson_exports`

### 4. Test the Application

1. Go back to your LinguaSpark application
2. **Generate a new lesson** (any type)
3. Check browser console for: "✅ Lesson saved to database"
4. Visit `/library` page
5. Your lesson should appear!

## Quick Copy-Paste Method

If you want to run all scripts at once:

1. Open Supabase SQL Editor
2. Create a new query
3. Copy and paste ALL four script files in order
4. Run once

## Troubleshooting

### Error: "relation already exists"
- **Solution**: Tables already exist, skip to next script

### Error: "permission denied"
- **Solution**: Make sure you're the project owner or have admin access

### Error: "auth.uid() does not exist"
- **Solution**: This is normal if no user is logged in. The policies will work once users authenticate.

### Library still shows "0 lessons"
1. **Check authentication**: Make sure you're logged in
2. **Generate a test lesson**: Create any lesson type
3. **Check console**: Look for "✅ Lesson saved to database"
4. **Refresh library**: Go to `/library` and refresh

### Error: "No authenticated user"
1. Sign out and sign back in
2. Or create a new account
3. The tutor profile will be created automatically

## What Each Table Does

### `tutors`
- Stores tutor account information
- Links to Supabase Auth users
- Auto-created when you sign up

### `students`
- Stores student profiles (optional)
- Linked to tutors
- Used for organizing lessons by student

### `lessons`
- **Main table for lesson storage**
- Stores all generated lessons
- Includes lesson data, type, level, language
- Links to source URL if from web

### `lesson_exports`
- Tracks exported lessons
- Stores export history (PDF, Word)
- Optional feature

## Database Schema

```sql
lessons table:
- id (UUID, primary key)
- tutor_id (UUID, foreign key to tutors)
- student_id (UUID, optional, foreign key to students)
- title (TEXT, lesson title)
- lesson_type (TEXT, discussion/grammar/travel/business/pronunciation)
- student_level (TEXT, A1/A2/B1/B2/C1)
- target_language (TEXT, english/spanish/etc)
- source_url (TEXT, optional, URL if from web)
- source_text (TEXT, optional, extracted text)
- lesson_data (JSONB, full lesson content)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Security (RLS Policies)

All tables have Row Level Security enabled:
- ✅ Tutors can only see their own data
- ✅ Tutors can only modify their own data
- ✅ Students are isolated per tutor
- ✅ Lessons are isolated per tutor

## After Setup

Once the database is set up:
1. ✅ Lessons will save automatically when generated
2. ✅ Library will display all your lessons
3. ✅ Filters will work properly
4. ✅ Search will find your lessons
5. ✅ Delete will remove from database

## Need Help?

If you encounter issues:
1. Check the Supabase logs (Logs → Database)
2. Verify your `.env.local` has correct Supabase credentials
3. Make sure you're logged in to the application
4. Check browser console for error messages

---

**Status**: ⚠️ Action Required
**Priority**: High - Required for Lesson Library to work
**Time**: ~5 minutes to run all scripts
