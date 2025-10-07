# Test script to verify Gemini model availability and response codes
# Tests: Gemini 1.5 Flash, Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 1.5 Flash Latest

Write-Host "🧪 Testing Gemini Model Availability" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Loaded environment variables from $envFile" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

$apiKey = $env:NEXT_PUBLIC_GOOGLE_AI_API_KEY
$baseUrl = $env:NEXT_PUBLIC_GOOGLE_AI_BASE_URL

if (-not $apiKey) {
    Write-Host "❌ NEXT_PUBLIC_GOOGLE_AI_API_KEY not found in environment!" -ForegroundColor Red
    exit 1
}

Write-Host "🔑 API Key: $($apiKey.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "🌐 Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Models to test - All known free Gemini models
$models = @(
    # Gemini 2.5 Series
    "gemini-2.5-flash",
    "gemini-2.5-flash-latest",
    "gemini-2.5-flash-exp",
    
    # Gemini 2.0 Series
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-latest",
    "gemini-2.0-flash-thinking-exp",
    "gemini-2.0-flash-thinking-exp-1219",
    
    # Gemini 1.5 Series
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash-8b-latest",
    "gemini-1.5-flash-8b-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    
    # Gemini 1.0 Series
    "gemini-1.0-pro",
    "gemini-1.0-pro-latest",
    "gemini-1.0-pro-001",
    
    # Legacy naming
    "gemini-pro",
    "gemini-pro-latest"
)

$testPrompt = "Say 'Hello' in one word."

$results = @()

foreach ($model in $models) {
    Write-Host "Testing: $model" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $url = "$baseUrl/v1beta/models/$($model):generateContent?key=$apiKey"
    
    $body = @{
        contents = @(
            @{
                parts = @(
                    @{
                        text = $testPrompt
                    }
                )
            }
        )
        generationConfig = @{
            temperature = 0.7
            maxOutputTokens = 100
            topP = 0.9
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        if ($content.candidates -and $content.candidates.Count -gt 0) {
            $generatedText = $content.candidates[0].content.parts[0].text
            
            Write-Host "✅ Status: $statusCode" -ForegroundColor Green
            Write-Host "📝 Response: $generatedText" -ForegroundColor White
            
            $results += [PSCustomObject]@{
                Model = $model
                Status = $statusCode
                Success = $true
                Response = $generatedText
                Error = $null
            }
        } else {
            Write-Host "⚠️ Status: $statusCode (No candidates in response)" -ForegroundColor Yellow
            
            $results += [PSCustomObject]@{
                Model = $model
                Status = $statusCode
                Success = $false
                Response = $null
                Error = "No candidates in response"
            }
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        Write-Host "❌ Status: $statusCode" -ForegroundColor Red
        Write-Host "❌ Error: $errorMessage" -ForegroundColor Red
        
        # Try to get more details from the response
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "📄 Error Details: $errorBody" -ForegroundColor Red
        }
        catch {
            # Ignore if we can't read error details
        }
        
        $results += [PSCustomObject]@{
            Model = $model
            Status = $statusCode
            Success = $false
            Response = $null
            Error = $errorMessage
        }
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500  # Small delay between requests
}

# Summary
Write-Host ""
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

$successCount = ($results | Where-Object { $_.Success -eq $true }).Count
$totalCount = $results.Count

Write-Host ""
Write-Host "✅ Successful: $successCount / $totalCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($successCount -gt 0) {
    Write-Host ""
    Write-Host "🎯 Recommended Models:" -ForegroundColor Cyan
    $results | Where-Object { $_.Success -eq $true } | ForEach-Object {
        Write-Host "  • $($_.Model)" -ForegroundColor Green
    }
}

Write-Host ""
