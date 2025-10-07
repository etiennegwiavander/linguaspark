# Test enhanced pronunciation section generation

Write-Host "Testing Enhanced Pronunciation Section Generation" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$testContent = @"
The Olympic Games represent the pinnacle of athletic achievement, bringing together thousands of competitors from around the world. Athletes train rigorously for years, dedicating themselves to perfecting their techniques and pushing the boundaries of human performance. The competition showcases extraordinary feats of strength, speed, and endurance across numerous disciplines. Spectators witness breathtaking moments as records are shattered and new champions emerge. The Olympics embody the spirit of international cooperation and friendly rivalry, transcending political and cultural differences through the universal language of sport.
"@

$levels = @('A1', 'A2', 'B1', 'B2', 'C1')

foreach ($level in $levels) {
    Write-Host "Testing Level: $level" -ForegroundColor Yellow
    Write-Host "-------------------" -ForegroundColor Yellow
    
    $body = @{
        sourceText = $testContent
        level = $level
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-pronunciation-enhancement" `
            -Method POST `
            -Body $body `
            -ContentType "application/json"

        Write-Host "✓ Request successful" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Validation Results:" -ForegroundColor Cyan
        Write-Host "  Has Instruction: $($response.validation.hasInstruction)" -ForegroundColor $(if ($response.validation.hasInstruction) { "Green" } else { "Red" })
        Write-Host "  Word Count: $($response.validation.wordCount) (min 5: $($response.validation.meetsMinWords))" -ForegroundColor $(if ($response.validation.meetsMinWords) { "Green" } else { "Red" })
        Write-Host "  Tongue Twister Count: $($response.validation.tongueTwisterCount) (min 2: $($response.validation.meetsTongueTwisters))" -ForegroundColor $(if ($response.validation.meetsTongueTwisters) { "Green" } else { "Red" })
        Write-Host "  All Words Have IPA: $($response.validation.allWordsHaveIPA)" -ForegroundColor $(if ($response.validation.allWordsHaveIPA) { "Green" } else { "Red" })
        Write-Host "  All Words Have Tips: $($response.validation.allWordsHaveTips)" -ForegroundColor $(if ($response.validation.allWordsHaveTips) { "Green" } else { "Red" })
        Write-Host "  All Words Have Practice Sentence: $($response.validation.allWordsHavePracticeSentence)" -ForegroundColor $(if ($response.validation.allWordsHavePracticeSentence) { "Green" } else { "Red" })
        Write-Host "  All Twisters Have Target Sounds: $($response.validation.allTwistersHaveTargetSounds)" -ForegroundColor $(if ($response.validation.allTwistersHaveTargetSounds) { "Green" } else { "Red" })
        Write-Host ""
        
        Write-Host "Overall: $($response.message)" -ForegroundColor $(if ($response.allChecksPassed) { "Green" } else { "Yellow" })
        Write-Host ""
        
        Write-Host "Sample Pronunciation Words:" -ForegroundColor Cyan
        $sampleWords = $response.pronunciationSection.words | Select-Object -First 2
        foreach ($word in $sampleWords) {
            Write-Host "  Word: $($word.word)" -ForegroundColor White
            Write-Host "    IPA: $($word.ipa)" -ForegroundColor Gray
            Write-Host "    Tips: $($word.tips -join '; ')" -ForegroundColor Gray
            Write-Host "    Practice: $($word.practiceSentence)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "Sample Tongue Twisters:" -ForegroundColor Cyan
        foreach ($twister in $response.pronunciationSection.tongueTwisters) {
            Write-Host "  Text: $($twister.text)" -ForegroundColor White
            Write-Host "    Target Sounds: $($twister.targetSounds -join ', ')" -ForegroundColor Gray
            Write-Host "    Difficulty: $($twister.difficulty)" -ForegroundColor Gray
            Write-Host ""
        }
        
    } catch {
        Write-Host "✗ Request failed: $_" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Test Complete!" -ForegroundColor Green
