/**
 * AFZ Production Configuration
 * Centralizes all API configurations for production deployment
 */

class AFZProductionConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfiguration();
        this.validateConfiguration();
    }

    detectEnvironment() {
        // Detect if we're in production, staging, or development
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        return process.env.NODE_ENV || 'development';
    }

    loadConfiguration() {
        const baseConfig = {
            // Environment
            environment: this.environment,
            
            // Supabase Configuration
            supabase: {
                url: this.getEnvVar('SUPABASE_URL', 'https://vzkbvhqvrazbxbhkynfy.supabase.co'),
                anonKey: this.getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J2aHF2cmF6YnhiaGt5bmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg3MTEsImV4cCI6MjA3Mjc0NDcxMX0.e0SZ_Jl1BRDiAyOqYUDY1jKCphKTeYg2UseVMzMJ-ak'),
                serviceRoleKey: this.getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J2aHF2cmF6YnhiaGt5bmZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODcxMSwiZXhwIjoyMDcyNzQ0NzExfQ.O_D1avuFo_-Xv6mhUSz7LUifR1R12X_1WOaVLdr0FlA'),
                redirectUrl: this.getEnvVar('SUPABASE_REDIRECT_URL', `${window.location.origin}/pages/member-hub.html`)
            },

            // OAuth Configuration
            oauth: {
                google: {
                    clientId: this.getEnvVar('GOOGLE_OAUTH_CLIENT_ID', 'your-google-client-id'),
                    enabled: this.getEnvVar('ENABLE_GOOGLE_OAUTH', 'true') === 'true'
                },
                facebook: {
                    appId: this.getEnvVar('FACEBOOK_OAUTH_APP_ID', 'your-facebook-app-id'),
                    enabled: this.getEnvVar('ENABLE_FACEBOOK_OAUTH', 'true') === 'true'
                }
            },

            // Payment Gateway Configuration
            payments: {
                paypal: {
                    clientId: this.getEnvVar('PAYPAL_CLIENT_ID', 'your-paypal-client-id'),
                    environment: this.getEnvVar('PAYPAL_ENVIRONMENT', 'sandbox'),
                    businessEmail: this.getEnvVar('PAYPAL_BUSINESS_EMAIL', 'donations@afz.org.zm'),
                    enabled: this.getEnvVar('ENABLE_PAYPAL', 'true') === 'true'
                },
                stripe: {
                    publishableKey: this.getEnvVar('STRIPE_PUBLISHABLE_KEY', 'pk_test_your-key'),
                    enabled: this.getEnvVar('ENABLE_STRIPE', 'true') === 'true'
                },
                flutterwave: {
                    publicKey: this.getEnvVar('FLUTTERWAVE_PUBLIC_KEY', 'FLWPUBK_TEST-your-key'),
                    enabled: this.getEnvVar('ENABLE_FLUTTERWAVE', 'true') === 'true'
                }
            },

            // Mobile Money Configuration
            mobileMoney: {
                enabled: this.getEnvVar('ENABLE_MOBILE_MONEY', 'true') === 'true',
                airtel: {
                    enabled: this.getEnvVar('ENABLE_AIRTEL_MONEY', 'true') === 'true',
                    apiUrl: this.getEnvVar('AIRTEL_MONEY_API_URL', 'https://openapiuat.airtel.africa'),
                    country: this.getEnvVar('AIRTEL_MONEY_COUNTRY', 'ZM'),
                    currency: this.getEnvVar('AIRTEL_MONEY_CURRENCY', 'ZMW')
                },
                mtn: {
                    enabled: this.getEnvVar('ENABLE_MTN_MOMO', 'true') === 'true',
                    apiUrl: this.getEnvVar('MTN_MOMO_API_URL', 'https://sandbox.momodeveloper.mtn.com'),
                    environment: this.getEnvVar('MTN_MOMO_TARGET_ENVIRONMENT', 'sandbox')
                },
                zamtel: {
                    enabled: this.getEnvVar('ENABLE_ZAMTEL_KWACHA', 'true') === 'true',
                    apiUrl: this.getEnvVar('ZAMTEL_KWACHA_API_URL', 'https://api.zamtel.co.zm/kwacha')
                }
            },

            // API Configuration
            api: {
                baseUrl: this.getEnvVar('API_BASE_URL', `${window.location.origin}/api`),
                timeout: parseInt(this.getEnvVar('API_TIMEOUT', '30000')),
                retries: parseInt(this.getEnvVar('API_RETRIES', '3'))
            },

            // Feature Flags
            features: {
                socialLogin: this.getEnvVar('ENABLE_SOCIAL_LOGIN', 'true') === 'true',
                internationalPayments: this.getEnvVar('ENABLE_INTERNATIONAL_PAYMENTS', 'true') === 'true',
                emailNotifications: this.getEnvVar('ENABLE_EMAIL_NOTIFICATIONS', 'true') === 'true',
                analytics: this.getEnvVar('ENABLE_ANALYTICS', 'true') === 'true'
            },

            // Security Configuration
            security: {
                csrfToken: this.getEnvVar('CSRF_TOKEN', ''),
                allowedOrigins: this.getEnvVar('ALLOWED_ORIGINS', window.location.origin).split(','),
                rateLimiting: {
                    enabled: this.getEnvVar('ENABLE_RATE_LIMITING', 'true') === 'true',
                    windowMs: parseInt(this.getEnvVar('RATE_LIMIT_WINDOW_MS', '900000')),
                    maxRequests: parseInt(this.getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'))
                }
            },

            // Monitoring Configuration
            monitoring: {
                googleAnalytics: {
                    measurementId: this.getEnvVar('GOOGLE_ANALYTICS_ID', ''),
                    enabled: this.getEnvVar('ENABLE_GOOGLE_ANALYTICS', 'false') === 'true'
                },
                sentry: {
                    dsn: this.getEnvVar('SENTRY_DSN', ''),
                    enabled: this.getEnvVar('ENABLE_SENTRY', 'false') === 'true'
                }
            }
        };

        return baseConfig;
    }

    getEnvVar(key, defaultValue = '') {
        // Try to get from process.env first (Node.js)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }

        // Try to get from window.__ENV__ (injected by build process)
        if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
            return window.__ENV__[key];
        }

        // Try to get from meta tags
        if (typeof document !== 'undefined') {
            const meta = document.querySelector(`meta[name="env-${key.toLowerCase()}"]`);
            if (meta) {
                return meta.getAttribute('content');
            }
        }

        return defaultValue;
    }

    validateConfiguration() {
        const errors = [];

        // Validate Supabase configuration
        if (!this.config.supabase.url || this.config.supabase.url.includes('yourproject')) {
            errors.push('SUPABASE_URL is not configured properly');
        }

        if (!this.config.supabase.anonKey || this.config.supabase.anonKey.includes('your-anon-key')) {
            errors.push('SUPABASE_ANON_KEY is not configured properly');
        }

        // Validate OAuth configuration if enabled
        if (this.config.oauth.google.enabled) {
            if (!this.config.oauth.google.clientId || this.config.oauth.google.clientId.includes('your-google')) {
                errors.push('Google OAuth is enabled but GOOGLE_OAUTH_CLIENT_ID is not configured');
            }
        }

        if (this.config.oauth.facebook.enabled) {
            if (!this.config.oauth.facebook.appId || this.config.oauth.facebook.appId.includes('your-facebook')) {
                errors.push('Facebook OAuth is enabled but FACEBOOK_OAUTH_APP_ID is not configured');
            }
        }

        // Validate payment gateways if enabled
        if (this.config.payments.paypal.enabled) {
            if (!this.config.payments.paypal.clientId || this.config.payments.paypal.clientId.includes('your-paypal')) {
                errors.push('PayPal is enabled but PAYPAL_CLIENT_ID is not configured');
            }
        }

        if (this.config.payments.stripe.enabled) {
            if (!this.config.payments.stripe.publishableKey || this.config.payments.stripe.publishableKey.includes('your-key')) {
                errors.push('Stripe is enabled but STRIPE_PUBLISHABLE_KEY is not configured');
            }
        }

        // Log errors in development, throw in production
        if (errors.length > 0) {
            const message = 'Configuration errors found:\n' + errors.join('\n');
            
            if (this.environment === 'development') {
                console.warn('⚠️ AFZ Configuration Warnings:', errors);
            } else {
                console.error('❌ AFZ Configuration Errors:', errors);
                // In production, you might want to show a maintenance page
                // throw new Error(message);
            }
        } else {
            console.log('✅ AFZ Configuration validated successfully');
        }
    }

    // Getter methods for easy access
    getSupabaseConfig() {
        return this.config.supabase;
    }

    getOAuthConfig() {
        return this.config.oauth;
    }

    getPaymentConfig() {
        return this.config.payments;
    }

    getMobileMoneyConfig() {
        return this.config.mobileMoney;
    }

    getAPIConfig() {
        return this.config.api;
    }

    getFeatureFlags() {
        return this.config.features;
    }

    getSecurityConfig() {
        return this.config.security;
    }

    // Check if a feature is enabled
    isFeatureEnabled(featureName) {
        return this.config.features[featureName] || false;
    }

    // Check if a payment method is enabled
    isPaymentMethodEnabled(method) {
        if (method === 'mobile-money') {
            return this.config.mobileMoney.enabled;
        }
        return this.config.payments[method]?.enabled || false;
    }

    // Get environment-specific URLs
    getRedirectUrl(path = '') {
        const baseUrl = this.environment === 'development' 
            ? window.location.origin 
            : this.getEnvVar('FRONTEND_URL', window.location.origin);
        return `${baseUrl}${path}`;
    }

    // Update configuration at runtime (for admin settings)
    updateConfig(updates) {
        Object.assign(this.config, updates);
        this.validateConfiguration();
        
        // Notify other parts of the application
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('afz-config-updated', {
                detail: { config: this.config }
            }));
        }
    }

    // Export configuration for debugging
    exportConfig() {
        // Remove sensitive information for export
        const safeConfig = JSON.parse(JSON.stringify(this.config));
        
        // Mask sensitive values
        if (safeConfig.supabase.serviceRoleKey) {
            safeConfig.supabase.serviceRoleKey = '***masked***';
        }
        
        return safeConfig;
    }
}

// Initialize and export the configuration
const afzProductionConfig = new AFZProductionConfig();

// Make available globally for easy access
if (typeof window !== 'undefined') {
    window.AFZConfig = afzProductionConfig;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AFZProductionConfig;
}

console.log('✅ AFZ Production Configuration loaded');
console.log('🔧 Environment:', afzProductionConfig.environment);
console.log('🎯 Features enabled:', Object.keys(afzProductionConfig.getFeatureFlags()).filter(
    key => afzProductionConfig.isFeatureEnabled(key)
));