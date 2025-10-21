# Embed Mascot Base64 in Extension

Write-Host "`n=== Embedding Mascot Base64 in Extension ===" -ForegroundColor Cyan

# Read the base64 data
$base64Data = Get-Content "public/mascot.txt" -Raw

# Create the data URL
$dataUrl = "data:image/png;base64,$base64Data"

Write-Host "Base64 data length: $($base64Data.Length) characters" -ForegroundColor Gray

# Read content.js
$contentJs = Get-Content "content.js" -Raw

# Create the mascot HTML with base64 embedded
$mascotHtml = @"
<img src="$dataUrl" width="40" height="40" alt="LinguaSpark mascot" style="pointer-events: none; user-select: none;" />
"@

# Replace the SVG patterns with the base64 image
# Pattern 1: The initial button creation
$pattern1 = '(?s)// Add ghost mascot.*?button\.innerHTML = `.*?`;'
$replacement1 = @"
// Add ghost mascot (base64 embedded)
      const mascotImg = '$mascotHtml';
      button.innerHTML = mascotImg;
"@

$contentJs = $contentJs -replace $pattern1, $replacement1

# Write back
Set-Content "content.js" -Value $contentJs -NoNewline

Write-Host "✅ Embedded base64 mascot in content.js" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to chrome://extensions/"
Write-Host "2. Click reload on LinguaSpark extension"
Write-Host "3. Refresh any webpage"
Write-Host "4. Your actual ghost mascot should now appear!"
Write-Host ""
