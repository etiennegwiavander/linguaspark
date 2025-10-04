#!/usr/bin/env pwsh

Write-Host "🧪 Testing Google AI Optimization Features" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test the Google AI optimization endpoint
Write-Host "`n📡 Testing Google AI optimization endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-google-ai-optimization" -Method POST -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Google AI optimization test passed!" -ForegroundColor Green
        
        Write-Host "`n📊 Test Results:" -ForegroundColor Cyan
        Write-Host "  Summary Generated: $($response.results.summaryGenerated)" -ForegroundColor White
        Write-Host "  Translation Generated: $($response.results.translationGenerated)" -ForegroundColor White
        Write-Host "  Batch Requests Processed: $($response.results.batchProcessed)" -ForegroundColor White
        Write-Host "  Usage Tracking: $($response.results.usageTracked)" -ForegroundColor White
        Write-Host "  Error Handling: $($response.results.errorHandlingWorking)" -ForegroundColor White
        
        Write-Host "`n📈 Usage Statistics:" -ForegroundColor Cyan
        Write-Host "  Total Lessons: $($response.usageReport.totalLessons)" -ForegroundColor White
        Write-Host "  Total Tokens: $($response.usageReport.totalTokens)" -ForegroundColor White
        Write-Host "  Average Tokens/Lesson: $([math]::Round($response.usageReport.averageTokensPerLesson, 2))" -ForegroundColor White
        Write-Host "  Optimization Savings: $($response.usageReport.optimizationSavings)" -ForegroundColor White
        
        Write-Host "`n🎉 All optimization features are working correctly!" -ForegroundColor Green
    } else {
        Write-Host "❌ Google AI optimization test failed!" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
        Write-Host "Details: $($response.details)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to connect to test endpoint!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Make sure the development server is running:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n✨ Google AI optimization test completed successfully!" -ForegroundColor Green