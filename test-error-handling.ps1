#!/usr/bin/env pwsh

Write-Host "🧪 Testing Error Handling Implementation..." -ForegroundColor Cyan

# Test different error types
$errorTypes = @("quota", "content", "network", "unknown")

foreach ($errorType in $errorTypes) {
    Write-Host "`n📋 Testing $errorType error classification..." -ForegroundColor Yellow
    
    $body = @{
        errorType = $errorType
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-error-handling" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Error classification successful" -ForegroundColor Green
            Write-Host "   Error Type: $($response.test.classifiedError.type)" -ForegroundColor White
            Write-Host "   Error ID: $($response.test.classifiedError.errorId)" -ForegroundColor White
            Write-Host "   User Message: $($response.test.userMessage.message)" -ForegroundColor White
            Write-Host "   Actionable Steps: $($response.test.userMessage.actionableSteps.Count) steps provided" -ForegroundColor White
        } else {
            Write-Host "❌ Test failed: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Testing API route error handling with invalid request..." -ForegroundColor Yellow

# Test the actual API route with invalid data
$invalidBody = @{
    sourceText = ""  # Empty source text should trigger content validation error
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "Spanish"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-lesson" -Method POST -Body $invalidBody -ContentType "application/json"
    
    if (-not $response.success) {
        Write-Host "✅ API route error handling working correctly" -ForegroundColor Green
        Write-Host "   Error Type: $($response.error.type)" -ForegroundColor White
        Write-Host "   Message: $($response.error.message)" -ForegroundColor White
        Write-Host "   Error ID: $($response.error.errorId)" -ForegroundColor White
        Write-Host "   Actionable Steps: $($response.error.actionableSteps.Count) steps provided" -ForegroundColor White
    } else {
        Write-Host "❌ Expected error but got success response" -ForegroundColor Red
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.success -eq $false) {
        Write-Host "✅ API route error handling working correctly" -ForegroundColor Green
        Write-Host "   Error Type: $($errorResponse.error.type)" -ForegroundColor White
        Write-Host "   Message: $($errorResponse.error.message)" -ForegroundColor White
        Write-Host "   Error ID: $($errorResponse.error.errorId)" -ForegroundColor White
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Error handling tests completed!" -ForegroundColor Cyan