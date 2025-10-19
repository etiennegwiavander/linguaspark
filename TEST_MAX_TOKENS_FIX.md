# Test MAX_TOKENS Fix - Quick Instructions

## What Was Fixed

The `MAX_TOKENS_EXCEEDED_NO_CONTENT` error that was breaking lesson generation.

## How to Test

### Step 1: Start the Dev Server

```powershell
npm run dev
```

### Step 2: Open the App

Navigate to: `http://localhost:3000`

### Step 3: Generate a Lesson

1. Paste this text (or any text > 1000 characters):
```
Maria Pia of Savoy was an Italian princess who became Queen of Portugal. She was born on October 16, 1847, in Turin, Italy, as the eldest daughter of Victor Emmanuel II of Italy and Adelaide of Austria. In 1862, at the age of 15, she married King Luís I of Portugal in Lisbon. As Queen consort, Maria Pia was known for her charitable work and patronage of the arts. She founded several hospitals and orphanages throughout Portugal and was particularly interested in improving healthcare for women and children. The Queen was also a talented artist and musician, often hosting cultural events at the royal palace. After her husband's death in 1889, Maria Pia continued to live in Portugal until 1910, when the Portuguese monarchy was overthrown. She then returned to Italy, where she lived until her death on July 5, 1911, in Stupinigi, near Turin.
```

2. Select:
   - Lesson Type: **Discussion**
   - Student Level: **B2**
   - Target Language: **English**

3. Click **"Generate AI Lesson"**

### Step 4: Watch the Console

Open browser console (F12) and look for:

**Expected Success Messages:**
```
🎯 Generating Engoo-style lesson title...
✅ Generated text (XX chars) in XXXXms
🤖 AI generated Engoo-style title: [Title Here]
✅ Using Engoo-style title: [Title Here]
```

**If Retry Happens (This is OK):**
```
⚠️ Hit MAX_TOKENS limit, response may be incomplete
⚠️ MAX_TOKENS hit with no content - retrying with reduced token limit
🔄 Retrying with maxTokens: 30
✅ Generated text (XX chars) in XXXXms
```

**Should NOT See:**
```
❌ MAX_TOKENS hit but no content available
❌ MAX_TOKENS_EXCEEDED_NO_CONTENT
```

### Step 5: Verify Lesson Generated

- ✅ Lesson should display successfully
- ✅ Title should be present
- ✅ All sections should be complete
- ✅ No 500 error

---

## If It Still Fails

Check the console for the exact error message and report:

1. The full error stack trace
2. The console logs leading up to the error
3. The text you used for generation
4. The lesson type and level selected

---

## Expected Result

✅ **Lesson generates successfully without MAX_TOKENS errors**

---

## Quick Verification

Run this command to verify the fix is in place:

```powershell
Select-String -Path "lib/google-ai-server.ts" -Pattern "retrying with reduced token limit"
```

**Expected output:**
```
lib/google-ai-server.ts:169:            console.warn("⚠️ MAX_TOKENS hit with no content - retrying with reduced token limit");
```

If you see this line, the fix is applied correctly.
