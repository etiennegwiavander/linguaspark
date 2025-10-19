# Add alternating background colors to instruction sections
$filePath = "components/lesson-display.tsx"
$content = Get-Content $filePath -Raw

# Pattern to match instruction paragraphs (after removing bg-muted/30)
$instructionPattern = 'text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 rounded-sm"'

# Counter for alternating colors
$counter = 0
$colors = @('#EEF7DC', '#F1FAFF')  # Light green and light blue

# Replace each instruction with alternating colors
$content = [regex]::Replace($content, $instructionPattern, {
    param($match)
    $color = $colors[$script:counter % 2]
    $script:counter++
    return "text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm`" style={{ backgroundColor: '$color' }}"
})

Set-Content -Path $filePath -Value $content

Write-Host "✅ Instruction colors added successfully!" -ForegroundColor Green
Write-Host "Applied alternating colors:" -ForegroundColor Cyan
Write-Host "  - #EEF7DC (light green)" -ForegroundColor White
Write-Host "  - #F1FAFF (light blue)" -ForegroundColor White
