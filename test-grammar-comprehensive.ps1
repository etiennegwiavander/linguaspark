Write-Host "Testing Comprehensive Grammar Section Generation..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-grammar-comprehensive" -Method Get

Write-Host "Test Results:" -ForegroundColor Green
Write-Host "=============" -ForegroundColor Green
Write-Host ""

Write-Host "Summary: $($response.summary.passed)/$($response.summary.total) tests passed" -ForegroundColor $(if ($response.summary.passed -eq $response.summary.total) { "Green" } else { "Yellow" })
Write-Host ""

foreach ($result in $response.results) {
    $status = if ($result.passed) { "✅ PASSED" } else { "❌ FAILED" }
    $color = if ($result.passed) { "Green" } else { "Red" }
    
    Write-Host "$status - $($result.description)" -ForegroundColor $color
    Write-Host "  Level: $($result.level)" -ForegroundColor White
    Write-Host "  Grammar Point: $($result.grammarPoint)" -ForegroundColor White
    Write-Host "  Examples: $($result.exampleCount) (minimum 5 required)" -ForegroundColor $(if ($result.validation.meetsMinimumExamples) { "Green" } else { "Red" })
    Write-Host "  Exercises: $($result.exerciseCount) (minimum 5 required)" -ForegroundColor $(if ($result.validation.meetsMinimumExercises) { "Green" } else { "Red" })
    Write-Host ""
    Write-Host "  Explanation:" -ForegroundColor Cyan
    Write-Host "    Form: $($result.explanation.form)" -ForegroundColor Gray
    Write-Host "    Usage: $($result.explanation.usage)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Sample Example: $($result.sampleExample)" -ForegroundColor Gray
    Write-Host "  Sample Exercise: $($result.sampleExercise.prompt)" -ForegroundColor Gray
    Write-Host "    Answer: $($result.sampleExercise.answer)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  Validation Details:" -ForegroundColor Cyan
    Write-Host "    Has Grammar Point: $($result.validation.hasGrammarPoint)" -ForegroundColor $(if ($result.validation.hasGrammarPoint) { "Green" } else { "Red" })
    Write-Host "    Has Form Explanation: $($result.validation.hasForm)" -ForegroundColor $(if ($result.validation.hasForm) { "Green" } else { "Red" })
    Write-Host "    Has Usage Explanation: $($result.validation.hasUsage)" -ForegroundColor $(if ($result.validation.hasUsage) { "Green" } else { "Red" })
    Write-Host "    Meets Minimum Examples (5): $($result.validation.meetsMinimumExamples)" -ForegroundColor $(if ($result.validation.meetsMinimumExamples) { "Green" } else { "Red" })
    Write-Host "    Meets Minimum Exercises (5): $($result.validation.meetsMinimumExercises)" -ForegroundColor $(if ($result.validation.meetsMinimumExercises) { "Green" } else { "Red" })
    Write-Host "    Exercises Have Answers: $($result.validation.exercisesHaveAnswers)" -ForegroundColor $(if ($result.validation.exercisesHaveAnswers) { "Green" } else { "Red" })
    Write-Host ""
    Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "Requirements Coverage:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
foreach ($req in $response.requirements.PSObject.Properties) {
    Write-Host "  $($req.Name): $($req.Value)" -ForegroundColor White
}
Write-Host ""

if ($response.summary.passed -eq $response.summary.total) {
    Write-Host "✅ All tests passed! Grammar section generation is working correctly." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Review the results above." -ForegroundColor Yellow
}
