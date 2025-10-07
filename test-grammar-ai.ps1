Write-Host "Testing AI-Powered Grammar Generation..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-grammar-ai-generation" -Method Get

if ($response.success) {
    Write-Host "✅ Test Completed Successfully" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Grammar Point: $($response.grammarPoint)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Explanation:" -ForegroundColor Cyan
    Write-Host "  Form: $($response.explanation.form)" -ForegroundColor Gray
    Write-Host "  Usage: $($response.explanation.usage)" -ForegroundColor Gray
    if ($response.explanation.levelNotes) {
        Write-Host "  Level Notes: $($response.explanation.levelNotes)" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "Content Counts:" -ForegroundColor Cyan
    Write-Host "  Examples: $($response.exampleCount) (minimum 5 required)" -ForegroundColor $(if ($response.validation.meetsMinimumExamples) { "Green" } else { "Red" })
    Write-Host "  Exercises: $($response.exerciseCount) (minimum 5 required)" -ForegroundColor $(if ($response.validation.meetsMinimumExercises) { "Green" } else { "Red" })
    Write-Host ""
    
    Write-Host "Sample Example:" -ForegroundColor Cyan
    Write-Host "  $($response.sampleExample)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Sample Exercise:" -ForegroundColor Cyan
    Write-Host "  Prompt: $($response.sampleExercise.prompt)" -ForegroundColor Gray
    Write-Host "  Answer: $($response.sampleExercise.answer)" -ForegroundColor Gray
    if ($response.sampleExercise.explanation) {
        Write-Host "  Explanation: $($response.sampleExercise.explanation)" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "Validation Results:" -ForegroundColor Cyan
    Write-Host "  Has Grammar Point: $($response.validation.hasGrammarPoint)" -ForegroundColor $(if ($response.validation.hasGrammarPoint) { "Green" } else { "Red" })
    Write-Host "  Has Form Explanation: $($response.validation.hasForm)" -ForegroundColor $(if ($response.validation.hasForm) { "Green" } else { "Red" })
    Write-Host "  Has Usage Explanation: $($response.validation.hasUsage)" -ForegroundColor $(if ($response.validation.hasUsage) { "Green" } else { "Red" })
    Write-Host "  Meets Minimum Examples: $($response.validation.meetsMinimumExamples)" -ForegroundColor $(if ($response.validation.meetsMinimumExamples) { "Green" } else { "Red" })
    Write-Host "  Meets Minimum Exercises: $($response.validation.meetsMinimumExercises)" -ForegroundColor $(if ($response.validation.meetsMinimumExercises) { "Green" } else { "Red" })
    Write-Host "  Exercises Have Structure: $($response.validation.exercisesHaveStructure)" -ForegroundColor $(if ($response.validation.exercisesHaveStructure) { "Green" } else { "Red" })
    Write-Host "  Contextually Relevant: $($response.validation.isContextuallyRelevant)" -ForegroundColor $(if ($response.validation.isContextuallyRelevant) { "Green" } else { "Red" })
    Write-Host ""
    
    Write-Host "Requirements Coverage:" -ForegroundColor Cyan
    foreach ($req in $response.requirements.PSObject.Properties) {
        $status = if ($req.Value.met) { "✅" } else { "❌" }
        $color = if ($req.Value.met) { "Green" } else { "Red" }
        Write-Host "  $status $($req.Name): $($req.Value.requirement)" -ForegroundColor $color
    }
    Write-Host ""
    
    if ($response.allRequirementsMet) {
        Write-Host "✅ All requirements met! Grammar generation is working correctly." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some requirements not met. Review the validation results above." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Test Failed" -ForegroundColor Red
    Write-Host "Error: $($response.error)" -ForegroundColor Red
}
