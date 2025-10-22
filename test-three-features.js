// Test script to verify all three features are working
// Run this in the browser console after generating a lesson

console.log('='.repeat(60));
console.log('🧪 TESTING THREE FEATURES');
console.log('='.repeat(60));

// Get the lesson data from the page
const getLessonData = () => {
  // Try to find lesson data in React component state
  // This is a simplified check - actual implementation may vary
  const lessonTitle = document.querySelector('h1')?.textContent;
  const bannerImage = document.querySelector('img[alt*="lesson"]') || document.querySelector('img[src*="banner"]');
  const sourceLink = document.querySelector('a[href*="http"]');
  
  return {
    lessonTitle,
    bannerImage,
    sourceLink
  };
};

// Test 1: Lesson Title Format
console.log('\n📝 TEST 1: Lesson Title Format');
console.log('-'.repeat(60));

const lessonTitle = document.querySelector('h1')?.textContent;
console.log('Title found:', lessonTitle);

if (lessonTitle) {
  const hasDash = lessonTitle.includes(' - ');
  const isOldFormat = lessonTitle.includes('Lesson - ') && lessonTitle.includes('Level');
  
  if (hasDash && !isOldFormat) {
    console.log('✅ PASS: Title uses "Original - AI Generated" format');
    console.log('   Format:', lessonTitle);
  } else if (isOldFormat) {
    console.log('❌ FAIL: Still using old format "Lesson - Level"');
    console.log('   Expected: "Original Title - AI Generated Title"');
    console.log('   Got:', lessonTitle);
  } else {
    console.log('⚠️  WARNING: Title format unclear');
    console.log('   Title:', lessonTitle);
  }
} else {
  console.log('❌ FAIL: No lesson title found');
}

// Test 2: Banner Image
console.log('\n🖼️  TEST 2: Banner Image Display');
console.log('-'.repeat(60));

// Look for banner image (should be near the top, after title)
const images = Array.from(document.querySelectorAll('img'));
const bannerImage = images.find(img => {
  const rect = img.getBoundingClientRect();
  return rect.width > 400 && rect.height > 100; // Large image likely to be banner
});

if (bannerImage) {
  console.log('✅ PASS: Banner image found');
  console.log('   Source:', bannerImage.src);
  console.log('   Alt:', bannerImage.alt);
  console.log('   Size:', `${bannerImage.width}x${bannerImage.height}`);
  console.log('   Position:', bannerImage.getBoundingClientRect());
} else {
  console.log('❌ FAIL: No banner image found');
  console.log('   Checked', images.length, 'images on page');
  console.log('   Tip: Banner should be large (>400px wide) and near top of page');
}

// Test 3: Source Attribution Link
console.log('\n🔗 TEST 3: Source Attribution Link');
console.log('-'.repeat(60));

// Look for source link at bottom of page
const links = Array.from(document.querySelectorAll('a'));
const sourceLink = links.find(link => {
  const text = link.textContent.toLowerCase();
  return text.includes('article from') || text.includes('source');
});

if (sourceLink) {
  console.log('✅ PASS: Source attribution link found');
  console.log('   Text:', sourceLink.textContent);
  console.log('   URL:', sourceLink.href);
  console.log('   Opens in new tab:', sourceLink.target === '_blank');
  console.log('   Has security attrs:', sourceLink.rel.includes('noopener'));
} else {
  console.log('❌ FAIL: No source attribution link found');
  console.log('   Checked', links.length, 'links on page');
  console.log('   Expected: Link with text "Article from [Site]" at bottom');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

const results = {
  titleFormat: !!lessonTitle && lessonTitle.includes(' - ') && !lessonTitle.includes('Lesson - '),
  bannerImage: !!bannerImage,
  sourceLink: !!sourceLink
};

const passCount = Object.values(results).filter(Boolean).length;
const totalTests = Object.keys(results).length;

console.log(`Tests passed: ${passCount}/${totalTests}`);
console.log('');
console.log('Feature Status:');
console.log(`  ${results.titleFormat ? '✅' : '❌'} Title Format: "Original - AI Generated"`);
console.log(`  ${results.bannerImage ? '✅' : '❌'} Banner Image: Displayed at top`);
console.log(`  ${results.sourceLink ? '✅' : '❌'} Source Link: Clickable at bottom`);

if (passCount === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! All three features are working correctly.');
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Check the details above.');
  console.log('\nDebugging tips:');
  if (!results.titleFormat) {
    console.log('  - Title: Check progressive-generator.ts generateLessonTitle()');
    console.log('  - Verify metadata.title is being passed through');
  }
  if (!results.bannerImage) {
    console.log('  - Banner: Check metadata.bannerImages in lesson object');
    console.log('  - Verify images were extracted from webpage');
    console.log('  - Check console for "Banner image failed to load"');
  }
  if (!results.sourceLink) {
    console.log('  - Source: Check lesson.extractionSource exists');
    console.log('  - Verify extractionSource.url and domain are set');
  }
}

console.log('\n' + '='.repeat(60));

// Additional debugging info
console.log('\n🔍 DEBUGGING INFO');
console.log('-'.repeat(60));

// Check Chrome storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['lessonConfiguration'], (result) => {
    console.log('Extraction config in storage:', !!result.lessonConfiguration);
    if (result.lessonConfiguration) {
      console.log('  - Has metadata:', !!result.lessonConfiguration.metadata);
      console.log('  - Has banner images:', !!result.lessonConfiguration.metadata?.bannerImages);
      console.log('  - Banner images count:', result.lessonConfiguration.metadata?.bannerImages?.length || 0);
      console.log('  - Has source URL:', !!result.lessonConfiguration.metadata?.sourceUrl);
      console.log('  - Domain:', result.lessonConfiguration.metadata?.domain);
    }
  });
} else {
  console.log('Chrome storage not available (not in extension context)');
}

console.log('\nTo manually inspect lesson data:');
console.log('  1. Open React DevTools');
console.log('  2. Find LessonDisplay component');
console.log('  3. Check props.lesson object');
console.log('  4. Verify: lesson.metadata.bannerImages, lesson.extractionSource');

console.log('\n' + '='.repeat(60));
