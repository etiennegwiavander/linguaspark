# Test lesson structure
Write-Host "Fetching lesson structure..." -ForegroundColor Cyan

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

# Get first lesson
$response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/public_lessons?select=*&limit=1" `
    -Headers @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
    } `
    -Method Get

Write-Host "`nLesson structure:" -ForegroundColor Green
$response[0] | ConvertTo-Json -Depth 10
