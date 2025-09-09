# AFZ Production Setup Guide

This guide will walk you through setting up all the required services for the AFZ website's authentication and payment systems.

## 📋 Setup Checklist

- [ ] Supabase OAuth Configuration
- [ ] PayPal Business Account Setup  
- [ ] Stripe Payment Processing
- [ ] Flutterwave African Payments
- [ ] Zambian Mobile Money Providers
- [ ] Environment Configuration
- [ ] Production Deployment

---

## 🔐 1. Supabase OAuth Configuration

### Step 1: Access Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in and select your AFZ project
3. Navigate to **Authentication > Providers**

### Step 2: Configure Google OAuth

#### A. Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API** and **People API**
4. Go to **Credentials > Create Credentials > OAuth 2.0 Client IDs**
5. Set Application Type: **Web Application**
6. Add Authorized JavaScript Origins:
   ```
   https://your-domain.com
   https://yourproject.supabase.co
   ```
7. Add Authorized Redirect URIs:
   ```
   https://yourproject.supabase.co/auth/v1/callback
   ```
8. Copy **Client ID** and **Client Secret**

#### B. Configure in Supabase
1. In Supabase Dashboard > Authentication > Providers
2. Enable **Google** provider
3. Enter your **Client ID** and **Client Secret**
4. Set Redirect URL: `https://your-domain.com/pages/member-hub.html`

### Step 3: Configure Facebook OAuth

#### A. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **Create App** > **Consumer** > **Next**
3. Enter App Name: "AFZ Member Portal"
4. Add **Facebook Login** product
5. In Facebook Login Settings:
   - Valid OAuth Redirect URIs:
     ```
     https://yourproject.supabase.co/auth/v1/callback
     ```
   - Deauthorize Callback URL:
     ```
     https://your-domain.com/auth/logout
     ```
6. Copy **App ID** and **App Secret**

#### B. Configure in Supabase
1. In Supabase Dashboard > Authentication > Providers
2. Enable **Facebook** provider
3. Enter your **App ID** and **App Secret**
4. Set Redirect URL: `https://your-domain.com/pages/member-hub.html`

### Step 4: Update Environment Variables
```bash
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-secret
FACEBOOK_OAUTH_APP_ID=your-facebook-app-id
FACEBOOK_OAUTH_APP_SECRET=your-facebook-secret
```

---

## 💳 2. PayPal Business Account Setup

### Step 1: Create PayPal Business Account
1. Go to [PayPal Business](https://www.paypal.com/zm/business)
2. Click **Get Started** > **Business Account**
3. Fill in AFZ organization details:
   - Business Name: "Albinism Foundation of Zambia"
   - Business Type: "Nonprofit Organization"
   - Industry: "Healthcare & Medical"
   - Website: "your-domain.com"

### Step 2: Verify Business Account
1. Complete business verification process
2. Add bank account for withdrawals
3. Set up business profile with AFZ information

### Step 3: Create Developer App
1. Go to [PayPal Developer](https://developer.paypal.com)
2. Log in with your business account
3. Click **Create App**
4. Fill details:
   - App Name: "AFZ Donations"
   - Merchant: Select your business account
   - Features: Check **Accept payments**
5. Copy **Client ID** and **Client Secret**

### Step 4: Configure Webhooks
1. In your PayPal app dashboard
2. Add webhook endpoint: `https://your-domain.com/api/webhooks/paypal`
3. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

### Step 5: Update Environment Variables
```bash
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=live  # or 'sandbox' for testing
PAYPAL_BUSINESS_EMAIL=donations@afz.org.zm
```

---

## 🔒 3. Stripe Payment Configuration

### Step 1: Create Stripe Account
1. Go to [Stripe](https://stripe.com)
2. Sign up for business account
3. Complete business verification with AFZ details
4. Add bank account for payouts

### Step 2: Get API Keys
1. In Stripe Dashboard, go to **Developers > API Keys**
2. Copy **Publishable Key** and **Secret Key**
3. For production, toggle to **Live mode**

### Step 3: Configure Webhooks
1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
5. Copy **Webhook Secret**

### Step 4: Set Up Products (Optional)
1. Go to **Products** in Stripe Dashboard
2. Create products for different donation types
3. Set up recurring donation plans if needed

### Step 5: Update Environment Variables
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

---

## 🌍 4. Flutterwave African Payments

### Step 1: Create Flutterwave Account
1. Go to [Flutterwave](https://flutterwave.com/zm)
2. Sign up for business account
3. Complete KYC verification with AFZ documents
4. Wait for account approval (1-3 business days)

### Step 2: Get API Credentials
1. Login to [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Go to **Settings > API**
3. Copy:
   - **Public Key**
   - **Secret Key**
   - **Encryption Key**

### Step 3: Configure Webhooks
1. Go to **Settings > Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/flutterwave`
3. Select events:
   - `charge.completed`
   - `charge.failed`
   - `transfer.completed`

### Step 4: Enable Payment Methods
1. Go to **Settings > Payment Methods**
2. Enable for Zambia:
   - Cards (Visa, Mastercard)
   - Mobile Money (Airtel, MTN)
   - Bank Transfer
   - USSD

### Step 5: Update Environment Variables
```bash
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-key
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key
```

---

## 📱 5. Zambian Mobile Money Setup

### Airtel Money Integration

#### Step 1: Contact Airtel Zambia
- **Email**: business@airtel.co.zm
- **Phone**: +260 97 7000000
- **Request**: API integration for nonprofit donations

#### Step 2: Submit Requirements
- AFZ registration certificate
- Director identification documents
- Bank account details
- Website and app details
- Expected transaction volumes

#### Step 3: API Access
Once approved, you'll receive:
- Client ID
- Client Secret
- API documentation
- Test credentials

#### Step 4: Integration
```bash
AIRTEL_MONEY_CLIENT_ID=your-client-id
AIRTEL_MONEY_CLIENT_SECRET=your-client-secret
AIRTEL_MONEY_API_URL=https://openapi.airtel.africa
```

### MTN Mobile Money Integration

#### Step 1: Contact MTN Zambia
- **Email**: momo@mtn.co.zm
- **Website**: [MTN MoMo Developer](https://momodeveloper.mtn.com)
- **Request**: Collection API for nonprofit

#### Step 2: Developer Registration
1. Register on MTN MoMo Developer portal
2. Subscribe to Collection API
3. Generate API credentials

#### Step 3: Approval Process
- Submit business case
- Complete compliance checks
- Receive production access

#### Step 4: Configuration
```bash
MTN_MOMO_PRIMARY_KEY=your-primary-key
MTN_MOMO_API_USER_ID=your-api-user-id
MTN_MOMO_API_KEY=your-api-key
```

### Zamtel Kwacha Integration

#### Step 1: Contact Zamtel
- **Email**: api@zamtel.co.zm
- **Phone**: +260 211 222222
- **Request**: Kwacha API integration

#### Step 2: Business Application
- Complete API application form
- Submit AFZ documentation
- Sign API agreement

#### Step 3: Testing and Go-Live
- Receive sandbox credentials
- Complete integration testing
- Get production approval

#### Step 4: Configuration
```bash
ZAMTEL_KWACHA_API_KEY=your-api-key
ZAMTEL_KWACHA_CLIENT_ID=your-client-id
ZAMTEL_KWACHA_CLIENT_SECRET=your-client-secret
```

---

## ⚙️ 6. Environment Configuration

### Step 1: Create Production Environment File
1. Copy `.env.template` to `.env.production`
2. Fill in all actual credentials
3. Remove or comment out development-only variables

### Step 2: Secure Credentials Storage
For production deployment:

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add all variables from `.env.production`

#### Vercel
1. Go to Project Settings > Environment Variables
2. Add all variables with appropriate environments

#### Railway/Heroku
1. Use CLI or dashboard to set environment variables
2. Ensure sensitive data is encrypted

### Step 3: Update Frontend Configuration
Update `js/services/supabase-config.js`:
```javascript
const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'your-production-url',
    supabaseKey: process.env.SUPABASE_ANON_KEY || 'your-production-key'
};
```

---

## 🚀 7. Production Deployment

### Step 1: Frontend Deployment
1. Build production version
2. Upload to hosting service (Netlify/Vercel)
3. Configure custom domain
4. Enable SSL certificate

### Step 2: Backend Deployment
1. Deploy Node.js backend to cloud service
2. Configure environment variables
3. Set up database connections
4. Enable monitoring and logging

### Step 3: DNS Configuration
1. Point domain to hosting service
2. Configure subdomain for API if needed
3. Set up email DNS records

### Step 4: SSL and Security
1. Enable HTTPS everywhere
2. Configure CORS properly
3. Set up security headers
4. Enable rate limiting

---

## 🧪 8. Testing

### Pre-Launch Checklist
- [ ] Test Google OAuth login
- [ ] Test Facebook OAuth login
- [ ] Test PayPal donation flow
- [ ] Test Stripe card payments
- [ ] Test Flutterwave payments
- [ ] Test mobile money flows (with test amounts)
- [ ] Verify email notifications
- [ ] Check all form validations
- [ ] Test on mobile devices
- [ ] Verify accessibility features

### Load Testing
- Test with multiple concurrent users
- Verify payment processing under load
- Check database performance
- Monitor error rates

---

## 📞 Support Contacts

### Technical Support
- **Supabase**: support@supabase.com
- **PayPal**: developer-support@paypal.com
- **Stripe**: support@stripe.com
- **Flutterwave**: developers@flutterwave.com

### Local Partners
- **Airtel Zambia**: business@airtel.co.zm
- **MTN Zambia**: momo@mtn.co.zm
- **Zamtel**: api@zamtel.co.zm

---

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use HTTPS everywhere** in production
3. **Regularly rotate API keys** and secrets
4. **Monitor for suspicious transactions**
5. **Set up fraud detection** where available
6. **Regular security audits** of payment flows
7. **Backup configuration** regularly

---

## 📈 Monitoring and Analytics

### Payment Monitoring
- Set up alerts for failed payments
- Monitor transaction success rates
- Track donation amounts and trends
- Set up fraud detection

### User Analytics
- Track authentication success rates
- Monitor user registration flow
- Analyze donation patterns
- Track mobile money adoption

---

This setup will provide AFZ with a comprehensive, secure, and scalable payment and authentication system suitable for a nonprofit organization operating in Zambia with international reach.