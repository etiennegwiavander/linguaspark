# Test Quality Validation Integration
# Tests that validators are properly integrated with regeneration logic and metrics tracking

Write-Host "🧪 Testing Quality Validation Integration..." -ForegroundColor Cyan
Write-Host ""

$url = "http://localhost:3000/api/test-quality-validation"

Write-Host "📡 Sending request to: $url" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Test PASSED" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📊 Quality Metrics:" -ForegroundColor Cyan
        Write-Host "  Overall Score: $($response.qualityMetrics.overallScore)/100" -ForegroundColor White
        Write-Host "  Total Time: $($response.qualityMetrics.totalGenerationTime)" -ForegroundColor White
        Write-Host "  Total Regenerations: $($response.qualityMetrics.totalRegenerations)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📋 Section Details:" -ForegroundColor Cyan
        foreach ($section in $response.qualityMetrics.sections) {
            $status = if ($section.regenerated) { "🔄" } else { "✅" }
            Write-Host "  $status $($section.name):" -ForegroundColor White
            Write-Host "     Score: $($section.score)/100" -ForegroundColor Gray
            Write-Host "     Attempts: $($section.attempts)" -ForegroundColor Gray
            Write-Host "     Time: $($section.time)" -ForegroundColor Gray
            Write-Host "     Issues: $($section.issues), Warnings: $($section.warnings)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "🎯 Test Results:" -ForegroundColor Cyan
        Write-Host "  Warmup: $($response.testResults.warmup.questionCount) questions generated" -ForegroundColor White
        Write-Host "  Vocabulary: $($response.testResults.vocabulary.wordCount) words generated" -ForegroundColor White
        Write-Host "  Discussion: $($response.testResults.discussion.questionCount) questions generated" -ForegroundColor White
        Write-Host "  Grammar: Focus on '$($response.testResults.grammar.focus)'" -ForegroundColor White
        Write-Host ""
        
        Write-Host "✨ All validators integrated successfully!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Test FAILED" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
        if ($response.stack) {
            Write-Host ""
            Write-Host "Stack trace:" -ForegroundColor Yellow
            Write-Host $response.stack -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Request failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the development server is running (npm run dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
