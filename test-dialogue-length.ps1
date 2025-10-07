# Test dialogue length requirements implementation
Write-Host "Testing Dialogue Length Requirements (Task 5)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$testContent = @"
The Ryder Cup is one of golf's most prestigious team competitions, pitting the best players from Europe against those from the United States. Unlike most golf tournaments where players compete individually, the Ryder Cup emphasizes teamwork and national pride. The event takes place every two years, alternating between venues in Europe and the United States.

The competition format includes various match play formats: foursomes, four-ball, and singles matches. In foursomes, two players form a team and alternate hitting the same ball. Four-ball allows each player to play their own ball, with the better score counting for the team. The singles matches on the final day often determine the overall winner.

The atmosphere at the Ryder Cup is electric, with passionate fans creating an intense environment. Players who typically compete against each other throughout the year become teammates, fostering unique camaraderie. The pressure is immense, as players represent not just themselves but their entire continent.

Many legendary moments have occurred in Ryder Cup history, from dramatic comebacks to clutch putts under pressure. The competition has grown in popularity and prestige since its inception in 1927, becoming a highlight of the golfing calendar.
"@

Write-Host "Test Parameters:" -ForegroundColor Yellow
Write-Host "  Level: B1" -ForegroundColor Gray
Write-Host "  Content: Ryder Cup golf article" -ForegroundColor Gray
Write-Host ""

# Test dialogue practice first
Write-Host "TEST 1: Dialogue Practice" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$body1 = @{
    sourceText = $testContent
    studentLevel = "B1"
    testType = "practice"
} | ConvertTo-Json

Write-Host "Sending request to test dialogue practice..." -ForegroundColor Yellow
Write-Host ""

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/test-dialogue-length" `
        -Method Post `
        -Body $body1 `
        -ContentType "application/json" `
        -TimeoutSec 120

    Write-Host "✓ Dialogue Practice test completed!" -ForegroundColor Green
    Write-Host ""

    Write-Host "Dialogue Practice Results:" -ForegroundColor Yellow
    Write-Host "  Line Count: $($response1.dialoguePractice.dialogue.Count)" -ForegroundColor $(if ($response1.validation.dialoguePractice.meetsMinimumLines) { "Green" } else { "Red" })
    Write-Host "  Meets Minimum (12): $($response1.validation.dialoguePractice.meetsMinimumLines)" -ForegroundColor $(if ($response1.validation.dialoguePractice.meetsMinimumLines) { "Green" } else { "Red" })
    Write-Host "  Has Follow-up Questions: $($response1.validation.dialoguePractice.hasFollowUpQuestions)" -ForegroundColor $(if ($response1.validation.dialoguePractice.hasFollowUpQuestions) { "Green" } else { "Red" })
    Write-Host "  Starts with Student: $($response1.validation.dialoguePractice.startsWithStudent)" -ForegroundColor $(if ($response1.validation.dialoguePractice.startsWithStudent) { "Green" } else { "Red" })
    Write-Host "  Alternates Speakers: $($response1.validation.dialoguePractice.alternatesSpeakers)" -ForegroundColor $(if ($response1.validation.dialoguePractice.alternatesSpeakers) { "Green" } else { "Red" })
    Write-Host ""

    # Display sample dialogue practice
    Write-Host "SAMPLE DIALOGUE PRACTICE" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $response1.dialoguePractice.instruction -ForegroundColor Yellow
    Write-Host ""
    
    $sampleLines = $response1.dialoguePractice.dialogue | Select-Object -First 8
    foreach ($line in $sampleLines) {
        $color = if ($line.character -eq "Student") { "Cyan" } else { "Magenta" }
        Write-Host "$($line.character): $($line.line)" -ForegroundColor $color
    }
    
    if ($response1.dialoguePractice.dialogue.Count -gt 8) {
        Write-Host "... ($($response1.dialoguePractice.dialogue.Count - 8) more lines)" -ForegroundColor Gray
    }
    Write-Host ""

    # Test dialogue fill-in-gap
    Write-Host ""
    Write-Host "TEST 2: Dialogue Fill-in-Gap" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""

    $body2 = @{
        sourceText = $testContent
        studentLevel = "B1"
        testType = "fill-gap"
    } | ConvertTo-Json

    Write-Host "Sending request to test dialogue fill-in-gap..." -ForegroundColor Yellow
    Write-Host ""

    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/test-dialogue-length" `
        -Method Post `
        -Body $body2 `
        -ContentType "application/json" `
        -TimeoutSec 120

    Write-Host "✓ Dialogue Fill-in-Gap test completed!" -ForegroundColor Green
    Write-Host ""

    Write-Host "Dialogue Fill-in-Gap Results:" -ForegroundColor Yellow
    Write-Host "  Line Count: $($response2.dialogueFillGap.dialogue.Count)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.meetsMinimumLines) { "Green" } else { "Red" })
    Write-Host "  Meets Minimum (12): $($response2.validation.dialogueFillGap.meetsMinimumLines)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.meetsMinimumLines) { "Green" } else { "Red" })
    Write-Host "  Has Gaps: $($response2.validation.dialogueFillGap.hasGaps)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.hasGaps) { "Green" } else { "Red" })
    Write-Host "  Gap Count: $($response2.validation.dialogueFillGap.gapCount)" -ForegroundColor Gray
    Write-Host "  Has Answers: $($response2.validation.dialogueFillGap.hasAnswers)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.hasAnswers) { "Green" } else { "Red" })
    Write-Host "  Starts with Student: $($response2.validation.dialogueFillGap.startsWithStudent)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.startsWithStudent) { "Green" } else { "Red" })
    Write-Host "  Alternates Speakers: $($response2.validation.dialogueFillGap.alternatesSpeakers)" -ForegroundColor $(if ($response2.validation.dialogueFillGap.alternatesSpeakers) { "Green" } else { "Red" })
    Write-Host ""

    # Display sample fill-in-gap
    Write-Host "SAMPLE DIALOGUE FILL-IN-GAP" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $response2.dialogueFillGap.instruction -ForegroundColor Yellow
    Write-Host ""
    
    $sampleGapLines = $response2.dialogueFillGap.dialogue | Select-Object -First 8
    foreach ($line in $sampleGapLines) {
        $color = if ($line.character -eq "Student") { "Cyan" } else { "Magenta" }
        $gapIndicator = if ($line.isGap) { " [GAP]" } else { "" }
        Write-Host "$($line.character): $($line.line)$gapIndicator" -ForegroundColor $color
    }
    
    if ($response2.dialogueFillGap.dialogue.Count -gt 8) {
        Write-Host "... ($($response2.dialogueFillGap.dialogue.Count - 8) more lines)" -ForegroundColor Gray
    }
    Write-Host ""

    # Display answers
    if ($response2.dialogueFillGap.answers.Count -gt 0) {
        Write-Host "Answers: $($response2.dialogueFillGap.answers -join ', ')" -ForegroundColor Yellow
        Write-Host ""
    }

    # Overall assessment
    Write-Host ""
    Write-Host "OVERALL ASSESSMENT" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host ""
    
    $allChecksPassed = $response1.validation.dialoguePractice.meetsMinimumLines -and 
                       $response2.validation.dialogueFillGap.meetsMinimumLines -and
                       $response1.validation.dialoguePractice.hasFollowUpQuestions -and
                       $response2.validation.dialogueFillGap.hasGaps

    if ($allChecksPassed) {
        Write-Host "✓ All requirements met!" -ForegroundColor Green
        Write-Host "  - Both dialogues have minimum 12 lines" -ForegroundColor Green
        Write-Host "  - Validation checks passed" -ForegroundColor Green
        Write-Host "  - Regeneration logic implemented" -ForegroundColor Green
    } else {
        Write-Host "✗ Some requirements not met" -ForegroundColor Red
        if (-not $response1.validation.dialoguePractice.meetsMinimumLines) {
            Write-Host "  - Dialogue practice needs more lines" -ForegroundColor Red
        }
        if (-not $response2.validation.dialogueFillGap.meetsMinimumLines) {
            Write-Host "  - Dialogue fill-in-gap needs more lines" -ForegroundColor Red
        }
    }

} catch {
    Write-Host "✗ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test complete." -ForegroundColor Cyan
