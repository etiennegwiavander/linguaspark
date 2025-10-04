#!/usr/bin/env pwsh

Write-Host "Testing AI Optimizer Implementation..." -ForegroundColor Green

# Test content
$testContent = @"
Artificial intelligence is revolutionizing the way businesses operate in the modern world. Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. Companies are increasingly adopting AI technologies to improve efficiency, reduce costs, and enhance customer experiences. Natural language processing enables computers to understand and generate human language, while computer vision allows machines to interpret visual information. The integration of AI into various industries, from healthcare to finance, is creating new opportunities and challenges. As AI continues to evolve, it's essential for professionals to understand its capabilities and limitations to leverage its potential effectively.
"@

$testData = @{
    content = $testContent
    section = "vocabulary"
    difficultyLevel = "B2"
} | ConvertTo-Json

Write-Host "Sending test request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-ai-optimizer" -Method POST -Body $testData -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ AI Optimizer test successful!" -ForegroundColor Green
        
        Write-Host "`n📝 Key Terms Extracted:" -ForegroundColor Cyan
        $response.results.keyTerms | ForEach-Object { Write-Host "  - $_" }
        
        Write-Host "`n📄 Content Summary:" -ForegroundColor Cyan
        Write-Host "  $($response.results.summary)"
        
        Write-Host "`n🎯 Optimized Prompt:" -ForegroundColor Cyan
        Write-Host "  Strategy: $($response.results.optimizedPrompt.optimizationStrategy)"
        Write-Host "  Estimated Tokens: $($response.results.optimizedPrompt.estimatedTokens)"
        Write-Host "  Prompt: $($response.results.optimizedPrompt.prompt)"
        
        Write-Host "`n📦 Batched Prompts:" -ForegroundColor Cyan
        $response.results.batchedPrompts | ForEach-Object {
            Write-Host "  Batch - Sections: $($_.sections -join ', '), Tokens: $($_.estimatedTokens)"
        }
        
        Write-Host "`n🔧 Shared Context:" -ForegroundColor Cyan
        Write-Host "  Difficulty: $($response.results.sharedContext.difficultyLevel)"
        Write-Host "  Vocabulary Count: $($response.results.sharedContext.keyVocabulary.Count)"
        Write-Host "  Themes: $($response.results.sharedContext.mainThemes -join ', ')"
        
    } else {
        Write-Host "❌ Test failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the development server is running (npm run dev)" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ All AI Optimizer tests completed successfully!" -ForegroundColor Green