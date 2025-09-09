# AFZ Member Hub - Windows Setup Script
# PowerShell version for Windows users

Param(
    [string]$Action = \"\"
)

# Colors for console output
$Colors = @{
    Green = \"Green\"
    Yellow = \"Yellow\"
    Red = \"Red\"
    Blue = \"Cyan\"
    White = \"White\"
}

function Write-Success {
    param([string]$Message)
    Write-Host \"✓ $Message\" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host \"⚠ $Message\" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host \"✗ $Message\" -ForegroundColor $Colors.Red
}

function Write-Info {
    param([string]$Message)
    Write-Host \"ℹ $Message\" -ForegroundColor $Colors.Blue
}

function Write-Header {
    param([string]$Message)
    Write-Host \"\"
    Write-Host $Message -ForegroundColor $Colors.White
    Write-Host (\"=\" * $Message.Length) -ForegroundColor $Colors.Blue
    Write-Host \"\"
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header \"Checking Prerequisites\"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success \"Node.js is installed: $nodeVersion\"
    }
    catch {
        Write-Error \"Node.js is not installed. Please install Node.js first.\"
        Write-Info \"Download from: https://nodejs.org/\"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success \"npm is installed: v$npmVersion\"
    }
    catch {
        Write-Error \"npm is not installed. Please install npm first.\"
        return $false
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Success \"Git is installed: $gitVersion\"
    }
    catch {
        Write-Warning \"Git is not installed. Some features may not work.\"
        Write-Info \"Download from: https://git-scm.com/download/win\"
    }
    
    return $true
}

# Setup development environment
function Initialize-Development {
    Write-Header \"Setting Up Development Environment\"
    
    # Install serve globally if not present
    try {
        $serveCheck = npm list -g serve 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success \"Serve is already installed globally\"
        }
        else {
            Write-Info \"Installing serve for local development...\"
            npm install -g serve
            Write-Success \"Serve installed globally\"
        }
    }
    catch {
        Write-Warning \"Could not check/install serve. You may need to run as administrator.\"
    }
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path \".env\")) {
        Write-Info \"Creating .env file...\"
        
        $envContent = @\"
# AFZ Member Hub Environment Configuration

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Development Settings
DEV_PORT=8080
DEV_HOST=localhost

# Feature Flags
ENABLE_REAL_TIME=true
ENABLE_NOTIFICATIONS=true
ENABLE_FILE_UPLOAD=true

# Email Configuration (for notifications)
EMAIL_FROM=noreply@afz-zambia.org
EMAIL_SUPPORT=support@afz-zambia.org
\"@
        
        $envContent | Out-File -FilePath \".env\" -Encoding UTF8
        Write-Success \"Created .env file with default configuration\"
        Write-Warning \"Please update the .env file with your actual Supabase credentials\"
    }
    else {
        Write-Success \".env file already exists\"
    }
}

# Validate configuration
function Test-Configuration {
    Write-Header \"Validating Configuration\"
    
    # Check Supabase configuration
    if (Test-Path \"js\\supabaseClient.js\") {
        $supabaseContent = Get-Content \"js\\supabaseClient.js\" -Raw
        if ($supabaseContent -match \"your-project\\.supabase\\.co\") {
            Write-Warning \"Supabase URL not configured in js\\supabaseClient.js\"
            Write-Info \"          Please update with your actual Supabase project URL\"
        }
        else {
            Write-Success \"Supabase client appears to be configured\"
        }
    }
    else {
        Write-Error \"Supabase client file not found: js\\supabaseClient.js\"
    }
    
    # Check required files
    $requiredFiles = @(
        \"pages\\member-hub.html\",
        \"js\\member-hub.js\",
        \"js\\supabaseClient.js\",
        \"css\\member-hub.css\",
        \"database\\supabase-schema.sql\"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success \"Found $file\"
        }
        else {
            Write-Error \"Missing $file\"
        }
    }
}

# Create sample data
function New-SampleData {
    Write-Header \"Creating Sample Data\"
    
    $response = Read-Host \"Would you like to create sample data for development? (y/n)\"
    
    if ($response -match \"^[Yy]\") {
        Write-Info \"Creating sample data...\"
        
        # Create directories
        if (-not (Test-Path \"data\\samples\")) {
            New-Item -Path \"data\\samples\" -ItemType Directory -Force | Out-Null
        }
        
        # Sample events
        $sampleEvents = @\"
[
  {
    \"title\": \"AFZ Healthcare Workshop\",
    \"description\": \"Learn about eye care and skin protection for persons with albinism. This comprehensive workshop covers daily health routines, medical resources, and preventive care.\",
    \"event_type\": \"workshop\",
    \"category\": [\"healthcare\", \"education\"],
    \"start_date\": \"2024-10-15T10:00:00Z\",
    \"end_date\": \"2024-10-15T15:00:00Z\",
    \"location_type\": \"physical\",
    \"venue_name\": \"Lusaka Community Center\",
    \"city\": \"Lusaka\",
    \"province\": \"Lusaka\",
    \"status\": \"published\",
    \"max_capacity\": 50,
    \"registration_required\": true
  },
  {
    \"title\": \"Advocacy Rights Training\",
    \"description\": \"Empowering advocates with knowledge about rights and legal protections for persons with albinism in Zambia.\",
    \"event_type\": \"educational\",
    \"category\": [\"advocacy\", \"legal\"],
    \"start_date\": \"2024-10-22T14:00:00Z\",
    \"end_date\": \"2024-10-22T17:00:00Z\",
    \"location_type\": \"virtual\",
    \"virtual_platform\": \"Zoom\",
    \"status\": \"published\",
    \"max_capacity\": 100,
    \"registration_required\": true
  }
]
\"@
        
        $sampleEvents | Out-File -FilePath \"data\\samples\\events.json\" -Encoding UTF8
        Write-Success \"Created sample events data\"
        
        # Sample resources
        $sampleResources = @\"
[
  {
    \"title\": \"Daily Sunscreen Application Guide\",
    \"description\": \"Step-by-step visual guide for proper sunscreen application and reapplication throughout the day.\",
    \"resource_type\": \"guide\",
    \"tags\": [\"sunscreen\", \"protection\", \"daily-care\"],
    \"target_audience\": [\"general\", \"children\", \"parents\"],
    \"access_level\": \"public\",
    \"difficulty_level\": \"beginner\",
    \"reading_time\": 5
  },
  {
    \"title\": \"Understanding Your Rights in Zambia\",
    \"description\": \"Comprehensive guide to legal rights and protections for persons with albinism under Zambian law.\",
    \"resource_type\": \"document\",
    \"tags\": [\"rights\", \"legal\", \"protection\"],
    \"target_audience\": [\"general\", \"advocates\"],
    \"access_level\": \"public\",
    \"difficulty_level\": \"intermediate\",
    \"reading_time\": 15
  }
]
\"@
        
        $sampleResources | Out-File -FilePath \"data\\samples\\resources.json\" -Encoding UTF8
        Write-Success \"Created sample resources data\"
        Write-Info \"Sample data files created in data\\samples\\\"
    }
}

# Start development server
function Start-DevelopmentServer {
    Write-Header \"Starting Development Server\"
    
    $port = 8080
    
    Write-Info \"Starting server on http://localhost:$port\"
    Write-Info \"Access member hub at: http://localhost:$port/pages/member-hub.html\"
    Write-Info \"Press Ctrl+C to stop the server\"
    Write-Host \"\"
    Write-Host \"🌟 Development server starting...\" -ForegroundColor Yellow
    Write-Host \"\"
    
    try {
        # Try to use serve if available
        serve -s . -p $port
    }
    catch {
        Write-Warning \"Serve command not found. Trying alternative method...\"
        
        # Fallback to Python if available
        try {
            python -m http.server $port
        }
        catch {
            Write-Error \"Could not start development server.\"
            Write-Info \"Please install 'serve' globally: npm install -g serve\"
            Write-Info \"Or install Python with http.server module\"
        }
    }
}

# Open browser to member hub
function Open-MemberHub {
    $url = \"http://localhost:8080/pages/member-hub.html\"
    Write-Info \"Opening member hub in browser: $url\"
    Start-Process $url
}

# Main setup function
function Invoke-Setup {
    Write-Host \"\"
    Write-Host \"🚀 AFZ Member Hub Setup Script\" -ForegroundColor Yellow
    Write-Host \"==================================\" -ForegroundColor Blue
    Write-Host \"\"
    Write-Host \"Welcome to the AFZ Member Hub setup!\" -ForegroundColor White
    Write-Host \"This script will help you get started with the member portal.\" -ForegroundColor White
    Write-Host \"\"
    
    if (-not (Test-Prerequisites)) {
        Write-Error \"Prerequisites not met. Please install required software.\"
        return
    }
    
    Initialize-Development
    Test-Configuration
    New-SampleData
    
    Write-Host \"\"
    Write-Host \"🎉 Setup complete!\" -ForegroundColor Green
    Write-Host \"\"
    Write-Host \"Next steps:\" -ForegroundColor Yellow
    Write-Host \"1. Create a Supabase project at https://supabase.com\" -ForegroundColor White
    Write-Host \"2. Run the SQL schema from database\\supabase-schema.sql\" -ForegroundColor White
    Write-Host \"3. Update your Supabase credentials in js\\supabaseClient.js\" -ForegroundColor White
    Write-Host \"4. Run this script with 'start' option to begin development\" -ForegroundColor White
    Write-Host \"\"
    Write-Host \"For detailed instructions, see MEMBER-HUB-SETUP.md\" -ForegroundColor Cyan
    Write-Host \"\"
}

# Handle command line arguments
switch ($Action.ToLower()) {
    \"start\" {
        Write-Info \"Starting development mode...\"
        Start-DevelopmentServer
    }
    \"open\" {
        Open-MemberHub
    }
    \"validate\" {
        Write-Info \"Validating configuration...\"
        Test-Configuration
    }
    \"\" {
        Invoke-Setup
    }
    default {
        Write-Host \"Usage: .\\setup-member-hub.ps1 [start|open|validate]\" -ForegroundColor Yellow
        Write-Host \"\"
        Write-Host \"Options:\" -ForegroundColor White
        Write-Host \"  start     - Start the development server\" -ForegroundColor White
        Write-Host \"  open      - Open member hub in browser\" -ForegroundColor White
        Write-Host \"  validate  - Validate current configuration\" -ForegroundColor White
        Write-Host \"  (no args) - Run full setup process\" -ForegroundColor White
    }
}