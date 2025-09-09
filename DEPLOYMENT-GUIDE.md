# AFZ Production Deployment Guide

## 🚀 Step-by-Step Deployment Instructions

### Prerequisites
- [ ] Domain name registered
- [ ] Hosting provider selected (recommended: Vercel, Netlify, or VPS)
- [ ] Node.js 18+ installed locally
- [ ] Email service account (Gmail, SendGrid, etc.)
- [ ] Database service (PostgreSQL recommended)

---

## **Phase 1: Local Testing**

### 1. Install Dependencies
```bash
cd backend-integration
npm install
```

### 2. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings:
# - Email credentials
# - Database connection
# - Security keys
```

### 3. Test Backend Locally
```bash
npm run dev
# Server should start on http://localhost:3000
```

### 4. Test Frontend Integration
```bash
# Open index.html in browser
# Test contact form submission
# Verify PWA functionality
```

---

## **Phase 2: Production Deployment**

### Option A: Static Frontend + Serverless Backend

#### Frontend Deployment (Netlify/Vercel)
1. **Create Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial AFZ website"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Netlify**
   - Connect GitHub repository
   - Build settings: 
     - Build command: (none for static site)
     - Publish directory: `/` (root)
   - Add environment variables for API endpoints

3. **Deploy Backend (Vercel Functions)**
   ```bash
   # Create vercel.json in root
   {
     "functions": {
       "backend-integration/server.js": {
         "runtime": "nodejs18.x"
       }
     },
     "routes": [
       { "src": "/api/(.*)", "dest": "/backend-integration/server.js" }
     ]
   }
   ```

#### Backend Environment Variables (Vercel)
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@afz.org.zm
EMAIL_ADMIN=info@afz.org.zm
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

### Option B: VPS Deployment

#### 1. Server Setup (Ubuntu/CentOS)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <your-repo-url> /var/www/afz
cd /var/www/afz

# Install dependencies
cd backend-integration
npm install --production

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Start with PM2
pm2 start server.js --name "afz-backend"
pm2 startup
pm2 save
```

#### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Frontend static files
    location / {
        root /var/www/afz;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL Setup (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## **Phase 3: Database Setup**

### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE afz_website;

-- Create user
CREATE USER afz_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE afz_website TO afz_user;

-- Connect to database and create tables
\c afz_website;

-- Contacts table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    newsletter BOOLEAN DEFAULT FALSE,
    language VARCHAR(2) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    language VARCHAR(2) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'active',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **Phase 4: Email Service Setup**

### Gmail Setup (Development)
1. Enable 2-factor authentication
2. Generate App Password
3. Use in EMAIL_PASSWORD environment variable

### SendGrid Setup (Production)
1. Create SendGrid account
2. Verify sender identity
3. Generate API key
4. Update environment variables:
   ```
   EMAIL_SERVICE=sendgrid
   EMAIL_API_KEY=your-sendgrid-api-key
   ```

---

## **Phase 5: Monitoring & Analytics**

### 1. Error Monitoring
```bash
# Install monitoring tools
npm install winston morgan
```

### 2. Analytics Setup
```html
<!-- Add to all HTML pages -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. Performance Monitoring
- Use Google PageSpeed Insights
- Monitor Core Web Vitals
- Set up uptime monitoring

---

## **Testing Checklist**

### Frontend Testing
- [ ] All pages load correctly
- [ ] Mobile responsiveness works
- [ ] PWA install prompt appears
- [ ] Offline functionality works
- [ ] Forms submit properly
- [ ] All languages switch correctly

### Backend Testing
- [ ] Contact form sends emails
- [ ] Newsletter subscription works
- [ ] API endpoints respond correctly
- [ ] Rate limiting functions
- [ ] Security headers present
- [ ] Database connections stable

### Production Testing
- [ ] Domain resolves correctly
- [ ] SSL certificate valid
- [ ] All redirects work
- [ ] Form submissions reach admin email
- [ ] Performance metrics acceptable
- [ ] SEO meta tags present

---

## **Maintenance Schedule**

### Weekly
- [ ] Check form submissions
- [ ] Monitor error logs
- [ ] Review performance metrics

### Monthly
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review analytics data
- [ ] Check SSL certificate status

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Content updates
- [ ] Translation reviews

---

## **Support Contacts**

- **Technical Issues**: info@afz.org.zm
- **Backend Documentation**: `/backend-integration/README.md`
- **Image Guidelines**: `/images/README-IMAGES.md`
- **Project Summary**: `/PROJECT-SUMMARY.md`

---

## **Emergency Procedures**

### Site Down
1. Check server status
2. Review error logs
3. Restart PM2 processes
4. Check database connections
5. Verify DNS settings

### Email Not Working
1. Check email service status
2. Verify environment variables
3. Test SMTP connections
4. Review rate limits

### Form Submissions Failed
1. Check backend logs
2. Verify database connections
3. Test API endpoints manually
4. Check CORS settings

---

**Next Phase**: Once deployment is complete, focus on content updates, image replacements, and ongoing maintenance based on user feedback.