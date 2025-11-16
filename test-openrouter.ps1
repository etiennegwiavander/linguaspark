# Test OpenRouter API with DeepSeek V3
Write-Host "🧪 Testing OpenRouter API with DeepSeek V3..." -ForegroundColor Cyan
Write-Host ""

$url = "http://localhost:3001/api/test-openrouter"

Write-Host "📡 Sending POST request to: $url" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    if ($response.success) {
        Write-Host "✓ Status: SUCCESS" -ForegroundColor Green
        Write-Host "✓ Model: $($response.model)" -ForegroundColor Green
        Write-Host "✓ Response Time: $($response.responseTime)" -ForegroundColor Green
        
        if ($response.tokenUsage) {
            Write-Host ""
            Write-Host "💰 Token Usage:" -ForegroundColor Yellow
            Write-Host "  - Prompt Tokens: $($response.tokenUsage.prompt_tokens)"
            Write-Host "  - Completion Tokens: $($response.tokenUsage.completion_tokens)"
            Write-Host "  - Total Tokens: $($response.tokenUsage.total_tokens)"
        }
        
        Write-Host ""
        Write-Host "📝 Generated Content Preview:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
        if ($response.parsedLesson) {
            Write-Host "✓ Lesson successfully parsed as JSON" -ForegroundColor Green
            Write-Host ""
            Write-Host "Title: $($response.parsedLesson.title)" -ForegroundColor White
            Write-Host "Warmup Questions: $($response.parsedLesson.warmup.Count)" -ForegroundColor White
            Write-Host "Reading Length: $($response.parsedLesson.reading.Length) characters" -ForegroundColor White
            Write-Host "Vocabulary Words: $($response.parsedLesson.vocabulary.Count)" -ForegroundColor White
        } else {
            $preview = $response.generatedContent.Substring(0, [Math]::Min(500, $response.generatedContent.Length))
            Write-Host $preview -ForegroundColor White
            if ($response.generatedContent.Length -gt 500) {
                Write-Host "..." -ForegroundColor Gray
                Write-Host "(truncated - full content is $($response.generatedContent.Length) characters)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "🎉 OpenRouter API is working correctly!" -ForegroundColor Green
        
    } else {
        Write-Host "✗ Status: FAILED" -ForegroundColor Red
        Write-Host "✗ Error: $($response.error)" -ForegroundColor Red
        if ($response.details) {
            Write-Host ""
            Write-Host "Details:" -ForegroundColor Yellow
            Write-Host $response.details -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Test failed with error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Your Next.js dev server is running on port 3001" -ForegroundColor White
    Write-Host "  2. OPEN_ROUTER_KEY is set in .env.local" -ForegroundColor White
    Write-Host "  3. Your internet connection is working" -ForegroundColor White
}

Write-Host ""
