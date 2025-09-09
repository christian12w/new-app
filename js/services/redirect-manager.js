/**
 * AFZ Redirect Manager
 * Handles post-authentication redirects
 */

class AFZRedirectManager {
    constructor() {
        this.init();
    }

    init() {
        // Check for stored redirect URL when auth service is ready
        if (window.afzAuthService) {
            this.handleAuthRedirect();
        } else {
            // Wait for auth service
            const interval = setInterval(() => {
                if (window.afzAuthService) {
                    clearInterval(interval);
                    this.handleAuthRedirect();
                }
            }, 100);
        }
    }

    handleAuthRedirect() {
        // Only handle redirects if user just signed in
        window.afzAuthService.onAuthStateChange((event, user) => {
            if (event === 'SIGNED_IN' && user) {
                this.performRedirect();
            }
        });

        // Also check immediately if already signed in (for page refresh cases)
        if (window.afzAuthService.isAuthenticated) {
            this.performRedirect();
        }
    }

    performRedirect() {
        // Check if we're offline - if so, don't redirect to prevent loops
        if (!navigator.onLine) {
            console.log('User is offline - not performing redirect to prevent loops');
            return;
        }
        
        // Get stored redirect URL
        const redirectUrl = sessionStorage.getItem('afz_redirect_after_login');
        
        if (redirectUrl) {
            // Clear the stored URL
            sessionStorage.removeItem('afz_redirect_after_login');
            
            // Validate that the redirect URL is safe (same origin)
            if (this.isSafeRedirectUrl(redirectUrl)) {
                console.log('Redirecting to:', redirectUrl);
                window.location.href = redirectUrl;
                return;
            }
        }

        // Default redirect based on current page
        if (window.location.pathname.includes('auth.html')) {
            // If on auth page, redirect to member hub
            window.location.href = './member-hub.html';
        }
    }

    isSafeRedirectUrl(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            
            // Only allow same origin redirects
            if (urlObj.origin !== window.location.origin) {
                console.warn('Blocked cross-origin redirect:', url);
                return false;
            }

            // Block redirects to auth page to prevent loops
            if (urlObj.pathname.includes('auth.html')) {
                console.warn('Blocked redirect to auth page:', url);
                return false;
            }

            return true;
        } catch (error) {
            console.warn('Invalid redirect URL:', url);
            return false;
        }
    }

    // Utility method to set redirect URL before going to auth
    static setRedirectUrl(url = null) {
        const redirectUrl = url || window.location.href;
        sessionStorage.setItem('afz_redirect_after_login', redirectUrl);
    }

    // Utility method to clear redirect URL
    static clearRedirectUrl() {
        sessionStorage.removeItem('afz_redirect_after_login');
    }
}

// Initialize redirect manager
if (typeof window !== 'undefined') {
    window.afzRedirectManager = new AFZRedirectManager();
}

console.log('✅ AFZ Redirect Manager loaded');