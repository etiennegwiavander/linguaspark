#!/usr/bin/env pwsh

Write-Host "🧪 Testing Full Error Flow with Real AI Generation..." -ForegroundColor Cyan

# Test with content that might cause AI generation issues
Write-Host "`n📋 Testing with problematic content..." -ForegroundColor Yellow

$problematicBody = @{
    sourceText = "a b c d e f g h i j"  # Very short, low-quality content
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "Spanish"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-lesson" -Method POST -Body $problematicBody -ContentType "application/json"
    
    if (-not $response.success) {
        Write-Host "✅ Error handling working for problematic content" -ForegroundColor Green
        Write-Host "   Error Type: $($response.error.type)" -ForegroundColor White
        Write-Host "   Message: $($response.error.message)" -ForegroundColor White
        Write-Host "   Error ID: $($response.error.errorId)" -ForegroundColor White
        Write-Host "   Has Actionable Steps: $($response.error.actionableSteps.Count -gt 0)" -ForegroundColor White
    } else {
        Write-Host "⚠️  Unexpected success - content should have failed validation" -ForegroundColor Yellow
        Write-Host "   Generated lesson with sections: $($response.lesson.sections | Get-Member -MemberType NoteProperty | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor White
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.success -eq $false) {
        Write-Host "✅ Error handling working correctly" -ForegroundColor Green
        Write-Host "   Error Type: $($errorResponse.error.type)" -ForegroundColor White
        Write-Host "   Message: $($errorResponse.error.message)" -ForegroundColor White
        Write-Host "   Error ID: $($errorResponse.error.errorId)" -ForegroundColor White
    } else {
        Write-Host "❌ Unexpected error format: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📋 Testing with valid content to ensure success path still works..." -ForegroundColor Yellow

$validBody = @{
    sourceText = "Climate change is one of the most pressing issues of our time. Scientists around the world have been studying the effects of global warming on our planet. The evidence shows that human activities, particularly the burning of fossil fuels, are the primary cause of recent climate changes. Rising temperatures are causing ice caps to melt, sea levels to rise, and weather patterns to become more extreme. Many countries are now implementing policies to reduce carbon emissions and transition to renewable energy sources. Individual actions, such as using public transportation, reducing energy consumption, and supporting sustainable practices, can also make a significant difference in combating climate change."
    lessonType = "discussion"
    studentLevel = "B1"
    targetLanguage = "Spanish"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-lesson" -Method POST -Body $validBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Success path still working correctly" -ForegroundColor Green
        Write-Host "   Generated lesson type: $($response.lesson.lessonType)" -ForegroundColor White
        Write-Host "   Student level: $($response.lesson.studentLevel)" -ForegroundColor White
        Write-Host "   Target language: $($response.lesson.targetLanguage)" -ForegroundColor White
        Write-Host "   Sections generated: $($response.lesson.sections | Get-Member -MemberType NoteProperty | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor White
    } else {
        Write-Host "❌ Valid content failed: $($response.error.message)" -ForegroundColor Red
        Write-Host "   Error ID: $($response.error.errorId)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error Type: $($errorResponse.error.type)" -ForegroundColor White
        Write-Host "   Error ID: $($errorResponse.error.errorId)" -ForegroundColor White
    }
}

Write-Host "`n🏁 Full error flow tests completed!" -ForegroundColor Cyan