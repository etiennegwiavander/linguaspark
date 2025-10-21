# Apply Mascot with All States - Final Version

Write-Host "`n=== Applying Mascot with All States ===" -ForegroundColor Cyan

# Read base64
$base64 = Get-Content "public/mascot.txt" -Raw
$dataUrl = "data:image/png;base64,$base64"

Write-Host "Base64 loaded: $($base64.Length) characters" -ForegroundColor Gray

# Create mascot HTML with 64px size and blue border
$mascotHtml = "<img src=`"$dataUrl`" width=`"64`" height=`"64`" alt=`"LinguaSpark mascot`" style=`"border: 2px solid rgb(37, 99, 235); border-radius: 50%; pointer-events: none; user-select: none;`" />"

# Read content.js
$content = Get-Content "content.js" -Raw

# Replace line 261-280 (the SVG ghost)
$oldSvg = @'
      // Add ghost mascot (SVG version for reliability)
      button.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Ghost body -->
          <ellipse cx="50" cy="55" rx="35" ry="40" fill="white"/>
          <rect x="15" y="55" width="70" height="30" fill="white"/>
          <!-- Ghost bottom waves -->
          <path d="M15 85 Q22 80 30 85 Q38 90 45 85 Q52 80 60 85 Q68 90 75 85 Q82 80 85 85 V95 H15 Z" fill="white"/>
          <!-- Eyes -->
          <ellipse cx="38" cy="45" rx="6" ry="8" fill="#2d2d2d"/>
          <ellipse cx="62" cy="45" rx="6" ry="8" fill="#2d2d2d"/>
          <!-- Book -->
          <rect x="30" y="60" width="40" height="25" rx="2" fill="#1a1a1a"/>
          <path d="M50 60 V85" stroke="white" stroke-width="1.5"/>
          <path d="M35 65 H45 M35 70 H45 M35 75 H45" stroke="white" stroke-width="1" opacity="0.7"/>
          <path d="M55 65 H65 M55 70 H65 M55 75 H65" stroke="white" stroke-width="1" opacity="0.7"/>
          <!-- Hands -->
          <ellipse cx="28" cy="70" rx="5" ry="7" fill="white"/>
          <ellipse cx="72" cy="70" rx="5" ry="7" fill="white"/>
        </svg>
      `;
'@

$newMascot = @"
      // Add ghost mascot
      button.innerHTML = ``$mascotHtml``;
"@

$content = $content -replace [regex]::Escape($oldSvg), $newMascot

# Replace loading spinner
$content = $content -replace '(?s)buttonInstance\.button\.innerHTML = `\s*<svg width="24".*?animate-spin.*?</svg>\s*`;', "buttonInstance.button.innerHTML = ``$mascotHtml``;"

# Replace success checkmark  
$content = $content -replace '(?s)buttonInstance\.button\.innerHTML = `\s*<svg width="24".*?M9 12L11 14L15 10.*?</svg>\s*`;', "buttonInstance.button.innerHTML = ``$mascotHtml``;"

# Replace error icon
$content = $content -replace '(?s)buttonInstance\.button\.innerHTML = `\s*<svg width="24".*?M12 9V13M12 17H12\.01.*?</svg>\s*`;', "buttonInstance.button.innerHTML = ``$mascotHtml``;"

# Replace old Sparky star (if any remain)
$content = $content -replace '(?s)buttonInstance\.button\.innerHTML = `\s*<svg width="32".*?M16 2L20 12H28.*?</svg>\s*`;', "buttonInstance.button.innerHTML = ``$mascotHtml``;"

# Write back
Set-Content "content.js" -Value $content -NoNewline

Write-Host "✅ Applied mascot to ALL states in content.js" -ForegroundColor Green
Write-Host "`nStates updated:" -ForegroundColor Cyan
Write-Host "  - Initial button (64px with blue border)" -ForegroundColor White
Write-Host "  - Loading state" -ForegroundColor White
Write-Host "  - Success state" -ForegroundColor White
Write-Host "  - Error state" -ForegroundColor White
Write-Host "  - Reset states" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Click RELOAD on LinguaSpark" -ForegroundColor White
Write-Host "3. Close ALL tabs with the button" -ForegroundColor White
Write-Host "4. Open NEW tab and visit any site" -ForegroundColor White
Write-Host "5. Your ghost mascot (64px, blue border) should appear!" -ForegroundColor Green
Write-Host ""
