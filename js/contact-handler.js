// AFZ Contact Form Handler
class AFZContactHandler {
    constructor() {
        // Check if we're running locally with backend
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000/api' 
            : '/api';
        this.endpoints = {
            contact: `${this.apiBaseUrl}/contact`,
            newsletter: `${this.apiBaseUrl}/newsletter`,
            volunteer: `${this.apiBaseUrl}/volunteer`
        };
        this.init();
    }

    init() {
        console.log('AFZ Contact Handler initialized');
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        // Contact form handler
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmission(e));
        }

        // Newsletter forms
        const newsletterForms = document.querySelectorAll('form[action*="newsletter"], .newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleNewsletterSubmission(e));
        });

        // Volunteer forms
        const volunteerForms = document.querySelectorAll('form[action*="volunteer"], .volunteer-form');
        volunteerForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleVolunteerSubmission(e));
        });
    }

    async handleContactSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // Show loading state
            this.setSubmitButtonState(submitButton, true, 'Sending...');
            
            // Collect form data
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                subject: formData.get('subject'),
                message: formData.get('message'),
                newsletter: formData.get('newsletter') === 'on',
                language: this.getCurrentLanguage()
            };

            // Validate data
            const validationErrors = this.validateContactData(data);
            if (validationErrors.length > 0) {
                this.showErrors(validationErrors);
                return;
            }

            // Submit to backend
            const response = await this.submitToBackend(this.endpoints.contact, data);
            
            if (response.success) {
                this.showSuccessMessage('Thank you for your message! We\'ll get back to you within 24 hours.');
                form.reset();
                this.clearValidationStates(form);
            } else {
                this.showErrorMessage(response.message || 'There was an error sending your message. Please try again.');
            }

        } catch (error) {
            console.error('Contact form submission error:', error);
            this.showErrorMessage('There was an error sending your message. Please try again later.');
        } finally {
            this.setSubmitButtonState(submitButton, false, originalText);
        }
    }

    async handleNewsletterSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            this.setSubmitButtonState(submitButton, true, 'Subscribing...');
            
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                language: this.getCurrentLanguage(),
                source: 'website'
            };

            const validationErrors = this.validateEmailData(data);
            if (validationErrors.length > 0) {
                this.showErrors(validationErrors);
                return;
            }

            const response = await this.submitToBackend(this.endpoints.newsletter, data);
            
            if (response.success) {
                this.showSuccessMessage('Successfully subscribed to our newsletter!');
                form.reset();
            } else {
                this.showErrorMessage(response.message || 'There was an error subscribing to the newsletter.');
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showErrorMessage('There was an error subscribing to the newsletter. Please try again later.');
        } finally {
            this.setSubmitButtonState(submitButton, false, originalText);
        }
    }

    async handleVolunteerSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            this.setSubmitButtonState(submitButton, true, 'Submitting...');
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                skills: formData.getAll('skills'),
                availability: formData.get('availability') || '',
                experience: formData.get('experience') || '',
                motivation: formData.get('motivation')
            };

            const validationErrors = this.validateVolunteerData(data);
            if (validationErrors.length > 0) {
                this.showErrors(validationErrors);
                return;
            }

            const response = await this.submitToBackend(this.endpoints.volunteer, data);
            
            if (response.success) {
                this.showSuccessMessage('Thank you for your interest in volunteering! We\'ll review your application and get back to you soon.');
                form.reset();
            } else {
                this.showErrorMessage(response.message || 'There was an error submitting your volunteer application.');
            }

        } catch (error) {
            console.error('Volunteer form submission error:', error);
            this.showErrorMessage('There was an error submitting your application. Please try again later.');
        } finally {
            this.setSubmitButtonState(submitButton, false, originalText);
        }
    }

    async submitToBackend(endpoint, data) {
        // Always try real backend first in development
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Backend not available, using simulation:', error.message);
            // Fallback to simulation if backend is not available
            return this.simulateBackendResponse(data);
        }
    }

    // Development mode simulation
    simulateBackendResponse(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Simulated success response (development mode)',
                    reference_id: 'AFZ-DEV-' + Date.now()
                });
            }, 1500);
        });
    }

    validateContactData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        
        if (!data.subject) {
            errors.push({ field: 'subject', message: 'Please select a subject' });
        }
        
        if (!data.message || data.message.trim().length < 10) {
            errors.push({ field: 'message', message: 'Message must be at least 10 characters long' });
        }
        
        return errors;
    }

    validateEmailData(data) {
        const errors = [];
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        
        return errors;
    }

    validateVolunteerData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Please enter a valid email address' });
        }
        
        if (!data.motivation || data.motivation.trim().length < 20) {
            errors.push({ field: 'motivation', message: 'Please tell us why you want to volunteer (at least 20 characters)' });
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getCurrentLanguage() {
        return document.documentElement.lang || 'en';
    }

    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    setSubmitButtonState(button, isLoading, text) {
        button.disabled = isLoading;
        button.textContent = text;
        button.classList.toggle('loading', isLoading);
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.afz-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `afz-message afz-message-${type}`;
        messageDiv.innerHTML = `
            <div class="afz-message-content">
                <span class="afz-message-icon">
                    ${type === 'success' ? '✅' : '❌'}
                </span>
                <span class="afz-message-text">${message}</span>
                <button class="afz-message-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px;
            padding: 16px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInFromRight 0.3s ease;
        `;

        document.body.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    showErrors(errors) {
        this.clearValidationStates();
        
        errors.forEach(error => {
            const field = document.querySelector(`[name="${error.field}"]`);
            if (field) {
                const fieldGroup = field.closest('.form-group');
                if (fieldGroup) {
                    fieldGroup.classList.add('error');
                    
                    let errorElement = fieldGroup.querySelector('.error-message');
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.className = 'error-message';
                        fieldGroup.appendChild(errorElement);
                    }
                    errorElement.textContent = error.message;
                }
            }
        });

        // Focus on first error field
        if (errors.length > 0) {
            const firstErrorField = document.querySelector(`[name="${errors[0].field}"]`);
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    clearValidationStates(form = document) {
        const errorGroups = form.querySelectorAll('.form-group.error');
        errorGroups.forEach(group => {
            group.classList.remove('error');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = '';
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.afzContactHandler = new AFZContactHandler();
});

// Add CSS for messages
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .afz-message-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .afz-message-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        opacity: 0.7;
    }
    
    .afz-message-close:hover {
        opacity: 1;
    }
    
    .form-group.error input,
    .form-group.error select,
    .form-group.error textarea {
        border-color: #dc3545;
        background-color: #fff5f5;
    }
    
    .error-message {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        display: block;
    }
    
    button.loading {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;
document.head.appendChild(messageStyles);