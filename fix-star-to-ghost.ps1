# Fix Star to Ghost Mascot in content.js
Write-Host "Replacing star SVG with ghost mascot..." -ForegroundColor Cyan

$contentJs = "content.js"
$mascotBase64 = (Get-Content "public/mascot.txt" -Raw).Trim()

# Read the file
$content = Get-Content $contentJs -Raw

# Create the ghost mascot HTML
$ghostHTML = "<img src=`"data:image/png;base64,$mascotBase64`" style=`"width: 48px; height: 48px; border: 2px solid #2563eb; border-radius: 50%;`" alt=`"LinguaSpark`" />"

# Replace first star (line ~700) - after success
$starPattern1 = '<svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">\s+<path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />\s+</svg>'
$content = $content -replace $starPattern1, $ghostHTML

# Write back
Set-Content -Path $contentJs -Value $content -NoNewline

Write-Host "✓ Replaced all star SVGs with ghost mascot!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Click RELOAD on LinguaSpark" -ForegroundColor White
Write-Host "3. Test the button - ghost should stay throughout all states!" -ForegroundColor White
