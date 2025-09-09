# 📧 AFZ Gmail Setup Guide

## 🎯 Quick Setup Checklist

### ☐ Step 1: Gmail Account
- [ ] Have AFZ Gmail account ready (or create new one)
- [ ] Account: `________________________@gmail.com`
- [ ] Password: `________________________`

### ☐ Step 2: Enable 2-Factor Authentication
- [ ] Go to [myaccount.google.com](https://myaccount.google.com)
- [ ] Click "Security" → "2-Step Verification"
- [ ] Complete phone verification setup
- [ ] ✅ 2FA Enabled

### ☐ Step 3: Generate App Password
- [ ] In Security settings, find "App passwords"
- [ ] Select "Mail" → "Other (custom name)"
- [ ] Name: "AFZ Backend Server"
- [ ] Copy 16-character password: `____-____-____-____`

### ☐ Step 4: Update Backend Configuration
- [ ] Edit the `.env` file in `backend-integration` folder
- [ ] Replace email credentials
- [ ] Restart backend server

---

## 📝 Detailed Instructions

### 1. Gmail Account Access

**If using existing AFZ account:**
- Email: `info@afz.org.zm` (if Gmail-hosted)
- Or use: `afz.zambia@gmail.com` (example)

**If creating new account:**
```
Suggested usernames:
- afz.zambia@gmail.com
- albinismzambia@gmail.com  
- afzzambia.org@gmail.com
```

### 2. Two-Factor Authentication Setup

1. **Visit**: [myaccount.google.com/security](https://myaccount.google.com/security)

2. **Find 2-Step Verification section**:
   ```
   Security → Signing in to Google → 2-Step Verification
   ```

3. **Click "Get started"** and follow prompts:
   - Enter phone number
   - Receive verification code
   - Confirm setup

4. **Verify 2FA is active** (you'll see a green checkmark)

### 3. App Password Generation

1. **After 2FA is enabled**, scroll down to find:
   ```
   Security → Signing in to Google → App passwords
   ```

2. **Click "App passwords"**

3. **Select dropdown options**:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)

4. **Enter custom name**: `AFZ Backend Server`

5. **Click "Generate"**

6. **Copy the 16-character password**:
   ```
   Example: abcd efgh ijkl mnop
   (Yours will be different - copy exactly as shown)
   ```

### 4. Backend Configuration

#### Edit `.env` file:
```env
# Email Configuration - Gmail Production Setup
EMAIL_SERVICE=gmail
# Replace with your actual AFZ Gmail address
EMAIL_USER=your-actual-email@gmail.com
# Replace with the 16-character app password (no spaces)
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afz.org.zm
EMAIL_ADMIN=info@afz.org.zm
```

#### Example with real data:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=afz.zambia@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@afz.org.zm
EMAIL_ADMIN=info@afz.org.zm
```

### 5. Restart Backend Server

After updating `.env` file:

```bash
# Stop current server (Ctrl+C in terminal)
# Navigate to backend folder
cd backend-integration

# Start server again
node server.js
```

---

## 🧪 Testing Gmail Integration

### Test Script (PowerShell):
```powershell
# Test contact form with Gmail
$body = @{
    name = "Gmail Test User"
    email = "test@example.com"
    subject = "support"
    message = "Testing Gmail integration for AFZ backend"
    newsletter = $true
    language = "en"
} | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/contact" -Method POST -Body $body -ContentType "application/json"
$response.Content
```

### Expected Success Response:
```json
{
  "success": true,
  "message": "Thank you for your message. We'll get back to you within 24 hours.",
  "reference_id": "AFZ-1234567890-abc123def"
}
```

### Check Gmail Inbox:
- ✅ **Admin email** should arrive at `EMAIL_ADMIN` address
- ✅ **User confirmation** should arrive at test email

---

## 🔧 Troubleshooting

### Common Issues:

#### ❌ "Invalid login" error:
- **Cause**: Wrong app password or 2FA not enabled
- **Fix**: Regenerate app password, ensure 2FA is active

#### ❌ "Username and Password not accepted":
- **Cause**: Using regular Gmail password instead of app password
- **Fix**: Use the 16-character app password, not your Gmail password

#### ❌ "Less secure app access":
- **Cause**: Gmail security settings
- **Fix**: App passwords bypass this requirement

#### ❌ Server not starting:
- **Cause**: Syntax error in .env file
- **Fix**: Check .env format, no extra spaces around `=`

### Debug Steps:
1. **Verify .env file format** (no spaces around `=`)
2. **Check app password** (16 characters, no spaces)
3. **Confirm 2FA is enabled**
4. **Test with simple email first**

---

## 📊 Production Checklist

### Before Going Live:
- [ ] Gmail account secured (strong password + 2FA)
- [ ] App password generated and stored securely
- [ ] Test emails received successfully
- [ ] Admin email address confirmed correct
- [ ] Backup app passwords generated (store safely)

### Security Best Practices:
- [ ] Use dedicated AFZ Gmail account (not personal)
- [ ] Enable account recovery options
- [ ] Store app password securely (password manager)
- [ ] Monitor email quota (Gmail has daily limits)
- [ ] Set up email forwarding if needed

---

## 🎉 Next Steps After Gmail Setup

1. **Test real email delivery**
2. **Update contact page** to reflect real backend
3. **Monitor email delivery** for first few submissions
4. **Consider SendGrid** for higher volume (future)

**Once Gmail is working, your AFZ website will have fully functional contact forms with real email notifications!**