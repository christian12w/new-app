/**
 * AFZ Authentication Guard
 * Protects pages that require authentication
 */

class AFZAuthGuard {
    constructor(options = {}) {
        this.options = {
            redirectUrl: './auth.html',
            requiredRole: null,
            allowedRoles: null,
            checkOnLoad: true,
            ...options
        };
        
        this.isInitialized = false;
        
        if (this.options.checkOnLoad) {
            this.init();
        }
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for auth service to be available
            await this.waitForAuthService();
            
            // Set up auth state listener
            window.afzAuthService.onAuthStateChange((event, user) => {
                if (event === 'SIGNED_OUT') {
                    this.handleUnauthorized('User signed out');
                }
            });
            
            // Initial check
            this.checkAuth();
            
            this.isInitialized = true;
            console.log('✅ AFZ Auth Guard initialized');
            
        } catch (error) {
            console.error('❌ Auth Guard initialization failed:', error);
            this.handleUnauthorized('Authentication system unavailable');
        }
    }

    async waitForAuthService() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService) {
            throw new Error('AFZ Auth Service not available');
        }
    }

    checkAuth() {
        const authService = window.afzAuthService;
        
        if (!authService) {
            this.handleUnauthorized('Authentication service not available');
            return false;
        }

        // Check if user is authenticated
        if (!authService.isAuthenticated) {
            this.handleUnauthorized('User not authenticated');
            return false;
        }

        // Check role requirements
        if (this.options.requiredRole && !authService.hasRole(this.options.requiredRole)) {
            this.handleUnauthorized(`Required role: ${this.options.requiredRole}`);
            return false;
        }

        if (this.options.allowedRoles && !authService.hasAnyRole(this.options.allowedRoles)) {
            this.handleUnauthorized(`Required roles: ${this.options.allowedRoles.join(', ')}`);
            return false;
        }

        console.log('✅ Auth check passed for user:', authService.getDisplayName());
        return true;
    }

    requireAuth() {
        return this.checkAuth();
    }

    requireRole(role) {
        const authService = window.afzAuthService;
        
        if (!this.requireAuth()) {
            return false;
        }

        if (!authService.hasRole(role)) {
            this.handleUnauthorized(`Required role: ${role}`);
            return false;
        }

        return true;
    }

    requireAnyRole(roles) {
        const authService = window.afzAuthService;
        
        if (!this.requireAuth()) {
            return false;
        }

        if (!authService.hasAnyRole(roles)) {
            this.handleUnauthorized(`Required roles: ${roles.join(', ')}`);
            return false;
        }

        return true;
    }

    handleUnauthorized(reason) {
        console.warn('🚫 Access denied:', reason);
        
        // Store the current URL for redirect after login
        sessionStorage.setItem('afz_redirect_after_login', window.location.href);
        
        // Redirect to auth page
        window.location.href = this.options.redirectUrl;
    }

    // Utility methods for checking specific permissions
    canViewAdminPanel() {
        return this.requireRole('admin');
    }

    canModerateContent() {
        return this.requireAnyRole(['admin', 'advocate', 'volunteer']);
    }

    canUploadResources() {
        return this.requireRole('admin');
    }

    canCreateEvents() {
        return this.requireAnyRole(['admin', 'advocate', 'volunteer']);
    }

    // Get current user information
    getCurrentUser() {
        return window.afzAuthService?.getCurrentUser() || null;
    }

    getDisplayName() {
        return window.afzAuthService?.getDisplayName() || 'Guest';
    }

    getUserRole() {
        return window.afzAuthService?.getUserRole() || 'guest';
    }
}

// Factory functions for common use cases
window.AFZAuthGuard = {
    // Create a basic auth guard (just requires login)
    create: (options) => new AFZAuthGuard(options),
    
    // Create an admin-only guard
    createAdminGuard: () => new AFZAuthGuard({
        requiredRole: 'admin',
        redirectUrl: './auth.html'
    }),
    
    // Create a moderator+ guard
    createModeratorGuard: () => new AFZAuthGuard({
        allowedRoles: ['admin', 'advocate', 'volunteer'],
        redirectUrl: './auth.html'
    }),
    
    // Create a member guard (any authenticated user)
    createMemberGuard: () => new AFZAuthGuard({
        redirectUrl: './auth.html'
    }),
    
    // Manual auth check without redirect
    checkAuth: async () => {
        const guard = new AFZAuthGuard({ checkOnLoad: false });
        await guard.init();
        return guard.checkAuth();
    },
    
    // Quick role check
    hasRole: (role) => {
        return window.afzAuthService?.hasRole(role) || false;
    },
    
    // Quick multi-role check
    hasAnyRole: (roles) => {
        return window.afzAuthService?.hasAnyRole(roles) || false;
    }
};

// Auto-initialize for pages that need basic auth protection
if (typeof window !== 'undefined') {
    // Check if page has auth-required attribute
    if (document.documentElement.hasAttribute('data-auth-required')) {
        const requiredRole = document.documentElement.getAttribute('data-required-role');
        const allowedRoles = document.documentElement.getAttribute('data-allowed-roles');
        
        new AFZAuthGuard({
            requiredRole: requiredRole || null,
            allowedRoles: allowedRoles ? allowedRoles.split(',') : null
        });
    }
}

console.log('✅ AFZ Auth Guard loaded');