# Test script to verify grammar MAX_TOKENS fix
Write-Host "🧪 Testing Grammar MAX_TOKENS Fix" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$testContent = @"
British Prime Minister Rishi Sunak has unexpectedly announced his resignation following a series of political setbacks. The departure of the Conservative leader has created significant uncertainty in UK politics. Sunak, who became Prime Minister in October 2022, faced mounting pressure from within his own party over economic policies and leadership decisions. His resignation marks a turbulent period in British political history, with questions now arising about who will lead the Conservative Party and the country forward. Political analysts suggest this unexpected move could trigger an early general election, though the timing remains unclear.
"@

Write-Host "📝 Test content length: $($testContent.Length) characters" -ForegroundColor Gray
Write-Host ""

$body = @{
    sourceText = $testContent
    lessonType = "travel"
    studentLevel = "B2"
    targetLanguage = "english"
} | ConvertTo-Json

Write-Host "🚀 Sending request to /api/generate-lesson..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/generate-lesson" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 300 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Lesson generated successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Check if grammar section exists
    if ($result.lesson.grammar) {
        Write-Host "✅ Grammar section present" -ForegroundColor Green
        Write-Host "   Focus: $($result.lesson.grammar.focus)" -ForegroundColor White
        Write-Host "   Examples: $($result.lesson.grammar.examples.Count)" -ForegroundColor White
        Write-Host "   Exercises: $($result.lesson.grammar.exercises.Count)" -ForegroundColor White
    } else {
        Write-Host "❌ Grammar section missing!" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📊 Lesson Structure:" -ForegroundColor Cyan
    $result.lesson.PSObject.Properties | ForEach-Object {
        Write-Host "   • $($_.Name)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "✅ TEST PASSED: Lesson generation completed without MAX_TOKENS error" -ForegroundColor Green
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Request failed with status: $statusCode" -ForegroundColor Red
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ""
        Write-Host "📄 Error Details:" -ForegroundColor Yellow
        Write-Host $errorDetails.error -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "❌ TEST FAILED" -ForegroundColor Red
    exit 1
}

Write-Host ""
