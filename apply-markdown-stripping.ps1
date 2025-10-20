# PowerShell script to apply stripMarkdown() to all text fields in Word export
# This ensures no markdown asterisks appear in exported documents

$filePath = "lib/export-utils.ts"
$content = Get-Content $filePath -Raw

# Pattern to match text: followed by template literals or strings that might contain variables
# We'll wrap these with stripMarkdown()

# List of patterns to replace (being conservative to avoid breaking code)
$replacements = @(
    # Questions and content with variables
    @{ Pattern = 'text: question,'; Replacement = 'text: stripMarkdown(question),' }
    @{ Pattern = 'text: `\$\{index\}\. \$\{question\}`,'; Replacement = 'text: stripMarkdown(`${index}. ${question}`),' }
    @{ Pattern = 'text: item\.meaning,'; Replacement = 'text: stripMarkdown(item.meaning),' }
    @{ Pattern = 'text: `\$\{index \+ 1\}\. \$\{item\.word\}`,'; Replacement = 'text: stripMarkdown(`${index + 1}. ${item.word}`),' }
    @{ Pattern = 'text: `   Meaning: \$\{item\.meaning\}`,'; Replacement = 'text: stripMarkdown(`   Meaning: ${item.meaning}`),' }
    @{ Pattern = 'text: `      \$\{exIndex \+ 1\}\. ""\$\{example\}"`,'; Replacement = 'text: stripMarkdown(`      ${exIndex + 1}. "${example}"`),' }
    @{ Pattern = 'text: `   Example: ""\$\{item\.example\}"`,'; Replacement = 'text: stripMarkdown(`   Example: "${item.example}"`),' }
    @{ Pattern = 'text: parts\[0\],'; Replacement = 'text: stripMarkdown(parts[0]),' }
    @{ Pattern = 'text: parts\.slice\(1\)\.join'; Replacement = 'text: stripMarkdown(parts.slice(1).join' }
    @{ Pattern = 'text: readingText,'; Replacement = 'text: stripMarkdown(readingText),' }
    @{ Pattern = 'text: line\.line,'; Replacement = 'text: stripMarkdown(line.line),' }
    @{ Pattern = 'text: `\$\{index \+ 1\}\. \$\{question\}`,'; Replacement = 'text: stripMarkdown(`${index + 1}. ${question}`),' }
    @{ Pattern = 'text: `• \$\{example\}`,'; Replacement = 'text: stripMarkdown(`• ${example}`),' }
    @{ Pattern = 'text: `\$\{index \+ 1\}\. \$\{exercise\}`,'; Replacement = 'text: stripMarkdown(`${index + 1}. ${exercise}`),' }
)

Write-Host "Applying stripMarkdown() to text fields..."
Write-Host "Original file size: $($content.Length) characters"

foreach ($replacement in $replacements) {
    $pattern = $replacement.Pattern
    $newValue = $replacement.Replacement
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $newValue
        Write-Host "✓ Applied: $pattern"
    }
}

# Save the modified content
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "`nCompleted! Modified file size: $($content.Length) characters"
Write-Host "Please review the changes in lib/export-utils.ts"
