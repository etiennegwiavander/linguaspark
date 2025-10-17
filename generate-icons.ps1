# Generate simple PNG icons for LinguaSpark Chrome Extension
# This creates basic colored square icons with text

Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$Size,
        [string]$OutputPath
    )
    
    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Enable anti-aliasing
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Create gradient brush
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $color1 = [System.Drawing.Color]::FromArgb(102, 126, 234)  # #667eea
    $color2 = [System.Drawing.Color]::FromArgb(118, 75, 162)   # #764ba2
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 45)
    
    # Fill circle background
    $graphics.FillEllipse($brush, 0, 0, $Size, $Size)
    
    # Add text/symbol
    $fontSize = [Math]::Max($Size * 0.4, 8)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Center the text
    $text = "S"
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = ($Size - $textSize.Height) / 2
    
    $graphics.DrawString($text, $font, $textBrush, $x, $y)
    
    # Save as PNG
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    
    Write-Host "Created icon: $OutputPath"
}

# Create icons directory if it doesn't exist
if (!(Test-Path "icons")) {
    New-Item -ItemType Directory -Path "icons"
}

# Generate all required icon sizes
Create-Icon -Size 16 -OutputPath "icons/icon16.png"
Create-Icon -Size 32 -OutputPath "icons/icon32.png"
Create-Icon -Size 48 -OutputPath "icons/icon48.png"
Create-Icon -Size 128 -OutputPath "icons/icon128.png"

Write-Host "All icons generated successfully!"
Write-Host "You can now load the Chrome extension."