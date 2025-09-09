/**
 * AFZ Member Dashboard - Integrated Profile Management
 * Simplified Supabase-integrated profile management
 */

class AFZProfileManager {
    constructor() {
        this.authService = null;
        this.currentUser = null;
        this.isLoading = false;
        this.activeTab = 'overview';
        
        this.waitForServices().then(() => this.init()).catch(console.error);
    }

    async waitForServices() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService) throw new Error('Auth service not available');
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        
        if (!this.currentUser) throw new Error('User not authenticated');
        
        console.log('✅ Profile Manager initialized');
    }

    init() {
        this.setupProfileInterface();
        this.setupEventListeners();
        this.updateProfileDisplay();
    }

    setupProfileInterface() {
        const container = document.getElementById('section-profile');
        if (!container) return;

        container.innerHTML = `
            <div class="profile-dashboard">
                <div class="profile-header-card">
                    <div class="profile-info">
                        <div class="avatar-section">
                            <img src="${this.getAvatarUrl()}" alt="Avatar" class="profile-avatar" id="profile-avatar">
                            <button class="avatar-edit-btn" id="change-avatar-btn">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="profile-details">
                            <h1 class="profile-name">${this.getDisplayName()}</h1>
                            <p class="profile-role">${this.getUserRole()}</p>
                            <p class="profile-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${this.currentUser.location || 'Zambia'}
                            </p>
                        </div>
                        <div class="profile-actions">
                            <button class="btn btn-primary" id="edit-profile-btn">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                <div class="profile-nav">
                    <button class="nav-btn active" data-tab="overview">
                        <i class="fas fa-user"></i> Overview
                    </button>
                    <button class="nav-btn" data-tab="edit">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                    <button class="nav-btn" data-tab="security">
                        <i class="fas fa-shield-alt"></i> Security
                    </button>
                    <button class="nav-btn" data-tab="preferences">
                        <i class="fas fa-cog"></i> Preferences
                    </button>
                </div>

                <div class="profile-content">
                    <div class="tab-content active" id="tab-overview">
                        ${this.renderOverviewTab()}
                    </div>
                    <div class="tab-content" id="tab-edit">
                        ${this.renderEditTab()}
                    </div>
                    <div class="tab-content" id="tab-security">
                        ${this.renderSecurityTab()}
                    </div>
                    <div class="tab-content" id="tab-preferences">
                        ${this.renderPreferencesTab()}
                    </div>
                </div>

                <div class="loading-overlay" id="profile-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Updating...</p>
                </div>
            </div>
        `;
    }

    renderOverviewTab() {
        return `
            <div class="overview-content">
                <div class="info-card">
                    <h3><i class="fas fa-user"></i> Personal Information</h3>
                    <div class="info-row">
                        <span class="label">Full Name:</span>
                        <span class="value">${this.currentUser.full_name || 'Not set'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${this.currentUser.email}</span>
                        ${this.currentUser.email_confirmed_at ? 
                            '<span class="status verified"><i class="fas fa-check-circle"></i> Verified</span>' : 
                            '<span class="status unverified"><i class="fas fa-exclamation-circle"></i> Unverified</span>'
                        }
                    </div>
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${this.currentUser.phone || 'Not set'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Location:</span>
                        <span class="value">${this.currentUser.location || 'Not set'}</span>
                    </div>
                </div>
                
                <div class="info-card">
                    <h3><i class="fas fa-info-circle"></i> About</h3>
                    <p>${this.currentUser.bio || 'No bio added yet.'}</p>
                </div>
                
                <div class="info-card">
                    <h3><i class="fas fa-users"></i> Community Role</h3>
                    <div class="role-badge ${this.currentUser.member_type}">
                        ${this.getRoleIcon()} ${this.getUserRoleDisplayName()}
                    </div>
                    <p>${this.getRoleDescription()}</p>
                </div>
            </div>
        `;
    }

    renderEditTab() {
        return `
            <div class="edit-content">
                <form id="profile-edit-form" class="profile-form">
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        <div class="form-group">
                            <label for="full_name">Full Name *</label>
                            <input type="text" id="full_name" name="full_name" 
                                   value="${this.currentUser.full_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="display_name">Display Name</label>
                            <input type="text" id="display_name" name="display_name" 
                                   value="${this.currentUser.display_name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" 
                                   value="${this.currentUser.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <select id="location" name="location">
                                <option value="">Select province</option>
                                <option value="lusaka" ${this.currentUser.location === 'lusaka' ? 'selected' : ''}>Lusaka</option>
                                <option value="copperbelt" ${this.currentUser.location === 'copperbelt' ? 'selected' : ''}>Copperbelt</option>
                                <option value="southern" ${this.currentUser.location === 'southern' ? 'selected' : ''}>Southern</option>
                                <option value="eastern" ${this.currentUser.location === 'eastern' ? 'selected' : ''}>Eastern</option>
                                <option value="western" ${this.currentUser.location === 'western' ? 'selected' : ''}>Western</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="bio">Bio</label>
                            <textarea id="bio" name="bio" rows="4">${this.currentUser.bio || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
    }

    renderSecurityTab() {
        return `
            <div class="security-content">
                <div class="security-section">
                    <h3><i class="fas fa-key"></i> Password</h3>
                    <p>Keep your account secure</p>
                    <button class="btn btn-primary" id="change-password-btn">Change Password</button>
                </div>
                
                <div class="security-section">
                    <h3><i class="fas fa-envelope"></i> Email Verification</h3>
                    ${this.currentUser.email_confirmed_at ? `
                        <div class="status-message verified">
                            <i class="fas fa-check-circle"></i> Email verified
                        </div>
                    ` : `
                        <div class="status-message unverified">
                            <i class="fas fa-exclamation-triangle"></i> Email not verified
                        </div>
                        <button class="btn btn-primary" id="resend-verification">Resend Verification</button>
                    `}
                </div>
            </div>
        `;
    }

    renderPreferencesTab() {
        return `
            <div class="preferences-content">
                <div class="preference-section">
                    <h3><i class="fas fa-paint-brush"></i> Accessibility</h3>
                    <div class="form-group">
                        <label for="accessibility_mode">Accessibility Mode</label>
                        <select id="accessibility_mode" name="accessibility_mode">
                            <option value="standard" ${this.currentUser.accessibility_mode === 'standard' ? 'selected' : ''}>Standard</option>
                            <option value="high_contrast" ${this.currentUser.accessibility_mode === 'high_contrast' ? 'selected' : ''}>High Contrast</option>
                            <option value="albinism_friendly" ${this.currentUser.accessibility_mode === 'albinism_friendly' ? 'selected' : ''}>Albinism Friendly</option>
                        </select>
                    </div>
                </div>
                
                <div class="preference-section">
                    <h3><i class="fas fa-bell"></i> Notifications</h3>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="email_notifications" ${this.currentUser.email_notifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Email Notifications
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" id="sms_notifications" ${this.currentUser.sms_notifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            SMS Notifications
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" id="save-preferences">Save Preferences</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-btn')) {
                const tab = e.target.closest('.nav-btn').dataset.tab;
                this.switchTab(tab);
            }
            
            if (e.target.closest('#change-avatar-btn')) {
                this.handleAvatarChange();
            }
            
            if (e.target.closest('#change-password-btn')) {
                this.handlePasswordChange();
            }
            
            if (e.target.closest('#save-preferences')) {
                this.handlePreferencesSave();
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'profile-edit-form') {
                e.preventDefault();
                this.handleProfileSave();
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        this.activeTab = tabName;
    }

    async handleProfileSave() {
        const form = document.getElementById('profile-edit-form');
        const formData = new FormData(form);
        
        const profileData = {
            full_name: formData.get('full_name'),
            display_name: formData.get('display_name'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            bio: formData.get('bio')
        };

        this.setLoading(true);

        try {
            const result = await this.authService.updateProfile(profileData);
            
            if (result.success) {
                this.currentUser = { ...this.currentUser, ...result.profile };
                this.updateProfileDisplay();
                this.showSuccess('Profile updated successfully!');
                this.switchTab('overview');
                document.getElementById('tab-overview').innerHTML = this.renderOverviewTab();
            } else {
                this.showError(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError('An unexpected error occurred');
        } finally {
            this.setLoading(false);
        }
    }

    handleAvatarChange() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => this.uploadAvatar(e.target.files[0]);
        input.click();
    }

    async uploadAvatar(file) {
        if (!file || !window.SupabaseConfig) return;

        const validation = window.SupabaseConfig.validateFile(file, 'avatars');
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        this.setLoading(true);

        try {
            const result = await window.SupabaseConfig.uploadFile(file, 'avatars', this.currentUser.id);
            
            if (result.success) {
                const updateResult = await this.authService.updateProfile({
                    avatar_url: result.publicUrl
                });

                if (updateResult.success) {
                    this.currentUser.avatar_url = result.publicUrl;
                    this.updateAvatarDisplay();
                    this.showSuccess('Avatar updated!');
                }
            } else {
                this.showError(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showError('Upload failed');
        } finally {
            this.setLoading(false);
        }
    }

    handlePasswordChange() {
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;

        this.authService.updatePassword(newPassword).then(result => {
            if (result.success) {
                this.showSuccess('Password updated successfully!');
            } else {
                this.showError(result.error || 'Failed to update password');
            }
        });
    }

    async handlePreferencesSave() {
        const accessibilityMode = document.getElementById('accessibility_mode')?.value;
        const emailNotifications = document.getElementById('email_notifications')?.checked;
        const smsNotifications = document.getElementById('sms_notifications')?.checked;

        const result = await this.authService.updateProfile({
            accessibility_mode: accessibilityMode,
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications
        });

        if (result.success) {
            this.showSuccess('Preferences saved!');
            this.currentUser = { ...this.currentUser, ...result.profile };
        } else {
            this.showError('Failed to save preferences');
        }
    }

    // Helper methods
    getDisplayName() {
        return this.currentUser?.display_name || this.currentUser?.full_name || 
               this.currentUser?.email?.split('@')[0] || 'Member';
    }

    getAvatarUrl() {
        return this.currentUser?.avatar_url || 
               `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getDisplayName())}&background=DAA520&color=000000`;
    }

    getUserRole() {
        return this.currentUser?.member_type || 'community';
    }

    getUserRoleDisplayName() {
        const roles = {
            community: 'Community Member',
            active: 'Active Member', 
            advocate: 'Advocate',
            volunteer: 'Volunteer',
            admin: 'Administrator'
        };
        return roles[this.getUserRole()] || 'Member';
    }

    getRoleIcon() {
        const icons = {
            community: '<i class="fas fa-user"></i>',
            active: '<i class="fas fa-star"></i>',
            advocate: '<i class="fas fa-bullhorn"></i>',
            volunteer: '<i class="fas fa-hands-helping"></i>',
            admin: '<i class="fas fa-crown"></i>'
        };
        return icons[this.getUserRole()] || '<i class="fas fa-user"></i>';
    }

    getRoleDescription() {
        const descriptions = {
            community: 'Part of the AFZ community with access to resources and events.',
            active: 'Active member with enhanced community participation.',
            advocate: 'Advocacy leader working to advance albinism awareness.',
            volunteer: 'Volunteer supporting AFZ programs and initiatives.',
            admin: 'Administrator with full access to manage the platform.'
        };
        return descriptions[this.getUserRole()] || 'Community member';
    }

    updateProfileDisplay() {
        const nameEl = document.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = this.getDisplayName();
        
        this.updateAvatarDisplay();
    }

    updateAvatarDisplay() {
        const avatarEl = document.getElementById('profile-avatar');
        if (avatarEl) avatarEl.src = this.getAvatarUrl();
    }

    setLoading(loading) {
        const overlay = document.getElementById('profile-loading');
        if (overlay) overlay.style.display = loading ? 'flex' : 'none';
        this.isLoading = loading;
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        setTimeout(() => toast.remove(), 5000);
    }

    setupRealtimeUpdates() {
        // Listen for auth state changes
        this.authService.onAuthStateChange((event, user) => {
            if (event === 'PROFILE_UPDATED') {
                this.currentUser = user;
                this.updateProfileDisplay();
            }
        });
    }
}

// Initialize when profile section is loaded
if (typeof window !== 'undefined') {
    window.profileManager = new AFZProfileManager();
}

console.log('✅ AFZ Profile Manager loaded');