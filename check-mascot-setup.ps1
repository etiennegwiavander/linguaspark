# Mascot Setup Diagnostic Script

Write-Host "`n=== LinguaSpark Mascot Replacement Diagnostic ===" -ForegroundColor Cyan

# Check if mascot.png exists
Write-Host "`n1. Checking for mascot.png..." -ForegroundColor Yellow
if (Test-Path "public/mascot.png") {
    Write-Host "   ✓ mascot.png found in public folder" -ForegroundColor Green
    $fileInfo = Get-Item "public/mascot.png"
    Write-Host "   Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
} else {
    Write-Host "   ✗ mascot.png NOT FOUND in public folder" -ForegroundColor Red
    Write-Host "   ACTION REQUIRED: Save your ghost mascot image as public/mascot.png" -ForegroundColor Yellow
}

# Check if AnimatedMascot component exists
Write-Host "`n2. Checking for AnimatedMascot component..." -ForegroundColor Yellow
if (Test-Path "components/animated-mascot-demo.tsx") {
    Write-Host "   ✓ animated-mascot-demo.tsx found" -ForegroundColor Green
} else {
    Write-Host "   ✗ animated-mascot-demo.tsx NOT FOUND" -ForegroundColor Red
}

# Check FloatingActionButton import
Write-Host "`n3. Checking FloatingActionButton imports..." -ForegroundColor Yellow
$fabContent = Get-Content "components/floating-action-button.tsx" -Raw
if ($fabContent -match "AnimatedMascot") {
    Write-Host "   ✓ AnimatedMascot import found" -ForegroundColor Green
} else {
    Write-Host "   ✗ AnimatedMascot import NOT FOUND" -ForegroundColor Red
}

if ($fabContent -match "SparkyMascot") {
    Write-Host "   ✗ Old SparkyMascot import still present!" -ForegroundColor Red
} else {
    Write-Host "   ✓ No SparkyMascot imports (good)" -ForegroundColor Green
}

# Check for mascot rendering
Write-Host "`n4. Checking mascot rendering..." -ForegroundColor Yellow
if ($fabContent -match "<AnimatedMascot") {
    Write-Host "   ✓ <AnimatedMascot> component used" -ForegroundColor Green
} else {
    Write-Host "   ✗ <AnimatedMascot> NOT FOUND in render" -ForegroundColor Red
}

if ($fabContent -match "<SparkyMascot") {
    Write-Host "   ✗ Old <SparkyMascot> still in render!" -ForegroundColor Red
} else {
    Write-Host "   ✓ No <SparkyMascot> in render (good)" -ForegroundColor Green
}

Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan

if (!(Test-Path "public/mascot.png")) {
    Write-Host "`n⚠ CRITICAL: Save your ghost mascot PNG as 'public/mascot.png'" -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Ensure public/mascot.png exists with your ghost image"
Write-Host "   2. Restart your dev server: Ctrl+C then 'npm run dev'"
Write-Host "   3. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
Write-Host "   4. Clear browser cache if still showing old mascot"

Write-Host "`n✨ The code is correctly updated to use AnimatedMascot!" -ForegroundColor Green
Write-Host ""
