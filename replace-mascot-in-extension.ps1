# Replace Sparky SVG with Ghost Mascot in Extension Files

Write-Host "`n=== Replacing Mascot in Extension Files ===" -ForegroundColor Cyan

# Read content.js
$contentJs = Get-Content "content.js" -Raw

# Replace all instances of the Sparky SVG with the ghost mascot image
$oldSvg = @'
        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />
        </svg>
'@

$newImg = @'
        <img src="chrome-extension://${chrome.runtime.id}/mascot.png" 
             width="40" 
             height="40" 
             alt="LinguaSpark mascot" 
             style="pointer-events: none; user-select: none;" />
'@

# Replace all occurrences
$contentJs = $contentJs -replace [regex]::Escape($oldSvg), $newImg

# Also replace the comment
$contentJs = $contentJs -replace "Add Sparky mascot \(simplified version for content script\)", "Add ghost mascot"

# Write back
Set-Content "content.js" -Value $contentJs -NoNewline

Write-Host "✅ Replaced mascot in content.js" -ForegroundColor Green

# Copy mascot.png to extension root if it doesn't exist
if (!(Test-Path "mascot.png")) {
    if (Test-Path "public/mascot.png") {
        Copy-Item "public/mascot.png" "mascot.png"
        Write-Host "✅ Copied mascot.png to extension root" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: public/mascot.png not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ mascot.png already exists in extension root" -ForegroundColor Green
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Go to chrome://extensions/"
Write-Host "2. Click the reload button on LinguaSpark extension"
Write-Host "3. Refresh any webpage where the button is showing"
Write-Host "4. You should now see the ghost mascot!"
Write-Host ""
