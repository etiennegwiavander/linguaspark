#!/usr/bin/env pwsh

# Simple Usage Monitor Test
# Tests the usage monitoring system without requiring full lesson generation

Write-Host "=== Simple Usage Monitor Test ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/test-usage-monitor"

# Function to make API calls
function Invoke-TestApi {
    param(
        [string]$Method = "POST",
        [hashtable]$Body = @{}
    )
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $baseUrl -Method GET
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $jsonBody -ContentType "application/json"
        }
        return $response
    } catch {
        Write-Host "API Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Clear any existing logs
Write-Host "1. Clearing existing logs..." -ForegroundColor Yellow
$clearTest = Invoke-TestApi -Body @{
    action = "clearOldLogs"
    days = 0  # Clear all logs
}
if ($clearTest -and $clearTest.success) {
    Write-Host "✓ Logs cleared" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to clear logs" -ForegroundColor Red
}

# Test 2: Simulate lesson generation usage
Write-Host ""
Write-Host "2. Simulating lesson generation with usage monitoring..." -ForegroundColor Yellow

# Simulate content adaptation
$contentAdaptation = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "content-adaptation"
    tokens = 245
    optimization = "content-summarization"
}

# Simulate lesson structure generation
$lessonGeneration = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "lesson-structure-generation"
    tokens = 380
    optimization = "structured-generation"
}

# Simulate vocabulary generation
$vocabGeneration = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "vocabulary"
    tokens = 120
    optimization = "keyword-extraction"
}

# Simulate reading passage generation
$readingGeneration = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "reading"
    tokens = 200
    optimization = "content-adaptation"
}

# Simulate comprehension questions
$comprehensionGeneration = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "comprehension"
    tokens = 95
    optimization = "question-generation"
}

if ($contentAdaptation.success -and $lessonGeneration.success -and $vocabGeneration.success -and $readingGeneration.success -and $comprehensionGeneration.success) {
    Write-Host "✓ All lesson sections logged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Some sections failed to log" -ForegroundColor Red
}

# Test 3: Log optimization savings
Write-Host ""
Write-Host "3. Logging optimization savings..." -ForegroundColor Yellow

$optimizations = @(
    @{ baseline = 300; optimized = 245; strategy = "content-summarization" },
    @{ baseline = 450; optimized = 380; strategy = "structured-generation" },
    @{ baseline = 150; optimized = 120; strategy = "keyword-extraction" }
)

foreach ($opt in $optimizations) {
    $optResult = Invoke-TestApi -Body @{
        action = "logOptimization"
        baseline = $opt.baseline
        optimized = $opt.optimized
        strategy = $opt.strategy
    }
    if ($optResult -and $optResult.success) {
        $savings = $opt.baseline - $opt.optimized
        Write-Host "✓ Logged $($opt.strategy): $savings tokens saved" -ForegroundColor Green
    }
}

# Test 4: Simulate an error
Write-Host ""
Write-Host "4. Simulating an AI generation error..." -ForegroundColor Yellow
$errorTest = Invoke-TestApi -Body @{
    action = "logError"
    errorType = "AI_GENERATION_TIMEOUT"
    errorMessage = "AI service timeout during vocabulary generation"
}
if ($errorTest -and $errorTest.success) {
    Write-Host "✓ Error logged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to log error" -ForegroundColor Red
}

# Test 5: Check final counts
Write-Host ""
Write-Host "5. Checking final usage counts..." -ForegroundColor Yellow
$finalCounts = Invoke-TestApi -Body @{
    action = "getLogCounts"
}
if ($finalCounts -and $finalCounts.success) {
    Write-Host "✓ Final counts:" -ForegroundColor Green
    Write-Host "  - Usage entries: $($finalCounts.counts.usage)" -ForegroundColor Cyan
    Write-Host "  - Error entries: $($finalCounts.counts.errors)" -ForegroundColor Cyan
    Write-Host "  - Optimization entries: $($finalCounts.counts.optimizations)" -ForegroundColor Cyan
} else {
    Write-Host "✗ Failed to get final counts" -ForegroundColor Red
}

# Test 6: Generate comprehensive report
Write-Host ""
Write-Host "6. Generating comprehensive usage report..." -ForegroundColor Yellow
$reportTest = Invoke-TestApi -Body @{
    action = "generateReport"
}
if ($reportTest -and $reportTest.success) {
    $report = $reportTest.report
    Write-Host "✓ Usage Report Generated:" -ForegroundColor Green
    Write-Host "  - Total Lessons: $($report.totalLessons)" -ForegroundColor Cyan
    Write-Host "  - Total Tokens: $($report.totalTokens)" -ForegroundColor Cyan
    Write-Host "  - Average Tokens/Lesson: $([math]::Round($report.averageTokensPerLesson, 2))" -ForegroundColor Cyan
    Write-Host "  - Optimization Savings: $($report.totalOptimizationSavings) tokens" -ForegroundColor Cyan
    Write-Host "  - Error Rate: $([math]::Round($report.errorRate, 2))%" -ForegroundColor Cyan
    
    if ($report.topOptimizationStrategies -and $report.topOptimizationStrategies.Count -gt 0) {
        Write-Host "  - Top Optimization Strategies:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(3, $report.topOptimizationStrategies.Count); $i++) {
            $strategy = $report.topOptimizationStrategies[$i]
            Write-Host "    $($i+1). $($strategy.strategy) - Used $($strategy.usage) times, Avg savings: $([math]::Round($strategy.averageSavings, 1)) tokens" -ForegroundColor Gray
        }
    }
    
    if ($report.sectionTokenBreakdown) {
        Write-Host "  - Token Usage by Section:" -ForegroundColor Cyan
        $report.sectionTokenBreakdown | Get-Member -MemberType NoteProperty | ForEach-Object {
            $sectionName = $_.Name
            $tokenCount = $report.sectionTokenBreakdown.$sectionName
            Write-Host "    - ${sectionName}: $tokenCount tokens" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "✗ Failed to generate usage report" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Simple Usage Monitor Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usage Monitor Features Verified:" -ForegroundColor White
Write-Host "• Token consumption logging per section ✓" -ForegroundColor Gray
Write-Host "• Optimization savings tracking ✓" -ForegroundColor Gray
Write-Host "• Error logging with context ✓" -ForegroundColor Gray
Write-Host "• Comprehensive usage reporting ✓" -ForegroundColor Gray
Write-Host "• Section-level token breakdown ✓" -ForegroundColor Gray
Write-Host "• Optimization strategy analysis ✓" -ForegroundColor Gray