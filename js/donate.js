/**
 * Donation Form JavaScript - International Payments Only
 * Handles donation form interactions, validation, and international payment processing
 */

(function() {
    'use strict';

    // Currency configurations
    const CURRENCY_CONFIG = {
        'USD': { symbol: '$', name: 'US Dollar', amounts: [10, 25, 50, 100, 250, 500] },
        'EUR': { symbol: '€', name: 'Euro', amounts: [10, 20, 40, 85, 210, 425] },
        'GBP': { symbol: '£', name: 'British Pound', amounts: [8, 18, 37, 73, 183, 365] },
        'ZMW': { symbol: 'ZK', name: 'Zambian Kwacha', amounts: [50, 100, 250, 500, 1000, 2500] },
        'ZAR': { symbol: 'R', name: 'South African Rand', amounts: [150, 375, 750, 1500, 3750, 7500] },
        'CAD': { symbol: 'C$', name: 'Canadian Dollar', amounts: [13, 34, 68, 135, 338, 675] },
        'AUD': { symbol: 'A$', name: 'Australian Dollar', amounts: [15, 38, 76, 152, 380, 760] }
    };

    let currentCurrency = 'ZMW';
    let internationalPaymentProcessor = null;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDonationForm);
    } else {
        initializeDonationForm();
    }

    function initializeDonationForm() {
        // Get form elements
        const form = document.getElementById('donationForm');
        const amountButtons = document.querySelectorAll('.amount-btn');
        const customAmountInput = document.querySelector('.custom-amount-input');
        const customAmountField = document.getElementById('customAmount');
        
        if (!form) return; // Exit if form not found

        // Initialize international payment processor
        if (window.InternationalPaymentProcessor) {
            internationalPaymentProcessor = new window.InternationalPaymentProcessor();
        }

        // Setup currency selector
        setupCurrencySelector();
        
        // Setup amount button interactions
        setupAmountButtons();
        
        // Setup payment method switching
        setupPaymentMethodSwitching();
        
        // Setup form validation
        setupFormValidation();
        
        // Setup form submission
        form.addEventListener('submit', handleFormSubmission);
    }

    function setupCurrencySelector() {
        const currencySelect = document.getElementById('currencySelect');
        if (!currencySelect) return;

        currencySelect.addEventListener('change', function(e) {
            currentCurrency = e.target.value;
            updateAmountButtons();
            updateCurrencyDisplay();
        });

        // Initialize with default currency
        updateAmountButtons();
        updateCurrencyDisplay();
    }

    function updateAmountButtons() {
        const currencyConfig = CURRENCY_CONFIG[currentCurrency];
        const amountButtons = document.querySelectorAll('.amount-btn:not(.custom-amount)');
        
        amountButtons.forEach((button, index) => {
            if (currencyConfig.amounts[index]) {
                const amount = currencyConfig.amounts[index];
                button.setAttribute('data-amount', amount);
                button.textContent = `${currencyConfig.symbol}${amount.toLocaleString()}`;
            }
        });
    }

    function updateCurrencyDisplay() {
        const currencyConfig = CURRENCY_CONFIG[currentCurrency];
        const legend = document.querySelector('.donation-amount-group .form-legend');
        
        if (legend) {
            legend.textContent = `Donation Amount (${currencyConfig.symbol} ${currentCurrency})`;
        }
    }

    function setupPaymentMethodSwitching() {
        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                showPaymentDetails(this.value);
            });
        });

        // Show initial payment details
        const checkedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        if (checkedPayment) {
            showPaymentDetails(checkedPayment.value);
        }
    }

    function showPaymentDetails(paymentMethod) {
        // Hide all payment details
        document.querySelectorAll('.payment-details').forEach(detail => {
            detail.style.display = 'none';
        });

        // Show selected payment details
        const selectedDetail = document.getElementById(`${paymentMethod}-details`);
        if (selectedDetail) {
            selectedDetail.style.display = 'block';
        }
    }

    function setupAmountButtons() {
        const amountButtons = document.querySelectorAll('.amount-btn');
        const customAmountInput = document.querySelector('.custom-amount-input');
        const customAmountField = document.getElementById('customAmount');

        amountButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all buttons
                amountButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                const amount = this.dataset.amount;
                
                if (amount === 'custom') {
                    // Show custom amount input
                    customAmountInput.style.display = 'block';
                    customAmountField.focus();
                    customAmountField.required = true;
                } else {
                    // Hide custom amount input
                    customAmountInput.style.display = 'none';
                    customAmountField.required = false;
                    customAmountField.value = '';
                }
            });
        });

        // Handle custom amount input
        if (customAmountField) {
            customAmountField.addEventListener('input', function() {
                if (this.value) {
                    // Remove active class from preset amount buttons
                    amountButtons.forEach(btn => {
                        if (btn.dataset.amount !== 'custom') {
                            btn.classList.remove('active');
                        }
                    });
                }
            });
        }
    }

    function setupFormValidation() {
        const form = document.getElementById('donationForm');
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                // Clear error message when user starts typing
                clearFieldError(this);
            });
        });
    }

    function validateField(field) {
        const errorElement = document.getElementById(field.id + '-error');
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        clearFieldError(field);

        // Check if field is required and empty
        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = getFieldName(field) + ' is required.';
        } else if (field.value.trim()) {
            // Field has value, validate specific types
            switch (field.type) {
                case 'email':
                    if (!isValidEmail(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;
                case 'tel':
                    if (!isValidPhone(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number.';
                    }
                    break;
                case 'number':
                    const numValue = parseFloat(field.value);
                    const min = parseFloat(field.getAttribute('min')) || 0;
                    const max = parseFloat(field.getAttribute('max')) || Infinity;
                    
                    if (isNaN(numValue) || numValue < min || numValue > max) {
                        isValid = false;
                        errorMessage = `Please enter a valid amount between ${min} and ${max}.`;
                    }
                    break;
            }
        }

        if (!isValid && errorElement) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }

        return isValid;
    }

    function clearFieldError(field) {
        const errorElement = document.getElementById(field.id + '-error');
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    function getFieldName(field) {
        const label = document.querySelector('label[for="' + field.id + '"]');
        return label ? label.textContent.replace('*', '').trim() : field.name || field.id;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        // Allow various phone formats including international
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    function handleFormSubmission(e) {
        e.preventDefault();
        
        // Validate all required fields
        const form = e.target;
        const requiredFields = form.querySelectorAll('input[required]');
        let allValid = true;

        requiredFields.forEach(field => {
            if (!validateField(field)) {
                allValid = false;
            }
        });

        // Check if amount is selected
        const selectedAmount = getSelectedDonationAmount();
        if (!selectedAmount || selectedAmount <= 0) {
            allValid = false;
            showFormError('Please select a donation amount.');
        }

        if (!allValid) {
            // Focus on first error field
            const firstErrorField = form.querySelector('.error');
            if (firstErrorField) {
                firstErrorField.focus();
            }
            return;
        }

        // Collect form data
        const formData = collectFormData(form);
        
        // Show loading state
        showLoadingState();
        
        // Submit donation
        submitDonation(formData);
    }

    function getSelectedDonationAmount() {
        const activeButton = document.querySelector('.amount-btn.active');
        if (!activeButton) return 0;
        
        const amount = activeButton.dataset.amount;
        if (amount === 'custom') {
            const customAmount = document.getElementById('customAmount').value;
            return parseFloat(customAmount) || 0;
        }
        
        return parseFloat(amount) || 0;
    }

    function collectFormData(form) {
        const formData = new FormData(form);
        const data = {
            amount: getSelectedDonationAmount(),
            currency: currentCurrency,
            donationType: formData.get('donationType'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            paymentMethod: formData.get('paymentMethod'),
            anonymous: formData.get('anonymous') === 'on',
            newsletter: formData.get('newsletter') === 'on',
            dedicationMessage: formData.get('dedicationMessage'),
            timestamp: new Date().toISOString()
        };
        
        return data;
    }

    function showLoadingState() {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            submitButton.classList.add('loading');
        }
    }

    function hideLoadingState() {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Proceed to Payment';
            submitButton.classList.remove('loading');
        }
    }

    function submitDonation(donationData) {
        console.log('Processing international donation:', donationData);
        
        // Use international payment processor if available
        if (internationalPaymentProcessor) {
            internationalPaymentProcessor.processDonation(donationData)
                .then(result => {
                    hideLoadingState();
                    if (result.success) {
                        showSuccessMessage(donationData);
                    } else {
                        showFormError(result.error || 'Payment processing failed. Please try again.');
                    }
                })
                .catch(error => {
                    hideLoadingState();
                    console.error('Payment processing error:', error);
                    showFormError('Payment processing failed. Please try again.');
                });
        } else {
            // Fallback for demo/development
            setTimeout(() => {
                hideLoadingState();
                showSuccessMessage(donationData);
            }, 2000);
        }
    }

    function showSuccessMessage(donationData) {
        const currencyConfig = CURRENCY_CONFIG[donationData.currency];
        const message = `Thank you for your donation of ${currencyConfig.symbol}${donationData.amount}! 
                        You will be redirected to complete the payment securely via ${getPaymentMethodName(donationData.paymentMethod)}.`;
        
        showNotification(message, 'success');
    }

    function getPaymentMethodName(method) {
        const methodNames = {
            'paypal': 'PayPal',
            'stripe': 'Stripe (Card Payment)',
            'flutterwave': 'Flutterwave (African Payments)'
        };
        return methodNames[method] || method;
    }

    function showFormError(message) {
        showNotification(message, 'error');
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button type="button" class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 5 seconds
        const autoHideTimer = setTimeout(() => {
            hideNotification(notification);
        }, 5000);
        
        // Manual close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            clearTimeout(autoHideTimer);
            hideNotification(notification);
        });
        
        // Screen reader announcement
        announceToScreenReader(message);
    }

    function hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    function announceToScreenReader(message) {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    // Multi-step form navigation
    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update progress indicator
        updateProgressIndicator(stepNumber);
        
        // Update donation summary if on step 3
        if (stepNumber === 3) {
            updateDonationSummary();
        }
        
        // Scroll to top of form
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateProgressIndicator(currentStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber <= currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    function updateDonationSummary() {
        const selectedAmount = getSelectedDonationAmount();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'paypal';
        const currencyConfig = CURRENCY_CONFIG[currentCurrency];
        
        // Calculate processing fee based on payment method
        let processingFee = 0;
        if (paymentMethod === 'paypal') {
            processingFee = Math.round((selectedAmount * 0.029 + 0.30) * 100) / 100;
        } else if (paymentMethod === 'stripe') {
            processingFee = Math.round((selectedAmount * 0.029 + 0.30) * 100) / 100;
        } else if (paymentMethod === 'flutterwave') {
            processingFee = Math.round((selectedAmount * 0.038) * 100) / 100;
        }
        
        const total = selectedAmount + processingFee;
        
        // Update summary display
        const summaryAmount = document.getElementById('summary-amount');
        const summaryFee = document.getElementById('summary-fee');
        const summaryTotal = document.getElementById('summary-total');
        const summaryImpact = document.getElementById('summary-impact');
        
        if (summaryAmount) {
            summaryAmount.textContent = `${currencyConfig.symbol}${selectedAmount.toLocaleString()}`;
        }
        
        if (summaryFee) {
            summaryFee.textContent = `${currencyConfig.symbol}${processingFee.toFixed(2)}`;
        }
        
        if (summaryTotal) {
            summaryTotal.textContent = `${currencyConfig.symbol}${total.toFixed(2)}`;
        }
        
        if (summaryImpact) {
            const impactText = getImpactText(selectedAmount, currencyConfig.symbol);
            summaryImpact.textContent = impactText;
        }
    }

    function getImpactText(amount, symbol) {
        // Convert to USD equivalent for consistent impact calculation
        let usdAmount = amount;
        if (currentCurrency !== 'USD') {
            // Simple conversion ratios (in production, use real exchange rates)
            const conversionRates = {
                'EUR': 1.1,
                'GBP': 1.25,
                'ZMW': 0.05,
                'ZAR': 0.067,
                'CAD': 0.75,
                'AUD': 0.67
            };
            usdAmount = amount * (conversionRates[currentCurrency] || 1);
        }
        
        if (usdAmount >= 500) {
            return `Your ${symbol}${amount} funds a community workshop reaching 50+ people`;
        } else if (usdAmount >= 250) {
            return `Your ${symbol}${amount} provides educational materials for 10 students`;
        } else if (usdAmount >= 100) {
            return `Your ${symbol}${amount} provides sunscreen for one person for 3 months`;
        } else if (usdAmount >= 50) {
            return `Your ${symbol}${amount} provides basic protection kit for one person`;
        } else {
            return `Your ${symbol}${amount} contributes to our mission of supporting persons with albinism`;
        }
    }

    // Enhanced amount button functionality for redesigned cards
    function setupAmountButtons() {
        const amountCards = document.querySelectorAll('.amount-card');
        const customAmountInput = document.querySelector('.custom-amount-input-redesigned');
        const customAmountField = document.getElementById('customAmount');

        amountCards.forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all cards
                amountCards.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked card
                this.classList.add('active');
                
                const amount = this.dataset.amount;
                
                if (amount === 'custom') {
                    // Show custom amount input
                    if (customAmountInput) {
                        customAmountInput.style.display = 'block';
                    }
                    if (customAmountField) {
                        customAmountField.focus();
                        customAmountField.required = true;
                    }
                } else {
                    // Hide custom amount input
                    if (customAmountInput) {
                        customAmountInput.style.display = 'none';
                    }
                    if (customAmountField) {
                        customAmountField.required = false;
                        customAmountField.value = '';
                    }
                }
                
                // Update preview card if visible
                updatePreviewCard();
            });
        });

        // Handle custom amount input
        if (customAmountField) {
            customAmountField.addEventListener('input', function() {
                if (this.value) {
                    // Remove active class from preset amount cards
                    amountCards.forEach(card => {
                        if (card.dataset.amount !== 'custom') {
                            card.classList.remove('active');
                        }
                    });
                }
                updatePreviewCard();
            });
        }
    }

    function updatePreviewCard() {
        const selectedAmount = getSelectedDonationAmount();
        const currencyConfig = CURRENCY_CONFIG[currentCurrency];
        const previewAmount = document.querySelector('.preview-amount');
        const previewImpact = document.querySelector('.preview-impact');
        
        if (previewAmount && selectedAmount > 0) {
            previewAmount.textContent = `${currencyConfig.symbol}${selectedAmount.toLocaleString()}`;
        }
        
        if (previewImpact && selectedAmount > 0) {
            const impactText = getImpactText(selectedAmount, currencyConfig.symbol);
            previewImpact.textContent = impactText.replace(/Your [^\s]+ /, '');
        }
    }

    // Make showStep function globally available
    window.showStep = showStep;

    // Initialize button links for main page donation buttons
    function initializeDonationButtons() {
        const donationButtons = document.querySelectorAll('[data-translate="cta-donate"], [data-translate="cta-donate-main"]');
        
        donationButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Navigate to donation page
                const currentPage = window.location.pathname;
                let donationUrl = './pages/donate.html';
                
                // Adjust URL based on current page location
                if (currentPage.includes('/pages/')) {
                    donationUrl = './donate.html';
                }
                
                window.location.href = donationUrl;
            });
        });
    }

    // Initialize donation buttons on all pages
    initializeDonationButtons();

    // Initialize payment modal functionality
    initializePaymentModal();

    // Payment Modal Functions
    function initializePaymentModal() {
        // Setup payment method switching in modal
        const paymentRadios = document.querySelectorAll('input[name="modalPaymentMethod"]');
        
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                showModalPaymentDetails(this.value);
            });
        });

        // Show initial payment details
        const checkedPayment = document.querySelector('input[name="modalPaymentMethod"]:checked');
        if (checkedPayment) {
            showModalPaymentDetails(checkedPayment.value);
        }

        // Update modal summary when opened
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    updateModalSummary();
                }
            });
        }
    }

    function openPaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            // Validate form before opening modal
            const form = document.getElementById('donationForm');
            const requiredFields = form.querySelectorAll('input[required]');
            let allValid = true;

            requiredFields.forEach(field => {
                if (!validateField(field)) {
                    allValid = false;
                }
            });

            // Check if amount is selected
            const selectedAmount = getSelectedDonationAmount();
            if (!selectedAmount || selectedAmount <= 0) {
                allValid = false;
                showFormError('Please select a donation amount.');
            }

            if (!allValid) {
                // Focus on first error field
                const firstErrorField = form.querySelector('.error');
                if (firstErrorField) {
                    firstErrorField.focus();
                }
                return;
            }

            // Update modal summary
            updateModalSummary();

            // Show modal
            modal.classList.add('show');
            modal.style.display = 'block';
            
            // Lock body scroll
            document.body.classList.add('modal-open');
            
            // Focus on first payment method
            const firstPaymentMethod = document.querySelector('input[name="modalPaymentMethod"]');
            if (firstPaymentMethod) {
                firstPaymentMethod.focus();
            }
        }
    }

    function closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                // Unlock body scroll
                document.body.classList.remove('modal-open');
            }, 300);
        }
    }

    function showModalPaymentDetails(paymentMethod) {
        // Hide all payment details
        document.querySelectorAll('.payment-details-modal .payment-detail').forEach(detail => {
            detail.classList.remove('active');
        });

        // Show selected payment details
        const selectedDetail = document.getElementById(`modal-${paymentMethod}-details`);
        if (selectedDetail) {
            selectedDetail.classList.add('active');
        }
    }

    function updateModalSummary() {
        const selectedAmount = getSelectedDonationAmount();
        const paymentMethod = document.querySelector('input[name="modalPaymentMethod"]:checked')?.value || 'paypal';
        const currencyConfig = CURRENCY_CONFIG[currentCurrency];
        
        // Calculate processing fee based on payment method
        let processingFee = 0;
        if (paymentMethod === 'paypal') {
            processingFee = Math.round((selectedAmount * 0.029 + 0.30) * 100) / 100;
        } else if (paymentMethod === 'stripe') {
            processingFee = Math.round((selectedAmount * 0.029 + 0.30) * 100) / 100;
        } else if (paymentMethod === 'flutterwave') {
            processingFee = Math.round((selectedAmount * 0.038) * 100) / 100;
        }
        
        const total = selectedAmount + processingFee;
        
        // Update summary display
        const summaryAmount = document.getElementById('modal-summary-amount');
        const summaryFee = document.getElementById('modal-summary-fee');
        const summaryTotal = document.getElementById('modal-summary-total');
        
        if (summaryAmount) {
            summaryAmount.textContent = `${currencyConfig.symbol}${selectedAmount.toLocaleString()}`;
        }
        
        if (summaryFee) {
            summaryFee.textContent = `${currencyConfig.symbol}${processingFee.toFixed(2)}`;
        }
        
        if (summaryTotal) {
            summaryTotal.textContent = `${currencyConfig.symbol}${total.toFixed(2)}`;
        }
    }

    function confirmPayment() {
        const paymentMethod = document.querySelector('input[name="modalPaymentMethod"]:checked')?.value || 'paypal';
        
        // Show loading state
        const confirmButton = document.querySelector('.btn-confirm-payment');
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.classList.add('loading');
            confirmButton.innerHTML = '<span class="btn-icon">⏳</span><span>Processing...</span>';
        }

        // Collect form data
        const form = document.getElementById('donationForm');
        const formData = collectFormData(form);
        formData.paymentMethod = paymentMethod;
        
        // Submit donation
        submitDonation(formData);
        
        // Close modal after a short delay
        setTimeout(() => {
            closePaymentModal();
            
            // Reset button
            if (confirmButton) {
                confirmButton.disabled = false;
                confirmButton.classList.remove('loading');
                confirmButton.innerHTML = '<span class="btn-icon">💳</span><span>Proceed to Payment</span>';
            }
        }, 1500);
    }

    // Make functions globally available
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.confirmPayment = confirmPayment;

})();

/**
 * Enhanced Donation Form Validation and Functionality
 * Handles form validation, step navigation, and accessibility improvements
 */

class DonationFormManager {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 3;
        this.form = document.getElementById('donationForm');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAccessibility();
        this.updateCurrencySymbol();
        this.updateSummary();
    }

    setupEventListeners() {
        // Currency selection change
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.addEventListener('change', () => {
                this.updateCurrencySymbol();
                this.updateSummary();
            });
        }

        // Custom amount input
        const customAmount = document.getElementById('customAmount');
        if (customAmount) {
            customAmount.addEventListener('input', () => {
                this.updateSummary();
            });
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateForm();
            });
        }

        // Donation type selection
        const donationTypeInputs = document.querySelectorAll('input[name="donationType"]');
        donationTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateSummary();
            });
        });

        // Add focus management for form elements
        const formElements = this.form.querySelectorAll('input, select, textarea, button');
        formElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
    }

    setupAccessibility() {
        // Add ARIA attributes for better screen reader support
        const formSteps = document.querySelectorAll('.form-step');
        formSteps.forEach((step, index) => {
            step.setAttribute('aria-labelledby', 'donation-form-heading');
            step.setAttribute('role', 'tabpanel');
            if (index === 0) {
                step.setAttribute('aria-hidden', 'false');
            } else {
                step.setAttribute('aria-hidden', 'true');
            }
        });

        // Add ARIA labels to form controls
        const formControls = this.form.querySelectorAll('input, select, textarea');
        formControls.forEach(control => {
            if (control.id) {
                const label = this.form.querySelector(`label[for="${control.id}"]`);
                if (label) {
                    control.setAttribute('aria-labelledby', `${control.id}-label`);
                    label.id = `${control.id}-label`;
                }
            }
        });

        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            // ESC key to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.payment-modal');
                modals.forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }

    updateCurrencySymbol() {
        const currencySelect = document.getElementById('currencySelect');
        const currencySymbol = document.getElementById('custom-currency-symbol');
        
        if (currencySelect && currencySymbol) {
            const symbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'ZMW': 'ZK',
                'ZAR': 'R',
                'CAD': 'C$',
                'AUD': 'A$',
                'JPY': '¥',
                'CHF': 'CHF'
            };
            
            currencySymbol.textContent = symbols[currencySelect.value] || currencySelect.value;
        }
    }

    updateSummary() {
        const amount = document.getElementById('customAmount').value || '0';
        const currency = document.getElementById('currencySelect').value;
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'ZMW': 'ZK',
            'ZAR': 'R',
            'CAD': 'C$',
            'AUD': 'A$',
            'JPY': '¥',
            'CHF': 'CHF'
        };
        
        const symbol = symbols[currency] || currency;
        const fee = (amount * 0.029).toFixed(2);
        const total = (parseFloat(amount) + parseFloat(fee)).toFixed(2);
        
        // Update main summary
        if (document.getElementById('summary-amount')) {
            document.getElementById('summary-amount').textContent = `${symbol}${amount}`;
        }
        if (document.getElementById('summary-fee')) {
            document.getElementById('summary-fee').textContent = `${symbol}${fee}`;
        }
        if (document.getElementById('summary-total')) {
            document.getElementById('summary-total').textContent = `${symbol}${total}`;
        }
        
        // Update modal summary
        if (document.getElementById('modal-summary-amount')) {
            document.getElementById('modal-summary-amount').textContent = `${symbol}${amount}`;
        }
        if (document.getElementById('modal-summary-fee')) {
            document.getElementById('modal-summary-fee').textContent = `${symbol}${fee}`;
        }
        if (document.getElementById('modal-summary-total')) {
            document.getElementById('modal-summary-total').textContent = `${symbol}${total}`;
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
            step.setAttribute('aria-hidden', 'true');
        });
        
        // Show selected step
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
            targetStep.setAttribute('aria-hidden', 'false');
        }
        
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update current step
        this.currentStep = stepNumber;
        
        // Scroll to top of form
        targetStep.scrollIntoView({ behavior: 'smooth' });
    }

    validateForm() {
        let isValid = true;
        let firstError = null;
        
        // Clear previous error messages
        this.clearErrors();
        
        // Validate based on current step
        switch (this.currentStep) {
            case 1:
                isValid = this.validateAmountStep();
                break;
            case 2:
                isValid = this.validateDetailsStep();
                break;
            case 3:
                // Payment step validation would happen in the payment processor
                break;
        }
        
        if (isValid) {
            if (this.currentStep < this.maxSteps) {
                this.showStep(this.currentStep + 1);
            } else {
                // Submit form or open payment modal
                this.openPaymentModal();
            }
        } else {
            // Focus on first error
            if (firstError) {
                firstError.focus();
            }
        }
    }

    validateAmountStep() {
        const amount = document.getElementById('customAmount');
        let isValid = true;
        
        if (amount && (!amount.value || parseFloat(amount.value) < 10)) {
            this.showError(amount, 'Please enter an amount of at least 10.');
            isValid = false;
        }
        
        return isValid;
    }

    validateDetailsStep() {
        let isValid = true;
        let firstError = null;
        
        // Validate first name
        const firstName = document.getElementById('firstName');
        if (firstName && !firstName.value.trim()) {
            this.showError(firstName, 'First name is required.');
            isValid = false;
            if (!firstError) firstError = firstName;
        }
        
        // Validate last name
        const lastName = document.getElementById('lastName');
        if (lastName && !lastName.value.trim()) {
            this.showError(lastName, 'Last name is required.');
            isValid = false;
            if (!firstError) firstError = lastName;
        }
        
        // Validate email
        const email = document.getElementById('email');
        if (email && !this.isValidEmail(email.value)) {
            this.showError(email, 'Please enter a valid email address.');
            isValid = false;
            if (!firstError) firstError = email;
        }
        
        // Validate privacy consent
        const privacyConsent = document.getElementById('privacy-consent');
        if (privacyConsent && !privacyConsent.checked) {
            this.showError(privacyConsent, 'You must agree to the privacy policy.');
            isValid = false;
            if (!firstError) firstError = privacyConsent;
        }
        
        return isValid;
    }

    showError(element, message) {
        // Add error class to element
        element.classList.add('error');
        
        // Create or update error message
        const errorId = `${element.id}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            element.parentNode.insertBefore(errorElement, element.nextSibling);
        }
        
        errorElement.textContent = message;
        element.setAttribute('aria-describedby', errorId);
    }

    clearErrors() {
        // Remove error classes
        const errorElements = this.form.querySelectorAll('.error');
        errorElements.forEach(element => {
            element.classList.remove('error');
        });
        
        // Clear error messages
        const errorMessages = this.form.querySelectorAll('.error-message');
        errorMessages.forEach(element => {
            element.textContent = '';
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    openPaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.updateModalSummary();
            
            // Focus on first focusable element in modal
            const firstFocusable = modal.querySelector('button, input, select, textarea, a');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    updateModalSummary() {
        this.updateSummary();
    }

    confirmPayment() {
        // In a real implementation, this would process the payment
        alert('Payment processing would begin here in a live environment.');
        this.closePaymentModal();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.donationFormManager = new DonationFormManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DonationFormManager;
}
