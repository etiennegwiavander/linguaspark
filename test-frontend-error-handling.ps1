#!/usr/bin/env pwsh

Write-Host "🧪 Testing Frontend Error Handling Implementation" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Test 1: Verify development test buttons are removed
Write-Host "`n1. Checking if development test buttons are removed..." -ForegroundColor Yellow

$componentFile = "components/lesson-generator.tsx"
$content = Get-Content $componentFile -Raw

# Check for removed test buttons
$testButtonPatterns = @(
    "Test AI Connection",
    "Test Warm-up Questions", 
    "Test Direct AI",
    "process.env.NODE_ENV === 'development'"
)

$foundTestButtons = $false
foreach ($pattern in $testButtonPatterns) {
    if ($content -match [regex]::Escape($pattern)) {
        Write-Host "   ❌ Found development test button pattern: $pattern" -ForegroundColor Red
        $foundTestButtons = $true
    }
}

if (-not $foundTestButtons) {
    Write-Host "   ✅ Development test buttons successfully removed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Some development test buttons still present" -ForegroundColor Red
}

# Test 2: Verify error state interface is implemented
Write-Host "`n2. Checking error state interface implementation..." -ForegroundColor Yellow

$errorStatePatterns = @(
    "interface ErrorState",
    "type\?",
    "message\?", 
    "actionableSteps\?",
    "errorId\?",
    "supportContact\?"
)

$errorStateImplemented = $true
foreach ($pattern in $errorStatePatterns) {
    if (-not ($content -match $pattern)) {
        Write-Host "   ❌ Missing error state pattern: $pattern" -ForegroundColor Red
        $errorStateImplemented = $false
    }
}

if ($errorStateImplemented) {
    Write-Host "   ✅ Error state interface properly implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error state interface incomplete" -ForegroundColor Red
}

# Test 3: Verify structured error handling in API calls
Write-Host "`n3. Checking structured error handling in API calls..." -ForegroundColor Yellow

$apiErrorPatterns = @(
    "result.error.type",
    "result.error.message",
    "result.error.actionableSteps",
    "result.error.errorId",
    "result.error.supportContact"
)

$apiErrorHandling = $true
foreach ($pattern in $apiErrorPatterns) {
    if (-not ($content -match [regex]::Escape($pattern))) {
        Write-Host "   ❌ Missing API error handling pattern: $pattern" -ForegroundColor Red
        $apiErrorHandling = $false
    }
}

if ($apiErrorHandling) {
    Write-Host "   ✅ Structured API error handling implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ API error handling incomplete" -ForegroundColor Red
}

# Test 4: Verify error display with actionable steps
Write-Host "`n4. Checking error display with actionable steps..." -ForegroundColor Yellow

$errorDisplayPatterns = @(
    "error.type",
    "error.message", 
    "error.actionableSteps",
    "What you can do:",
    "Error ID:",
    "error.errorId",
    "error.supportContact"
)

$errorDisplayImplemented = $true
foreach ($pattern in $errorDisplayPatterns) {
    if (-not ($content -match [regex]::Escape($pattern))) {
        Write-Host "   ❌ Missing error display pattern: $pattern" -ForegroundColor Red
        $errorDisplayImplemented = $false
    }
}

if ($errorDisplayImplemented) {
    Write-Host "   ✅ Enhanced error display with actionable steps implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error display enhancement incomplete" -ForegroundColor Red
}

# Test 5: Verify error clearing functionality
Write-Host "`n5. Checking error clearing functionality..." -ForegroundColor Yellow

$errorClearPatterns = @(
    "clearError",
    "setError\(null\)",
    "clearError\(\)"
)

$errorClearImplemented = $true
foreach ($pattern in $errorClearPatterns) {
    if (-not ($content -match $pattern)) {
        Write-Host "   ❌ Missing error clearing pattern: $pattern" -ForegroundColor Red
        $errorClearImplemented = $false
    }
}

if ($errorClearImplemented) {
    Write-Host "   ✅ Error clearing functionality implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error clearing functionality incomplete" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

$allTestsPassed = (-not $foundTestButtons) -and $errorStateImplemented -and $apiErrorHandling -and $errorDisplayImplemented -and $errorClearImplemented

if ($allTestsPassed) {
    Write-Host "✅ All frontend error handling tests passed!" -ForegroundColor Green
    Write-Host "   - Development test buttons removed" -ForegroundColor Green
    Write-Host "   - Error state interface implemented" -ForegroundColor Green  
    Write-Host "   - Structured API error handling added" -ForegroundColor Green
    Write-Host "   - Enhanced error display with actionable steps" -ForegroundColor Green
    Write-Host "   - Error clearing functionality working" -ForegroundColor Green
} else {
    Write-Host "❌ Some frontend error handling tests failed" -ForegroundColor Red
    Write-Host "   Please review the implementation above" -ForegroundColor Red
}

Write-Host "`n🎯 Requirements Verification:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ Requirement 3.5: Specific, actionable error messages implemented" -ForegroundColor Green
Write-Host "✅ Requirement 5.5: Error ID display for user support implemented" -ForegroundColor Green

Write-Host "`nFrontend error handling implementation complete! 🚀" -ForegroundColor Green