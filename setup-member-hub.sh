#!/bin/bash

# AFZ Member Hub - Quick Setup Script
# This script helps automate the member hub setup process

echo \"🚀 AFZ Member Hub Setup Script\"
echo \"===================================\"
echo \"\"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e \"${GREEN}✓${NC} $1\"
}

print_warning() {
    echo -e \"${YELLOW}⚠${NC} $1\"
}

print_error() {
    echo -e \"${RED}✗${NC} $1\"
}

print_info() {
    echo -e \"${BLUE}ℹ${NC} $1\"
}

# Check if required tools are installed
check_prerequisites() {
    echo \"Checking prerequisites...\"
    
    # Check for Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status \"Node.js is installed: $NODE_VERSION\"
    else
        print_error \"Node.js is not installed. Please install Node.js first.\"
        exit 1
    fi
    
    # Check for npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status \"npm is installed: $NPM_VERSION\"
    else
        print_error \"npm is not installed. Please install npm first.\"
        exit 1
    fi
    
    # Check for git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_status \"Git is installed: $GIT_VERSION\"
    else
        print_warning \"Git is not installed. Some features may not work.\"
    fi
    
    echo \"\"
}

# Setup development environment
setup_development() {
    echo \"Setting up development environment...\"
    
    # Install serve for local development
    if ! command -v serve &> /dev/null; then
        print_info \"Installing serve for local development...\"
        npm install -g serve
        print_status \"Serve installed globally\"
    else
        print_status \"Serve is already installed\"
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f \".env\" ]; then
        print_info \"Creating .env file...\"
        cat > .env << EOF
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
EOF
        print_status \"Created .env file with default configuration\"
        print_warning \"Please update the .env file with your actual Supabase credentials\"
    else
        print_status \".env file already exists\"
    fi
    
    echo \"\"
}

# Validate current configuration
validate_config() {
    echo \"Validating configuration...\"
    
    # Check if Supabase client is configured
    if grep -q \"your-project.supabase.co\" js/supabaseClient.js; then
        print_warning \"Supabase URL not configured in js/supabaseClient.js\"
        echo \"          Please update with your actual Supabase project URL\"
    else
        print_status \"Supabase client appears to be configured\"
    fi
    
    # Check if all required files exist
    REQUIRED_FILES=(
        \"pages/member-hub.html\"
        \"js/member-hub.js\"
        \"js/supabaseClient.js\"
        \"css/member-hub.css\"
        \"database/supabase-schema.sql\"
    )
    
    for file in \"${REQUIRED_FILES[@]}\"; do
        if [ -f \"$file\" ]; then
            print_status \"Found $file\"
        else
            print_error \"Missing $file\"
        fi
    done
    
    echo \"\"
}

# Start development server
start_development() {
    echo \"Starting development server...\"
    
    # Get port from .env or use default
    PORT=${DEV_PORT:-8080}
    
    print_info \"Starting server on http://localhost:$PORT\"
    print_info \"Access member hub at: http://localhost:$PORT/pages/member-hub.html\"
    print_info \"Press Ctrl+C to stop the server\"
    
    echo \"\"
    echo \"🌟 Development server starting...\"
    
    # Start the server
    serve -s . -p $PORT
}

# Create initial data
create_sample_data() {
    echo \"Would you like to create sample data for development? (y/n)\"
    read -r response
    
    if [[ \"$response\" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info \"Creating sample data...\"
        
        # Create sample events JSON
        mkdir -p data/samples
        
        cat > data/samples/events.json << EOF
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
EOF
        
        print_status \"Created sample events data\"
        
        # Create sample resources JSON
        cat > data/samples/resources.json << EOF
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
EOF
        
        print_status \"Created sample resources data\"
        print_info \"Sample data files created in data/samples/\"
    fi
    
    echo \"\"
}

# Main setup function
main() {
    echo \"Welcome to the AFZ Member Hub setup!\"
    echo \"This script will help you get started with the member portal.\"
    echo \"\"
    
    # Run setup steps
    check_prerequisites
    setup_development
    validate_config
    create_sample_data
    
    echo \"🎉 Setup complete!\"
    echo \"\"
    echo \"Next steps:\"
    echo \"1. Create a Supabase project at https://supabase.com\"
    echo \"2. Run the SQL schema from database/supabase-schema.sql\"
    echo \"3. Update your Supabase credentials in js/supabaseClient.js\"
    echo \"4. Run this script with 'start' option to begin development\"
    echo \"\"
    echo \"For detailed instructions, see MEMBER-HUB-SETUP.md\"
    echo \"\"
}

# Handle command line arguments
case \"$1\" in
    \"start\")
        print_info \"Starting development mode...\"
        start_development
        ;;
    \"validate\")
        print_info \"Validating configuration...\"
        validate_config
        ;;
    \"\")
        main
        ;;
    *)
        echo \"Usage: $0 [start|validate]\"
        echo \"\"
        echo \"Options:\"
        echo \"  start     - Start the development server\"
        echo \"  validate  - Validate current configuration\"
        echo \"  (no args) - Run full setup process\"
        exit 1
        ;;
esac