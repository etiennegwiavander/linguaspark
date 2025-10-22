# Add Image Extraction to content.js
Write-Host "Adding image extraction functionality..." -ForegroundColor Cyan

$contentJs = "content.js"
$content = Get-Content $contentJs -Raw

# Find the location where we return the extracted content object
# We'll add image extraction before the return statement

$imageExtractionCode = @'

    // Extract images from the page
    const extractImages = () => {
      const images = [];
      const seenUrls = new Set();
      
      // Selectors for finding important images
      const imageSelectors = [
        'article img',
        'main img',
        '[role="main"] img',
        '.post-content img',
        '.entry-content img',
        '.article-content img',
        '.content-body img',
        'img[class*="featured"]',
        'img[class*="hero"]',
        'img[class*="banner"]',
        '.featured-image img',
        '.hero-image img',
        'meta[property="og:image"]',
        'meta[name="twitter:image"]'
      ];
      
      // First, try to get Open Graph or Twitter Card image (usually the best)
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      
      if (ogImage && ogImage.content) {
        const url = ogImage.content;
        if (!seenUrls.has(url)) {
          images.push({
            url: url,
            alt: document.title || '',
            width: 0,
            height: 0,
            score: 100, // Highest priority
            source: 'og:image'
          });
          seenUrls.add(url);
        }
      }
      
      if (twitterImage && twitterImage.content) {
        const url = twitterImage.content;
        if (!seenUrls.has(url)) {
          images.push({
            url: url,
            alt: document.title || '',
            width: 0,
            height: 0,
            score: 95,
            source: 'twitter:image'
          });
          seenUrls.add(url);
        }
      }
      
      // Extract images from the page
      imageSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(img => {
            if (img.tagName === 'META') return; // Already handled above
            
            let url = img.src || img.dataset.src || img.dataset.lazySrc;
            if (!url || seenUrls.has(url)) return;
            
            // Skip tiny images, icons, tracking pixels
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            if (width < 200 || height < 150) return;
            
            // Skip common ad/tracking patterns
            if (url.includes('doubleclick') || 
                url.includes('analytics') || 
                url.includes('tracking') ||
                url.includes('pixel') ||
                url.includes('beacon')) return;
            
            // Calculate image score based on various factors
            let score = 50;
            
            // Size bonus (larger images are usually more important)
            if (width >= 800) score += 20;
            else if (width >= 600) score += 15;
            else if (width >= 400) score += 10;
            
            // Position bonus (images near the top are usually more important)
            const rect = img.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const absoluteTop = rect.top + scrollTop;
            if (absoluteTop < 1000) score += 15;
            else if (absoluteTop < 2000) score += 10;
            else if (absoluteTop < 3000) score += 5;
            
            // Class/ID bonus (featured, hero, banner images)
            const className = (img.className || '').toLowerCase();
            const id = (img.id || '').toLowerCase();
            const combined = className + ' ' + id;
            if (combined.includes('featured') || combined.includes('hero') || combined.includes('banner')) {
              score += 25;
            }
            if (combined.includes('main') || combined.includes('primary')) {
              score += 15;
            }
            
            // Alt text bonus (images with good alt text are usually important)
            const alt = img.alt || '';
            if (alt.length > 10) score += 10;
            if (alt.length > 30) score += 5;
            
            // Parent element bonus (images in article/main are more important)
            if (img.closest('article, main, [role="main"]')) {
              score += 20;
            }
            
            images.push({
              url: url,
              alt: alt,
              width: width,
              height: height,
              score: score,
              source: 'img-tag'
            });
            seenUrls.add(url);
          });
        } catch (error) {
          console.warn('[LinguaSpark] Error extracting images from selector:', selector, error);
        }
      });
      
      // Sort by score (highest first) and return top 5
      images.sort((a, b) => b.score - a.score);
      const topImages = images.slice(0, 5);
      
      console.log('[LinguaSpark] Extracted images:', topImages.length, 'images');
      if (topImages.length > 0) {
        console.log('[LinguaSpark] Best image:', topImages[0]);
      }
      
      return topImages;
    };
    
    const extractedImages = extractImages();
    const bannerImage = extractedImages.length > 0 ? extractedImages[0].url : null;
'@

# Find the return statement in extractCleanContent and add image extraction before it
$returnPattern = '(\s+return\s+\{\s+text:\s+text\.trim\(\),)'
$replacement = $imageExtractionCode + "`r`n`$1"

if ($content -match $returnPattern) {
    $content = $content -replace $returnPattern, $replacement
    Write-Host "✓ Added image extraction code" -ForegroundColor Green
} else {
    Write-Host "✗ Could not find return statement pattern" -ForegroundColor Red
    Write-Host "Searching for alternative pattern..." -ForegroundColor Yellow
}

# Also need to add images and bannerImage to the return object
$returnObjectPattern = '(return\s+\{\s+text:\s+text\.trim\(\),\s+wordCount:\s+words\.length,)'
$returnReplacement = 'return { text: text.trim(), wordCount: words.length, images: extractedImages, bannerImage: bannerImage,'

if ($content -match $returnObjectPattern) {
    $content = $content -replace $returnObjectPattern, $returnReplacement
    Write-Host "✓ Added images to return object" -ForegroundColor Green
} else {
    Write-Host "! Could not automatically add to return object" -ForegroundColor Yellow
    Write-Host "  You may need to manually add: images: extractedImages, bannerImage: bannerImage" -ForegroundColor Yellow
}

# Write back
Set-Content -Path $contentJs -Value $content -NoNewline

Write-Host ""
Write-Host "✓ Image extraction added to content.js!" -ForegroundColor Green
Write-Host ""
Write-Host "The extracted data now includes:" -ForegroundColor Cyan
Write-Host "  • images: Array of top 5 images with scores" -ForegroundColor White
Write-Host "  • bannerImage: URL of the best image for banner" -ForegroundColor White
Write-Host ""
Write-Host "Next: Update lesson generator to use bannerImage" -ForegroundColor Yellow
