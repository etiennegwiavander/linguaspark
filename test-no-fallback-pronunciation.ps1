# Unit test to verify NO fallback content in pronunciation section
# Verifies LinguaSpark's quality-first policy

Write-Host "Testing: No Fallback Content in Pronunciation Section" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Read the progressive generator file
$filePath = "lib/progressive-generator.ts"
$content = Get-Content $filePath -Raw

Write-Host "Analyzing: $filePath" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check for fallback pronunciation data patterns
Write-Host "Test 1: No Fallback Pronunciation Data" -ForegroundColor Cyan
$fallbackPatterns = @(
    'ipa:\s*`/\$\{word\}/`',
    'Practice saying.*slowly.*gradually increase speed',
    'The word.*is important in this context',
    'Create fallback pronunciation',
    'fallback pronunciation data'
)

$foundFallback = $false
foreach ($pattern in $fallbackPatterns) {
    if ($content -match $pattern) {
        Write-Host "  ✗ FAIL: Found fallback pattern: $pattern" -ForegroundColor Red
        $foundFallback = $true
        $testsFailed++
    }
}

if (-not $foundFallback) {
    Write-Host "  ✓ PASS: No fallback pronunciation data patterns found" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 2: Check for fallback tongue twister patterns
Write-Host "Test 2: No Fallback Tongue Twisters" -ForegroundColor Cyan
$twisterFallbackPatterns = @(
    'Practice pronunciation with these words:',
    'Repeat these challenging words clearly and slowly',
    'Create fallback tongue twisters',
    'fallback tongue twisters'
)

$foundTwisterFallback = $false
foreach ($pattern in $twisterFallbackPatterns) {
    if ($content -match [regex]::Escape($pattern)) {
        Write-Host "  ✗ FAIL: Found fallback tongue twister pattern: $pattern" -ForegroundColor Red
        $foundTwisterFallback = $true
        $testsFailed++
    }
}

if (-not $foundTwisterFallback) {
    Write-Host "  ✓ PASS: No fallback tongue twister patterns found" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 3: Verify error throwing instead of fallback
Write-Host "Test 3: Throws Errors Instead of Using Fallback" -ForegroundColor Cyan

# Check for proper error throwing in pronunciation word generation
if ($content -match 'Failed to generate pronunciation for word') {
    Write-Host "  ✓ PASS: Throws error for failed pronunciation word generation" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ✗ FAIL: Missing error throw for pronunciation word generation" -ForegroundColor Red
    $testsFailed++
}

# Check for proper error throwing in tongue twister generation
if ($content -match 'Failed to generate tongue twisters') {
    Write-Host "  ✓ PASS: Throws error for failed tongue twister generation" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ✗ FAIL: Missing error throw for tongue twister generation" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 4: Check for NO FALLBACK comments
Write-Host "Test 4: Proper No-Fallback Documentation" -ForegroundColor Cyan
if ($content -match 'NO FALLBACK CONTENT') {
    Write-Host "  ✓ PASS: Code documented with NO FALLBACK CONTENT policy" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ⚠ WARNING: Missing NO FALLBACK CONTENT documentation" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Verify no generic content strings
Write-Host "Test 5: No Generic Content Strings" -ForegroundColor Cyan
$genericPatterns = @(
    'Practice saying "\$\{word\}"',
    'important in this context',
    'Repeat these challenging words'
)

$foundGeneric = $false
foreach ($pattern in $genericPatterns) {
    if ($content -match $pattern) {
        Write-Host "  ✗ FAIL: Found generic content string: $pattern" -ForegroundColor Red
        $foundGeneric = $true
        $testsFailed++
    }
}

if (-not $foundGeneric) {
    Write-Host "  ✓ PASS: No generic content strings found" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 6: Check pronunciation section specifically for fallback CONTENT generation
Write-Host "Test 6: Pronunciation Section Fallback Content Check" -ForegroundColor Cyan

# Look for specific lines around pronunciation generation (lines 2150-2250)
$pronunciationLines = (Get-Content $filePath -TotalCount 2250) | Select-Object -Skip 2149

# Check for fallback content generation patterns (not just the word "fallback")
$hasFallbackContent = $false
$inFallbackBlock = $false
foreach ($line in $pronunciationLines) {
    # Check for actual fallback content patterns (not comments, not empty array declarations)
    if ($line -match 'pronunciationWords\.push\(' -and 
        $line -notmatch 'wordData' -and
        $line -notmatch '//' -and
        $line -match 'ipa:\s*`') {
        Write-Host "  ✗ FAIL: Found fallback pronunciation content generation: $line" -ForegroundColor Red
        $hasFallbackContent = $true
        $testsFailed++
        break
    }
    # Check for fallback tongue twister array with actual content (not empty declaration)
    if ($line -match 'tongueTwisters\s*=\s*\[' -and 
        $line -notmatch '\[\s*\]' -and
        $line -notmatch 'parseTongueTwisterResponse' -and
        $line -notmatch '//' -and
        $line -match '\{') {
        Write-Host "  ✗ FAIL: Found fallback tongue twister content: $line" -ForegroundColor Red
        $hasFallbackContent = $true
        $testsFailed++
        break
    }
}

if (-not $hasFallbackContent) {
    Write-Host "  ✓ PASS: No fallback content generation in pronunciation section" -ForegroundColor Green
    $testsPassed++
}

# Check for proper error throwing
$hasErrorThrows = $false
foreach ($line in $pronunciationLines) {
    if ($line -match 'throw new Error.*pronunciation|throw new Error.*tongue twister') {
        $hasErrorThrows = $true
        break
    }
}

if ($hasErrorThrows) {
    Write-Host "  ✓ PASS: Pronunciation section throws errors on failure" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ✗ FAIL: Pronunciation section missing error throws" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 7: Search for any remaining fallback-related code (excluding NO FALLBACK comments)
Write-Host "Test 7: Global Fallback Search" -ForegroundColor Cyan
$allFallbackMatches = Select-String -Path $filePath -Pattern "fallback" -CaseSensitive:$false

$pronunciationFallbacks = $allFallbackMatches | Where-Object { 
    ($_.Line -match "pronunciation" -or 
     $_.Line -match "tongue.*twister" -or
     ($_.LineNumber -ge 2100 -and $_.LineNumber -le 2300)) -and
    ($_.Line -notmatch "NO FALLBACK CONTENT") -and
    ($_.Line -notmatch "//.*NO FALLBACK")
}

if ($pronunciationFallbacks.Count -eq 0) {
    Write-Host "  ✓ PASS: No fallback code in pronunciation section (only policy comments)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  ✗ FAIL: Found $($pronunciationFallbacks.Count) fallback reference(s) in pronunciation section:" -ForegroundColor Red
    foreach ($match in $pronunciationFallbacks) {
        Write-Host "    Line $($match.LineNumber): $($match.Line.Trim())" -ForegroundColor Red
    }
    $testsFailed++
}
Write-Host ""

# Summary
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ SUCCESS: No fallback content found in pronunciation section" -ForegroundColor Green
    Write-Host "✓ Code follows LinguaSpark's quality-first policy" -ForegroundColor Green
    Write-Host "✓ Pronunciation section will fail gracefully instead of using generic content" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ FAILURE: Fallback content detected in pronunciation section" -ForegroundColor Red
    Write-Host "✗ Please remove all fallback content to maintain quality standards" -ForegroundColor Red
    exit 1
}
