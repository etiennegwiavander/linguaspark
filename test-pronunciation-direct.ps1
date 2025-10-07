# Test direct pronunciation AI call

Write-Host "Testing Direct Pronunciation AI Call" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    word = "achievement"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-pronunciation-direct" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"

    Write-Host "✓ Request successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "Word: $($response.word)" -ForegroundColor Yellow
    Write-Host "Response Length: $($response.responseLength) characters" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "AI Response:" -ForegroundColor Cyan
    Write-Host $response.response -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "✗ Request failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test Complete!" -ForegroundColor Green
