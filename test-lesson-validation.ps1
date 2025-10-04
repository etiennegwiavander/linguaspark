# Test Content Validation in Lesson Generation API
Write-Host "Testing Content Validation in Lesson Generation..." -ForegroundColor Green

# Test with invalid content (too short)
Write-Host "`nTest: Lesson generation with invalid content" -ForegroundColor Yellow
$invalidLessonRequest = @{
    sourceText = "Too short."
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "English"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/generate-lesson" -Method POST -Body $invalidLessonRequest -ContentType "application/json"
    Write-Host "Unexpected success - validation should have failed" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Expected validation failure:" -ForegroundColor Green
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Error Details: $($_.ErrorDetails.Message)" -ForegroundColor Cyan
    
    # Try to parse JSON if possible
    try {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorResponse | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "Raw error message: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`nContent validation integration test completed!" -ForegroundColor Green