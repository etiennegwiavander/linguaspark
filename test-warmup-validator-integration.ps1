#!/usr/bin/env pwsh

Write-Host "🧪 Testing Warmup Validator Integration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test the warmup validator integration
Write-Host "📡 Calling test endpoint..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-warmup-validator" -Method Get

Write-Host ""
Write-Host "✅ Test Results:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host ""

if ($response.success) {
    Write-Host "✓ Success: $($response.message)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Context:" -ForegroundColor Cyan
    Write-Host "  Level: $($response.context.level)" -ForegroundColor White
    Write-Host "  Themes: $($response.context.themes -join ', ')" -ForegroundColor White
    Write-Host "  Vocabulary: $($response.context.vocabulary -join ', ')" -ForegroundColor White
    Write-Host ""
    
    Write-Host "❓ Generated Warmup Questions:" -ForegroundColor Cyan
    $questionNum = 1
    foreach ($question in $response.warmup.questions) {
        Write-Host "  $questionNum. $question" -ForegroundColor White
        $questionNum++
    }
    Write-Host ""
    
    Write-Host "✓ Question Count: $($response.warmup.questionCount)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔍 Validation:" -ForegroundColor Cyan
    Write-Host "  $($response.validation.message)" -ForegroundColor White
    Write-Host "  Note: $($response.validation.note)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Test failed: $($response.error)" -ForegroundColor Red
    if ($response.stack) {
        Write-Host ""
        Write-Host "Stack trace:" -ForegroundColor Yellow
        Write-Host $response.stack -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "💡 Check the server console for detailed validation logs including:" -ForegroundColor Yellow
Write-Host "   - Validation score (0-100)" -ForegroundColor Gray
Write-Host "   - Any validation issues or warnings" -ForegroundColor Gray
Write-Host "   - Regeneration attempts if validation failed" -ForegroundColor Gray
