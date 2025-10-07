Write-Host "🧪 Testing Vocabulary Example Count by CEFR Level" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$levels = @("A1", "A2", "B1", "B2", "C1")
$expectedCounts = @{
    "A1" = 5
    "A2" = 5
    "B1" = 4
    "B2" = 3
    "C1" = 2
}

$allPassed = $true

foreach ($level in $levels) {
    Write-Host "Testing $level level (expecting $($expectedCounts[$level]) examples per word)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-vocabulary-examples?level=$level" -Method Get
        
        if ($response.success) {
            Write-Host "  ✅ Level: $($response.level)" -ForegroundColor Green
            Write-Host "  📚 Vocabulary words generated: $($response.vocabularyGenerated)" -ForegroundColor Green
            Write-Host "  📊 Expected examples per word: $($response.expectedExamplesPerWord)" -ForegroundColor Green
            
            Write-Host "  📝 Example counts per word:" -ForegroundColor Cyan
            foreach ($item in $response.exampleCounts) {
                $status = if ($item.exampleCount -eq $expectedCounts[$level]) { "✅" } else { "❌" }
                Write-Host "     $status $($item.word): $($item.exampleCount) examples" -ForegroundColor $(if ($item.exampleCount -eq $expectedCounts[$level]) { "Green" } else { "Red" })
            }
            
            if ($response.allCorrect) {
                Write-Host "  ✅ $($response.message)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  $($response.message)" -ForegroundColor Yellow
                $allPassed = $false
            }
            
            # Show sample word with examples
            if ($response.sampleWord) {
                Write-Host "  📖 Sample word: $($response.sampleWord.word)" -ForegroundColor Cyan
                Write-Host "     Meaning: $($response.sampleWord.meaning)" -ForegroundColor Gray
                Write-Host "     Examples:" -ForegroundColor Gray
                for ($i = 0; $i -lt $response.sampleWord.examples.Count; $i++) {
                    Write-Host "       $($i + 1). $($response.sampleWord.examples[$i])" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "  ❌ Test failed: $($response.error)" -ForegroundColor Red
            $allPassed = $false
        }
    } catch {
        Write-Host "  ❌ Request failed: $_" -ForegroundColor Red
        $allPassed = $false
    }
    
    Write-Host ""
}

Write-Host "=================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ All tests passed! Vocabulary example counts are correct for all CEFR levels." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Please review the results above." -ForegroundColor Yellow
}
Write-Host ""
