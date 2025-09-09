const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Testing Gmail Connection...');
console.log('📧 Email User:', process.env.EMAIL_USER);
console.log('🔑 Password Length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'undefined');

// Test different configurations
const configs = [
    {
        name: 'Gmail Service',
        config: {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        }
    },
    {
        name: 'Gmail SMTP Direct',
        config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        }
    }
];

async function testConfig(config) {
    console.log(`\n🔄 Testing ${config.name}...`);
    
    try {
        const transporter = nodemailer.createTransport(config.config);
        
        // Test connection
        await transporter.verify();
        console.log(`✅ ${config.name}: Connection successful!`);
        
        // Try sending a test email
        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_ADMIN,
            subject: 'AFZ Backend Test Email',
            text: 'This is a test email from AFZ backend server to verify Gmail integration is working.',
            html: '<h2>AFZ Backend Test Email</h2><p>This is a test email from AFZ backend server to verify Gmail integration is working.</p>'
        });
        
        console.log(`📧 ${config.name}: Test email sent successfully!`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return true;
    } catch (error) {
        console.log(`❌ ${config.name}: Failed`);
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n🚀 Starting Gmail Integration Tests...');
    
    for (const config of configs) {
        const success = await testConfig(config);
        if (success) {
            console.log('\n🎉 Gmail integration working! You should receive test emails.');
            process.exit(0);
        }
    }
    
    console.log('\n❌ All Gmail configurations failed. Please check:');
    console.log('1. 2-Factor Authentication is enabled on afz.zambia@gmail.com');
    console.log('2. App password is correctly generated and copied');
    console.log('3. No typos in EMAIL_USER or EMAIL_PASSWORD');
    console.log('4. Account is not locked or restricted');
    process.exit(1);
}

runTests();