# Test Content Validation Implementation
Write-Host "Testing Content Validation..." -ForegroundColor Green

# Test 1: Valid content
Write-Host "`nTest 1: Valid content" -ForegroundColor Yellow
$validContent = @{
    content = "Climate change is one of the most pressing issues of our time. Scientists around the world have been studying the effects of global warming on our planet. The evidence shows that human activities, particularly the burning of fossil fuels, are the primary cause of rising temperatures. This has led to melting ice caps, rising sea levels, and more frequent extreme weather events. Governments and organizations are working together to find solutions and reduce carbon emissions."
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:3001/api/test-content-validation" -Method POST -Body $validContent -ContentType "application/json"
Write-Host "Valid content result:" -ForegroundColor Cyan
$response1 | ConvertTo-Json -Depth 3

# Test 2: Too short content
Write-Host "`nTest 2: Too short content" -ForegroundColor Yellow
$shortContent = @{
    content = "This is too short."
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:3001/api/test-content-validation" -Method POST -Body $shortContent -ContentType "application/json"
Write-Host "Short content result:" -ForegroundColor Cyan
$response2 | ConvertTo-Json -Depth 3

# Test 3: Poor quality content
Write-Host "`nTest 3: Poor quality content" -ForegroundColor Yellow
$poorContent = @{
    content = "word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word"
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "http://localhost:3001/api/test-content-validation" -Method POST -Body $poorContent -ContentType "application/json"
Write-Host "Poor quality content result:" -ForegroundColor Cyan
$response3 | ConvertTo-Json -Depth 3

# Test 4: Empty content
Write-Host "`nTest 4: Empty content" -ForegroundColor Yellow
$emptyContent = @{
    content = ""
} | ConvertTo-Json

$response4 = Invoke-RestMethod -Uri "http://localhost:3001/api/test-content-validation" -Method POST -Body $emptyContent -ContentType "application/json"
Write-Host "Empty content result:" -ForegroundColor Cyan
$response4 | ConvertTo-Json -Depth 3

Write-Host "`nContent validation tests completed!" -ForegroundColor Green