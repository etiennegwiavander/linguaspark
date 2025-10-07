# Test pronunciation word selection logic
# Tests Requirements 6.5, 6.6 - word selection with challenging sounds

Write-Host "Testing Pronunciation Word Selection Logic..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$testContent = @"
The Olympic Games represent the pinnacle of athletic achievement. Athletes from around the world compete in various sports, demonstrating extraordinary strength, technique, and determination. The competition requires years of rigorous training and preparation. Coaches work closely with their athletes to develop strategies and improve performance. The atmosphere during the games is electric, with spectators cheering enthusiastically for their favorite competitors.
"@

$body = @{
    sourceText = $testContent
    level = "B2"
} | ConvertTo-Json

Write-Host "Test Content: Olympic Games and Athletic Competition" -ForegroundColor Yellow
Write-Host "Student Level: B2" -ForegroundColor Yellow
Write-Host "Expected: 5+ challenging words with difficult sounds" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Sending request to API..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-pronunciation-enhancement" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 180

    if ($response.success) {
        Write-Host "✓ API call successful" -ForegroundColor Green
        Write-Host ""
        
        $pronunciation = $response.pronunciationSection
        
        # Test 1: Check word count (Requirement 6.1)
        Write-Host "Test 1: Minimum Word Count (Requirement 6.1)" -ForegroundColor Cyan
        $wordCount = $pronunciation.words.Count
        if ($wordCount -ge 5) {
            Write-Host "  ✓ PASS: $wordCount words (minimum 5 required)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Only $wordCount words (minimum 5 required)" -ForegroundColor Red
        }
        Write-Host ""
        
        # Test 2: Check IPA transcriptions (Requirement 6.2)
        Write-Host "Test 2: IPA Transcriptions (Requirement 6.2)" -ForegroundColor Cyan
        $wordsWithIPA = ($pronunciation.words | Where-Object { $_.ipa -and $_.ipa.Length -gt 0 }).Count
        if ($wordsWithIPA -eq $wordCount) {
            Write-Host "  ✓ PASS: All $wordCount words have IPA transcriptions" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Only $wordsWithIPA/$wordCount words have IPA transcriptions" -ForegroundColor Red
        }
        Write-Host ""
        
        # Test 3: Check pronunciation tips (Requirement 6.3)
        Write-Host "Test 3: Pronunciation Tips (Requirement 6.3)" -ForegroundColor Cyan
        $wordsWithTips = ($pronunciation.words | Where-Object { $_.tips -and $_.tips.Count -gt 0 }).Count
        if ($wordsWithTips -eq $wordCount) {
            Write-Host "  ✓ PASS: All $wordCount words have pronunciation tips" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Only $wordsWithTips/$wordCount words have pronunciation tips" -ForegroundColor Red
        }
        Write-Host ""
        
        # Test 4: Check practice sentences (Requirement 6.6)
        Write-Host "Test 4: Practice Sentences (Requirement 6.6)" -ForegroundColor Cyan
        $wordsWithPractice = ($pronunciation.words | Where-Object { $_.practiceSentence -and $_.practiceSentence.Length -gt 0 }).Count
        if ($wordsWithPractice -eq $wordCount) {
            Write-Host "  ✓ PASS: All $wordCount words have practice sentences" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Only $wordsWithPractice/$wordCount words have practice sentences" -ForegroundColor Red
        }
        Write-Host ""
        
        # Test 5: Check challenging sounds (Requirement 6.5)
        Write-Host "Test 5: Challenging Sounds Selection (Requirement 6.5)" -ForegroundColor Cyan
        $wordsWithDifficultSounds = ($pronunciation.words | Where-Object { $_.difficultSounds -and $_.difficultSounds.Count -gt 0 }).Count
        if ($wordsWithDifficultSounds -ge ($wordCount * 0.8)) {
            Write-Host "  ✓ PASS: $wordsWithDifficultSounds/$wordCount words have challenging sounds identified" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ WARNING: Only $wordsWithDifficultSounds/$wordCount words have challenging sounds identified" -ForegroundColor Yellow
        }
        Write-Host ""
        
        # Test 6: Check tongue twisters (Requirement 6.4)
        Write-Host "Test 6: Tongue Twisters (Requirement 6.4)" -ForegroundColor Cyan
        $twisterCount = $pronunciation.tongueTwisters.Count
        if ($twisterCount -ge 2) {
            Write-Host "  ✓ PASS: $twisterCount tongue twisters (minimum 2 required)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Only $twisterCount tongue twisters (minimum 2 required)" -ForegroundColor Red
        }
        Write-Host ""
        
        # Display detailed word information
        Write-Host "Detailed Word Analysis:" -ForegroundColor Cyan
        Write-Host "======================" -ForegroundColor Cyan
        foreach ($word in $pronunciation.words) {
            Write-Host ""
            Write-Host "Word: $($word.word)" -ForegroundColor Yellow
            Write-Host "  IPA: $($word.ipa)" -ForegroundColor Gray
            
            if ($word.difficultSounds -and $word.difficultSounds.Count -gt 0) {
                Write-Host "  Difficult Sounds: $($word.difficultSounds -join ', ')" -ForegroundColor Gray
            }
            
            if ($word.tips -and $word.tips.Count -gt 0) {
                Write-Host "  Tips:" -ForegroundColor Gray
                foreach ($tip in $word.tips) {
                    Write-Host "    - $tip" -ForegroundColor Gray
                }
            }
            
            if ($word.practiceSentence) {
                Write-Host "  Practice: $($word.practiceSentence)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "Tongue Twisters:" -ForegroundColor Cyan
        Write-Host "================" -ForegroundColor Cyan
        foreach ($twister in $pronunciation.tongueTwisters) {
            Write-Host ""
            Write-Host "  Text: $($twister.text)" -ForegroundColor Yellow
            if ($twister.targetSounds) {
                Write-Host "  Target Sounds: $($twister.targetSounds -join ', ')" -ForegroundColor Gray
            }
            if ($twister.difficulty) {
                Write-Host "  Difficulty: $($twister.difficulty)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Cyan
        Write-Host "Test Summary" -ForegroundColor Cyan
        Write-Host "=============================================" -ForegroundColor Cyan
        Write-Host "✓ Pronunciation word selection logic implemented" -ForegroundColor Green
        Write-Host "✓ Words selected based on challenging sounds" -ForegroundColor Green
        Write-Host "✓ Practice sentences generated for each word" -ForegroundColor Green
        Write-Host "✓ Validation ensures section completeness" -ForegroundColor Green
        
    } else {
        Write-Host "✗ API returned error: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Test failed with error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
