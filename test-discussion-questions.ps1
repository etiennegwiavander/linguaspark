# Test script for 5-question discussion generation
Write-Host "Testing Discussion Question Generation (5 questions)" -ForegroundColor Cyan
Write-Host "=" -repeat 60 -ForegroundColor Cyan

# Test content about climate change
$testContent = @"
Climate change is one of the most pressing challenges facing humanity today. Rising global temperatures are causing ice caps to melt, sea levels to rise, and weather patterns to become more extreme. Scientists agree that human activities, particularly the burning of fossil fuels, are the primary cause of recent climate change. The effects are already being felt around the world, from more frequent hurricanes to prolonged droughts. Many countries are working together to reduce greenhouse gas emissions and transition to renewable energy sources. However, the pace of change needs to accelerate if we are to avoid the most catastrophic consequences of global warming.
"@

# Test at different CEFR levels
$levels = @("A1", "A2", "B1", "B2", "C1")

foreach ($level in $levels) {
    Write-Host "`nTesting Level: $level" -ForegroundColor Yellow
    Write-Host "-" -repeat 60
    
    $body = @{
        content = $testContent
        level = $level
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-discussion-questions" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        
        Write-Host "✓ Success!" -ForegroundColor Green
        Write-Host "Question Count: $($response.questionCount)" -ForegroundColor Cyan
        Write-Host "Validation: $($response.validation.isValid)" -ForegroundColor $(if ($response.validation.isValid) { "Green" } else { "Yellow" })
        
        if ($response.validation.issues.Count -gt 0) {
            Write-Host "`nValidation Issues:" -ForegroundColor Yellow
            $response.validation.issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        }
        
        Write-Host "`nGenerated Questions:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $response.questions.Count; $i++) {
            Write-Host "  $($i + 1). $($response.questions[$i])" -ForegroundColor White
        }
        
        if ($response.metadata) {
            Write-Host "`nMetadata:" -ForegroundColor Gray
            Write-Host "  Attempts: $($response.metadata.attempts)" -ForegroundColor Gray
            Write-Host "  Generation Time: $($response.metadata.generationTime)ms" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n" -NoNewline
Write-Host "=" -repeat 60 -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
