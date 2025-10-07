# Test script for Task 10: Grammar Form and Usage Explanations
# This tests that grammar sections include both form and usage explanations

Write-Host "Testing Grammar Form and Usage Explanations..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test data - using a simple topic about technology
$testData = @{
    sourceText = "Artificial intelligence is transforming how we work and live. Companies have adopted AI technologies to improve efficiency and innovation. Machine learning algorithms analyze vast amounts of data to identify patterns and make predictions. As AI continues to evolve, it raises important questions about ethics, privacy, and the future of employment."
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "English"
} | ConvertTo-Json

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "- Source: AI and Technology" -ForegroundColor Gray
Write-Host "- Level: B1" -ForegroundColor Gray
Write-Host "- Focus: Grammar with Form and Usage" -ForegroundColor Gray
Write-Host ""

# Call the API
Write-Host "Calling grammar generation API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-grammar-comprehensive" `
        -Method Post `
        -Body $testData `
        -ContentType "application/json" `
        -TimeoutSec 60

    Write-Host "✓ API call successful" -ForegroundColor Green
    Write-Host ""

    # Check if grammar section exists
    if ($response.grammar) {
        Write-Host "Grammar Section Generated:" -ForegroundColor Green
        Write-Host "=========================" -ForegroundColor Green
        Write-Host ""
        
        # Display grammar point
        Write-Host "Grammar Point: $($response.grammar.focus)" -ForegroundColor Cyan
        Write-Host ""
        
        # Check and display FORM explanation
        if ($response.grammar.explanation -and $response.grammar.explanation.form) {
            Write-Host "✓ FORM Explanation Present:" -ForegroundColor Green
            Write-Host $response.grammar.explanation.form -ForegroundColor White
            Write-Host ""
            
            # Validate form explanation length
            if ($response.grammar.explanation.form.Length -ge 20) {
                Write-Host "  ✓ Form explanation meets minimum length (20+ chars)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Form explanation too short ($($response.grammar.explanation.form.Length) chars)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ FORM Explanation MISSING" -ForegroundColor Red
        }
        Write-Host ""
        
        # Check and display USAGE explanation
        if ($response.grammar.explanation -and $response.grammar.explanation.usage) {
            Write-Host "✓ USAGE Explanation Present:" -ForegroundColor Green
            Write-Host $response.grammar.explanation.usage -ForegroundColor White
            Write-Host ""
            
            # Validate usage explanation length
            if ($response.grammar.explanation.usage.Length -ge 30) {
                Write-Host "  ✓ Usage explanation meets minimum length (30+ chars)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Usage explanation too short ($($response.grammar.explanation.usage.Length) chars)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ USAGE Explanation MISSING" -ForegroundColor Red
        }
        Write-Host ""
        
        # Check level notes
        if ($response.grammar.explanation -and $response.grammar.explanation.levelNotes) {
            Write-Host "✓ Level-Specific Notes Present:" -ForegroundColor Green
            Write-Host $response.grammar.explanation.levelNotes -ForegroundColor White
            Write-Host ""
        }
        
        # Display examples
        if ($response.grammar.examples -and $response.grammar.examples.Count -gt 0) {
            Write-Host "✓ Examples ($($response.grammar.examples.Count)):" -ForegroundColor Green
            $response.grammar.examples | ForEach-Object -Begin { $i = 1 } -Process {
                Write-Host "  $i. $_" -ForegroundColor White
                $i++
            }
            Write-Host ""
            
            # Validate example count
            if ($response.grammar.examples.Count -ge 5) {
                Write-Host "  ✓ Meets minimum example count (5+)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Insufficient examples ($($response.grammar.examples.Count)/5)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ Examples MISSING" -ForegroundColor Red
        }
        Write-Host ""
        
        # Display exercises
        if ($response.grammar.exercises -and $response.grammar.exercises.Count -gt 0) {
            Write-Host "✓ Practice Exercises ($($response.grammar.exercises.Count)):" -ForegroundColor Green
            $response.grammar.exercises | ForEach-Object -Begin { $i = 1 } -Process {
                Write-Host "  $i. $($_.prompt)" -ForegroundColor White
                Write-Host "     Answer: $($_.answer)" -ForegroundColor Gray
                if ($_.explanation) {
                    Write-Host "     Explanation: $($_.explanation)" -ForegroundColor Gray
                }
                $i++
            }
            Write-Host ""
            
            # Validate exercise count
            if ($response.grammar.exercises.Count -eq 5) {
                Write-Host "  ✓ Correct exercise count (5)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Incorrect exercise count ($($response.grammar.exercises.Count)/5)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ Exercises MISSING" -ForegroundColor Red
        }
        Write-Host ""
        
        # Overall validation summary
        Write-Host "Validation Summary:" -ForegroundColor Cyan
        Write-Host "==================" -ForegroundColor Cyan
        
        $validationPassed = $true
        
        # Check all requirements
        if (-not ($response.grammar.explanation -and $response.grammar.explanation.form -and $response.grammar.explanation.form.Length -ge 20)) {
            Write-Host "✗ Form explanation requirement NOT met" -ForegroundColor Red
            $validationPassed = $false
        } else {
            Write-Host "✓ Form explanation requirement met" -ForegroundColor Green
        }
        
        if (-not ($response.grammar.explanation -and $response.grammar.explanation.usage -and $response.grammar.explanation.usage.Length -ge 30)) {
            Write-Host "✗ Usage explanation requirement NOT met" -ForegroundColor Red
            $validationPassed = $false
        } else {
            Write-Host "✓ Usage explanation requirement met" -ForegroundColor Green
        }
        
        if (-not ($response.grammar.examples -and $response.grammar.examples.Count -ge 5)) {
            Write-Host "✗ Example count requirement NOT met" -ForegroundColor Red
            $validationPassed = $false
        } else {
            Write-Host "✓ Example count requirement met" -ForegroundColor Green
        }
        
        if (-not ($response.grammar.exercises -and $response.grammar.exercises.Count -eq 5)) {
            Write-Host "✗ Exercise count requirement NOT met" -ForegroundColor Red
            $validationPassed = $false
        } else {
            Write-Host "✓ Exercise count requirement met" -ForegroundColor Green
        }
        
        Write-Host ""
        if ($validationPassed) {
            Write-Host "✓✓✓ ALL REQUIREMENTS MET - Task 10 Complete! ✓✓✓" -ForegroundColor Green
        } else {
            Write-Host "✗✗✗ SOME REQUIREMENTS NOT MET ✗✗✗" -ForegroundColor Red
        }
        
    } else {
        Write-Host "✗ No grammar section in response" -ForegroundColor Red
    }

} catch {
    Write-Host "✗ API call failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
