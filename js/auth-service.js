/**
 * AFZ Authentication Service
 * Real Supabase authentication integration for member portal
 */

class AFZAuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authListeners = [];
        this.init();
    }

    async init() {
        if (!window.sb) {
            console.error('Supabase client not available');
            return;
        }

        // Check for existing session
        try {
            const { data: { session }, error } = await window.sb.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                await this.handleUserSession(session.user);
            }

            // Listen for auth state changes
            window.sb.auth.onAuthStateChange(async (event, session) => {
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
                }
            });

        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async handleUserSession(user) {
        try {
            // Get or create user profile
            const profile = await this.getUserProfile(user.id);
            
            this.currentUser = {
                id: user.id,
                email: user.email,
                ...profile
            };
            
            this.isAuthenticated = true;
            this.notifyAuthListeners('SIGNED_IN', this.currentUser);
            
            // Update last active timestamp
            await this.updateLastActive();
            
        } catch (error) {
            console.error('Error handling user session:', error);
        }
    }

    async getUserProfile(userId) {
        try {
            const { data, error } = await window.sb
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found error
                throw error;
            }

            // If no profile exists, create a basic one
            if (!data) {
                const { data: newProfile, error: createError } = await window.sb
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: this.currentUser?.email || '',
                        role: 'member',
                        membership_type: 'standard'
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                return newProfile;
            }

            return data;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return {
                id: userId,
                email: this.currentUser?.email || '',
                display_name: 'Member',
                role: 'member'
            };
        }
    }

    async updateLastActive() {
        if (!this.currentUser) return;

        try {
            await window.sb
                .from('profiles')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', this.currentUser.id);
        } catch (error) {
            console.error('Error updating last active:', error);
        }
    }

    handleSignOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.notifyAuthListeners('SIGNED_OUT', null);
        
        // Redirect to auth page
        window.location.href = './auth.html';
    }

    async signOut() {
        try {
            const { error } = await window.sb.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Sign out error:', error);
            // Force local sign out
            this.handleSignOut();
        }
    }

    async updateProfile(updates) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const { data, error } = await window.sb
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

            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Role-based access control
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }

    hasAnyRole(roles) {
        if (!this.currentUser) return false;
        return roles.includes(this.currentUser.role);
    }

    isAdmin() {
        return this.hasAnyRole(['admin', 'super_admin']);
    }

    isModerator() {
        return this.hasAnyRole(['moderator', 'admin', 'super_admin']);
    }

    canModerate() {
        return this.isModerator();
    }

    canAdminister() {
        return this.isAdmin();
    }

    // Auth state listeners
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

    // Utility methods
    requireAuth() {
        if (!this.isAuthenticated) {
            window.location.href = './auth.html';
            return false;
        }
        return true;
    }

    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasRole(role)) {
            console.warn(`Access denied. Required role: ${role}, user role: ${this.currentUser.role}`);
            return false;
        }
        return true;
    }

    requireAnyRole(roles) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasAnyRole(roles)) {
            console.warn(`Access denied. Required roles: ${roles.join(', ')}, user role: ${this.currentUser.role}`);
            return false;
        }
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getDisplayName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.display_name || this.currentUser.full_name || this.currentUser.email.split('@')[0];
    }

    getAvatarUrl() {
        if (!this.currentUser) return null;
        return this.currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getDisplayName())}&background=DAA520&color=000000`;
    }

    getUserRole() {
        return this.currentUser?.role || 'guest';
    }
}

// Initialize global auth service
window.afzAuth = new AFZAuthService();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AFZAuthService;
}

console.log('✅ AFZ Authentication Service initialized');