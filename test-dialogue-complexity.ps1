# Test script for CEFR-appropriate dialogue complexity
# Tests Requirements 3.3, 3.4, 3.5, 3.6, 3.7

Write-Host "Testing CEFR-Appropriate Dialogue Complexity..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test data - same content for all levels to compare complexity
$testContent = @"
The Olympic Games bring together athletes from around the world to compete in various sports. 
Athletes train for years to represent their countries and achieve their dreams of winning medals. 
The competition is fierce, but the spirit of sportsmanship and international cooperation makes 
the Olympics a unique celebration of human achievement.
"@

# Test all CEFR levels
$levels = @("A1", "A2", "B1", "B2", "C1")

foreach ($level in $levels) {
    Write-Host "Testing Level: $level" -ForegroundColor Yellow
    Write-Host "-------------------" -ForegroundColor Yellow
    
    $body = @{
        content = $testContent
        lessonType = "discussion"
        studentLevel = $level
        targetLanguage = "English"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-dialogue-complexity" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"

        Write-Host "✓ Dialogue Practice Generated:" -ForegroundColor Green
        Write-Host "  Lines: $($response.dialoguePractice.dialogue.Count)" -ForegroundColor White
        Write-Host "  Validation: $($response.dialoguePractice.validation.isValid)" -ForegroundColor White
        
        if ($response.dialoguePractice.validation.issues.Count -gt 0) {
            Write-Host "  Issues:" -ForegroundColor Red
            foreach ($issue in $response.dialoguePractice.validation.issues) {
                Write-Host "    - $issue" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "  Sample Lines:" -ForegroundColor Cyan
        $sampleLines = $response.dialoguePractice.dialogue | Select-Object -First 3
        foreach ($line in $sampleLines) {
            $wordCount = ($line.line -split '\s+').Count
            Write-Host "    $($line.character): $($line.line) [$wordCount words]" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "✓ Dialogue Fill-in-Gap Generated:" -ForegroundColor Green
        Write-Host "  Lines: $($response.dialogueFillGap.dialogue.Count)" -ForegroundColor White
        Write-Host "  Gaps: $(($response.dialogueFillGap.dialogue | Where-Object { $_.line -match '_____' }).Count)" -ForegroundColor White
        Write-Host "  Validation: $($response.dialogueFillGap.validation.isValid)" -ForegroundColor White
        
        if ($response.dialogueFillGap.validation.issues.Count -gt 0) {
            Write-Host "  Issues:" -ForegroundColor Red
            foreach ($issue in $response.dialogueFillGap.validation.issues) {
                Write-Host "    - $issue" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "  Complexity Analysis:" -ForegroundColor Cyan
        Write-Host "    Vocabulary Integration: $($response.complexityAnalysis.vocabularyIntegration.hasIntegration)" -ForegroundColor White
        Write-Host "    Integrated Words: $($response.complexityAnalysis.vocabularyIntegration.integratedWords -join ', ')" -ForegroundColor White
        Write-Host "    Vocabulary Appropriate: $($response.complexityAnalysis.vocabularyComplexity.isAppropriate)" -ForegroundColor White
        Write-Host "    Grammar Appropriate: $($response.complexityAnalysis.grammarComplexity.isAppropriate)" -ForegroundColor White
        
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host ""
        
    } catch {
        Write-Host "✗ Error testing level $level" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "- A1: Simple vocabulary, basic sentence structures (5-8 words)" -ForegroundColor White
Write-Host "- A2: Simple vocabulary, straightforward structures (8-12 words)" -ForegroundColor White
Write-Host "- B1: Intermediate vocabulary, varied structures (10-15 words)" -ForegroundColor White
Write-Host "- B2: Advanced vocabulary, complex structures (12-18 words)" -ForegroundColor White
Write-Host "- C1: Sophisticated vocabulary, complex grammar (15-20 words)" -ForegroundColor White
