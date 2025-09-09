/**
 * AFZ Comprehensive Authentication Service
 * Integrated Supabase authentication with form handling and user management
 */

class AFZAuthenticationService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authListeners = [];
        this.realtimeSubscriptions = new Map();
        
        // Initialize service
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase client
            if (window.SupabaseConfig) {
                this.supabase = window.SupabaseConfig.getSupabaseClient();
            } else if (window.sb) {
                this.supabase = window.sb;
            } else {
                throw new Error('Supabase client not available');
            }

            if (!this.supabase) {
                throw new Error('Failed to initialize Supabase client');
            }

            console.log('✅ AFZ Authentication Service initialized');

            // Check for existing session
            await this.checkExistingSession();

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                
                switch (event) {
                    case 'SIGNED_IN':
                        await this.handleUserSession(session.user);
                        break;
                    case 'SIGNED_OUT':
                        this.handleSignOut();
                        break;
                    case 'TOKEN_REFRESHED':
                        console.log('Token refreshed');
                        break;
                    case 'USER_UPDATED':
                        if (session?.user) {
                            await this.handleUserSession(session.user);
                        }
                        break;
                }
            });

        } catch (error) {
            console.error('❌ Auth service initialization error:', error);
        }
    }

    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                await this.handleUserSession(session.user);
            }
        } catch (error) {
            console.error('Error checking existing session:', error);
        }
    }

    async handleUserSession(user) {
        try {
            // Get or create user profile
            const profile = await this.getUserProfile(user.id);
            
            this.currentUser = {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
                phone: user.phone,
                ...profile
            };
            
            this.isAuthenticated = true;
            this.notifyAuthListeners('SIGNED_IN', this.currentUser);
            
            // Update last active timestamp
            await this.updateLastActive();
            
            console.log('✅ User session established:', this.currentUser.email);
            
        } catch (error) {
            console.error('Error handling user session:', error);
        }
    }

    async getUserProfile(userId) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found error
                throw error;
            }

            return data || this.createDefaultProfile(userId);

        } catch (error) {
            console.error('Error getting user profile:', error);
            return this.createDefaultProfile(userId);
        }
    }

    createDefaultProfile(userId) {
        return {
            id: userId,
            email: this.currentUser?.email || '',
            full_name: '',
            display_name: 'Member',
            member_type: 'community',
            profile_visibility: 'public',
            accessibility_mode: 'standard'
        };
    }

    handleSignOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.notifyAuthListeners('SIGNED_OUT', null);
        this.clearAllSubscriptions();
        
        console.log('✅ User signed out');
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    async signIn(email, password, rememberMe = false) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            if (data.user) {
                // Set session persistence based on remember me
                if (!rememberMe) {
                    // Session will expire when browser closes
                    await this.supabase.auth.updateUser({
                        data: { session_timeout: 'session' }
                    });
                }

                return {
                    success: true,
                    user: data.user,
                    session: data.session
                };
            }

            throw new Error('Authentication failed');

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message || 'Authentication failed'
            };
        }
    }

    async signUp(userData) {
        try {
            const { email, password, firstName, lastName, phone, location } = userData;

            // Sign up user
            const { data, error } = await this.supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: `${firstName.trim()} ${lastName.trim()}`,
                        display_name: firstName.trim(),
                        phone: phone?.trim() || null,
                        location: location || null
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Create user profile
                await this.createUserProfile(data.user, userData);

                return {
                    success: true,
                    user: data.user,
                    session: data.session,
                    message: data.user.email_confirmed_at ? 
                        'Account created successfully!' : 
                        'Please check your email to confirm your account.'
                };
            }

            throw new Error('Registration failed');

        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    }

    async createUserProfile(user, userData) {
        try {
            const profileData = {
                id: user.id,
                email: user.email,
                full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
                display_name: userData.firstName.trim(),
                phone: userData.phone?.trim() || null,
                location: userData.location || null,
                member_type: 'community',
                profile_visibility: 'public',
                accessibility_mode: 'standard'
            };

            const { error } = await this.supabase
                .from('profiles')
                .insert(profileData);

            if (error) throw error;

            console.log('✅ User profile created successfully');

        } catch (error) {
            console.error('Error creating user profile:', error);
            // Don't throw here as the auth signup was successful
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Sign out error:', error);
            // Force local sign out even if API call fails
            this.handleSignOut();
            return { success: true, forced: true };
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/pages/auth.html?mode=reset`
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Password reset email sent. Please check your inbox.'
            };

        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send password reset email'
            };
        }
    }

    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Password updated successfully'
            };

        } catch (error) {
            console.error('Password update error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update password'
            };
        }
    }

    async updateProfile(updates) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            // Update current user
            Object.assign(this.currentUser, data);
            this.notifyAuthListeners('PROFILE_UPDATED', this.currentUser);

            return { success: true, profile: data };

        } catch (error) {
            console.error('Error updating profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to update profile'
            };
        }
    }

    async updateLastActive() {
        if (!this.currentUser) return;

        try {
            await this.supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', this.currentUser.id);
        } catch (error) {
            console.error('Error updating last active:', error);
        }
    }

    // ============================================
    // SOCIAL AUTHENTICATION
    // ============================================

    async signInWithGoogle() {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/pages/member-hub.html`
                }
            });

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Google sign in error:', error);
            return {
                success: false,
                error: error.message || 'Google sign in failed'
            };
        }
    }

    async signInWithFacebook() {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: `${window.location.origin}/pages/member-hub.html`
                }
            });

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Facebook sign in error:', error);
            return {
                success: false,
                error: error.message || 'Facebook sign in failed'
            };
        }
    }

    // ============================================
    // ROLE-BASED ACCESS CONTROL
    // ============================================

    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.member_type === role;
    }

    hasAnyRole(roles) {
        if (!this.currentUser) return false;
        return roles.includes(this.currentUser.member_type);
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    canModerate() {
        return this.hasAnyRole(['admin', 'advocate', 'volunteer']);
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            // Check if we're offline before redirecting
            if (!navigator.onLine) {
                // If offline, don't redirect to auth page as it might cause loops
                console.log('User not authenticated but offline - not redirecting to auth');
                return false;
            }
            
            // Store current URL for redirect after login, but only if not already on auth page
            if (!window.location.pathname.includes('auth.html')) {
                AFZRedirectManager.setRedirectUrl();
            }
            
            window.location.href = './auth.html';
            return false;
        }
        return true;
    }

    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasRole(role)) {
            console.warn(`Access denied. Required role: ${role}, user role: ${this.currentUser.member_type}`);
            return false;
        }
        return true;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    getCurrentUser() {
        return this.currentUser;
    }

    getDisplayName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.display_name || 
               this.currentUser.full_name || 
               this.currentUser.email.split('@')[0];
    }

    getAvatarUrl() {
        if (!this.currentUser) return null;
        return this.currentUser.avatar_url || 
               `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getDisplayName())}&background=DAA520&color=000000`;
    }

    getUserRole() {
        return this.currentUser?.member_type || 'guest';
    }

    isEmailConfirmed() {
        return this.currentUser?.email_confirmed_at !== null;
    }

    // ============================================
    // AUTH STATE LISTENERS
    // ============================================

    onAuthStateChange(callback) {
        this.authListeners.push(callback);
        
        // Immediately call with current state
        if (this.isAuthenticated) {
            callback('SIGNED_IN', this.currentUser);
        }
        
        // Return unsubscribe function
        return () => {
            this.authListeners = this.authListeners.filter(listener => listener !== callback);
        };
    }

    notifyAuthListeners(event, user) {
        this.authListeners.forEach(callback => {
            try {
                callback(event, user);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }

    // ============================================
    // REAL-TIME SUBSCRIPTIONS
    // ============================================

    subscribeToNotifications(callback) {
        if (!this.currentUser) return null;

        const subscription = this.supabase
            .channel('user-notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `recipient_id=eq.${this.currentUser.id}`
            }, callback)
            .subscribe();

        this.realtimeSubscriptions.set('notifications', subscription);
        return subscription;
    }

    clearAllSubscriptions() {
        this.realtimeSubscriptions.forEach((subscription) => {
            this.supabase.removeChannel(subscription);
        });
        this.realtimeSubscriptions.clear();
    }

    // ============================================
    // VALIDATION HELPERS
    // ============================================

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return {
            isValid: minLength && hasUpper && hasLower && hasNumber,
            checks: {
                minLength,
                hasUpper,
                hasLower,
                hasNumber
            }
        };
    }

    validatePhone(phone) {
        if (!phone) return true; // Phone is optional
        
        // Basic phone validation for Zambian numbers
        const phoneRegex = /^(\+260|0)?[7-9]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
}

// Initialize global authentication service
if (typeof window !== 'undefined') {
    window.afzAuthService = new AFZAuthenticationService();
    
    // Legacy compatibility
    window.afzAuth = window.afzAuthService;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AFZAuthenticationService;
}

console.log('✅ AFZ Comprehensive Authentication Service loaded');