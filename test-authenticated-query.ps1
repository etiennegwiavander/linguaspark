# Test if authenticated user can query lessons
Write-Host "=== Testing Authenticated Lessons Query ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening test endpoint in browser..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will test if your authenticated session can query lessons." -ForegroundColor White
Write-Host ""

# Open the test endpoint in default browser
Start-Process "http://localhost:3000/api/test-lessons-direct"

Write-Host "✅ Browser opened to: http://localhost:3000/api/test-lessons-direct" -ForegroundColor Green
Write-Host ""
Write-Host "What to look for in the browser:" -ForegroundColor Yellow
Write-Host "  ✅ success: true - Authentication and query worked" -ForegroundColor White
Write-Host "  ✅ lessons: [] - No lessons found (expected if you haven't created any)" -ForegroundColor White
Write-Host "  ❌ error: 'No authenticated user' - You need to sign in first" -ForegroundColor White
Write-Host "  ❌ error: 'Auth error' - Session expired, sign in again" -ForegroundColor White
Write-Host ""
Write-Host "If you see 'No authenticated user':" -ForegroundColor Yellow
Write-Host "  1. Go to http://localhost:3000" -ForegroundColor White
Write-Host "  2. Sign in with your account" -ForegroundColor White
Write-Host "  3. Then try this test again" -ForegroundColor White
