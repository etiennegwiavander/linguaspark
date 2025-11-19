# Admin User Setup Verification Script
# This script helps you verify your admin user is set up correctly

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Admin User Setup Verification" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
    
    # Read Supabase URL
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=(.+)") {
        $supabaseUrl = $matches[1].Trim()
        Write-Host "✅ Supabase URL configured: $supabaseUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)") {
        Write-Host "✅ Supabase Anon Key configured" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "   Create .env.local with your Supabase credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Create Admin User in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   - Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   - Navigate to: Authentication → Users" -ForegroundColor White
Write-Host "   - Click: 'Add user'" -ForegroundColor White
Write-Host "   - Email: admin@admin.com" -ForegroundColor White
Write-Host "   - Password: admin123" -ForegroundColor White
Write-Host "   - Auto Confirm User: ✅ YES" -ForegroundColor Green
Write-Host ""

Write-Host "2. Set Admin Flag in SQL Editor:" -ForegroundColor Yellow
Write-Host "   - Go to: SQL Editor in Supabase Dashboard" -ForegroundColor White
Write-Host "   - Run the script in: scripts/010_create_admin_user.sql" -ForegroundColor White
Write-Host ""

Write-Host "3. Verify Admin User:" -ForegroundColor Yellow
Write-Host "   Run this SQL query:" -ForegroundColor White
Write-Host ""
Write-Host "   SELECT " -ForegroundColor Gray
Write-Host "       u.email," -ForegroundColor Gray
Write-Host "       u.email_confirmed_at," -ForegroundColor Gray
Write-Host "       t.is_admin" -ForegroundColor Gray
Write-Host "   FROM auth.users u" -ForegroundColor Gray
Write-Host "   LEFT JOIN tutors t ON u.id = t.id" -ForegroundColor Gray
Write-Host "   WHERE u.email = 'admin@admin.com';" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Test Login:" -ForegroundColor Yellow
Write-Host "   - Start dev server: npm run dev" -ForegroundColor White
Write-Host "   - Navigate to: http://localhost:3000/auth/admin/login" -ForegroundColor White
Write-Host "   - Email: admin@admin.com" -ForegroundColor White
Write-Host "   - Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Documentation" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor White
Write-Host "  - ADMIN_USER_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "  - scripts/010_create_admin_user.sql" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
