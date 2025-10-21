# Fix Extension Mascot - Replace all instances with SVG ghost

Write-Host "`n=== Fixing Extension Mascot ===" -ForegroundColor Cyan

$ghostSvg = @'
<svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="55" rx="35" ry="40" fill="white"/>
          <rect x="15" y="55" width="70" height="30" fill="white"/>
          <path d="M15 85 Q22 80 30 85 Q38 90 45 85 Q52 80 60 85 Q68 90 75 85 Q82 80 85 85 V95 H15 Z" fill="white"/>
          <ellipse cx="38" cy="45" rx="6" ry="8" fill="#2d2d2d"/>
          <ellipse cx="62" cy="45" rx="6" ry="8" fill="#2d2d2d"/>
          <rect x="30" y="60" width="40" height="25" rx="2" fill="#1a1a1a"/>
          <path d="M50 60 V85" stroke="white" stroke-width="1.5"/>
          <path d="M35 65 H45 M35 70 H45 M35 75 H45" stroke="white" stroke-width="1" opacity="0.7"/>
          <path d="M55 65 H65 M55 70 H65 M55 75 H65" stroke="white" stroke-width="1" opacity="0.7"/>
          <ellipse cx="28" cy="70" rx="5" ry="7" fill="white"/>
          <ellipse cx="72" cy="70" rx="5" ry="7" fill="white"/>
        </svg>
'@

# Read content.js
$content = Get-Content "content.js" -Raw

# Replace the old Sparky star SVG pattern
$oldPattern = '<svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">\s*<path d="M16 2L20 12H28L22 18L24 28L16 22L8 28L10 18L4 12H12L16 2Z" />\s*</svg>'
$content = $content -replace $oldPattern, $ghostSvg

# Replace any remaining image tags
$oldImgPattern = '<img src="chrome-extension://\$\{chrome\.runtime\.id\}/mascot\.png"[^>]*>'
$content = $content -replace $oldImgPattern, $ghostSvg

# Write back
Set-Content "content.js" -Value $content -NoNewline

Write-Host "✅ Fixed all mascot instances in content.js" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to chrome://extensions/"
Write-Host "2. Click reload on LinguaSpark extension"
Write-Host "3. Refresh any webpage"
Write-Host "4. Ghost mascot should now appear!"
Write-Host ""
