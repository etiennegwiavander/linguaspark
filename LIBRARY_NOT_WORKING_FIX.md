# Lesson Library Not Working - Fix Required

## Problem

The Lesson Library page is stuck loading because **the database tables don't exist yet in Supabase**.

## Root Cause

The application code is trying to query the `lessons` table, but it hasn't been created in your Supabase database.

## Solution

**Run the SQL migration scripts in Supabase** (takes ~5 minutes)

## Quick Fix Steps

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com](https://supabase.com)
   - Open your LinguaSpark project
   - Click "SQL Editor" in sidebar

2. **Run These Scripts in Order**
   - `scripts/001_create_tables.sql` ← **MOST IMPORTANT**
   - `scripts/002_fix_tutor_insert_policy.sql`
   - `scripts/003_complete_rls_fix.sql`
   - `scripts/004_auto_create_tutor_profile.sql`

3. **How to Run**
   - Click "New Query"
   - Copy script content
   - Paste in editor
   - Click "Run"
   - Repeat for each script

4. **Verify**
   - Go to "Table Editor" in Supabase
   - You should see: `tutors`, `students`, `lessons`, `lesson_exports`

5. **Test**
   - Generate a new lesson in LinguaSpark
   - Visit `/library`
   - Your lesson should appear!

## What Gets Created

The scripts create:
- ✅ **lessons table** - Stores all generated lessons
- ✅ **tutors table** - Your account info
- ✅ **students table** - Optional student profiles
- ✅ **lesson_exports table** - Export history
- ✅ **Security policies** - Data isolation per tutor
- ✅ **Indexes** - Fast queries

## Why This Happened

The database schema exists in the code (`scripts/` folder) but hasn't been executed in your Supabase instance yet. This is a one-time setup step.

## After Setup

Once done:
- ✅ Lessons save automatically when generated
- ✅ Library displays all your lessons
- ✅ Filters and search work
- ✅ Delete removes from database
- ✅ Everything persists across sessions

## Detailed Instructions

See `DATABASE_SETUP_GUIDE.md` for step-by-step instructions with screenshots and troubleshooting.

---

**Action Required**: Run SQL scripts in Supabase
**Time Needed**: ~5 minutes
**Difficulty**: Easy (copy/paste)
