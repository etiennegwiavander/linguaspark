# LinguaSpark Environment Setup Script
# Run this script to securely set up your environment variables

Write-Host "🚀 LinguaSpark Environment Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Found existing .env.local file" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to update it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Please provide the following credentials:" -ForegroundColor Cyan
Write-Host ""

# Supabase Configuration
Write-Host "🔗 SUPABASE CONFIGURATION" -ForegroundColor Magenta
Write-Host "Get these from: https://supabase.com/dashboard/project/_/settings/api" -ForegroundColor Gray
$supabaseUrl = Read-Host "Enter your Supabase Project URL"
$supabaseKey = Read-Host "Enter your Supabase anon/public key"

Write-Host ""

# Google AI Configuration
Write-Host "🤖 GOOGLE AI CONFIGURATION" -ForegroundColor Magenta
Write-Host "Get this from: https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
$googleApiKey = Read-Host "Enter your Google AI API Key"

Write-Host ""

# Validate inputs
if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or 
    [string]::IsNullOrWhiteSpace($supabaseKey) -or 
    [string]::IsNullOrWhiteSpace($googleApiKey)) {
    Write-Host "❌ All fields are required!" -ForegroundColor Red
    exit 1
}

# Validate Supabase URL format
if (-not $supabaseUrl.StartsWith("https://") -or -not $supabaseUrl.Contains(".supabase.co")) {
    Write-Host "❌ Invalid Supabase URL format. Should be: https://your-project.supabase.co" -ForegroundColor Red
    exit 1
}

# Create .env.local content
$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey

# Google AI Configuration
NEXT_PUBLIC_GOOGLE_AI_API_KEY=$googleApiKey
NEXT_PUBLIC_GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com

# Development Configuration
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
"@

# Write to .env.local
try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Environment variables saved to .env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔒 SECURITY REMINDERS:" -ForegroundColor Yellow
    Write-Host "• Never commit .env.local to version control" -ForegroundColor Gray
    Write-Host "• Keep your API keys secure and private" -ForegroundColor Gray
    Write-Host "• Regularly rotate your API keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run build" -ForegroundColor Gray
    Write-Host "2. Load the extension in Chrome from the 'dist' folder" -ForegroundColor Gray
    Write-Host "3. Set up your Supabase database using the SQL script" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to write .env.local file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}