# Test Discussion Question Complexity Implementation
# Tests CEFR-appropriate question generation for all levels

Write-Host "Testing Discussion Question Complexity (Task 8)..." -ForegroundColor Cyan
Write-Host ""

# Test data for different CEFR levels
$testCases = @(
    @{
        Level = "A1"
        Content = "Soccer is a popular sport played around the world. Two teams of eleven players try to kick a ball into the other team's goal. The team with the most goals wins the game. Many children and adults enjoy playing and watching soccer."
        ExpectedTypes = @("simple yes/no", "personal preference", "basic experience")
    },
    @{
        Level = "A2"
        Content = "Climate change is affecting our planet. Temperatures are rising, ice caps are melting, and weather patterns are changing. Many scientists believe human activities are causing these changes. People can help by reducing waste and using less energy."
        ExpectedTypes = @("simple opinion", "personal experience", "simple hypothetical")
    },
    @{
        Level = "B1"
        Content = "Social media has transformed how people communicate. While it helps people stay connected across distances, some worry about privacy and the spread of misinformation. Young people especially spend significant time on these platforms, which can affect their mental health and relationships."
        ExpectedTypes = @("opinion with justification", "comparison", "advantages/disadvantages")
    },
    @{
        Level = "B2"
        Content = "Artificial intelligence is rapidly advancing and being integrated into many aspects of daily life, from healthcare diagnostics to autonomous vehicles. While AI promises increased efficiency and new capabilities, it also raises concerns about job displacement, privacy, and ethical decision-making. Society must carefully consider how to regulate and implement these technologies."
        ExpectedTypes = @("analytical", "evaluation", "hypothetical consequences")
    },
    @{
        Level = "C1"
        Content = "The concept of universal basic income has gained traction as automation threatens traditional employment models. Proponents argue it could provide economic security and freedom, while critics question its feasibility and potential impact on work motivation. This debate reflects broader tensions between individual liberty, social welfare, and economic sustainability in modern democracies."
        ExpectedTypes = @("evaluative", "critical analysis", "abstract reasoning")
    }
)

foreach ($test in $testCases) {
    Write-Host "Testing Level: $($test.Level)" -ForegroundColor Yellow
    Write-Host "Expected question types: $($test.ExpectedTypes -join ', ')" -ForegroundColor Gray
    Write-Host ""
    
    $body = @{
        content = $test.Content
        lessonType = "discussion"
        studentLevel = $test.Level
        targetLanguage = "English"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-discussion-questions" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        
        Write-Host "✓ Generated Questions:" -ForegroundColor Green
        $response.questions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
        Write-Host ""
        
        if ($response.validation) {
            Write-Host "Validation Results:" -ForegroundColor Cyan
            Write-Host "  Valid: $($response.validation.isValid)" -ForegroundColor $(if ($response.validation.isValid) { "Green" } else { "Red" })
            
            if ($response.validation.issues -and $response.validation.issues.Count -gt 0) {
                Write-Host "  Issues:" -ForegroundColor Red
                $response.validation.issues | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
            }
            
            if ($response.validation.warnings -and $response.validation.warnings.Count -gt 0) {
                Write-Host "  Warnings:" -ForegroundColor Yellow
                $response.validation.warnings | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
            }
        }
        
        Write-Host ""
        Write-Host "---" -ForegroundColor Gray
        Write-Host ""
        
    } catch {
        Write-Host "✗ Error testing level $($test.Level): $_" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual Review Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] A1/A2 questions use simple structures and familiar topics" -ForegroundColor Gray
Write-Host "  [ ] B1 questions include opinions and comparisons" -ForegroundColor Gray
Write-Host "  [ ] B2/C1 questions are analytical and evaluative" -ForegroundColor Gray
Write-Host "  [ ] All questions relate to source material" -ForegroundColor Gray
Write-Host "  [ ] Questions encourage extended responses appropriate to level" -ForegroundColor Gray
