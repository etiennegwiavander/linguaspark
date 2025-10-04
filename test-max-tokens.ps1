$body = @{
    sourceText = "A South African minister recently made controversial comments that have sparked widespread criticism. The minister used language that many consider inappropriate and offensive. This incident has led to calls for accountability and has highlighted ongoing issues around respectful communication in politics. The public reaction has been swift and strong, with many demanding an apology and better standards from political leaders."
    lessonType = "discussion"
    studentLevel = "A2"
    targetLanguage = "english"
} | ConvertTo-Json

Write-Host "Testing MAX_TOKENS fixes..."
Write-Host "Request body length: $($body.Length) characters"

# Test simple validation first
Write-Host "Testing simple validation..." -ForegroundColor Cyan
try {
    $simpleResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/test-simple-fix" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Simple validation passed!" -ForegroundColor Green
    Write-Host "Response: $($simpleResponse | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "❌ Simple validation failed: $($_.Exception.Message)" -ForegroundColor Red
    return
}

# Now test the full MAX_TOKENS fix
Write-Host "`nTesting MAX_TOKENS fixes..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-max-tokens-fix" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}