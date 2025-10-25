# Test Supabase Connection Script
# This script tests if the Supabase API is accessible

Write-Host "=== Testing Supabase Connection ===" -ForegroundColor Cyan
Write-Host ""

# Read environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "Reading .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$') {
            $supabaseUrl = $matches[1]
        }
        if ($_ -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$') {
            $supabaseKey = $matches[1]
        }
    }
} else {
    Write-Host "Error: .env.local not found!" -ForegroundColor Red
    exit 1
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Error: Supabase credentials not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host "API Key: $($supabaseKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Test 1: Check if Supabase API is reachable
Write-Host "Test 1: Checking Supabase API health..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Method Get -Headers @{
        "apikey" = $supabaseKey
    } -ErrorAction Stop
    Write-Host "✅ Supabase API is reachable" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to reach Supabase API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check if lessons table exists
Write-Host "Test 2: Checking if lessons table exists..." -ForegroundColor Cyan
try {
    $lessonsCheck = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/lessons?limit=1" -Method Get -Headers @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
    } -ErrorAction Stop
    Write-Host "✅ Lessons table exists and is accessible" -ForegroundColor Green
    Write-Host "   Found $($lessonsCheck.Count) lesson(s) in first query" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to access lessons table" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Test the local API endpoint
Write-Host "Test 3: Testing local API endpoint..." -ForegroundColor Cyan
Write-Host "Make sure your Next.js dev server is running on http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command in your browser or another terminal:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:3000/api/test-lessons-direct" -ForegroundColor White
Write-Host ""
Write-Host "Or open this URL in your browser:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000/api/test-lessons-direct" -ForegroundColor White

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000/library in your browser" -ForegroundColor White
Write-Host "2. Open DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "3. Look for requests to $supabaseUrl" -ForegroundColor White
Write-Host "4. Check the request/response details" -ForegroundColor White
