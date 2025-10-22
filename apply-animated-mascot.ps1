# Apply Animated Mascot to Extension - Complete Solution

Write-Host "`n=== Applying Animated Mascot ===" -ForegroundColor Cyan

# Read base64
$base64 = Get-Content "public/mascot.txt" -Raw
$dataUrl = "data:image/png;base64,$base64"

Write-Host "Base64 loaded: $($base64.Length) characters" -ForegroundColor Gray

# Read content.js
$content = Get-Content "content.js" -Raw

# Find where to insert the mascot functions (after the initial comment)
$insertPoint = $content.IndexOf("console.log('[LinguaSpark] Content script loaded")

# Create the mascot helper functions
$mascotFunctions = @"

  // Mascot image data
  const MASCOT_BASE64 = '$dataUrl';
  
  // Create mascot HTML with state-specific styling
  function getMascotHTML(state = 'idle') {
    const animations = {
      idle: 'animation: float 3s ease-in-out infinite;',
      reading: 'animation: float 3s ease-in-out infinite, tilt 4s ease-in-out infinite;',
      thinking: 'animation: sway 2.5s ease-in-out infinite;',
      success: 'animation: bounce 1.5s ease-out;',
      error: 'animation: sway 2s ease-in-out infinite;'
    };
    
    const filters = {
      idle: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
      reading: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
      thinking: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
      success: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))',
      error: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.4))'
    };
    
    return ``<img src="`${MASCOT_BASE64}" width="64" height="64" alt="LinguaSpark mascot" style="border: 2px solid rgb(37, 99, 235); border-radius: 50%; pointer-events: none; user-select: none; `${animations[state] || animations.idle} filter: `${filters[state] || filters.idle};" />``;
  }

"@

# Insert the functions at the beginning
$content = $content.Insert($insertPoint, $mascotFunctions)

# Now replace all button.innerHTML instances

# 1. Initial button creation (line ~261)
$content = $content -replace '(?s)// Add ghost mascot.*?button\.innerHTML = `.*?`;', @'
// Add ghost mascot
      button.innerHTML = getMascotHTML('idle');
'@

# 2. Loading state
$content = $content -replace '(?s)// Show loading state\s*buttonInstance\.button\.style\.background = "#1d4ed8";\s*buttonInstance\.button\.innerHTML = `.*?`;', @'
// Show loading state
      buttonInstance.button.style.background = '#1d4ed8';
      buttonInstance.button.innerHTML = getMascotHTML('reading');
'@

# 3. Success state
$content = $content -replace '(?s)// Show success state\s*buttonInstance\.button\.style\.background = "#16a34a";\s*buttonInstance\.button\.innerHTML = `.*?`;', @'
// Show success state
      buttonInstance.button.style.background = '#16a34a';
      buttonInstance.button.innerHTML = getMascotHTML('success');
'@

# 4. Error state
$content = $content -replace '(?s)buttonInstance\.button\.style\.background = "#dc2626";\s*buttonInstance\.button\.innerHTML = `.*?`;', @'
buttonInstance.button.style.background = '#dc2626';
        buttonInstance.button.innerHTML = getMascotHTML('error');
'@

# 5. Reset to idle (after success/error)
$content = $content -replace 'buttonInstance\.button\.style\.background = "#2563eb";\s*buttonInstance\.button\.innerHTML = `[^`]*`;', @'
buttonInstance.button.style.background = '#2563eb';
          buttonInstance.button.innerHTML = getMascotHTML('idle');
'@

# Write back
Set-Content "content.js" -Value $content -NoNewline

Write-Host "✅ Applied animated mascot to content.js" -ForegroundColor Green
Write-Host "`nStates configured:" -ForegroundColor Cyan
Write-Host "  ✓ Idle - gentle floating" -ForegroundColor White
Write-Host "  ✓ Reading - focused with tilt" -ForegroundColor White
Write-Host "  ✓ Thinking - sway animation" -ForegroundColor White
Write-Host "  ✓ Success - celebratory bounce" -ForegroundColor White
Write-Host "  ✓ Error - concerned sway" -ForegroundColor White
Write-Host "`nNext: Reload extension and test!" -ForegroundColor Green
Write-Host ""
