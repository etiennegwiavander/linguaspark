# Test script for enhanced contextual vocabulary generation
Write-Host "Testing Enhanced Contextual Vocabulary Generation..." -ForegroundColor Cyan
Write-Host ""

# Test with sports content
$testPayload = @{
    sourceText = "The Ryder Cup is one of golf's most prestigious team competitions. European and American teams compete every two years in a thrilling tournament. Players must demonstrate exceptional skill and teamwork to win matches. The competition creates intense rivalry and memorable moments in golf history."
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "English"
} | ConvertTo-Json

Write-Host "Test Payload:" -ForegroundColor Yellow
Write-Host $testPayload
Write-Host ""

Write-Host "Calling API endpoint..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-contextual-vocab" -Method Post -Body $testPayload -ContentType "application/json"

Write-Host ""
Write-Host "=== VOCABULARY GENERATION RESULTS ===" -ForegroundColor Green
Write-Host ""

if ($response.success) {
    Write-Host "✓ Generation successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Context Information:" -ForegroundColor Cyan
    Write-Host "  Level: $($response.context.difficultyLevel)" -ForegroundColor White
    Write-Host "  Themes: $($response.context.mainThemes -join ', ')" -ForegroundColor White
    Write-Host "  Key Vocabulary: $($response.context.keyVocabulary -join ', ')" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Generated Vocabulary:" -ForegroundColor Cyan
    foreach ($item in $response.vocabulary) {
        if ($item.word -eq "INSTRUCTION") {
            Write-Host "  $($item.meaning)" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "  Word: $($item.word)" -ForegroundColor Magenta
            Write-Host "  Meaning: $($item.meaning)" -ForegroundColor White
            Write-Host "  Examples ($($item.examples.Count)):" -ForegroundColor White
            foreach ($example in $item.examples) {
                Write-Host "    - $example" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "Validation Results:" -ForegroundColor Cyan
    foreach ($validation in $response.validationResults) {
        $status = if ($validation.isValid) { "✓" } else { "✗" }
        $color = if ($validation.isValid) { "Green" } else { "Red" }
        Write-Host "  $status $($validation.word): " -ForegroundColor $color -NoNewline
        if ($validation.isValid) {
            Write-Host "PASSED" -ForegroundColor Green
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            foreach ($issue in $validation.issues) {
                Write-Host "    - $issue" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
    Write-Host "Generation Metrics:" -ForegroundColor Cyan
    Write-Host "  Total Time: $($response.metrics.totalTime)ms" -ForegroundColor White
    Write-Host "  Words Generated: $($response.metrics.wordsGenerated)" -ForegroundColor White
    Write-Host "  Validation Pass Rate: $($response.metrics.validationPassRate)%" -ForegroundColor White
    
} else {
    Write-Host "✗ Generation failed!" -ForegroundColor Red
    Write-Host "Error: $($response.error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
