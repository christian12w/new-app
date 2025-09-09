# AFZ Member Hub - Supabase Database Setup Script
# This script helps set up the complete database schema for the member portal

Write-Host "🚀 AFZ Member Hub - Database Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Supabase connection details
$SUPABASE_URL = "https://vzkbvhqvrazbxbhkynfy.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J2aHF2cmF6YnhiaGt5bmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg3MTEsImV4cCI6MjA3Mjc0NDcxMX0.e0SZ_Jl1BRDiAyOqYUDY1jKCphKTeYg2UseVMzMJ-ak"

Write-Host "📋 Database Schema Setup Instructions" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open your Supabase Dashboard:" -ForegroundColor White
Write-Host "   → Go to: $SUPABASE_URL/project/default/editor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to the SQL Editor:" -ForegroundColor White
Write-Host "   → Click on 'SQL Editor' in the left sidebar" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run the Database Schema:" -ForegroundColor White
Write-Host "   → Copy the contents of: database\setup-schema.sql" -ForegroundColor Gray
Write-Host "   → Paste into the SQL Editor" -ForegroundColor Gray
Write-Host "   → Click 'Run' to execute the schema" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Alternative: Supabase CLI Setup" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

# Check if Supabase CLI is installed
$supabaseCLI = Get-Command "supabase" -ErrorAction SilentlyContinue

if ($supabaseCLI) {
    Write-Host "✅ Supabase CLI is installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run these commands to set up the database:" -ForegroundColor White
    Write-Host "1. supabase login" -ForegroundColor Gray
    Write-Host "2. supabase link --project-ref vzkbvhqvrazbxbhkynfy" -ForegroundColor Gray
    Write-Host "3. supabase db reset" -ForegroundColor Gray
    Write-Host ""
    
    $runSetup = Read-Host "Would you like to run the CLI setup now? (y/N)"
    if ($runSetup -eq "y" -or $runSetup -eq "Y") {
        Write-Host "🔄 Running Supabase CLI setup..." -ForegroundColor Cyan
        
        # Login to Supabase
        Write-Host "Please login to Supabase CLI..." -ForegroundColor Yellow
        supabase login
        
        # Link project
        Write-Host "Linking to your Supabase project..." -ForegroundColor Yellow
        supabase link --project-ref vzkbvhqvrazbxbhkynfy
        
        # Apply migrations if they exist
        if (Test-Path ".\supabase\migrations") {
            Write-Host "Applying database migrations..." -ForegroundColor Yellow
            supabase db push
        } else {
            Write-Host "No migrations folder found. Please run the SQL manually." -ForegroundColor Orange
        }
    }
} else {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use the manual method above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Database Schema Overview" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow
Write-Host "The schema includes:" -ForegroundColor White
Write-Host "• User profiles with roles and preferences" -ForegroundColor Gray
Write-Host "• Events system with RSVP functionality" -ForegroundColor Gray
Write-Host "• Resource library with categories" -ForegroundColor Gray
Write-Host "• Real-time chat system" -ForegroundColor Gray
Write-Host "• Notification system" -ForegroundColor Gray
Write-Host "• User connections/networking" -ForegroundColor Gray
Write-Host "• Content moderation tools" -ForegroundColor Gray
Write-Host "• File storage integration" -ForegroundColor Gray
Write-Host "• Row Level Security (RLS)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔐 Security Features" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host "• Row Level Security (RLS) enabled on all tables" -ForegroundColor Gray
Write-Host "• User-based access controls" -ForegroundColor Gray
Write-Host "• Role-based permissions (member, moderator, admin)" -ForegroundColor Gray
Write-Host "• Content moderation system" -ForegroundColor Gray
Write-Host ""

Write-Host "⚡ Performance Optimizations" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host "• Optimized indexes for fast queries" -ForegroundColor Gray
Write-Host "• Real-time subscriptions for live updates" -ForegroundColor Gray
Write-Host "• Efficient data relationships" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 Next Steps After Database Setup" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "1. Verify tables were created successfully" -ForegroundColor White
Write-Host "2. Test authentication with the member portal" -ForegroundColor White
Write-Host "3. Create your first admin user" -ForegroundColor White
Write-Host "4. Test real-time features (chat, notifications)" -ForegroundColor White
Write-Host "5. Upload test resources and create events" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Ready to launch your AFZ Member Hub!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""

# Open schema file for easy copying
$schemaPath = ".\database\setup-schema.sql"
if (Test-Path $schemaPath) {
    $openFile = Read-Host "Would you like to open the schema file now? (y/N)"
    if ($openFile -eq "y" -or $openFile -eq "Y") {
        Start-Process "notepad.exe" -ArgumentList $schemaPath
    }
}

Write-Host "📝 Setup completed! Check the instructions above." -ForegroundColor Cyan