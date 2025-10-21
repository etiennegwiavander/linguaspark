# Final Comprehensive Mascot Fix

Write-Host "`n=== Final Mascot Replacement ===" -ForegroundColor Cyan

# Read the base64 data
$base64 = Get-Content "public/mascot.txt" -Raw
$dataUrl = "data:image/png;base64,$base64"

Write-Host "Base64 length: $($base64.Length) characters" -ForegroundColor Gray

# Read content.js
$content = Get-Content "content.js" -Raw

# Add the mascot constant at the very top of the file (after the first comment)
$mascotConstant = @"

// Mascot image data
const MASCOT_IMG = '<img src="$dataUrl" width="40" height="40" alt="LinguaSpark mascot" style="pointer-events: none; user-select: none;" />';
"@

# Insert after the first line
$lines = $content -split "`n"
$lines[0] = $lines[0] + $mascotConstant
$content = $lines -join "`n"

# Now replace all 6 instances of button.innerHTML

# 1. Initial button creation (the SVG one)
$content = $content -replace '(?s)// Add ghost mascot.*?button\.innerHTML = `.*?`;', @'
// Add ghost mascot
      button.innerHTML = MASCOT_IMG;
'@

# 2-6. All other instances - replace SVG content with MASCOT_IMG
$content = $content -replace '(?s)buttonInstance\.button\.innerHTML = `\s*<svg.*?</svg>\s*`;', 'buttonInstance.button.innerHTML = MASCOT_IMG;'

# Write back
Set-Content "content.js" -Value $content -NoNewline

Write-Host "✅ Replaced ALL mascot instances in content.js" -ForegroundColor Green
Write-Host "`nCritical next steps:" -ForegroundColor Yellow
Write-Host "1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Click RELOAD button on LinguaSpark extension" -ForegroundColor White
Write-Host "3. Close ALL browser tabs with the button" -ForegroundColor White
Write-Host "4. Open a NEW tab and visit any website" -ForegroundColor White
Write-Host "5. Your actual ghost mascot should appear!" -ForegroundColor Green
Write-Host ""
