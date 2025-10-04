$body = @{
    sourceText = "A South African minister recently made controversial comments that have sparked widespread criticism. The minister used language that many consider inappropriate and offensive. This incident has led to calls for accountability and has highlighted ongoing issues around respectful communication in politics. The public reaction has been swift and strong, with many demanding an apology and better standards from political leaders."
    lessonType = "discussion"
    studentLevel = "A2"
    targetLanguage = "english"
} | ConvertTo-Json

Write-Host "🧪 Testing vocabulary filtering fixes..." -ForegroundColor Cyan
Write-Host "Request body length: $($body.Length) characters"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-vocabulary-fix" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.results.isClean) {
        Write-Host "✅ SUCCESS: No problematic words found!" -ForegroundColor Green
    } else {
        Write-Host "❌ ISSUE: Found problematic words: $($response.results.problematicWordsFound -join ', ')" -ForegroundColor Red
    }
    
    Write-Host "`nFill-gap answers: $($response.results.fillGapAnswers -join ', ')" -ForegroundColor Yellow
    Write-Host "Vocabulary count: $($response.results.vocabularyCount)" -ForegroundColor Cyan
    
    Write-Host "`nFixes status:" -ForegroundColor Cyan
    $response.fixes.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}