# Test the debug endpoint to see what's happening
Write-Host "Testing /api/debug-lessons endpoint..." -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$response = try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/debug-lessons" -UseBasicParsing -ErrorAction Stop
} catch {
    Write-Host "Error: Could not connect to dev server" -ForegroundColor Red
    Write-Host "Make sure your Next.js dev server is running (npm run dev)" -ForegroundColor Yellow
    exit 1
}

# Parse and display the response
$data = $response.Content | ConvertFrom-Json

Write-Host "=== DEBUG RESULTS ===" -ForegroundColor Green
Write-Host ""

if ($data.success) {
    Write-Host "User Information:" -ForegroundColor Cyan
    Write-Host "  Email: $($data.user.email)"
    Write-Host "  ID: $($data.user.id)"
    Write-Host ""
    
    Write-Host "Your Lessons:" -ForegroundColor Cyan
    Write-Host "  Count: $($data.userLessons.count)"
    if ($data.userLessons.error) {
        Write-Host "  Error: $($data.userLessons.error.message)" -ForegroundColor Red
        Write-Host "  Code: $($data.userLessons.error.code)" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "All Lessons in Database:" -ForegroundColor Cyan
    Write-Host "  Count: $($data.allLessons.data.Count)"
    if ($data.allLessons.error) {
        Write-Host "  Error: $($data.allLessons.error.message)" -ForegroundColor Red
    }
    Write-Host ""
    
    if ($data.userLessons.count -eq 0 -and $data.allLessons.data.Count -gt 0) {
        Write-Host "WARNING: Lessons exist but not associated with your user!" -ForegroundColor Yellow
        Write-Host "This indicates an RLS or tutor profile issue." -ForegroundColor Yellow
    }
    
    if ($data.userLessons.count -eq 0 -and $data.allLessons.data.Count -eq 0) {
        Write-Host "INFO: No lessons in database yet. Generate one to test." -ForegroundColor Yellow
    }
    
    # Show full JSON for debugging
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor Cyan
    Write-Host ($data | ConvertTo-Json -Depth 10)
} else {
    Write-Host "ERROR: $($data.error)" -ForegroundColor Red
    if ($data.details) {
        Write-Host "Details: $($data.details)" -ForegroundColor Red
    }
}
