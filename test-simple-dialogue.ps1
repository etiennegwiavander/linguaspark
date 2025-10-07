# Simple test for dialogue generation
Write-Host "Testing Simple Dialogue Generation..." -ForegroundColor Cyan

$body = @{
    content = "The Olympic Games bring together athletes from around the world."
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "English"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-dialogue-complexity" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}
