# Manual Testing Validation Script
# This script helps prepare for and verify manual testing

Write-Host "=== LinguaSpark Manual Testing Validation ===" -ForegroundColor Cyan
Write-Host ""

# Check if development server is running
Write-Host "Checking development environment..." -ForegroundColor Yellow

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "[✓] .env.local file found" -ForegroundColor Green
    
    # Check for required environment variables
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_GOOGLE_AI_API_KEY") {
        Write-Host "[✓] Google AI API key configured" -ForegroundColor Green
    } else {
        Write-Host "[✗] Google AI API key not found in .env.local" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL") {
        Write-Host "[✓] Supabase URL configured" -ForegroundColor Green
    } else {
        Write-Host "[✗] Supabase URL not found in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "[✗] .env.local file not found" -ForegroundColor Red
    Write-Host "    Run setup-env.ps1 to create it" -ForegroundColor Yellow
}

Write-Host ""

# Check if key files exist
Write-Host "Checking implementation files..." -ForegroundColor Yellow

$filesToCheck = @(
    "lib/progressive-generator.ts",
    "lib/export-utils.ts",
    "app/api/generate-lesson-stream/route.ts",
    "components/lesson-generator.tsx",
    "MANUAL_TESTING_GUIDE.md"
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "[✓] $file exists" -ForegroundColor Green
    } else {
        Write-Host "[✗] $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "[✓] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[✗] Dependencies not installed" -ForegroundColor Red
    Write-Host "    Run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Manual Testing Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open the manual testing guide:" -ForegroundColor White
Write-Host "   MANUAL_TESTING_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Follow the test procedures in the guide" -ForegroundColor White
Write-Host ""
Write-Host "4. Key areas to test:" -ForegroundColor White
Write-Host "   - Progress tracking during lesson generation" -ForegroundColor Gray
Write-Host "   - Word export markdown stripping" -ForegroundColor Gray
Write-Host "   - PDF/Word export consistency" -ForegroundColor Gray
Write-Host "   - Error handling and edge cases" -ForegroundColor Gray
Write-Host ""

# Check if Chrome extension files exist
Write-Host "Checking Chrome extension files..." -ForegroundColor Yellow

$extensionFiles = @(
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.js"
)

$extensionComplete = $true
foreach ($file in $extensionFiles) {
    if (Test-Path $file) {
        Write-Host "[✓] $file exists" -ForegroundColor Green
    } else {
        Write-Host "[✗] $file missing" -ForegroundColor Red
        $extensionComplete = $false
    }
}

if ($extensionComplete) {
    Write-Host ""
    Write-Host "Chrome Extension Testing:" -ForegroundColor Cyan
    Write-Host "1. Load extension in Chrome (chrome://extensions/)" -ForegroundColor White
    Write-Host "2. Enable Developer mode" -ForegroundColor White
    Write-Host "3. Click 'Load unpacked' and select this directory" -ForegroundColor White
    Write-Host "4. Test content extraction with Sparky button" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Quick Test Commands ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run automated tests:" -ForegroundColor White
Write-Host "  npm test -- --run" -ForegroundColor Gray
Write-Host ""
Write-Host "Run specific test suites:" -ForegroundColor White
Write-Host "  npm test progress-tracking-integration.test.ts -- --run" -ForegroundColor Gray
Write-Host "  npm test markdown-stripping-integration.test.ts -- --run" -ForegroundColor Gray
Write-Host "  npm test export-consistency.test.ts -- --run" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Ready for Manual Testing ===" -ForegroundColor Green
Write-Host ""
Write-Host "Open MANUAL_TESTING_GUIDE.md and follow the test procedures." -ForegroundColor White
Write-Host ""
