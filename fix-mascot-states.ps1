# Fix Ghost Mascot States in content.js
# This script replaces all star SVG instances with the ghost mascot

Write-Host "Fixing ghost mascot states in content.js..." -ForegroundColor Cyan

$contentJs = "content.js"

# Read the mascot base64 from mascot.txt
$mascotBase64 = Get-Content "public/mascot.txt" -Raw

# Create the mascot HTML helper function to insert at the top of the file
$mascotHelper = @"

  // Helper function to get mascot HTML with animation state
  function getMascotHTML(state = 'idle') {
    const animations = {
      'idle': 'float 3s ease-in-out infinite',
      'reading': 'float 2s ease-in-out infinite, tilt 4s ease-in-out infinite',
      'thinking': 'sway 2s ease-in-out infinite',
      'success': 'bounce 0.6s ease-in-out',
      'error': 'sway 0.5s ease-in-out 3'
    };
    
    const glows = {
      'idle': 'none',
      'reading': '0 0 20px rgba(59, 130, 246, 0.5)',
      'thinking': '0 0 20px rgba(59, 130, 246, 0.6)',
      'success': '0 0 25px rgba(34, 197, 94, 0.7)',
      'error': '0 0 25px rgba(239, 68, 68, 0.7)'
    };

    return \`<img src="data:image/png;base64,$mascotBase64" 
      style="width: 48px; height: 48px; animation: \${animations[state] || animations.idle}; filter: drop-shadow(\${glows[state] || glows.idle}); border: 2px solid #2563eb; border-radius: 50%;" 
      alt="LinguaSpark" />\`;
  }

"@

# Read current content
$content = Get-Content $contentJs -Raw

# Check if helper function already exists
if ($content -match "function getMascotHTML") {
    Write-Host "Helper function already exists, removing old version..." -ForegroundColor Yellow
    $content = $content -replace "(?s)  // Helper function to get mascot HTML.*?}\s*\n", ""
}

# Insert helper function after the IIFE opening
$content = $content -replace "(\(\) => \{)", "`$1$mascotHelper"

# Replace initial button creation (keep the existing base64)
# This one is already correct, so we skip it

# Replace loading state (line ~494)
$content = $content -replace "(?s)// Show loading state\s+buttonInstance\.button\.style\.background = `"#1d4ed8`";\s+buttonInstance\.button\.innerHTML = ``[^``]+``;", @"
// Show loading state
      buttonInstance.button.style.background = "#1d4ed8";
      buttonInstance.button.innerHTML = getMascotHTML('reading');
"@

# Replace success state (line ~669)
$content = $content -replace "(?s)// Show success state\s+buttonInstance\.button\.style\.background = `"#16a34a`";\s+buttonInstance\.button\.innerHTML = ``[^``]+``;", @"
// Show success state
      buttonInstance.button.style.background = "#16a34a";
      buttonInstance.button.innerHTML = getMascotHTML('success');
"@

# Replace reset to idle state after success (line ~698)
$content = $content -replace "(?s)if \(buttonInstance\) \{\s+buttonInstance\.button\.style\.background = `"#2563eb`";\s+buttonInstance\.button\.innerHTML = ``\s+<svg width=`"32`" height=`"32`"[^``]+``;\s+\}", @"
if (buttonInstance) {
          buttonInstance.button.style.background = "#2563eb";
          buttonInstance.button.innerHTML = getMascotHTML('idle');
        }"@

# Replace error state (line ~711)
$content = $content -replace "(?s)if \(buttonInstance\) \{\s+buttonInstance\.button\.style\.background = `"#dc2626`";\s+buttonInstance\.button\.innerHTML = ``\s+<svg width=`"24`" height=`"24`"[^``]+``;\s+\}", @"
if (buttonInstance) {
        buttonInstance.button.style.background = "#dc2626";
        buttonInstance.button.innerHTML = getMascotHTML('error');
      }"@

# Replace reset to idle state after error (line ~720)
$content = $content -replace "(?s)setTimeout\(\(\) => \{\s+buttonInstance\.button\.style\.background = `"#2563eb`";\s+buttonInstance\.button\.innerHTML = ``\s+<svg width=`"32`" height=`"32`"[^``]+``;\s+\}", @"
setTimeout(() => {
          buttonInstance.button.style.background = "#2563eb";
          buttonInstance.button.innerHTML = getMascotHTML('idle');"@

# Write back
Set-Content -Path $contentJs -Value $content -NoNewline

Write-Host ""
Write-Host "✓ Fixed all mascot states in content.js" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Click RELOAD on LinguaSpark" -ForegroundColor White
Write-Host "3. Close all old tabs and open a new one" -ForegroundColor White
Write-Host "4. Test the button - it should show ghost in ALL states!" -ForegroundColor White
Write-Host ""
Write-Host "States to test:" -ForegroundColor Cyan
Write-Host "  • Idle: Gentle floating" -ForegroundColor White
Write-Host "  • Click: Reading animation (float + tilt)" -ForegroundColor White
Write-Host "  • Success: Bounce with green glow" -ForegroundColor White
Write-Host "  • Error: Sway with red glow" -ForegroundColor White
