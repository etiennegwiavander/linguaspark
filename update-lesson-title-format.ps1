# Update Lesson Title Format
# New format: "Original Article Title - AI Generated Lesson Title"

Write-Host "Updating lesson title format..." -ForegroundColor Cyan

# Update the lesson generator server file
$lessonGenFile = "lib/lesson-ai-generator-server.ts"

if (Test-Path $lessonGenFile) {
    $content = Get-Content $lessonGenFile -Raw
    
    # Find where the lesson title is generated and update the format
    # Look for the title generation section
    
    Write-Host "✓ Found lesson generator file" -ForegroundColor Green
    Write-Host "  Manual update needed in lib/lesson-ai-generator-server.ts" -ForegroundColor Yellow
    Write-Host "  Change title format to: sourceTitle + ' - ' + aiGeneratedTitle" -ForegroundColor Yellow
} else {
    Write-Host "✗ Could not find $lessonGenFile" -ForegroundColor Red
}

# Update the lesson display component
$lessonDisplayFile = "components/lesson-generator.tsx"

if (Test-Path $lessonDisplayFile) {
    Write-Host "✓ Found lesson display component" -ForegroundColor Green
    Write-Host "  Will need to display bannerImage at the top" -ForegroundColor Yellow
} else {
    Write-Host "✗ Could not find $lessonDisplayFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary of changes needed:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Content Extraction (content.js):" -ForegroundColor White
Write-Host "   ✓ Extract images with scoring algorithm" -ForegroundColor Green
Write-Host "   ✓ Select best image as bannerImage" -ForegroundColor Green
Write-Host "   ✓ Include in extracted content data" -ForegroundColor Green
Write-Host ""
Write-Host "2. Lesson Title Format:" -ForegroundColor White
Write-Host "   • Change from: 'Discussion Lesson - B1 Level'" -ForegroundColor Red
Write-Host "   • Change to: 'Article Title - AI Generated Title'" -ForegroundColor Green
Write-Host ""
Write-Host "3. Lesson Display:" -ForegroundColor White
Write-Host "   • Add banner image at top of lesson" -ForegroundColor Yellow
Write-Host "   • Use bannerImage URL from extracted content" -ForegroundColor Yellow
Write-Host "   • Fallback to no image if not available" -ForegroundColor Yellow
Write-Host ""
