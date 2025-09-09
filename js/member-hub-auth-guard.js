/**
 * Member Hub Authentication Guard
 * Handles authentication state and UI transitions for the member hub
 */

(function() {
    'use strict';

    let authCheckComplete = false;
    let currentUser = null;

    // UI Elements
    const loadingScreen = document.getElementById('loading-screen');
    const authRequiredScreen = document.getElementById('auth-required-screen');
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.hub-header');

    function showLoadingScreen() {
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (authRequiredScreen) authRequiredScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        if (header) header.style.display = 'none';
        document.body.setAttribute('data-auth-status', 'checking');
    }

    function showAuthRequiredScreen() {
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (authRequiredScreen) authRequiredScreen.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        if (header) header.style.display = 'none';
        document.body.setAttribute('data-auth-status', 'unauthenticated');
        
        console.log('🚫 User not authenticated - showing auth required screen');
    }

    function showMemberHub() {
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (authRequiredScreen) authRequiredScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (sidebar) sidebar.style.display = 'block';
        if (header) header.style.display = 'block';
        document.body.setAttribute('data-auth-status', 'authenticated');
        
        // Update user info in UI
        if (currentUser) {
            updateUserInfo(currentUser);
        }
        
        console.log('✅ User authenticated - showing member hub');
    }

    function updateUserInfo(user) {
        // Update user name displays
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            if (el.classList.contains('section-title')) {
                // For the "Welcome back, [Name]!" title
                const welcomeText = el.textContent.split(',')[0]; // Keep "Welcome back"
                el.innerHTML = `${welcomeText}, <span class="user-name">${getDisplayName(user)}</span>!`;
            } else {
                el.textContent = getDisplayName(user);
            }
        });

        // Update user email
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = user.email || '';
        });

        // Update avatar
        const avatarElements = document.querySelectorAll('.user-avatar .avatar-text, .user-avatar-large .avatar-text');
        avatarElements.forEach(el => {
            el.textContent = getInitials(user);
        });

        // Update user role
        const userRoleElements = document.querySelectorAll('.user-role');
        userRoleElements.forEach(el => {
            el.textContent = getUserRoleDisplay(user);
        });
        
        // Set body data attributes for role-based styling
        document.body.setAttribute('data-user-role', user.member_type || 'member');
        document.body.setAttribute('data-user-id', user.id || '');

        // Show/hide admin sections
        const adminSection = document.getElementById('admin-section');
        if (adminSection) {
            const isAdmin = user.member_type === 'admin';
            adminSection.style.display = isAdmin ? 'block' : 'none';
        }
    }

    function getDisplayName(user) {
        if (user.display_name) return user.display_name;
        if (user.full_name) return user.full_name.split(' ')[0]; // First name only
        if (user.email) return user.email.split('@')[0];
        return 'Member';
    }

    function getInitials(user) {
        const name = user.full_name || user.display_name || user.email;
        if (!name) return 'M';
        
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function getUserRoleDisplay(user) {
        const roleMap = {
            'admin': 'Administrator',
            'advocate': 'Advocate', 
            'volunteer': 'Volunteer',
            'healthcare': 'Healthcare Professional',
            'educator': 'Educator',
            'family': 'Family Member',
            'community': 'Community Member',
            'member': 'Member'
        };
        
        return roleMap[user.member_type] || 'Member';
    }

    async function checkAuthenticationState() {
        try {
            // Wait for auth service to be ready
            if (!window.afzAuthService) {
                console.log('⏳ Waiting for auth service...');
                setTimeout(checkAuthenticationState, 100);
                return;
            }

            // Check current session
            const user = await window.afzAuthService.getCurrentUser();
            
            if (user && window.afzAuthService.isAuthenticated) {
                currentUser = user;
                showMemberHub();
                
                // Initialize member hub functionality
                if (window.afzMemberHub && typeof window.afzMemberHub.init === 'function') {
                    window.afzMemberHub.init();
                }
            } else {
                showAuthRequiredScreen();
            }
            
            authCheckComplete = true;
            
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            showAuthRequiredScreen();
            authCheckComplete = true;
        }
    }

    function setupAuthStateListener() {
        // Listen for auth state changes
        if (window.afzAuthService) {
            window.afzAuthService.onAuthStateChange((event, user) => {
                console.log('🔄 Auth state changed:', event, user?.email);
                
                switch (event) {
                    case 'SIGNED_IN':
                        currentUser = user;
                        if (authCheckComplete) {
                            showMemberHub();
                            
                            // Initialize member hub if not already done
                            if (window.afzMemberHub && typeof window.afzMemberHub.init === 'function') {
                                window.afzMemberHub.init();
                            }
                        }
                        break;
                        
                    case 'SIGNED_OUT':
                        currentUser = null;
                        if (authCheckComplete) {
                            showAuthRequiredScreen();
                        }
                        break;
                        
                    case 'PROFILE_UPDATED':
                        if (user) {
                            currentUser = user;
                            updateUserInfo(user);
                        }
                        break;
                }
            });
        } else {
            // Retry if auth service not ready
            setTimeout(setupAuthStateListener, 100);
        }
    }

    function setupLogoutHandler() {
        document.addEventListener('click', async function(e) {
            const logoutElement = e.target.closest('[data-action="logout"]');
            if (logoutElement) {
                e.preventDefault();
                
                // Show loading state
                showLoadingScreen();
                
                try {
                    if (window.afzAuthService) {
                        await window.afzAuthService.signOut();
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    // Always redirect to auth page after logout attempt
                    window.location.href = './auth.html';
                }
            }
        });
    }

    function init() {
        // Show loading screen initially
        showLoadingScreen();
        
        // Set up authentication monitoring
        setupAuthStateListener();
        setupLogoutHandler();
        
        // Start authentication check
        checkAuthenticationState();
        
        console.log('🛡️ Member Hub Auth Guard initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.memberHubAuthGuard = {
        checkAuthenticationState,
        currentUser: () => currentUser,
        isAuthComplete: () => authCheckComplete
    };
})();