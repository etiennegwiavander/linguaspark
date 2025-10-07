# Unit Test for Discussion Question Validation Logic
# Tests validation without making API calls

Write-Host "Testing Discussion Question Validation Logic..." -ForegroundColor Cyan
Write-Host ""

# Test cases with pre-defined questions for each level
$testCases = @(
    @{
        Level = "A1"
        Questions = @(
            "Do you like soccer?",
            "What is your favorite sport?",
            "Have you ever played soccer?",
            "Where do you play sports?",
            "Can you kick a ball?"
        )
        ExpectedValid = $true
        Description = "Simple yes/no and wh- questions"
    },
    @{
        Level = "A1"
        Questions = @(
            "What are the socioeconomic implications of professional sports?",
            "How might one evaluate the cultural significance?",
            "To what extent does globalization affect sports?"
        )
        ExpectedValid = $false
        Description = "Questions too complex for A1 (should fail)"
    },
    @{
        Level = "A2"
        Questions = @(
            "What do you think about climate change?",
            "Can you describe your experience with recycling?",
            "What would you do to help the environment?",
            "Do you believe people care about nature?",
            "Where would you like to visit in nature?"
        )
        ExpectedValid = $true
        Description = "Simple opinions and experiences"
    },
    @{
        Level = "B1"
        Questions = @(
            "Why do you think social media is so popular?",
            "How does online communication compare to face-to-face conversation?",
            "What are the advantages of using social media?",
            "Do you agree that social media affects relationships?",
            "What problems can social media cause?"
        )
        ExpectedValid = $true
        Description = "Opinions, comparisons, and justifications"
    },
    @{
        Level = "B2"
        Questions = @(
            "To what extent do you agree that AI will transform society?",
            "What might be the long-term consequences of automation?",
            "How would you evaluate the ethical implications of AI?",
            "What are the potential risks and benefits of AI development?",
            "How might AI change the nature of human work?"
        )
        ExpectedValid = $true
        Description = "Analytical and evaluative questions"
    },
    @{
        Level = "B2"
        Questions = @(
            "Do you like AI?",
            "What is AI?",
            "Can you use AI?"
        )
        ExpectedValid = $false
        Description = "Questions too simple for B2 (should fail)"
    },
    @{
        Level = "C1"
        Questions = @(
            "What are the broader implications of universal basic income for economic systems?",
            "In what ways could different perspectives on automation be reconciled?",
            "How might one critically assess the underlying assumptions about work?",
            "To what extent does the concept challenge traditional economic theory?",
            "What philosophical considerations emerge from this debate?"
        )
        ExpectedValid = $true
        Description = "Sophisticated, evaluative, and abstract questions"
    }
)

$passCount = 0
$failCount = 0

foreach ($test in $testCases) {
    Write-Host "Test: $($test.Description)" -ForegroundColor Yellow
    Write-Host "Level: $($test.Level)" -ForegroundColor Gray
    Write-Host "Question Count: $($test.Questions.Count)" -ForegroundColor Gray
    Write-Host ""
    
    # Display questions
    Write-Host "Questions:" -ForegroundColor Cyan
    $test.Questions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
    
    # Perform validation checks
    $issues = @()
    $warnings = @()
    
    # Check count
    if ($test.Questions.Count -ne 5) {
        $issues += "Expected 5 questions, got $($test.Questions.Count)"
    }
    
    # Check each question
    for ($i = 0; $i -lt $test.Questions.Count; $i++) {
        $question = $test.Questions[$i]
        $questionLower = $question.ToLower()
        $wordCount = ($question -split '\s+').Count
        
        # Check format
        if (-not $question.EndsWith('?')) {
            $issues += "Question $($i + 1) does not end with ?"
        }
        if ($question.Length -lt 15) {
            $issues += "Question $($i + 1) is too short"
        }
        if (-not ($question -match '^[A-Z]')) {
            $issues += "Question $($i + 1) should start with capital"
        }
        
        # Check complexity for level
        $expectedRanges = @{
            'A1' = @{ min = 4; max = 12 }
            'A2' = @{ min = 5; max = 15 }
            'B1' = @{ min = 6; max = 18 }
            'B2' = @{ min = 8; max = 22 }
            'C1' = @{ min = 10; max = 25 }
        }
        
        $range = $expectedRanges[$test.Level]
        if ($wordCount -lt $range.min) {
            $warnings += "Question $($i + 1) may be too simple ($wordCount words, expected $($range.min)+)"
        }
        elseif ($wordCount -gt $range.max) {
            $warnings += "Question $($i + 1) may be too complex ($wordCount words, max $($range.max))"
        }
        
        # Check for level-inappropriate complexity
        if ($test.Level -in @('A1', 'A2')) {
            $complexWords = @('implications', 'consequences', 'evaluate', 'analyze', 'reconcile')
            foreach ($word in $complexWords) {
                if ($questionLower.Contains($word)) {
                    $warnings += "Question $($i + 1) uses advanced vocabulary '$word' for $($test.Level)"
                }
            }
        }
        
        # Check for yes/no questions at high levels
        if ($test.Level -in @('B2', 'C1')) {
            if ($question -match '^(Do|Does|Did|Can|Could|Would|Should|Have|Has|Had|Is|Are|Was|Were)\s+') {
                $warnings += "Question $($i + 1) is yes/no format at $($test.Level) level"
            }
        }
    }
    
    # Check diversity
    $questionStarts = $test.Questions | ForEach-Object { ($_ -split '\s+')[0].ToLower() }
    $uniqueStarts = $questionStarts | Select-Object -Unique
    if ($uniqueStarts.Count -lt 3) {
        $warnings += "Questions lack diversity (only $($uniqueStarts.Count) unique starts)"
    }
    
    $isValid = $issues.Count -eq 0
    
    # Display results
    Write-Host "Validation Results:" -ForegroundColor Cyan
    Write-Host "  Valid: $isValid" -ForegroundColor $(if ($isValid) { "Green" } else { "Red" })
    Write-Host "  Expected Valid: $($test.ExpectedValid)" -ForegroundColor Gray
    
    if ($issues.Count -gt 0) {
        Write-Host "  Issues:" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "  Warnings:" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
    }
    
    # Check if result matches expectation
    if ($isValid -eq $test.ExpectedValid) {
        Write-Host "✓ Test PASSED" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "✗ Test FAILED (expected valid=$($test.ExpectedValid), got valid=$isValid)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor Red
Write-Host "  Total: $($passCount + $failCount)" -ForegroundColor Gray
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ All validation tests passed!" -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
}
