# Test public lessons API
Write-Host "Testing public lessons API..." -ForegroundColor Cyan

$apiUrl = "http://localhost:3001/api/public-lessons/list"

Write-Host "`nCalling: $apiUrl" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
    
    Write-Host "`nAPI Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
    if ($response.success) {
        Write-Host "`nFound $($response.lessons.Count) lessons" -ForegroundColor Green
    } else {
        Write-Host "`nAPI returned error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "`nError calling API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nResponse body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
