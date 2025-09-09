# Backend Integration Guide for AFZ

This document outlines the backend integration requirements for the AFZ (Albinism Foundation Zambia) website.

## Overview

The AFZ website requires backend integration for the following features:
1. Contact form submission
2. Newsletter subscription
3. Volunteer application form
4. Donation processing
5. Event RSVP system

## Required API Endpoints

### 1. Contact Form (`/api/contact`)

**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "name": "string (required, min: 2 chars)",
  "email": "string (required, valid email)",
  "phone": "string (optional)",
  "subject": "string (required, one of: support|volunteer|partnership|media|other)",
  "message": "string (required, min: 10 chars)",
  "newsletter": "boolean (optional, default: false)",
  "language": "string (optional, one of: en|ny|be, default: en)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thank you for your message. We'll get back to you within 24 hours.",
  "reference_id": "AFZ-2024-001234"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Invalid email format",
    "message": "Message is too short"
  }
}
```

### 2. Newsletter Subscription (`/api/newsletter`)

**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "language": "string (optional, one of: en|ny|be, default: en)",
  "source": "string (optional, default: website)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "subscription_id": "sub_abc123"
}
```

### 3. Volunteer Application (`/api/volunteer`)

**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "skills": "array of strings (optional)",
  "availability": "string (optional)",
  "experience": "string (optional)",
  "motivation": "string (required)"
}
```

### 4. Event RSVP (`/api/events/{event_id}/rsvp`)

**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "attendance_type": "string (in_person|virtual)",
  "guests": "number (default: 0)"
}
```

## Security Requirements

1. **CORS Configuration:**
   - Allow origins: your-domain.com, www.your-domain.com
   - Allow methods: POST, OPTIONS
   - Allow headers: Content-Type, Authorization

2. **Rate Limiting:**
   - Contact form: 5 submissions per hour per IP
   - Newsletter: 3 subscriptions per hour per IP
   - General: 60 requests per minute per IP

3. **Input Validation:**
   - Sanitize all inputs
   - Validate email formats
   - Check for spam patterns
   - Implement honeypot fields

4. **Data Protection:**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement GDPR compliance measures
   - Store contact data securely

## Implementation Notes

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afz_website
DB_USER=afz_user
DB_PASSWORD=secure_password

# Email Service (e.g., SendGrid, AWS SES)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_api_key
EMAIL_FROM=noreply@afz.org.zm
EMAIL_ADMIN=info@afz.org.zm

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=5

# External Services
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
ANALYTICS_ID=your_analytics_id
```

### Database Schema

#### contacts table
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    newsletter BOOLEAN DEFAULT FALSE,
    language VARCHAR(2) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### newsletter_subscriptions table
```sql
CREATE TABLE newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    language VARCHAR(2) DEFAULT 'en',
    source VARCHAR(50) DEFAULT 'website',
    status VARCHAR(20) DEFAULT 'active',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL
);
```

#### volunteers table
```sql
CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    skills TEXT[],
    availability TEXT,
    experience TEXT,
    motivation TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Example Test Requests

#### Contact Form Test
```bash
curl -X POST https://your-api.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "support",
    "message": "This is a test message for the contact form."
  }'
```

#### Newsletter Test
```bash
curl -X POST https://your-api.com/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newsletter@example.com",
    "language": "en"
  }'
```

## Error Handling

All endpoints should handle the following error scenarios:

1. **Validation Errors (400):** Invalid input data
2. **Rate Limiting (429):** Too many requests
3. **Server Errors (500):** Internal server issues
4. **Service Unavailable (503):** External service failures

## Monitoring and Logging

1. Log all form submissions for audit purposes
2. Monitor API response times
3. Track success/failure rates
4. Set up alerts for high error rates
5. Monitor email delivery status

## Deployment Checklist

- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Email service configured and tested
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] SSL certificate installed
- [ ] Error logging configured
- [ ] Monitoring setup
- [ ] Backup procedures in place
- [ ] Security headers configured

## Support

For technical support during integration:
- Email: info@afz.org.zm
- Documentation: This README
- Test environment: Available upon request

---

**Note:** This integration guide assumes a RESTful API backend. Adjust the implementation details based on your chosen backend technology (Node.js, Python, PHP, etc.).