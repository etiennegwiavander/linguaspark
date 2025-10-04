#!/usr/bin/env pwsh

# Test script for Usage Monitor System
# Tests all functionality including logging, reporting, and metrics

Write-Host "=== Usage Monitor System Test ===" -ForegroundColor Cyan
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

# Test 1: Get initial status
Write-Host "1. Getting initial status..." -ForegroundColor Yellow
$status = Invoke-TestApi -Method "GET"
if ($status -and $status.success) {
    Write-Host "✓ Initial counts - Usage: $($status.currentCounts.usage), Errors: $($status.currentCounts.errors), Optimizations: $($status.currentCounts.optimizations)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to get initial status" -ForegroundColor Red
    exit 1
}

# Test 2: Log token usage
Write-Host ""
Write-Host "2. Testing token usage logging..." -ForegroundColor Yellow
$tokenTest = Invoke-TestApi -Body @{
    action = "logTokenUsage"
    section = "vocabulary"
    tokens = 150
    optimization = "keyword-extraction"
}
if ($tokenTest -and $tokenTest.success) {
    Write-Host "✓ Token usage logged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to log token usage" -ForegroundColor Red
}

# Test 3: Log error
Write-Host ""
Write-Host "3. Testing error logging..." -ForegroundColor Yellow
$errorTest = Invoke-TestApi -Body @{
    action = "logError"
    errorType = "AI_GENERATION_FAILED"
    errorMessage = "Test AI generation timeout"
}
if ($errorTest -and $errorTest.success) {
    Write-Host "✓ Error logged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to log error" -ForegroundColor Red
}

# Test 4: Log optimization savings
Write-Host ""
Write-Host "4. Testing optimization savings logging..." -ForegroundColor Yellow
$optimizationTest = Invoke-TestApi -Body @{
    action = "logOptimization"
    baseline = 300
    optimized = 200
    strategy = "prompt-compression"
}
if ($optimizationTest -and $optimizationTest.success) {
    Write-Host "✓ Optimization savings logged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to log optimization savings" -ForegroundColor Red
}

# Test 5: Simulate multiple usage entries
Write-Host ""
Write-Host "5. Simulating multiple lesson generations..." -ForegroundColor Yellow
$simulationTest = Invoke-TestApi -Body @{
    action = "simulateUsage"
}
if ($simulationTest -and $simulationTest.success) {
    Write-Host "✓ Simulated $($simulationTest.sectionsGenerated) lesson sections" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to simulate usage" -ForegroundColor Red
}

# Test 6: Get updated log counts
Write-Host ""
Write-Host "6. Checking updated log counts..." -ForegroundColor Yellow
$countsTest = Invoke-TestApi -Body @{
    action = "getLogCounts"
}
if ($countsTest -and $countsTest.success) {
    Write-Host "✓ Updated counts - Usage: $($countsTest.counts.usage), Errors: $($countsTest.counts.errors), Optimizations: $($countsTest.counts.optimizations)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to get log counts" -ForegroundColor Red
}

# Test 7: Generate usage report
Write-Host ""
Write-Host "7. Generating usage report..." -ForegroundColor Yellow
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
    
    if ($report.topOptimizationStrategies.Count -gt 0) {
        Write-Host "  - Top Optimization Strategy: $($report.topOptimizationStrategies[0].strategy)" -ForegroundColor Cyan
    }
} else {
    Write-Host "✗ Failed to generate usage report" -ForegroundColor Red
}

# Test 8: Get lesson metrics
Write-Host ""
Write-Host "8. Testing lesson metrics retrieval..." -ForegroundColor Yellow
$metricsTest = Invoke-TestApi -Body @{
    action = "getLessonMetrics"
    lessonId = "test-lesson-456"
}
if ($metricsTest -and $metricsTest.success) {
    if ($metricsTest.metrics) {
        Write-Host "✓ Lesson metrics retrieved:" -ForegroundColor Green
        Write-Host "  - Total Tokens: $($metricsTest.metrics.totalTokens)" -ForegroundColor Cyan
        Write-Host "  - Optimization Savings: $($metricsTest.metrics.optimizationSavings)" -ForegroundColor Cyan
        Write-Host "  - Generation Time: $($metricsTest.metrics.generationTime)ms" -ForegroundColor Cyan
    } else {
        Write-Host "✓ No metrics found for lesson (expected for new lesson ID)" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Failed to get lesson metrics" -ForegroundColor Red
}

# Test 9: Test log clearing
Write-Host ""
Write-Host "9. Testing log clearing (30+ days old)..." -ForegroundColor Yellow
$clearTest = Invoke-TestApi -Body @{
    action = "clearOldLogs"
    days = 30
}
if ($clearTest -and $clearTest.success) {
    Write-Host "✓ Old logs cleared successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to clear old logs" -ForegroundColor Red
}

# Final status check
Write-Host ""
Write-Host "10. Final status check..." -ForegroundColor Yellow
$finalStatus = Invoke-TestApi -Method "GET"
if ($finalStatus -and $finalStatus.success) {
    Write-Host "✓ Final counts - Usage: $($finalStatus.currentCounts.usage), Errors: $($finalStatus.currentCounts.errors), Optimizations: $($finalStatus.currentCounts.optimizations)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to get final status" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Usage Monitor Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The usage monitoring system provides:" -ForegroundColor White
Write-Host "• Token consumption tracking per lesson section" -ForegroundColor Gray
Write-Host "• Error logging with detailed context" -ForegroundColor Gray
Write-Host "• Optimization savings measurement" -ForegroundColor Gray
Write-Host "• Comprehensive usage reporting" -ForegroundColor Gray
Write-Host "• Lesson-specific metrics retrieval" -ForegroundColor Gray
Write-Host "• Automatic log management and cleanup" -ForegroundColor Gray