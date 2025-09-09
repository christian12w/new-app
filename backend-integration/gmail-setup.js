// AFZ Gmail Configuration Helper
// This script helps you configure Gmail for your AFZ backend

const fs = require('fs');
const path = require('path');

console.log('🎉 AFZ Gmail Configuration Helper\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file');
} catch (error) {
    console.log('❌ No .env file found, creating new one...');
}

// Configuration questions
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function configureGmail() {
    console.log('\n📧 Gmail Configuration Setup');
    console.log('================================\n');
    
    console.log('Before proceeding, make sure you have:');
    console.log('1. ✅ Gmail account for AFZ');
    console.log('2. ✅ 2-Factor Authentication enabled');
    console.log('3. ✅ App-specific password generated');
    console.log('');
    
    const ready = await askQuestion('Are you ready to configure Gmail? (y/n): ');
    
    if (ready.toLowerCase() !== 'y') {
        console.log('\n📖 Please follow the GMAIL-SETUP-GUIDE.md first, then run this script again.');
        process.exit(0);
    }
    
    console.log('\n📝 Enter your Gmail configuration:');
    
    const gmailUser = await askQuestion('Gmail address (e.g., afz.zambia@gmail.com): ');
    const gmailPassword = await askQuestion('App-specific password (16 characters): ');
    const emailFrom = await askQuestion('From address (e.g., noreply@afz.org.zm) [noreply@afz.org.zm]: ') || 'noreply@afz.org.zm';
    const emailAdmin = await askQuestion('Admin email (e.g., info@afz.org.zm) [info@afz.org.zm]: ') || 'info@afz.org.zm';
    
    // Update .env file
    const newEnvContent = `# AFZ Backend Configuration - Production with Gmail
# Server Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000

# Database Configuration (SQLite for development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afz_website_dev
DB_USER=dev_user
DB_PASSWORD=dev_password

# Email Configuration - Gmail Production Setup
EMAIL_SERVICE=gmail
EMAIL_USER=${gmailUser}
EMAIL_PASSWORD=${gmailPassword}
EMAIL_FROM=${emailFrom}
EMAIL_ADMIN=${emailAdmin}

# Security - Development Keys
JWT_SECRET=development-jwt-secret-key-not-for-production
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Development Settings
LOG_LEVEL=debug
LOG_FILE=./logs/afz-backend-dev.log

# CORS Configuration
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000
CORS_CREDENTIALS=true

# Health Check
HEALTH_CHECK_TOKEN=dev-health-check-token

# Session Configuration
SESSION_SECRET=development-session-secret
SESSION_TIMEOUT=86400000
`;
    
    try {
        fs.writeFileSync(envPath, newEnvContent);
        console.log('\n✅ .env file updated successfully!');
        
        console.log('\n🎯 Configuration Summary:');
        console.log(`   Gmail User: ${gmailUser}`);
        console.log(`   From Address: ${emailFrom}`);
        console.log(`   Admin Email: ${emailAdmin}`);
        console.log(`   Password: ${'*'.repeat(gmailPassword.length)} (hidden)`);
        
        console.log('\n🚀 Next steps:');
        console.log('1. Restart your backend server (Ctrl+C, then: node server.js)');
        console.log('2. Test email delivery with backend-test.html');
        console.log('3. Check Gmail inbox for test emails');
        
        console.log('\n📧 Your AFZ backend is now configured to send real emails via Gmail!');
        
    } catch (error) {
        console.error('❌ Failed to update .env file:', error.message);
    }
    
    rl.close();
}

// Run the configuration
configureGmail().catch(console.error);