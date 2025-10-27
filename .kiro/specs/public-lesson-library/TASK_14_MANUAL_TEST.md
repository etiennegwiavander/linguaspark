# Task 14: Manual Testing Guide

## Prerequisites
- Development server running (`npm run dev`)
- At least one public lesson in the database
- Test accounts: regular user and admin user

## Test Scenarios

### Scenario 1: Unauthenticated User View
**Steps:**
1. Ensure you're logged out
2. Navigate to `/library`
3. Click on any lesson card
4. Verify the lesson view page loads

**Expected Results:**
- ✅ Lesson title displays prominently
- ✅ Banner image shows (if available)
- ✅ Metadata badges display (CEFR level, lesson type, category)
- ✅ Tags display (if available)
- ✅ Duration displays (if available)
- ✅ Source link displays and is clickable (if available)
- ✅ All lesson sections render correctly
- ✅ NO sidebar is visible
- ✅ "Back to Library" button works
- ✅ Page loads quickly (static generation)

### Scenario 2: Authenticated Non-Admin User View
**Steps:**
1. Sign in as a regular user (non-admin)
2. Navigate to `/library`
3. Click on any lesson card

**Expected Results:**
- ✅ All unauthenticated features work
- ✅ Sidebar appears on the right side
- ✅ "Actions" heading in sidebar
- ✅ "Export" section with three buttons:
  - Export as HTML
  - Export as PDF
  - Export as Word
- ✅ NO "Admin" section visible
- ✅ NO "Delete Lesson" button visible

**Export Testing:**
1. Click "Export as HTML"
   - ✅ HTML file downloads
   - ✅ Button shows "Exporting..." during process
   - ✅ Other export buttons disabled during export

2. Click "Export as PDF"
   - ✅ PDF file downloads
   - ✅ Content formatted correctly

3. Click "Export as Word"
   - ✅ Word document downloads
   - ✅ Content formatted correctly

### Scenario 3: Admin User View
**Steps:**
1. Sign in as an admin user
2. Navigate to `/library`
3. Click on any lesson card

**Expected Results:**
- ✅ All authenticated user features work
- ✅ Sidebar includes "Admin" section
- ✅ "Delete Lesson" button visible in Admin section
- ✅ Button styled as destructive (red)

**Delete Testing:**
1. Click "Delete Lesson"
   - ✅ Confirmation dialog appears
   - ✅ Dialog message: "Are you sure you want to delete this public lesson? This action cannot be undone."

2. Click "Cancel" in confirmation
   - ✅ Dialog closes
   - ✅ Lesson remains on page

3. Click "Delete Lesson" again, then "OK"
   - ✅ Button shows "Deleting..." during process
   - ✅ Success message appears
   - ✅ Redirects to `/library`
   - ✅ Lesson no longer appears in library

### Scenario 4: Content Display Verification
**Test with different lesson types:**

1. **Lesson with all sections:**
   - ✅ Warm-up questions display
   - ✅ Vocabulary words with definitions and examples
   - ✅ Reading passage with comprehension questions
   - ✅ Grammar focus with explanation and examples
   - ✅ Discussion questions display
   - ✅ Pronunciation section (if present)
   - ✅ Wrap-up summary displays

2. **Minimal lesson (only required sections):**
   - ✅ Warm-up displays
   - ✅ Wrap-up displays
   - ✅ No errors for missing optional sections

3. **Lesson with banner image:**
   - ✅ Banner image displays at top
   - ✅ Image is properly sized and cropped
   - ✅ Image has proper alt text

4. **Lesson with source URL:**
   - ✅ Source attribution displays
   - ✅ Link is clickable
   - ✅ Link opens in new tab
   - ✅ Shows source title if available, URL otherwise

### Scenario 5: Responsive Design
**Test on different screen sizes:**

1. **Desktop (1920x1080):**
   - ✅ Sidebar appears on right
   - ✅ Content area uses appropriate width
   - ✅ Proper spacing and margins

2. **Tablet (768x1024):**
   - ✅ Layout adjusts appropriately
   - ✅ Sidebar remains visible (if authenticated)
   - ✅ Content remains readable

3. **Mobile (375x667):**
   - ✅ Layout stacks vertically
   - ✅ Sidebar adapts or hides appropriately
   - ✅ All content accessible
   - ✅ Touch targets appropriately sized

### Scenario 6: SEO and Performance
**Verification:**

1. **View page source:**
   - ✅ Meta tags present (title, description)
   - ✅ OpenGraph tags present
   - ✅ Banner image in og:image (if available)

2. **Check network tab:**
   - ✅ Page loads quickly (static generation)
   - ✅ No unnecessary API calls on initial load
   - ✅ Images load efficiently

3. **Test direct URL access:**
   - ✅ Navigate directly to `/library/[lesson-id]`
   - ✅ Page loads without errors
   - ✅ Content displays correctly

### Scenario 7: Error Handling
**Test edge cases:**

1. **Invalid lesson ID:**
   - Navigate to `/library/invalid-id-12345`
   - ✅ 404 page displays

2. **Deleted lesson:**
   - Navigate to URL of recently deleted lesson
   - ✅ 404 page displays or redirects appropriately

3. **Network error during export:**
   - Simulate network failure
   - ✅ Error message displays
   - ✅ User can retry

## Quick Verification Checklist

### Visual Design
- [ ] Vintage theme consistent with library page
- [ ] Proper typography and spacing
- [ ] Colors match design system
- [ ] Borders and shadows consistent
- [ ] Badges styled correctly

### Functionality
- [ ] Navigation works (back to library)
- [ ] Authentication detection works
- [ ] Sidebar visibility correct for user type
- [ ] Export functions work
- [ ] Delete function works (admin only)
- [ ] Confirmation dialogs work

### Content
- [ ] All lesson sections display
- [ ] Metadata displays correctly
- [ ] Banner images display
- [ ] Source attribution works
- [ ] Tags display properly

### Performance
- [ ] Page loads quickly
- [ ] Static generation working
- [ ] No console errors
- [ ] Smooth interactions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Proper heading hierarchy
- [ ] Alt text on images

## Common Issues and Solutions

### Issue: Sidebar not showing for authenticated users
**Solution:** Check that authentication is working correctly. Verify localStorage has session token.

### Issue: Export buttons not working
**Solution:** Check browser console for errors. Verify export utilities are properly imported.

### Issue: Delete button not showing for admin
**Solution:** Verify user has `is_admin = true` in tutors table.

### Issue: 404 error on valid lesson
**Solution:** Check that lesson exists in public_lessons table and has correct ID.

### Issue: Slow page load
**Solution:** Verify static generation is working. Check revalidation settings.

## Success Criteria

All test scenarios pass with expected results:
- ✅ Unauthenticated users can view lessons
- ✅ Authenticated users can view and export lessons
- ✅ Admin users can delete lessons
- ✅ Content displays correctly for all lesson types
- ✅ Responsive design works on all screen sizes
- ✅ SEO optimization in place
- ✅ Performance is optimal (static generation)
- ✅ Error handling works correctly

## Notes

- Test with real lesson data from the database
- Verify static generation by checking page load times
- Test export functionality with different lesson structures
- Ensure admin delete functionality is properly restricted
- Check that all requirements from the spec are satisfied
