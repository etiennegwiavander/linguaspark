# Test script for contextual vocabulary across all CEFR levels
Write-Host "Testing Contextual Vocabulary Across All CEFR Levels..." -ForegroundColor Cyan
Write-Host ""

$sourceText = "The Ryder Cup is one of golf's most prestigious team competitions. European and American teams compete every two years in a thrilling tournament. Players must demonstrate exceptional skill and teamwork to win matches. The competition creates intense rivalry and memorable moments in golf history. Fans travel from around the world to witness this spectacular sporting event."

$levels = @("A1", "A2", "B1", "B2", "C1")
$results = @()

foreach ($level in $levels) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Testing Level: $level" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    $testPayload = @{
        sourceText = $sourceText
        lessonType = "discussion"
        studentLevel = $level
        targetLanguage = "English"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-contextual-vocab" -Method Post -Body $testPayload -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✓ Level $level - Generation successful!" -ForegroundColor Green
            Write-Host ""
            
            # Expected example counts per level
            $expectedCounts = @{
                "A1" = 5
                "A2" = 5
                "B1" = 4
                "B2" = 3
                "C1" = 2
            }
            $expectedCount = $expectedCounts[$level]
            
            Write-Host "Context:" -ForegroundColor Cyan
            Write-Host "  Themes: $($response.context.mainThemes -join ', ')" -ForegroundColor White
            Write-Host "  Expected examples per word: $expectedCount" -ForegroundColor White
            Write-Host ""
            
            # Analyze vocabulary items
            $vocabItems = $response.vocabulary | Where-Object { $_.word -ne "INSTRUCTION" }
            $totalContextualRelevance = 0
            $totalExampleCount = 0
            
            foreach ($item in $vocabItems) {
                Write-Host "  Word: $($item.word)" -ForegroundColor Magenta
                Write-Host "  Examples: $($item.examples.Count)/$expectedCount" -ForegroundColor White
                
                # Check contextual relevance
                $contextualCount = 0
                foreach ($example in $item.examples) {
                    $isContextual = $false
                    foreach ($theme in $response.context.mainThemes) {
                        if ($example -match $theme) {
                            $isContextual = $true
                            break
                        }
                    }
                    if ($isContextual) { $contextualCount++ }
                    
                    # Show first 2 examples
                    if ($item.examples.IndexOf($example) -lt 2) {
                        Write-Host "    - $example" -ForegroundColor Gray
                    }
                }
                
                $relevancePercent = if ($item.examples.Count -gt 0) { 
                    [math]::Round(($contextualCount / $item.examples.Count) * 100) 
                } else { 0 }
                
                Write-Host "  Contextual relevance: $contextualCount/$($item.examples.Count) ($relevancePercent%)" -ForegroundColor $(if ($relevancePercent -ge 60) { "Green" } else { "Yellow" })
                Write-Host ""
                
                $totalContextualRelevance += $contextualCount
                $totalExampleCount += $item.examples.Count
            }
            
            # Summary for this level
            $overallRelevance = if ($totalExampleCount -gt 0) {
                [math]::Round(($totalContextualRelevance / $totalExampleCount) * 100)
            } else { 0 }
            
            Write-Host "Level $level Summary:" -ForegroundColor Cyan
            Write-Host "  Words generated: $($vocabItems.Count)" -ForegroundColor White
            Write-Host "  Validation pass rate: $($response.metrics.validationPassRate)%" -ForegroundColor White
            Write-Host "  Overall contextual relevance: $overallRelevance%" -ForegroundColor $(if ($overallRelevance -ge 60) { "Green" } else { "Yellow" })
            Write-Host "  Generation time: $($response.metrics.totalTime)ms" -ForegroundColor White
            
            $results += @{
                Level = $level
                Success = $true
                ValidationPassRate = $response.metrics.validationPassRate
                ContextualRelevance = $overallRelevance
                GenerationTime = $response.metrics.totalTime
                WordsGenerated = $vocabItems.Count
            }
            
        } else {
            Write-Host "✗ Level $level - Generation failed!" -ForegroundColor Red
            Write-Host "Error: $($response.error)" -ForegroundColor Red
            
            $results += @{
                Level = $level
                Success = $false
                Error = $response.error
            }
        }
        
    } catch {
        Write-Host "✗ Level $level - Request failed!" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        
        $results += @{
            Level = $level
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2  # Brief pause between levels
}

# Final summary
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "FINAL SUMMARY - ALL LEVELS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$successfulLevels = ($results | Where-Object { $_.Success }).Count
Write-Host "Successful levels: $successfulLevels/$($levels.Count)" -ForegroundColor $(if ($successfulLevels -eq $levels.Count) { "Green" } else { "Yellow" })
Write-Host ""

foreach ($result in $results) {
    if ($result.Success) {
        $status = "✓"
        $color = "Green"
        Write-Host "$status $($result.Level): Pass Rate $($result.ValidationPassRate)%, Relevance $($result.ContextualRelevance)%, Time $($result.GenerationTime)ms" -ForegroundColor $color
    } else {
        $status = "✗"
        $color = "Red"
        Write-Host "$status $($result.Level): FAILED - $($result.Error)" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
