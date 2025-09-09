# AFZ Frontend Supabase Authentication Setup Guide

## Overview
This guide covers the complete frontend authentication system for the AFZ Member Portal, including Supabase integration, user management, and form handling.

## Files Created/Updated

### Core Authentication Services

1. **`js/services/auth-service.js`** - Complete authentication service
   - User sign up, sign in, sign out
   - Profile management
   - Role-based access control
   - Real-time subscriptions
   - Social authentication (Google, Facebook)

2. **`js/services/auth-guard.js`** - Page protection utility
   - Automatic authentication checking
   - Role-based page access
   - Redirect handling

3. **`js/services/redirect-manager.js`** - Post-login redirect handling
   - Safe redirect validation
   - Session storage management

4. **`js/components/auth-form-handler.js`** - Form interaction handler
   - Login/registration form processing
   - Real-time validation
   - Error handling
   - Loading states

5. **`js/services/supabase-config.js`** - Updated with actual credentials
   - Supabase client configuration
   - File upload utilities
   - Storage bucket management

### Styling

6. **`css/auth-enhancements.css`** - Enhanced authentication UI
   - Loading states
   - Error styling
   - Password strength indicators
   - Accessibility improvements

### Pages

7. **`pages/auth.html`** - Updated to use new authentication system
   - Integration with new services
   - Enhanced form handling

## Setup Instructions

### 1. Verify Database Schema
Ensure your Supabase database has the correct schema from `database/supabase-schema.sql`:
- `profiles` table with proper columns
- Row Level Security policies
- Storage buckets and policies

### 2. Configure Authentication Providers (Optional)

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Add your Google Client ID and Secret

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. In Supabase Dashboard → Authentication → Providers → Facebook:
   - Enable Facebook provider
   - Add your Facebook App ID and Secret

### 3. Update Email Templates (Optional)
In Supabase Dashboard → Authentication → Email Templates, customize:
- Welcome email
- Password reset email
- Email confirmation

### 4. Test Authentication Flow

#### Basic Testing
1. Open `pages/auth.html`
2. Try registering a new user
3. Check email for confirmation (if enabled)
4. Try logging in
5. Verify redirect to member hub

#### Role Testing
1. Update a user's `member_type` in the database to 'admin'
2. Test admin-only features
3. Try accessing protected pages

## Usage Examples

### Protecting a Page
Add to any HTML page that requires authentication:

```html
<!DOCTYPE html>
<html data-auth-required>
<head>
    <!-- ... -->
</head>
<body>
    <!-- Page content -->
    
    <script src="js/services/supabase-config.js"></script>
    <script src="js/services/auth-service.js"></script>
    <script src="js/services/auth-guard.js"></script>
</body>
</html>
```

### Admin-Only Page
```html
<html data-auth-required data-required-role="admin">
```

### Multiple Roles
```html
<html data-auth-required data-allowed-roles="admin,advocate,volunteer">
```

### Manual Authentication Checks
```javascript
// Check if user is authenticated
if (window.afzAuthService?.isAuthenticated) {
    console.log('User is logged in');
}

// Get current user
const user = window.afzAuthService?.getCurrentUser();

// Check role
if (window.afzAuthService?.hasRole('admin')) {
    // Show admin features
}

// Require authentication
const authGuard = new AFZAuthGuard();
if (authGuard.requireAuth()) {
    // User is authenticated, proceed
}
```

### Handling Authentication State
```javascript
// Listen for auth state changes
window.afzAuthService?.onAuthStateChange((event, user) => {
    switch (event) {
        case 'SIGNED_IN':
            console.log('User signed in:', user.email);
            // Update UI for authenticated user
            break;
        case 'SIGNED_OUT':
            console.log('User signed out');
            // Update UI for guest user
            break;
        case 'PROFILE_UPDATED':
            console.log('Profile updated:', user);
            // Refresh user display
            break;
    }
});
```

### Custom Login Form
```javascript
// Custom login handling
async function handleCustomLogin(email, password) {
    const result = await window.afzAuthService.signIn(email, password);
    
    if (result.success) {
        console.log('Login successful');
        // Redirect or update UI
    } else {
        console.error('Login failed:', result.error);
        // Show error message
    }
}
```

## Security Considerations

### Row Level Security
- All database tables have RLS enabled
- Policies restrict access based on user roles
- Users can only access their own data by default

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- Client-side and server-side validation

### Session Management
- JWT tokens with automatic refresh
- Configurable session timeout
- Secure cookie storage

### Data Validation
- Email format validation
- Phone number validation (Zambian format)
- Input sanitization

## Troubleshooting

### Common Issues

1. **"Supabase client not available"**
   - Ensure Supabase CDN script loads before custom scripts
   - Check network connectivity
   - Verify Supabase URL and keys

2. **"Authentication service not available"**
   - Ensure proper script loading order
   - Check browser console for errors
   - Verify service initialization

3. **Redirect loops**
   - Check auth guard configuration
   - Verify page permissions
   - Clear session storage if needed

4. **Email not confirmed**
   - Check spam folder
   - Verify email template settings
   - Check Supabase logs

### Debug Tools

#### Check Authentication Status
```javascript
console.log('Auth Status:', {
    isAuthenticated: window.afzAuthService?.isAuthenticated,
    user: window.afzAuthService?.getCurrentUser(),
    role: window.afzAuthService?.getUserRole()
});
```

#### Check Service Loading
```javascript
console.log('Services Loaded:', {
    supabaseConfig: !!window.SupabaseConfig,
    authService: !!window.afzAuthService,
    authGuard: !!window.AFZAuthGuard
});
```

#### Clear Authentication Data
```javascript
// Force logout and clear data
await window.afzAuthService?.signOut();
sessionStorage.clear();
localStorage.clear();
location.reload();
```

## Next Steps

1. **Test all authentication flows thoroughly**
2. **Implement user profile management pages**
3. **Add password reset functionality**
4. **Set up email notification system**
5. **Configure social authentication providers**
6. **Implement user role management for admins**

## File Dependencies

```
pages/auth.html
├── css/auth-enhancements.css
├── js/services/supabase-config.js
├── js/services/auth-service.js
├── js/services/redirect-manager.js
└── js/components/auth-form-handler.js

Protected pages:
├── js/services/auth-guard.js
└── js/services/auth-service.js
```

---

**Important:** Always test authentication flows in incognito/private browsing mode to ensure fresh sessions and verify the complete user experience.