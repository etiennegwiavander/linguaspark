# Check public lessons in database
Write-Host "Checking public lessons in database..." -ForegroundColor Cyan

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

Write-Host "`nSupabase URL: $supabaseUrl" -ForegroundColor Yellow

# Check public lessons count
Write-Host "`nFetching public lessons..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/public_lessons?select=id,title,lesson_type,cefr_level,created_at&order=created_at.desc&limit=10" `
    -Headers @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
    } `
    -Method Get

Write-Host "`nFound $($response.Count) public lessons:" -ForegroundColor Green

if ($response.Count -eq 0) {
    Write-Host "No public lessons found in database!" -ForegroundColor Red
    Write-Host "`nThis means you need to create a lesson and save it to the public library." -ForegroundColor Yellow
} else {
    $response | ForEach-Object {
        Write-Host "`n- ID: $($_.id)" -ForegroundColor White
        Write-Host "  Title: $($_.title)" -ForegroundColor White
        Write-Host "  Type: $($_.lesson_type)" -ForegroundColor White
        Write-Host "  Level: $($_.cefr_level)" -ForegroundColor White
        Write-Host "  Created: $($_.created_at)" -ForegroundColor White
    }
}

Write-Host "`nDone!" -ForegroundColor Green
