/**
 * AFZ Member Hub - Integrated Profile Management Module
 * Comprehensive profile editing with Supabase integration
 */

class ProfileManager {
    constructor() {
        this.authService = null;
        this.currentUser = null;
        this.formData = {};
        this.hasUnsavedChanges = false;
        this.isLoading = false;
        this.activeTab = 'overview';
        
        // Wait for auth service and initialize
        this.waitForServices().then(() => {
            this.init();
        });
    }

    async waitForServices() {
        // Wait for auth service to be available
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService) {
            throw new Error('Authentication service not available');
        }
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }
        
        console.log('✅ Profile Manager initialized for user:', this.currentUser.email);
    }

    init() {
        this.setupProfileInterface();
        this.setupEventListeners();
        this.loadUserProfile();
        this.setupImageUploads();
        this.setupFormValidation();
        this.setupRealtimeUpdates();
    }

    setupProfileInterface() {
        const profileContainer = document.getElementById('section-profile');
        if (!profileContainer) return;

        profileContainer.innerHTML = `
            <div class="profile-interface">
                <!-- Profile Header -->
                <div class="profile-header">
                    <div class="cover-image-container">
                        <div class="cover-image" style="background-image: url('${this.getAvatarUrl()}')">
                            <div class="cover-overlay">
                                <button class="change-cover-btn" id="change-cover-btn" title="Change Cover Photo">
                                    <i class="fas fa-camera"></i>
                                    Change Cover
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-info-header">
                        <div class="avatar-section">
                            <div class="avatar-container">
                                <img src="${this.getAvatarUrl()}" alt="Profile Avatar" id="profile-avatar" class="profile-avatar">
                                <div class="avatar-overlay">
                                    <button class="change-avatar-btn" id="change-avatar-btn" title="Change Profile Picture">
                                        <i class="fas fa-camera"></i>
                                    </button>
                                </div>
                                <div class="status-indicator online"></div>
                            </div>
                        </div>
                        
                        <div class="profile-basic-info">
                            <h1 class="profile-name">${this.getDisplayName()}</h1>
                            <p class="profile-title">${this.currentUser.occupation || 'Community Member'}</p>
                            <p class="profile-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${this.currentUser.location || 'Zambia'}
                            </p>
                            <p class="member-since">
                                Member since ${this.formatDate(this.currentUser.created_at)}
                            </p>
                        </div>
                        
                        <div class="profile-actions">
                            <button class="btn btn-primary" id="edit-profile-btn">
                                <i class="fas fa-edit"></i>
                                Edit Profile
                            </button>
                            <button class="btn btn-secondary" id="view-public-profile-btn">
                                <i class="fas fa-eye"></i>
                                View Public Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Profile Content -->
                <div class="profile-content">
                    <div class="profile-tabs">
                        <button class="tab-btn active" data-tab="overview" id="tab-overview">
                            <i class="fas fa-user"></i>
                            Overview
                        </button>
                        <button class="tab-btn" data-tab="edit" id="tab-edit">
                            <i class="fas fa-edit"></i>
                            Edit Profile
                        </button>
                        <button class="tab-btn" data-tab="privacy" id="tab-privacy">
                            <i class="fas fa-shield-alt"></i>
                            Privacy Settings
                        </button>
                        <button class="tab-btn" data-tab="security" id="tab-security">
                            <i class="fas fa-lock"></i>
                            Security
                        </button>
                        <button class="tab-btn" data-tab="preferences" id="tab-preferences">
                            <i class="fas fa-sliders-h"></i>
                            Preferences
                        </button>
                    </div>

                    <div class="profile-tab-content">
                        <!-- Overview Tab -->
                        <div class="tab-panel active" id="panel-overview">
                            ${this.renderOverviewPanel()}
                        </div>

                        <!-- Edit Profile Tab -->
                        <div class="tab-panel" id="panel-edit">
                            ${this.renderEditPanel()}
                        </div>

                        <!-- Privacy Settings Tab -->
                        <div class="tab-panel" id="panel-privacy">
                            ${this.renderPrivacyPanel()}
                        </div>

                        <!-- Security Tab -->
                        <div class="tab-panel" id="panel-security">
                            ${this.renderSecurityPanel()}
                        </div>
                        
                        <!-- Preferences Tab -->
                        <div class="tab-panel" id="panel-preferences">
                            ${this.renderPreferencesPanel()}
                        </div>
                    </div>
                </div>

                <!-- Loading Overlay -->
                <div class="profile-loading" id="profile-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Updating profile...</p>
                </div>
            </div>
        `;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    getDisplayName() {
        return this.currentUser?.display_name || 
               this.currentUser?.full_name || 
               this.currentUser?.email?.split('@')[0] || 
               'Member';
    }

    getAvatarUrl() {
        return this.currentUser?.avatar_url || 
               `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getDisplayName())}&background=DAA520&color=000000`;
    }

    formatDate(dateString) {
        if (!dateString) return 'Recently';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
        } catch {
            return 'Recently';
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) return;
        
        this.setLoading(true);
        
        try {
            // The user profile is already loaded from auth service
            // Just update the display
            this.updateProfileDisplay();
            
            console.log('✅ Profile data loaded successfully');
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile data');
        } finally {
            this.setLoading(false);
        }
    }

    updateProfileDisplay() {
        // Update profile name
        const nameElement = document.querySelector('.profile-name');
        if (nameElement) {
            nameElement.textContent = this.getDisplayName();
        }
        
        // Update avatar
        const avatarElement = document.getElementById('profile-avatar');
        if (avatarElement) {
            avatarElement.src = this.getAvatarUrl();
        }
        
        // Update other profile elements
        const titleElement = document.querySelector('.profile-title');
        if (titleElement) {
            titleElement.textContent = this.currentUser.occupation || 'Community Member';
        }
        
        const locationElement = document.querySelector('.profile-location');
        if (locationElement) {
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                ${this.currentUser.location || 'Zambia'}
            `;
        }
        
        const memberSinceElement = document.querySelector('.member-since');
        if (memberSinceElement) {
            memberSinceElement.textContent = `Member since ${this.formatDate(this.currentUser.created_at)}`;
        }
    }
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="cancel-upload">Cancel</button>
                            <button class="btn btn-primary" id="confirm-upload" disabled>Upload Image</button>
                        </div>
                    </div>
                </div>

                <!-- Unsaved Changes Warning -->
                <div class="unsaved-changes-warning" id="unsaved-warning" style="display: none;">
                    <div class="warning-content">
                        <div class="warning-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="warning-message">
                            <h4>You have unsaved changes</h4>
                            <p>Your changes will be lost if you leave without saving.</p>
                        </div>
                        <div class="warning-actions">
                            <button class="btn btn-sm btn-secondary" id="discard-changes">Discard</button>
                            <button class="btn btn-sm btn-primary" id="save-changes">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.injectProfileStyles();
    }

    renderOverviewPanel() {
        return `
            <div class="overview-content">
                <div class="info-section">
                    <h3>About</h3>
                    <p class="bio">${this.currentUser.bio}</p>
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <h4>Contact Information</h4>
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <span>${this.currentUser.email}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <span>${this.currentUser.phone}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.currentUser.location}</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>Personal Details</h4>
                        <div class="info-item">
                            <i class="fas fa-birthday-cake"></i>
                            <span>${this.formatDate(this.currentUser.dateOfBirth)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-venus-mars"></i>
                            <span>${this.currentUser.gender}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-briefcase"></i>
                            <span>${this.currentUser.occupation}</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>Interests</h4>
                        <div class="interests-list">
                            ${this.currentUser.interests.map(interest => 
                                `<span class="interest-tag">${interest}</span>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>Social Links</h4>
                        <div class="social-links">
                            ${this.renderSocialLinks()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEditPanel() {
        return `
            <form class="edit-profile-form" id="edit-profile-form">
                <div class="form-sections">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="edit-name">Full Name *</label>
                                <input type="text" id="edit-name" name="name" value="${this.currentUser.name}" required>
                                <div class="form-error" id="error-name"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-email">Email Address *</label>
                                <input type="email" id="edit-email" name="email" value="${this.currentUser.email}" required>
                                <div class="form-error" id="error-email"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-phone">Phone Number</label>
                                <input type="tel" id="edit-phone" name="phone" value="${this.currentUser.phone}">
                                <div class="form-error" id="error-phone"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-location">Location</label>
                                <input type="text" id="edit-location" name="location" value="${this.currentUser.location}">
                                <div class="form-error" id="error-location"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-dob">Date of Birth</label>
                                <input type="date" id="edit-dob" name="dateOfBirth" value="${this.currentUser.dateOfBirth}">
                                <div class="form-error" id="error-dob"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-gender">Gender</label>
                                <select id="edit-gender" name="gender">
                                    <option value="">Select Gender</option>
                                    <option value="Male" ${this.currentUser.gender === 'Male' ? 'selected' : ''}>Male</option>
                                    <option value="Female" ${this.currentUser.gender === 'Female' ? 'selected' : ''}>Female</option>
                                    <option value="Other" ${this.currentUser.gender === 'Other' ? 'selected' : ''}>Other</option>
                                    <option value="Prefer not to say" ${this.currentUser.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-occupation">Occupation</label>
                                <input type="text" id="edit-occupation" name="occupation" value="${this.currentUser.occupation}">
                            </div>
                        </div>
                    </div>

                    <!-- About & Bio -->
                    <div class="form-section">
                        <h3>About & Bio</h3>
                        <div class="form-group">
                            <label for="edit-bio">Bio</label>
                            <textarea id="edit-bio" name="bio" rows="4" maxlength="500" placeholder="Tell us about yourself...">${this.currentUser.bio}</textarea>
                            <div class="char-counter">
                                <span id="bio-char-count">${this.currentUser.bio.length}</span>/500
                            </div>
                        </div>
                    </div>

                    <!-- Interests -->
                    <div class="form-section">
                        <h3>Interests</h3>
                        <div class="form-group">
                            <label for="edit-interests">Your Interests</label>
                            <div class="interests-input">
                                <input type="text" id="interest-input" placeholder="Add an interest">
                                <button type="button" class="btn btn-sm btn-primary" id="add-interest-btn">Add</button>
                            </div>
                            <div class="current-interests" id="current-interests">
                                ${this.renderEditableInterests()}
                            </div>
                        </div>
                    </div>

                    <!-- Social Links -->
                    <div class="form-section">
                        <h3>Social Links</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="edit-facebook">
                                    <i class="fab fa-facebook"></i>
                                    Facebook
                                </label>
                                <input type="url" id="edit-facebook" name="facebook" value="${this.currentUser.socialLinks.facebook}" placeholder="https://facebook.com/username">
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-twitter">
                                    <i class="fab fa-twitter"></i>
                                    Twitter
                                </label>
                                <input type="url" id="edit-twitter" name="twitter" value="${this.currentUser.socialLinks.twitter}" placeholder="https://twitter.com/username">
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-linkedin">
                                    <i class="fab fa-linkedin"></i>
                                    LinkedIn
                                </label>
                                <input type="url" id="edit-linkedin" name="linkedin" value="${this.currentUser.socialLinks.linkedin}" placeholder="https://linkedin.com/in/username">
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-instagram">
                                    <i class="fab fa-instagram"></i>
                                    Instagram
                                </label>
                                <input type="url" id="edit-instagram" name="instagram" value="${this.currentUser.socialLinks.instagram}" placeholder="https://instagram.com/username">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
    }

    renderPrivacyPanel() {
        return `
            <div class="privacy-settings">
                <div class="privacy-section">
                    <h3>Profile Visibility</h3>
                    <div class="privacy-option">
                        <div class="option-info">
                            <h4>Profile Visibility</h4>
                            <p>Control who can see your profile information</p>
                        </div>
                        <select id="profile-visibility" name="profileVisibility">
                            <option value="public" ${this.currentUser.privacySettings.profileVisibility === 'public' ? 'selected' : ''}>Public</option>
                            <option value="members" ${this.currentUser.privacySettings.profileVisibility === 'members' ? 'selected' : ''}>Members Only</option>
                            <option value="connections" ${this.currentUser.privacySettings.profileVisibility === 'connections' ? 'selected' : ''}>Connections Only</option>
                            <option value="private" ${this.currentUser.privacySettings.profileVisibility === 'private' ? 'selected' : ''}>Private</option>
                        </select>
                    </div>
                </div>

                <div class="privacy-section">
                    <h3>Contact Information</h3>
                    <div class="privacy-option">
                        <div class="option-info">
                            <h4>Show Contact Information</h4>
                            <p>Allow other members to see your email and phone number</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="contact-visible" ${this.currentUser.privacySettings.contactInfoVisible ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="privacy-section">
                    <h3>Activity & Engagement</h3>
                    <div class="privacy-option">
                        <div class="option-info">
                            <h4>Show Activity</h4>
                            <p>Display your recent activities and interactions</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="activity-visible" ${this.currentUser.privacySettings.activityVisible ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="privacy-section">
                    <h3>Communication</h3>
                    <div class="privacy-option">
                        <div class="option-info">
                            <h4>Allow Messages</h4>
                            <p>Let other members send you private messages</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="allow-messages" ${this.currentUser.privacySettings.allowMessages ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="privacy-option">
                        <div class="option-info">
                            <h4>Allow Connection Requests</h4>
                            <p>Enable other members to send you connection requests</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="allow-connections" ${this.currentUser.privacySettings.allowConnectionRequests ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="privacy-actions">
                    <button class="btn btn-primary" id="save-privacy">Save Privacy Settings</button>
                </div>
            </div>
        `;
    }

    renderActivityPanel() {
        return `
            <div class="activity-content">
                <div class="activity-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="stat-info">
                            <h4>34</h4>
                            <p>Messages Sent</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-info">
                            <h4>12</h4>
                            <p>Events Attended</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h4>18</h4>
                            <p>Connections</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="stat-info">
                            <h4>7</h4>
                            <p>Resources Downloaded</p>
                        </div>
                    </div>
                </div>

                <div class="recent-activity">
                    <h3>Recent Activity</h3>
                    <div class="activity-timeline">
                        ${this.renderActivityTimeline()}
                    </div>
                </div>
            </div>
        `;
    }

    renderSocialLinks() {
        const links = [];
        Object.entries(this.currentUser.socialLinks).forEach(([platform, url]) => {
            if (url) {
                links.push(`
                    <a href="${url}" target="_blank" rel="noopener" class="social-link">
                        <i class="fab fa-${platform}"></i>
                        ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                `);
            }
        });
        return links.length > 0 ? links.join('') : '<p class="no-social">No social links added yet</p>';
    }

    renderEditableInterests() {
        return this.currentUser.interests.map((interest, index) => `
            <span class="interest-tag editable" data-index="${index}">
                ${interest}
                <button type="button" class="remove-interest" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }

    renderActivityTimeline() {
        const activities = [
            { type: 'message', description: 'Sent a message in Healthcare Support', time: '2 hours ago', icon: 'fas fa-comment' },
            { type: 'event', description: 'Registered for Albinism Awareness Workshop', time: '1 day ago', icon: 'fas fa-calendar-plus' },
            { type: 'connection', description: 'Connected with Sarah Williams', time: '2 days ago', icon: 'fas fa-user-plus' },
            { type: 'resource', description: 'Downloaded Healthcare Directory', time: '3 days ago', icon: 'fas fa-download' },
            { type: 'profile', description: 'Updated profile information', time: '1 week ago', icon: 'fas fa-user-edit' }
        ];

        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-description">${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    renderSecurityPanel() {
        return `
            <form id="security-form" class="security-form">
                <div class="form-section">
                    <h3>Change Email</h3>
                    <div class="form-group">
                        <label for="sec-email">New Email</label>
                        <input type="email" id="sec-email" placeholder="you@example.com">
                        <div class="form-error" id="err-sec-email"></div>
                    </div>
                    <button type="button" id="btn-update-email" class="btn btn-secondary">Update Email</button>
                </div>
                <div class="form-section">
                    <h3>Change Password</h3>
                    <div class="form-group">
                        <label for="sec-pass">New Password</label>
                        <input type="password" id="sec-pass" placeholder="New password">
                        <div class="form-error" id="err-sec-pass"></div>
                    </div>
                    <div class="form-group">
                        <label for="sec-pass2">Confirm Password</label>
                        <input type="password" id="sec-pass2" placeholder="Confirm new password">
                        <div class="form-error" id="err-sec-pass2"></div>
                    </div>
                    <button type="button" id="btn-update-pass" class="btn btn-secondary">Update Password</button>
                </div>
            </form>
        `;
    }

    renderPreferencesPanel() {
        return `
            <form id="preferences-form" class="prefs-form">
                <div class="form-section">
                    <h3>General Preferences</h3>
                    <div class="form-group">
                        <label for="pref-language">Language</label>
                        <select id="pref-language">
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="pt">Portuguese</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pref-theme">Theme</label>
                        <select id="pref-theme">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="save-preferences" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;
    }

    renderNotificationsPanel() {
        return `
            <form id="notifications-form" class="prefs-form">
                <div class="form-section">
                    <h3>Email Notifications</h3>
                    <label class="checkbox">
                        <input type="checkbox" id="notif-news" ${this.currentUser.notifications?.news !== false ? 'checked' : ''}>
                        <span>News and updates</span>
                    </label>
                    <label class="checkbox">
                        <input type="checkbox" id="notif-events" ${this.currentUser.notifications?.events !== false ? 'checked' : ''}>
                        <span>Event reminders</span>
                    </label>
                    <label class="checkbox">
                        <input type="checkbox" id="notif-messages" ${this.currentUser.notifications?.messages !== false ? 'checked' : ''}>
                        <span>Messages and mentions</span>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" id="save-notifications" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;
    }

    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget || (e.target && e.target.closest('.tab-btn'));
                const tabName = button ? button.getAttribute('data-tab') : null;
                if (tabName) this.switchTab(tabName);
            });
        });

        // Edit profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.switchTab('edit');
            });
        }

        // Image upload buttons
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const changeCoverBtn = document.getElementById('change-cover-btn');
        
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                this.showImageUploadModal('avatar');
            });
        }
        
        if (changeCoverBtn) {
            changeCoverBtn.addEventListener('click', () => {
                this.showImageUploadModal('cover');
            });
        }

        // Form submission
        const editForm = document.getElementById('edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(e);
            });
        }

        // Privacy settings
        const savePrivacyBtn = document.getElementById('save-privacy');
        if (savePrivacyBtn) {
            savePrivacyBtn.addEventListener('click', () => {
                this.savePrivacySettings();
            });
        }

        // Interest management
        this.setupInterestManagement();

        // Form change detection
        this.setupChangeDetection();

        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });

        // Save buttons in new panels
        setTimeout(() => {
            const btnEmail = document.getElementById('btn-update-email');
            const btnPass = document.getElementById('btn-update-pass');
            const btnPrefs = document.getElementById('save-preferences');
            const btnNotifs = document.getElementById('save-notifications');

            if (btnEmail) btnEmail.onclick = () => this.handleEmailUpdate();
            if (btnPass) btnPass.onclick = () => this.handlePasswordUpdate();
            if (btnPrefs) btnPrefs.onclick = () => this.handlePreferencesSave();
            if (btnNotifs) btnNotifs.onclick = () => this.handleNotificationsSave();
        }, 0);
    }

    setupInterestManagement() {
        const addInterestBtn = document.getElementById('add-interest-btn');
        const interestInput = document.getElementById('interest-input');
        
        if (addInterestBtn && interestInput) {
            addInterestBtn.addEventListener('click', () => {
                this.addInterest();
            });
            
            interestInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addInterest();
                }
            });
        }

        // Remove interest buttons (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-interest')) {
                const index = parseInt(e.target.closest('.remove-interest').dataset.index);
                this.removeInterest(index);
            }
        });
    }

    setupChangeDetection() {
        const form = document.getElementById('edit-profile-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
            });
            
            input.addEventListener('change', () => {
                this.markAsChanged();
            });
        });

        // Bio character count
        const bioTextarea = document.getElementById('edit-bio');
        const charCount = document.getElementById('bio-char-count');
        
        if (bioTextarea && charCount) {
            bioTextarea.addEventListener('input', () => {
                charCount.textContent = bioTextarea.value.length;
            });
        }
    }

    setupImageUploads() {
        const uploadInput = document.getElementById('image-upload-input');
        const dropZone = document.getElementById('upload-drop-zone');
        const closeModal = document.getElementById('close-upload-modal');
        const cancelUpload = document.getElementById('cancel-upload');
        const confirmUpload = document.getElementById('confirm-upload');

        if (dropZone) {
            dropZone.addEventListener('click', () => uploadInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                this.handleImageSelection(e.dataTransfer.files);
            });
        }

        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                this.handleImageSelection(e.target.files);
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideImageUploadModal();
            });
        }

        if (cancelUpload) {
            cancelUpload.addEventListener('click', () => {
                this.hideImageUploadModal();
            });
        }

        if (confirmUpload) {
            confirmUpload.addEventListener('click', () => {
                this.uploadImage();
            });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('edit-profile-form');
        if (!form) return;

        const nameInput = document.getElementById('edit-name');
        const emailInput = document.getElementById('edit-email');
        const phoneInput = document.getElementById('edit-phone');

        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                this.validateName(nameInput.value);
            });
        }

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmail(emailInput.value);
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                this.validatePhone(phoneInput.value);
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab panels
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });

        // Warn about unsaved changes when switching away from edit
        if (this.hasUnsavedChanges && tabName !== 'edit') {
            this.showUnsavedWarning();
        }
    }

    showImageUploadModal(type) {
        const modal = document.getElementById('image-upload-modal');
        const title = document.getElementById('upload-modal-title');
        
        if (modal && title) {
            title.textContent = type === 'avatar' ? 'Upload Profile Picture' : 'Upload Cover Photo';
            modal.style.display = 'flex';
            modal.dataset.uploadType = type;
        }
    }

    hideImageUploadModal() {
        const modal = document.getElementById('image-upload-modal');
        const preview = document.getElementById('image-preview');
        const dropZone = document.getElementById('upload-drop-zone');
        const confirmBtn = document.getElementById('confirm-upload');
        
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.uploadType;
        }
        
        if (preview) {
            preview.style.display = 'none';
        }
        
        if (dropZone) {
            dropZone.style.display = 'block';
        }
        
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
    }

    handleImageSelection(files) {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showError('Image file size must be less than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc, file) {
        const preview = document.getElementById('image-preview');
        const dropZone = document.getElementById('upload-drop-zone');
        const previewImg = document.getElementById('preview-image');
        const confirmBtn = document.getElementById('confirm-upload');

        if (preview && dropZone && previewImg && confirmBtn) {
            previewImg.src = imageSrc;
            dropZone.style.display = 'none';
            preview.style.display = 'block';
            confirmBtn.disabled = false;
            
            this.uploadedFiles.set('current', file);
        }
    }

    uploadImage() {
        const modal = document.getElementById('image-upload-modal');
        const uploadType = modal.dataset.uploadType;
        const file = this.uploadedFiles.get('current');
        
        if (!file || !uploadType) return;

        const finishSuccess = (url) => {
            if (uploadType === 'avatar') {
                this.updateAvatar(url);
            } else {
                this.updateCoverImage(url);
            }
            this.hideImageUploadModal();
            if (window.afzDashboard) {
                window.afzDashboard.showNotification(`${uploadType === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`, 'success');
            }
        };

        if (uploadType === 'avatar' && window.afzProfileApi && window.afzProfileApi.uploadAvatar) {
            window.afzProfileApi.uploadAvatar(file)
                .then((publicUrl) => {
                    finishSuccess(publicUrl || this.currentUser.avatar);
                })
                .catch((err) => {
                    console.error('Upload failed:', err);
                    // Fallback to local preview
                    const reader = new FileReader();
                    reader.onload = (e) => finishSuccess(e.target.result);
                    reader.readAsDataURL(file);
                });
            return;
        }

        // Fallback to local preview if no storage integration
        const reader = new FileReader();
        reader.onload = (e) => finishSuccess(e.target.result);
        reader.readAsDataURL(file);
    }

    updateAvatar(newAvatar) {
        this.currentUser.avatar = newAvatar;
        this.markAsChanged();
        
        const avatarElements = document.querySelectorAll('#profile-avatar, .user-avatar img');
        avatarElements.forEach(img => {
            img.src = newAvatar;
        });
    }

    updateCoverImage(newCover) {
        this.currentUser.coverImage = newCover;
        this.markAsChanged();
        
        const coverElement = document.querySelector('.cover-image');
        if (coverElement) {
            coverElement.style.backgroundImage = `url('${newCover}')`;
        }
    }

    addInterest() {
        const input = document.getElementById('interest-input');
        const interest = input.value.trim();
        
        if (!interest) return;
        
        if (this.currentUser.interests.includes(interest)) {
            this.showError('This interest is already added.');
            return;
        }
        
        if (this.currentUser.interests.length >= 10) {
            this.showError('You can add up to 10 interests maximum.');
            return;
        }

        this.currentUser.interests.push(interest);
        input.value = '';
        this.updateInterestsDisplay();
        this.markAsChanged();
    }

    removeInterest(index) {
        this.currentUser.interests.splice(index, 1);
        this.updateInterestsDisplay();
        this.markAsChanged();
    }

    updateInterestsDisplay() {
        const container = document.getElementById('current-interests');
        if (container) {
            container.innerHTML = this.renderEditableInterests();
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        this.saveProfile();
    }

    validateForm() {
        let isValid = true;
        
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();

        if (!this.validateName(name)) isValid = false;
        if (!this.validateEmail(email)) isValid = false;
        if (phone && !this.validatePhone(phone)) isValid = false;

        return isValid;
    }

    validateName(name) {
        const errorElement = document.getElementById('error-name');
        
        if (!name) {
            this.showFieldError(errorElement, 'Name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showFieldError(errorElement, 'Name must be at least 2 characters');
            return false;
        }
        
        this.clearFieldError(errorElement);
        return true;
    }

    validateEmail(email) {
        const errorElement = document.getElementById('error-email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError(errorElement, 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError(errorElement, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(errorElement);
        return true;
    }

    validatePhone(phone) {
        const errorElement = document.getElementById('error-phone');
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        
        if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            this.showFieldError(errorElement, 'Please enter a valid phone number');
            return false;
        }
        
        this.clearFieldError(errorElement);
        return true;
    }

    showFieldError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(errorElement) {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    async saveProfile() {
        const formData = new FormData(document.getElementById('edit-profile-form'));
        
        // Update user data from form fields
        for (let [key, value] of formData.entries()) {
            if (key in this.currentUser) {
                this.currentUser[key] = value;
            }
        }
        this.currentUser.socialLinks.facebook = document.getElementById('edit-facebook').value;
        this.currentUser.socialLinks.twitter = document.getElementById('edit-twitter').value;
        this.currentUser.socialLinks.linkedin = document.getElementById('edit-linkedin').value;
        this.currentUser.socialLinks.instagram = document.getElementById('edit-instagram').value;

        const payload = {
            name: this.currentUser.name,
            phone: this.currentUser.phone,
            location: this.currentUser.location,
            date_of_birth: this.currentUser.dateOfBirth,
            gender: this.currentUser.gender,
            occupation: this.currentUser.occupation,
            bio: this.currentUser.bio,
            social_links: {
                facebook: this.currentUser.socialLinks.facebook,
                twitter: this.currentUser.socialLinks.twitter,
                linkedin: this.currentUser.socialLinks.linkedin,
                instagram: this.currentUser.socialLinks.instagram
            },
            interests: this.currentUser.interests
        };

        const finishSuccess = () => {
            this.markAsSaved();
            this.updateProfileDisplay();
            this.switchTab('overview');
            if (window.afzDashboard) {
                window.afzDashboard.showNotification('Profile updated successfully!', 'success');
            }
        };

        if (window.afzProfileApi && window.afzProfileApi.upsertProfile) {
            window.afzProfileApi.upsertProfile(payload)
                .then(() => finishSuccess())
                .catch((err) => {
                    console.error('Failed to save profile:', err);
                    if (window.afzDashboard) {
                        window.afzDashboard.showNotification('Failed to save profile: ' + (err.message || 'Unknown error'), 'error');
                    }
                });
        } else {
            // Fallback: local update only
            setTimeout(finishSuccess, 500);
        }
    }

    savePrivacySettings() {
        const settings = {
            profileVisibility: document.getElementById('profile-visibility').value,
            contactInfoVisible: document.getElementById('contact-visible').checked,
            activityVisible: document.getElementById('activity-visible').checked,
            allowMessages: document.getElementById('allow-messages').checked,
            allowConnectionRequests: document.getElementById('allow-connections').checked
        };

        this.currentUser.privacySettings = { ...this.currentUser.privacySettings, ...settings };

        // Simulate API call
        setTimeout(() => {
            if (window.afzDashboard) {
                window.afzDashboard.showNotification('Privacy settings saved successfully!', 'success');
            }
        }, 500);
    }

    updateProfileDisplay() {
        // Update header information
        const profileName = document.querySelector('.profile-name');
        const profileTitle = document.querySelector('.profile-title');
        const profileLocation = document.querySelector('.profile-location');

        if (profileName) profileName.textContent = this.currentUser.name;
        if (profileTitle) profileTitle.textContent = this.currentUser.occupation;
        if (profileLocation) {
            profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentUser.location}`;
        }

        // Update overview panel
        const overviewPanel = document.getElementById('panel-overview');
        if (overviewPanel) {
            overviewPanel.innerHTML = this.renderOverviewPanel();
        }
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.showUnsavedWarning();
    }

    markAsSaved() {
        this.hasUnsavedChanges = false;
        this.hideUnsavedWarning();
    }

    showUnsavedWarning() {
        const warning = document.getElementById('unsaved-warning');
        if (warning && this.hasUnsavedChanges) {
            warning.style.display = 'flex';
            
            // Setup warning actions if not already done
            const discardBtn = document.getElementById('discard-changes');
            const saveBtn = document.getElementById('save-changes');
            
            if (discardBtn) {
                discardBtn.onclick = () => {
                    this.discardChanges();
                };
            }
            
            if (saveBtn) {
                saveBtn.onclick = () => {
                    this.saveProfile();
                };
            }
        }
    }

    hideUnsavedWarning() {
        const warning = document.getElementById('unsaved-warning');
        if (warning) {
            warning.style.display = 'none';
        }
    }

    discardChanges() {
        this.hasUnsavedChanges = false;
        this.hideUnsavedWarning();
        this.loadUserData(); // Reload original data
    }

    async loadUserData() {
        try {
            if (window.sb && window.sb.auth) {
                const sessionRes = await window.sb.auth.getUser();
                const authedUser = sessionRes && sessionRes.data ? sessionRes.data.user : null;
                if (authedUser) {
                    this.currentUser.id = authedUser.id;
                    this.currentUser.email = authedUser.email || '';
                    const meta = authedUser.user_metadata || {};
                    const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim();
                    this.currentUser.name = fullName || authedUser.email || '';
                }
            }

            if (window.afzProfileApi && window.afzProfileApi.fetchProfile) {
                const profile = await window.afzProfileApi.fetchProfile();
                if (profile) {
                    this.currentUser = Object.assign({}, this.currentUser, {
                        name: profile.name || this.currentUser.name,
                        phone: profile.phone || '',
                        location: profile.location || '',
                        bio: profile.bio || '',
                        avatar: profile.avatar_url || this.currentUser.avatar,
                        coverImage: profile.cover_url || this.currentUser.coverImage,
                        dateOfBirth: profile.date_of_birth || '',
                        gender: profile.gender || '',
                        occupation: profile.occupation || '',
                        interests: Array.isArray(profile.interests) ? profile.interests : [],
                        socialLinks: {
                            facebook: (profile.social_links && profile.social_links.facebook) || '',
                            twitter: (profile.social_links && profile.social_links.twitter) || '',
                            linkedin: (profile.social_links && profile.social_links.linkedin) || '',
                            instagram: (profile.social_links && profile.social_links.instagram) || ''
                        },
                        privacySettings: Object.assign({}, this.currentUser.privacySettings, profile.privacy_settings || {})
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        }

        this.updateProfileDisplay();
    }

    showError(message) {
        if (window.afzDashboard) {
            window.afzDashboard.showNotification(message, 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setupRealtime() {
        if (window.afzProfileApi && window.afzProfileApi.onProfileChange) {
            if (this._unsubscribeProfile) this._unsubscribeProfile();
            this._unsubscribeProfile = window.afzProfileApi.onProfileChange((payload) => {
                if (!payload || !payload.new) return;
                if (this.currentUser && payload.new.id === this.currentUser.id) {
                    const p = payload.new;
                    this.currentUser = Object.assign({}, this.currentUser, {
                        name: p.name || this.currentUser.name,
                        phone: p.phone || this.currentUser.phone,
                        location: p.location || this.currentUser.location,
                        bio: p.bio || this.currentUser.bio,
                        avatar: p.avatar_url || this.currentUser.avatar,
                        coverImage: p.cover_url || this.currentUser.coverImage,
                        dateOfBirth: p.date_of_birth || this.currentUser.dateOfBirth,
                        gender: p.gender || this.currentUser.gender,
                        occupation: p.occupation || this.currentUser.occupation,
                        interests: Array.isArray(p.interests) ? p.interests : this.currentUser.interests,
                        socialLinks: {
                            facebook: (p.social_links && p.social_links.facebook) || this.currentUser.socialLinks.facebook,
                            twitter: (p.social_links && p.social_links.twitter) || this.currentUser.socialLinks.twitter,
                            linkedin: (p.social_links && p.social_links.linkedin) || this.currentUser.socialLinks.linkedin,
                            instagram: (p.social_links && p.social_links.instagram) || this.currentUser.socialLinks.instagram
                        }
                    });
                    this.updateProfileDisplay();
                }
            });
        }
    }

    injectProfileStyles() {
        if (document.getElementById('profile-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'profile-styles';
        styles.textContent = `
            .profile-interface {
                background: var(--surface);
                border-radius: 16px;
                overflow: hidden;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .profile-header {
                position: relative;
                margin-bottom: 20px;
            }

            .cover-image-container {
                position: relative;
                height: 200px;
                overflow: hidden;
            }

            .cover-image {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                background-color: var(--primary-light);
                position: relative;
            }

            .cover-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .cover-image-container:hover .cover-overlay {
                opacity: 1;
            }

            .change-cover-btn {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }

            .change-cover-btn:hover {
                background: white;
                transform: translateY(-2px);
            }

            .profile-info-header {
                display: flex;
                align-items: flex-end;
                gap: 24px;
                padding: 0 32px;
                margin-top: -60px;
                position: relative;
                z-index: 2;
            }

            .avatar-container {
                position: relative;
                width: 120px;
                height: 120px;
            }

            .profile-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 4px solid white;
                background: var(--surface);
                object-fit: cover;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }

            .avatar-overlay {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .avatar-container:hover .avatar-overlay {
                opacity: 1;
            }

            .change-avatar-btn {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-primary);
                transition: all 0.2s ease;
            }

            .change-avatar-btn:hover {
                background: white;
                transform: scale(1.1);
            }

            .status-indicator {
                position: absolute;
                bottom: 10px;
                right: 10px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
            }

            .status-indicator.online {
                background: var(--success);
            }

            .profile-basic-info {
                flex: 1;
                padding: 20px 0;
            }

            .profile-name {
                font-size: 32px;
                font-weight: 700;
                margin: 0 0 8px;
                color: var(--text-primary);
            }

            .profile-title {
                font-size: 18px;
                color: var(--text-secondary);
                margin: 0 0 8px;
            }

            .profile-location {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary);
                margin: 0 0 8px;
            }

            .member-since {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0;
            }

            .profile-actions {
                display: flex;
                gap: 12px;
                align-items: flex-end;
                padding: 20px 0;
            }

            .profile-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .profile-tabs {
                display: flex;
                border-bottom: 1px solid var(--border-color);
                padding: 0 32px;
                background: var(--surface);
            }

            .tab-btn {
                background: none;
                border: none;
                padding: 16px 24px;
                font-weight: 500;
                color: var(--text-secondary);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tab-btn:hover {
                color: var(--text-primary);
            }

            .tab-btn.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
            }

            .profile-tab-content {
                flex: 1;
                overflow-y: auto;
            }

            .tab-panel {
                display: none;
                padding: 32px;
                height: 100%;
            }

            .tab-panel.active {
                display: block;
            }

            /* Overview Styles */
            .overview-content {
                max-width: 800px;
            }

            .info-section {
                margin-bottom: 32px;
            }

            .info-section h3 {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 16px;
                color: var(--text-primary);
            }

            .bio {
                font-size: 16px;
                line-height: 1.6;
                color: var(--text-secondary);
                margin: 0;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            }

            .info-card {
                background: var(--surface-hover);
                padding: 24px;
                border-radius: 12px;
                border: 1px solid var(--border-color);
            }

            .info-card h4 {
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 16px;
                color: var(--text-primary);
            }

            .info-item {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                color: var(--text-secondary);
            }

            .info-item:last-child {
                margin-bottom: 0;
            }

            .info-item i {
                width: 16px;
                color: var(--primary-color);
            }

            .interests-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .interest-tag {
                background: var(--primary-light);
                color: var(--primary-color);
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 13px;
                font-weight: 500;
            }

            .interest-tag.editable {
                position: relative;
                padding-right: 32px;
            }

            .remove-interest {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                color: var(--primary-color);
                font-size: 10px;
            }

            .remove-interest:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .social-links {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .social-link {
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--text-secondary);
                text-decoration: none;
                padding: 8px 0;
                transition: color 0.2s ease;
            }

            .social-link:hover {
                color: var(--primary-color);
            }

            .social-link i {
                width: 16px;
            }

            .no-social {
                color: var(--text-secondary);
                font-style: italic;
                margin: 0;
            }

            /* Edit Form Styles */
            .edit-profile-form {
                max-width: 800px;
            }

            .form-sections {
                display: flex;
                flex-direction: column;
                gap: 32px;
                margin-bottom: 32px;
            }

            .form-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 20px;
                color: var(--text-primary);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 12px;
            }

            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-group label {
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                background: var(--surface);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                color: var(--text-primary);
                transition: all 0.2s ease;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px var(--primary-light);
            }

            .form-group textarea {
                resize: vertical;
                min-height: 80px;
            }

            .form-error {
                color: var(--error);
                font-size: 13px;
                margin-top: 4px;
                display: none;
            }

            .char-counter {
                display: flex;
                justify-content: flex-end;
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 4px;
            }

            .interests-input {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }

            .interests-input input {
                flex: 1;
                margin-bottom: 0;
            }

            .current-interests {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding-top: 32px;
                border-top: 1px solid var(--border-color);
            }

            /* Privacy Settings Styles */
            .privacy-settings {
                max-width: 600px;
            }

            .privacy-section {
                margin-bottom: 32px;
                padding: 24px;
                background: var(--surface-hover);
                border-radius: 12px;
                border: 1px solid var(--border-color);
            }

            .privacy-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 20px;
                color: var(--text-primary);
            }

            .privacy-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 20px;
            }

            .privacy-option:last-child {
                margin-bottom: 0;
            }

            .option-info {
                flex: 1;
            }

            .option-info h4 {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 4px;
                color: var(--text-primary);
            }

            .option-info p {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0;
            }

            .privacy-option select {
                background: var(--surface);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 8px 12px;
                color: var(--text-primary);
                min-width: 120px;
            }

            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }

            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--border-color);
                transition: 0.3s;
                border-radius: 24px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background: white;
                transition: 0.3s;
                border-radius: 50%;
            }

            input:checked + .toggle-slider {
                background: var(--primary-color);
            }

            input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }

            .privacy-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 32px;
            }

            /* Activity Styles */
            .activity-content {
                max-width: 800px;
            }

            .activity-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }

            .stat-card {
                background: var(--surface-hover);
                padding: 24px;
                border-radius: 12px;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .stat-icon {
                width: 48px;
                height: 48px;
                background: var(--primary-light);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-color);
                font-size: 20px;
            }

            .stat-info h4 {
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 4px;
                color: var(--text-primary);
            }

            .stat-info p {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0;
            }

            .recent-activity h3 {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 20px;
                color: var(--text-primary);
            }

            .activity-timeline {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .activity-item {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 16px;
                background: var(--surface-hover);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }

            .activity-icon {
                width: 40px;
                height: 40px;
                background: var(--primary-light);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-color);
                flex-shrink: 0;
            }

            .activity-content {
                flex: 1;
            }

            .activity-description {
                font-size: 14px;
                color: var(--text-primary);
                margin: 0 0 4px;
            }

            .activity-time {
                font-size: 12px;
                color: var(--text-secondary);
            }

            /* Image Upload Modal */
            .image-upload-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .image-upload-modal .modal-content {
                background: var(--surface);
                border-radius: 16px;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }

            .image-upload-modal .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
            }

            .image-upload-modal h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .modal-close {
                background: none;
                border: none;
                padding: 8px;
                cursor: pointer;
                color: var(--text-secondary);
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .modal-close:hover {
                background: var(--surface-hover);
            }

            .image-upload-modal .modal-body {
                padding: 24px;
            }

            .upload-drop-zone {
                border: 2px dashed var(--border-color);
                border-radius: 12px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: var(--surface-hover);
            }

            .upload-drop-zone:hover,
            .upload-drop-zone.dragover {
                border-color: var(--primary-color);
                background: var(--primary-light);
            }

            .upload-drop-zone i {
                font-size: 48px;
                color: var(--text-secondary);
                margin-bottom: 16px;
            }

            .upload-drop-zone p {
                margin: 0 0 8px;
                color: var(--text-primary);
                font-weight: 500;
            }

            .upload-drop-zone small {
                color: var(--text-secondary);
            }

            .upload-drop-zone input {
                display: none;
            }

            .image-preview {
                text-align: center;
            }

            .image-preview img {
                max-width: 100%;
                max-height: 300px;
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }

            .image-crop-tools {
                margin-top: 16px;
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .image-upload-modal .modal-footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                padding: 24px;
                border-top: 1px solid var(--border-color);
            }

            /* Unsaved Changes Warning */
            .unsaved-changes-warning {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: var(--warning-light);
                border: 1px solid var(--warning-color);
                border-radius: 12px;
                padding: 16px;
                max-width: 400px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .warning-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }

            .warning-icon {
                color: var(--warning-color);
                font-size: 20px;
                margin-top: 2px;
            }

            .warning-message h4 {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .warning-message p {
                margin: 0 0 12px;
                font-size: 13px;
                color: var(--text-secondary);
            }

            .warning-actions {
                display: flex;
                gap: 8px;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .profile-info-header {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 16px;
                    margin-top: -40px;
                    padding: 0 20px;
                }

                .avatar-container {
                    width: 80px;
                    height: 80px;
                }

                .profile-name {
                    font-size: 24px;
                }

                .profile-actions {
                    flex-direction: column;
                    width: 100%;
                    padding: 16px 0 0;
                }

                .profile-tabs {
                    overflow-x: auto;
                    padding: 0 16px;
                }

                .tab-panel {
                    padding: 20px 16px;
                }

                .info-grid {
                    grid-template-columns: 1fr;
                }

                .form-grid {
                    grid-template-columns: 1fr;
                }

                .activity-stats {
                    grid-template-columns: 1fr;
                }

                .unsaved-changes-warning {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    async handleEmailUpdate() {
        const input = document.getElementById('sec-email');
        const err = document.getElementById('err-sec-email');
        if (!input) return;
        const email = input.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (err) { err.textContent = 'Enter a valid email'; err.style.display = 'block'; }
            return;
        }
        if (err) { err.textContent = ''; err.style.display = 'none'; }
        try {
            await window.afzProfileApi.updateEmail(email);
            if (window.afzDashboard) window.afzDashboard.showNotification('Email update requested. Check your inbox to confirm.', 'success');
        } catch (e) {
            if (window.afzDashboard) window.afzDashboard.showNotification('Failed to update email: ' + (e.message || 'Unknown error'), 'error');
        }
    }

    async handlePasswordUpdate() {
        const p1 = document.getElementById('sec-pass');
        const p2 = document.getElementById('sec-pass2');
        const e1 = document.getElementById('err-sec-pass');
        const e2 = document.getElementById('err-sec-pass2');
        if (!p1 || !p2) return;
        const v1 = p1.value;
        const v2 = p2.value;
        let valid = true;
        if (!v1 || v1.length < 8) { if (e1) { e1.textContent = 'Password must be at least 8 characters'; e1.style.display = 'block'; } valid = false; }
        else { if (e1) { e1.textContent = ''; e1.style.display = 'none'; } }
        if (v1 !== v2) { if (e2) { e2.textContent = 'Passwords do not match'; e2.style.display = 'block'; } valid = false; }
        else { if (e2) { e2.textContent = ''; e2.style.display = 'none'; } }
        if (!valid) return;
        try {
            await window.afzProfileApi.updatePassword(v1);
            p1.value = ''; p2.value = '';
            if (window.afzDashboard) window.afzDashboard.showNotification('Password updated.', 'success');
        } catch (e) {
            if (window.afzDashboard) window.afzDashboard.showNotification('Failed to update password: ' + (e.message || 'Unknown error'), 'error');
        }
    }

    async handlePreferencesSave() {
        const lang = document.getElementById('pref-language')?.value || 'en';
        const theme = document.getElementById('pref-theme')?.value || 'light';
        try {
            await window.afzProfileApi.upsertProfile({ preferences: { language: lang, theme: theme } });
            if (window.afzDashboard) window.afzDashboard.showNotification('Preferences saved.', 'success');
        } catch (e) {
            if (window.afzDashboard) window.afzDashboard.showNotification('Failed to save preferences: ' + (e.message || 'Unknown error'), 'error');
        }
    }

    async handleNotificationsSave() {
        const news = document.getElementById('notif-news')?.checked !== false;
        const events = document.getElementById('notif-events')?.checked !== false;
        const messages = document.getElementById('notif-messages')?.checked !== false;
        try {
            await window.afzProfileApi.upsertProfile({ notifications: { news: news, events: events, messages: messages } });
            if (window.afzDashboard) window.afzDashboard.showNotification('Notification settings saved.', 'success');
        } catch (e) {
            if (window.afzDashboard) window.afzDashboard.showNotification('Failed to save notifications: ' + (e.message || 'Unknown error'), 'error');
        }
    }
}

// Export for use in main dashboard
window.ProfileManager = ProfileManager;
