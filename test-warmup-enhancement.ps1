# Test Enhanced Warm-up Generation
# Tests the level-specific warm-up prompt builder implementation

Write-Host "🧪 Testing Enhanced Warm-up Generation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test the enhanced warm-up generation endpoint
Write-Host "📤 Sending test request to /api/test-warmup-enhancement..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-warmup-enhancement" `
        -Method POST `
        -ContentType "application/json" `
        -TimeoutSec 120

    Write-Host ""
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Display results for each level
    foreach ($result in $response.results) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "📊 Level: $($result.level)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Questions Generated: $($result.questionCount)" -ForegroundColor White
        Write-Host "Expected Complexity: $($result.expectedComplexity)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Generated Questions:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $result.questions.Count; $i++) {
            Write-Host "  $($i + 1). $($result.questions[$i])" -ForegroundColor White
        }
        Write-Host ""
        
        Write-Host "Validation Results:" -ForegroundColor Yellow
        Write-Host "  ✓ Ends with '?': $($result.validation.endsWithQuestionMark)" -ForegroundColor $(if ($result.validation.endsWithQuestionMark) { "Green" } else { "Red" })
        Write-Host "  ✓ No proper names: $(-not $result.validation.hasProperNames)" -ForegroundColor $(if (-not $result.validation.hasProperNames) { "Green" } else { "Red" })
        Write-Host "  ✓ No specific events: $(-not $result.validation.referencesSpecificEvents)" -ForegroundColor $(if (-not $result.validation.referencesSpecificEvents) { "Green" } else { "Red" })
        Write-Host "  Average length: $($result.validation.averageLength) characters" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📈 Summary" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total Tests: $($response.summary.totalTests)" -ForegroundColor White
    Write-Host "All Passed: $($response.summary.allPassed)" -ForegroundColor $(if ($response.summary.allPassed) { "Green" } else { "Red" })
    Write-Host ""
    
    if ($response.summary.allPassed) {
        Write-Host "✅ All validation checks passed!" -ForegroundColor Green
        Write-Host "✅ Level-specific warm-up prompt builder is working correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some validation checks failed" -ForegroundColor Yellow
        Write-Host "Review the results above for details" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Development server is running (npm run dev)" -ForegroundColor Yellow
    Write-Host "  2. Google AI API key is configured in .env.local" -ForegroundColor Yellow
    Write-Host "  3. All dependencies are installed" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Test script completed!" -ForegroundColor Green
