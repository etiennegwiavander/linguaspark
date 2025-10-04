#!/usr/bin/env pwsh

Write-Host "🧪 Testing Progressive Generation System..." -ForegroundColor Cyan

# Test the progressive generation API
Write-Host "`n🔄 Testing progressive generation..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-progressive-generation" -Method POST -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Progressive generation test PASSED" -ForegroundColor Green
        
        Write-Host "`n📊 Shared Context Results:" -ForegroundColor Cyan
        Write-Host "  Vocabulary Count: $($response.results.sharedContext.vocabularyCount)" -ForegroundColor White
        Write-Host "  Themes Count: $($response.results.sharedContext.themesCount)" -ForegroundColor White
        Write-Host "  Summary Length: $($response.results.sharedContext.summaryLength)" -ForegroundColor White
        
        Write-Host "`n📚 Key Vocabulary:" -ForegroundColor Cyan
        foreach ($word in $response.results.sharedContext.keyVocabulary) {
            Write-Host "  - $word" -ForegroundColor White
        }
        
        Write-Host "`n🎯 Main Themes:" -ForegroundColor Cyan
        foreach ($theme in $response.results.sharedContext.mainThemes) {
            Write-Host "  - $theme" -ForegroundColor White
        }
        
        Write-Host "`n🔧 Generated Sections:" -ForegroundColor Cyan
        foreach ($section in $response.results.generatedSections) {
            Write-Host "  $($section.name): $($section.strategy) strategy, $($section.tokensUsed) tokens" -ForegroundColor White
            Write-Host "    Preview: $($section.contentPreview)" -ForegroundColor Gray
        }
        
        Write-Host "`n🔄 Context Updates:" -ForegroundColor Cyan
        Write-Host "  Final Vocabulary Count: $($response.results.finalContext.vocabularyCount)" -ForegroundColor White
        Write-Host "  Final Themes Count: $($response.results.finalContext.themesCount)" -ForegroundColor White
        
    } else {
        Write-Host "❌ Progressive generation test FAILED" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
        if ($response.details) {
            Write-Host "Details: $($response.details)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Failed to connect to progressive generation API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the development server is running on port 3000" -ForegroundColor Yellow
}

Write-Host "`n🎯 Progressive Generation Test Complete!" -ForegroundColor Cyan