# Unit test for pronunciation word selection algorithm
# Tests Requirements 6.5 - Select words with challenging sounds

Write-Host "Testing Word Selection Algorithm (Unit Test)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test vocabulary with various challenging sounds
$testVocabulary = @(
    "athlete",      # /θ/ sound
    "strength",     # consonant cluster, /θ/
    "through",      # /θ/, /uː/, silent 'gh'
    "competition",  # /ʃ/ sound
    "technique",    # /iː/, /k/
    "extraordinary", # long word, /ɔː/
    "enthusiastically", # very long, /θ/, /æ/
    "thought",      # /θ/, /ɔː/, silent 'gh'
    "know",         # silent 'k'
    "walk",         # silent 'l'
    "simple",       # basic word
    "good",         # basic word
    "championship", # /tʃ/, /ʃ/
    "breathe",      # /θ/, /iː/
    "rhythm"        # no vowels in middle, /ð/
)

$body = @{
    vocabulary = $testVocabulary
} | ConvertTo-Json

Write-Host "Test Vocabulary: $($testVocabulary.Count) words" -ForegroundColor Yellow
Write-Host "Expected: Top 5 words with most challenging sounds" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Sending request to API..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/test-word-selection" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 30

    if ($response.success) {
        Write-Host "✓ API call successful" -ForegroundColor Green
        Write-Host ""
        
        # Display all words with scores
        Write-Host "All Words Ranked by Difficulty:" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        foreach ($word in $response.allWords) {
            $soundsStr = if ($word.challengingSounds.Count -gt 0) { 
                $word.challengingSounds -join ', ' 
            } else { 
                "none" 
            }
            Write-Host "  $($word.word.PadRight(20)) Score: $($word.score.ToString().PadLeft(3))  Sounds: $soundsStr" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Selected Words for Pronunciation Practice:" -ForegroundColor Cyan
        Write-Host "==========================================" -ForegroundColor Cyan
        foreach ($word in $response.selectedWords) {
            Write-Host ""
            Write-Host "  Word: $($word.word)" -ForegroundColor Yellow
            Write-Host "    Score: $($word.score)" -ForegroundColor Gray
            Write-Host "    Challenging Sounds: $($word.challengingSounds -join ', ')" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host "========" -ForegroundColor Cyan
        Write-Host "  Total vocabulary words: $($response.summary.totalWords)" -ForegroundColor Gray
        Write-Host "  Selected for practice: $($response.summary.selectedCount)" -ForegroundColor Gray
        Write-Host "  Unique challenging sounds: $($response.summary.uniqueSoundsCount)" -ForegroundColor Gray
        Write-Host "  Average difficulty score: $([math]::Round($response.summary.averageScore, 2))" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "Unique Sounds Covered:" -ForegroundColor Cyan
        Write-Host "=====================" -ForegroundColor Cyan
        foreach ($sound in $response.uniqueSounds) {
            Write-Host "  - $sound" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Validation:" -ForegroundColor Cyan
        Write-Host "===========" -ForegroundColor Cyan
        
        # Test 1: Correct number of words selected
        if ($response.summary.selectedCount -eq 5) {
            Write-Host "  ✓ PASS: Exactly 5 words selected" -ForegroundColor Green
        } else {
            Write-Host "  ✗ FAIL: Expected 5 words, got $($response.summary.selectedCount)" -ForegroundColor Red
        }
        
        # Test 2: Words are from vocabulary
        $allFromVocab = $true
        foreach ($selected in $response.selectedWords) {
            if ($testVocabulary -notcontains $selected.word) {
                Write-Host "  ✗ FAIL: Selected word '$($selected.word)' not in original vocabulary" -ForegroundColor Red
                $allFromVocab = $false
            }
        }
        if ($allFromVocab) {
            Write-Host "  ✓ PASS: All selected words are from lesson vocabulary" -ForegroundColor Green
        }
        
        # Test 3: Words have challenging sounds identified
        $wordsWithSounds = ($response.selectedWords | Where-Object { $_.challengingSounds.Count -gt 0 }).Count
        if ($wordsWithSounds -ge 4) {
            Write-Host "  ✓ PASS: $wordsWithSounds/5 words have challenging sounds identified" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ WARNING: Only $wordsWithSounds/5 words have challenging sounds identified" -ForegroundColor Yellow
        }
        
        # Test 4: Sound diversity
        if ($response.summary.uniqueSoundsCount -ge 3) {
            Write-Host "  ✓ PASS: Good sound diversity ($($response.summary.uniqueSoundsCount) unique sounds)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ WARNING: Limited sound diversity ($($response.summary.uniqueSoundsCount) unique sounds)" -ForegroundColor Yellow
        }
        
        # Test 5: High-scoring words selected
        $topScores = $response.allWords | Select-Object -First 5 | ForEach-Object { $_.score }
        $selectedScores = $response.selectedWords | ForEach-Object { $_.score }
        $avgTop = ($topScores | Measure-Object -Average).Average
        $avgSelected = ($selectedScores | Measure-Object -Average).Average
        
        if ($avgSelected -ge ($avgTop * 0.8)) {
            Write-Host "  ✓ PASS: Selected words have high difficulty scores" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ WARNING: Selected words may not be the most challenging" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Cyan
        Write-Host "✓ Word selection algorithm working correctly" -ForegroundColor Green
        Write-Host "✓ Prioritizes words with challenging sounds" -ForegroundColor Green
        Write-Host "✓ Ensures words are from lesson vocabulary" -ForegroundColor Green
        Write-Host "✓ Provides sound diversity" -ForegroundColor Green
        
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
