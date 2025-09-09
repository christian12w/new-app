/**
 * AFZ Authentication Form Handler
 * Integrates with AFZ Authentication Service for login and registration
 */

class AFZAuthFormHandler {
    constructor() {
        this.isLoading = false;
        this.currentForm = 'login';
        
        // Initialize when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('✅ AFZ Auth Form Handler initializing...');
        
        // Wait for auth service to be available
        this.waitForAuthService().then(() => {
            this.setupEventListeners();
            this.setupFormValidation();
            this.setupUIHandlers();
            this.checkAuthStatus();
            
            console.log('✅ AFZ Auth Form Handler initialized');
        });
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

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Social login buttons
        document.querySelectorAll('.google-login').forEach(btn => {
            btn.addEventListener('click', () => this.handleGoogleLogin());
        });

        document.querySelectorAll('.facebook-login').forEach(btn => {
            btn.addEventListener('click', () => this.handleFacebookLogin());
        });

        // Forgot password
        document.querySelectorAll('.forgot-password-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleForgotPassword(e));
        });

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });
    }

    setupFormValidation() {
        // Real-time validation for all form inputs
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Password strength checker
        const passwordField = document.getElementById('register-password');
        if (passwordField) {
            passwordField.addEventListener('input', () => this.updatePasswordStrength());
        }

        // Confirm password validation
        const confirmPasswordField = document.getElementById('register-confirm-password');
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    setupUIHandlers() {
        // Check for URL parameters (e.g., password reset)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'reset') {
            this.showPasswordResetForm();
        }

        // Auto-focus first input
        const firstInput = document.querySelector('.auth-panel.active input:first-of-type');
        if (firstInput) {
            firstInput.focus();
        }
    }

    checkAuthStatus() {
        // Redirect if already authenticated
        if (window.afzAuthService?.isAuthenticated) {
            console.log('User already authenticated, redirecting...');
            window.location.href = './member-hub.html';
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    handleTabSwitch(event) {
        const targetTab = event.target;
        const targetPanel = targetTab.getAttribute('aria-controls');
        
        // Update tab states
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        document.querySelectorAll('.auth-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Activate new tab and panel
        targetTab.classList.add('active');
        targetTab.setAttribute('aria-selected', 'true');
        document.getElementById(targetPanel).classList.add('active');
        
        // Update current form
        this.currentForm = targetPanel.includes('login') ? 'login' : 'register';
        
        // Clear errors and focus first input
        this.clearAllErrors();
        const firstInput = document.querySelector(`#${targetPanel} input:first-of-type`);
        if (firstInput) {
            firstInput.focus();
        }
        
        // Announce to screen readers
        this.announceToScreenReader(`Switched to ${targetTab.textContent} form`);
    }

    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const form = event.target;
        const formData = new FormData(form);
        
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');
        
        // Validate inputs
        if (!this.validateLoginForm(email, password)) {
            return;
        }
        
        this.setFormLoading(true);
        
        try {
            const result = await window.afzAuthService.signIn(email, password, !!rememberMe);
            
            if (result.success) {
                this.showSuccess('Welcome back! Redirecting to your dashboard...');
                
                // Small delay for UX
                setTimeout(() => {
                    window.location.href = './member-hub.html';
                }, 1500);
                
            } else {
                this.showError(result.error || 'Login failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setFormLoading(false);
        }
    }

    async handleRegistration(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const form = event.target;
        const formData = new FormData(form);
        
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            agreeToTerms: formData.get('agreeToTerms')
        };
        
        // Validate inputs
        if (!this.validateRegistrationForm(userData)) {
            return;
        }
        
        this.setFormLoading(true);
        
        try {
            const result = await window.afzAuthService.signUp(userData);
            
            if (result.success) {
                this.showSuccess(result.message);
                
                // If email confirmed immediately, redirect
                if (result.user?.email_confirmed_at) {
                    setTimeout(() => {
                        window.location.href = './member-hub.html';
                    }, 2000);
                } else {
                    // Show email confirmation message
                    this.showEmailConfirmationMessage(userData.email);
                }
                
            } else {
                this.showError(result.error || 'Registration failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setFormLoading(false);
        }
    }

    async handleGoogleLogin() {
        if (this.isLoading) return;
        
        this.setFormLoading(true);
        
        try {
            const result = await window.afzAuthService.signInWithGoogle();
            
            if (!result.success) {
                this.showError(result.error || 'Google sign in failed');
                this.setFormLoading(false);
            }
            // On success, the page will redirect automatically
            
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Google sign in failed. Please try again.');
            this.setFormLoading(false);
        }
    }

    async handleFacebookLogin() {
        if (this.isLoading) return;
        
        this.setFormLoading(true);
        
        try {
            const result = await window.afzAuthService.signInWithFacebook();
            
            if (!result.success) {
                this.showError(result.error || 'Facebook sign in failed');
                this.setFormLoading(false);
            }
            // On success, the page will redirect automatically
            
        } catch (error) {
            console.error('Facebook login error:', error);
            this.showError('Facebook sign in failed. Please try again.');
            this.setFormLoading(false);
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        
        const email = prompt('Please enter your email address:');
        if (!email) return;
        
        if (!window.afzAuthService.validateEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }
        
        this.setFormLoading(true);
        
        try {
            const result = await window.afzAuthService.resetPassword(email);
            
            if (result.success) {
                this.showSuccess(result.message);
            } else {
                this.showError(result.error || 'Failed to send reset email');
            }
            
        } catch (error) {
            console.error('Password reset error:', error);
            this.showError('Failed to send reset email. Please try again.');
        } finally {
            this.setFormLoading(false);
        }
    }

    togglePassword(event) {
        const button = event.target.closest('.password-toggle');
        const input = button.parentElement.querySelector('input');
        const icon = button.querySelector('.password-toggle-icon');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
            button.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
            button.setAttribute('aria-label', 'Show password');
        }
    }

    // ============================================
    // VALIDATION METHODS
    // ============================================

    validateLoginForm(email, password) {
        let isValid = true;
        
        if (!email) {
            this.showFieldError('login-email', 'Email is required');
            isValid = false;
        } else if (!window.afzAuthService.validateEmail(email)) {
            this.showFieldError('login-email', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            this.showFieldError('login-password', 'Password is required');
            isValid = false;
        }
        
        return isValid;
    }

    validateRegistrationForm(userData) {
        let isValid = true;
        
        // First name
        if (!userData.firstName.trim()) {
            this.showFieldError('register-first-name', 'First name is required');
            isValid = false;
        }
        
        // Last name
        if (!userData.lastName.trim()) {
            this.showFieldError('register-last-name', 'Last name is required');
            isValid = false;
        }
        
        // Email
        if (!userData.email) {
            this.showFieldError('register-email', 'Email is required');
            isValid = false;
        } else if (!window.afzAuthService.validateEmail(userData.email)) {
            this.showFieldError('register-email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Phone (optional but validate if provided)
        if (userData.phone && !window.afzAuthService.validatePhone(userData.phone)) {
            this.showFieldError('register-phone', 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Password
        const passwordValidation = window.afzAuthService.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
            this.showFieldError('register-password', 'Password must meet all requirements');
            isValid = false;
        }
        
        // Confirm password
        if (userData.password !== userData.confirmPassword) {
            this.showFieldError('register-confirm-password', 'Passwords do not match');
            isValid = false;
        }
        
        // Terms agreement
        if (!userData.agreeToTerms) {
            this.showError('You must agree to the Terms of Service and Privacy Policy');
            isValid = false;
        }
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        
        // Clear previous error
        this.clearFieldError(field.id);
        
        // Skip validation if field is empty and not required
        if (!value && !field.hasAttribute('required')) {
            return true;
        }
        
        switch (field.type) {
            case 'email':
                if (!window.afzAuthService.validateEmail(value)) {
                    this.showFieldError(field.id, 'Please enter a valid email address');
                    isValid = false;
                }
                break;
                
            case 'tel':
                if (value && !window.afzAuthService.validatePhone(value)) {
                    this.showFieldError(field.id, 'Please enter a valid phone number');
                    isValid = false;
                }
                break;
                
            case 'password':
                if (field.id === 'register-password') {
                    const validation = window.afzAuthService.validatePassword(value);
                    if (!validation.isValid) {
                        this.showFieldError(field.id, 'Password must meet all requirements');
                        isValid = false;
                    }
                }
                break;
        }
        
        // Required field check
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field.id, `${this.getFieldLabel(field)} is required`);
            isValid = false;
        }
        
        return isValid;
    }

    updatePasswordStrength() {
        const passwordField = document.getElementById('register-password');
        const requirements = document.querySelectorAll('.password-requirements li');
        
        if (!passwordField || !requirements.length) return;
        
        const password = passwordField.value;
        const validation = window.afzAuthService.validatePassword(password);
        
        // Update requirement indicators
        requirements.forEach((req, index) => {
            const checks = Object.values(validation.checks);
            if (checks[index]) {
                req.classList.add('met');
            } else {
                req.classList.remove('met');
            }
        });
    }

    validatePasswordMatch() {
        const passwordField = document.getElementById('register-password');
        const confirmField = document.getElementById('register-confirm-password');
        
        if (!passwordField || !confirmField) return;
        
        if (confirmField.value && passwordField.value !== confirmField.value) {
            this.showFieldError('register-confirm-password', 'Passwords do not match');
        } else {
            this.clearFieldError('register-confirm-password');
        }
    }

    // ============================================
    // UI HELPERS
    // ============================================

    setFormLoading(loading) {
        this.isLoading = loading;
        
        // Disable/enable all form controls
        document.querySelectorAll('input, button, select').forEach(element => {
            element.disabled = loading;
        });
        
        // Update submit button text
        const submitButton = document.querySelector(`#${this.currentForm}-panel .auth-button.primary`);
        if (submitButton) {
            if (loading) {
                submitButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
            } else {
                submitButton.textContent = this.currentForm === 'login' ? 'Sign In' : 'Create Account';
            }
        }
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }
    }

    clearFieldError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        document.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
        });
        
        // Clear global messages
        this.clearMessages();
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        this.clearMessages();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <span class="message-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="message-text">${message}</span>
        `;
        
        const container = document.querySelector('.auth-forms-container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            // Auto-remove success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 5000);
            }
        }
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    clearMessages() {
        document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
    }

    showEmailConfirmationMessage(email) {
        const message = `
            <div class="email-confirmation-notice">
                <h4>Check Your Email</h4>
                <p>We've sent a confirmation link to <strong>${email}</strong></p>
                <p>Please click the link in the email to activate your account.</p>
                <button onclick="this.parentElement.remove()" class="btn-close">Got it</button>
            </div>
        `;
        
        const container = document.querySelector('.auth-forms-container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', message);
        }
    }

    getFieldLabel(field) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : 'Field';
    }

    announceToScreenReader(message) {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }
}

// Initialize form handler
window.afzAuthFormHandler = new AFZAuthFormHandler();

console.log('✅ AFZ Auth Form Handler loaded');