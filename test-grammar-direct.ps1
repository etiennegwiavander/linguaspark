# Direct test for grammar generation (no auth required)
Write-Host "🧪 Testing Grammar Generation (Direct)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Calling test endpoint..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test-grammar-generation" `
        -Method GET `
        -TimeoutSec 60 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "✅ TEST PASSED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Results:" -ForegroundColor Cyan
        Write-Host "   Duration: $($result.duration)" -ForegroundColor White
        Write-Host "   Response Length: $($result.responseLength) chars" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Grammar Data:" -ForegroundColor Cyan
        Write-Host "   Grammar Point: $($result.grammarData.grammarPoint)" -ForegroundColor White
        Write-Host "   Has Explanation: $($result.grammarData.hasExplanation)" -ForegroundColor White
        Write-Host "   Examples: $($result.grammarData.examplesCount)" -ForegroundColor White
        Write-Host "   Exercises: $($result.grammarData.exercisesCount)" -ForegroundColor White
        Write-Host ""
        
        # Validate completeness
        $issues = @()
        if (-not $result.grammarData.hasExplanation) {
            $issues += "Missing explanation"
        }
        if ($result.grammarData.examplesCount -lt 3) {
            $issues += "Insufficient examples (expected 3, got $($result.grammarData.examplesCount))"
        }
        if ($result.grammarData.exercisesCount -lt 3) {
            $issues += "Insufficient exercises (expected 3, got $($result.grammarData.exercisesCount))"
        }
        
        if ($issues.Count -gt 0) {
            Write-Host "⚠️ Quality Issues:" -ForegroundColor Yellow
            $issues | ForEach-Object {
                Write-Host "   • $_" -ForegroundColor Yellow
            }
            Write-Host ""
            Write-Host "⚠️ TEST PASSED WITH WARNINGS" -ForegroundColor Yellow
        } else {
            Write-Host "✅ All quality checks passed!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎯 Grammar section is complete and valid" -ForegroundColor Green
        }
        
        # Show full grammar point
        Write-Host ""
        Write-Host "📖 Full Grammar Response:" -ForegroundColor Cyan
        Write-Host ($result.fullResponse | ConvertTo-Json -Depth 10) -ForegroundColor Gray
        
    } else {
        Write-Host "❌ TEST FAILED" -ForegroundColor Red
        Write-Host "Error: $($result.error)" -ForegroundColor Red
        if ($result.code) {
            Write-Host "Code: $($result.code)" -ForegroundColor Red
        }
        exit 1
    }
    
} catch {
    Write-Host "❌ Request failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ""
            Write-Host "📄 Error Details:" -ForegroundColor Yellow
            Write-Host ($errorDetails | ConvertTo-Json -Depth 5) -ForegroundColor Red
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "❌ TEST FAILED" -ForegroundColor Red
    exit 1
}

Write-Host ""
