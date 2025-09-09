const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests from file:// protocol and localhost
        console.log('CORS request from origin:', origin);
        
        // Allow file:// protocol (null origin), localhost, and 127.0.0.1
        if (!origin || 
            origin === 'null' || 
            origin.startsWith('file://') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1')) {
            console.log('CORS: Allowing origin:', origin || 'null/file://');
            callback(null, true);
        } else {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
            const isAllowed = allowedOrigins.includes(origin);
            console.log('CORS: Origin allowed?', isAllowed, 'for origin:', origin);
            callback(null, isAllowed);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const contactRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 submissions per hour (increased for testing)
    message: {
        success: false,
        message: 'Too many contact form submissions. Please try again later.'
    }
});

const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    }
});

app.use('/api/', generalRateLimit);

// Email transporter setup
let emailTransporter;

if (process.env.EMAIL_SERVICE === 'development' || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    // Development mode - log emails instead of sending
    console.log('📧 Running in EMAIL DEVELOPMENT MODE - emails will be simulated');
    emailTransporter = {
        sendMail: async (options) => {
            console.log('\n=== EMAIL SIMULATION (Development Mode) ===');
            console.log('From:', options.from);
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Content:', options.html || options.text);
            console.log('=== END EMAIL SIMULATION ===\n');
            return { messageId: 'dev_' + Date.now() };
        }
    };
} else {
    // Production mode - real email service with fallback
    console.log('📧 Running in EMAIL PRODUCTION MODE with service:', process.env.EMAIL_SERVICE);
    console.log('🗺 Attempting Gmail connection for user:', process.env.EMAIL_USER);
    console.log('🔑 App password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'undefined');
    
    emailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    // Verify email connection on startup with fallback
    emailTransporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email service connection failed:', error.message);
            console.log('💡 Check your EMAIL_USER and EMAIL_PASSWORD in .env file');
            console.log('🔄 Switching to EMAIL SIMULATION MODE for testing');
            
            // Fallback to simulation mode if Gmail fails
            emailTransporter = {
                sendMail: async (options) => {
                    console.log('\n=== EMAIL SIMULATION (Gmail Connection Failed) ===');
                    console.log('From:', options.from);
                    console.log('To:', options.to);
                    console.log('Subject:', options.subject);
                    console.log('Content:', options.html || options.text);
                    console.log('=== END EMAIL SIMULATION ===\n');
                    return { messageId: 'fallback_' + Date.now() };
                }
            };
        } else {
            console.log('✅ Email service connected successfully');
        }
    });
}

// Validation middleware
const validateContact = [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('subject').isIn(['support', 'volunteer', 'partnership', 'media', 'other']).withMessage('Invalid subject'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
    body('newsletter').optional().isBoolean().withMessage('Newsletter must be boolean'),
    body('language').optional().isIn(['en', 'ny', 'be']).withMessage('Invalid language')
];

const validateNewsletter = [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('language').optional().isIn(['en', 'ny', 'be']).withMessage('Invalid language'),
    body('source').optional().isString().withMessage('Source must be string')
];

// Routes
app.post('/api/contact', contactRateLimit, validateContact, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.mapped()
            });
        }

        const { name, email, phone, subject, message, newsletter, language } = req.body;
        
        // Generate reference ID
        const referenceId = `AFZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Email to admin
        const adminEmailOptions = {
            from: process.env.EMAIL_FROM || email,
            to: process.env.EMAIL_ADMIN || 'info@afz.org.zm',
            subject: `New Contact Form Submission - ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Reference ID:</strong> ${referenceId}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Newsletter Subscription:</strong> ${newsletter ? 'Yes' : 'No'}</p>
                <p><strong>Language:</strong> ${language || 'en'}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>Submitted at: ${new Date().toISOString()}</small></p>
            `
        };

        // Confirmation email to user
        const userEmailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@afz.org.zm',
            to: email,
            subject: 'Thank you for contacting AFZ',
            html: `
                <h2>Thank you for contacting the Albinism Foundation of Zambia</h2>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you within 24 hours.</p>
                <p><strong>Reference ID:</strong> ${referenceId}</p>
                <p><strong>Your message:</strong></p>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
                <p>Best regards,<br>The AFZ Team</p>
                <hr>
                <p><small>If you didn't submit this form, please ignore this email.</small></p>
            `
        };

        // Send emails
        await emailTransporter.sendMail(adminEmailOptions);
        await emailTransporter.sendMail(userEmailOptions);

        // Handle newsletter subscription if requested
        if (newsletter) {
            // Add to newsletter list (implement your newsletter service integration here)
            console.log(`Newsletter subscription requested for: ${email}`);
        }

        // Log to database (implement your database logging here)
        console.log('Contact form submission:', { referenceId, name, email, subject });

        res.json({
            success: true,
            message: 'Thank you for your message. We\'ll get back to you within 24 hours.',
            reference_id: referenceId
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
});

app.post('/api/newsletter', validateNewsletter, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.mapped()
            });
        }

        const { email, language, source } = req.body;
        
        // Generate subscription ID
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Email confirmation
        const confirmationEmail = {
            from: process.env.EMAIL_FROM || 'noreply@afz.org.zm',
            to: email,
            subject: 'AFZ Newsletter Subscription Confirmation',
            html: `
                <h2>Welcome to AFZ Newsletter</h2>
                <p>Thank you for subscribing to the Albinism Foundation of Zambia newsletter!</p>
                <p>You will receive updates about our programs, events, and advocacy work.</p>
                <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                <p>If you didn't subscribe, you can safely ignore this email.</p>
                <hr>
                <p><small>To unsubscribe, please contact us at info@afz.org.zm</small></p>
            `
        };

        await emailTransporter.sendMail(confirmationEmail);

        // Log to database (implement your database logging here)
        console.log('Newsletter subscription:', { subscriptionId, email, language, source });

        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            subscription_id: subscriptionId
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`AFZ Backend server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;