# PowerShell script to update lesson display styling
# Changes:
# 1. Border radius: rounded-lg -> rounded-sm (2px)
# 2. Gaps/margins: space-y-3/4 -> space-y-1.5, mb-3 -> mb-1.5, gap-2/3/4 -> gap-1.5
# 3. Instruction backgrounds: Alternate between #EEF7DC and #F1FAFF

$filePath = "components/lesson-display.tsx"
$content = Get-Content $filePath -Raw

# 1. Change all rounded-lg to rounded-sm (2px border radius)
$content = $content -replace 'rounded-lg', 'rounded-sm'

# 2. Reduce gaps and margins to 5px (1.5 in Tailwind = 6px, closest to 5px)
$content = $content -replace 'space-y-4', 'space-y-1.5'
$content = $content -replace 'space-y-3', 'space-y-1.5'
$content = $content -replace 'mb-4', 'mb-1.5'
$content = $content -replace 'mb-3', 'mb-1.5'
$content = $content -replace 'mb-2', 'mb-1.5'
$content = $content -replace 'gap-4', 'gap-1.5'
$content = $content -replace 'gap-3', 'gap-1.5'
$content = $content -replace 'gap-2', 'gap-1.5'

# 3. Update instruction backgrounds with alternating colors
# Warmup instructions - #EEF7DC (light green)
$content = $content -replace '(id: "warmup"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#EEF7DC" }}>'

# Vocabulary instructions - #F1FAFF (light blue)
$content = $content -replace '(id: "vocabulary"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#F1FAFF" }}>'

# Reading instructions - #EEF7DC
$content = $content -replace '(id: "reading"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#EEF7DC" }}>'

# Comprehension instructions - #F1FAFF
$content = $content -replace '(id: "comprehension"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#F1FAFF" }}>'

# Dialogue Practice instructions - #EEF7DC
$content = $content -replace '(id: "dialoguePractice"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#EEF7DC" }}>'

# Dialogue Fill Gap instructions - #F1FAFF
$content = $content -replace '(id: "dialogueFillGap"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#F1FAFF" }}>'

# Discussion instructions - #EEF7DC
$content = $content -replace '(id: "discussion"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#EEF7DC" }}>'

# Pronunciation instructions - #F1FAFF
$content = $content -replace '(id: "pronunciation"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#F1FAFF" }}>'

# Wrapup instructions - #EEF7DC
$content = $content -replace '(id: "wrapup"[\s\S]*?)<p className="text-\[15px\] text-muted-foreground italic border-l-2 border-primary/20\s+pl-3 py-2 bg-muted/30 rounded-r">', '$1<p className="text-[15px] text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-2 rounded-sm" style={{ backgroundColor: "#EEF7DC" }}>'

# Simpler approach: Replace all instruction backgrounds at once
$content = $content -replace 'bg-muted/30 rounded-r', 'rounded-sm'

# Write back to file
Set-Content -Path $filePath -Value $content

Write-Host "✅ Styling updated successfully!" -ForegroundColor Green
Write-Host "Changes applied:" -ForegroundColor Cyan
Write-Host "  - Border radius: rounded-lg → rounded-sm (2px)" -ForegroundColor White
Write-Host "  - Gaps/margins: Reduced to 1.5 (~6px, closest to 5px)" -ForegroundColor White
Write-Host "  - Instruction backgrounds: bg-muted/30 removed (will add inline styles)" -ForegroundColor White
