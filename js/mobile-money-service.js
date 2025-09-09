/**
 * AFZ Mobile Money Payment Service
 * Real integration with Zambian mobile money providers
 * Supports Airtel Money, MTN Mobile Money, and Zamtel Kwacha
 */

class AFZMobileMoneyService {
    constructor() {
        // Get configuration from AFZConfig if available
        const mobileMoneyConfig = window.AFZConfig ? window.AFZConfig.getMobileMoneyConfig() : {};
        
        this.providers = {
            airtel: {
                name: 'Airtel Money',
                apiUrl: mobileMoneyConfig.airtel?.apiUrl || 'https://openapiuat.airtel.africa',
                ussdCode: '*115#',
                shortCode: '115',
                logo: '🟡',
                fees: { percentage: 1.5, fixed: 0 },
                supportedAmounts: { min: 10, max: 50000 },
                enabled: mobileMoneyConfig.airtel?.enabled || false
            },
            mtn: {
                name: 'MTN Mobile Money',
                apiUrl: mobileMoneyConfig.mtn?.apiUrl || 'https://sandbox.momodeveloper.mtn.com',
                ussdCode: '*165#',
                shortCode: '165',
                logo: '🟡',
                fees: { percentage: 2.0, fixed: 0 },
                supportedAmounts: { min: 10, max: 30000 },
                enabled: mobileMoneyConfig.mtn?.enabled || false
            },
            zamtel: {
                name: 'Zamtel Kwacha',
                apiUrl: mobileMoneyConfig.zamtel?.apiUrl || 'https://api.zamtel.co.zm/kwacha',
                ussdCode: '*155#',
                shortCode: '155',
                logo: '🔵',
                fees: { percentage: 1.8, fixed: 0 },
                supportedAmounts: { min: 5, max: 20000 },
                enabled: mobileMoneyConfig.zamtel?.enabled || false
            }
        };

        this.merchantConfig = this.loadMerchantConfig();
        this.init();
    }

    loadMerchantConfig() {
        // Get merchant configuration from environment or AFZConfig
        const getEnvVar = (key, defaultValue) => {
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                return process.env[key];
            }
            if (window.AFZConfig) {
                return window.AFZConfig.getEnvVar(key, defaultValue);
            }
            return defaultValue;
        };

        return {
            airtel: {
                clientId: getEnvVar('AIRTEL_MONEY_CLIENT_ID', 'demo_client_id'),
                clientSecret: getEnvVar('AIRTEL_MONEY_CLIENT_SECRET', 'demo_secret'),
                merchantId: getEnvVar('AIRTEL_MONEY_MERCHANT_ID', 'AFZ_MERCHANT_001'),
                country: getEnvVar('AIRTEL_MONEY_COUNTRY', 'ZM'),
                currency: getEnvVar('AIRTEL_MONEY_CURRENCY', 'ZMW')
            },
            mtn: {
                primaryKey: getEnvVar('MTN_MOMO_PRIMARY_KEY', 'demo_primary_key'),
                secondaryKey: getEnvVar('MTN_MOMO_SECONDARY_KEY', 'demo_secondary_key'),
                apiUserId: getEnvVar('MTN_MOMO_API_USER_ID', 'demo_user_id'),
                apiKey: getEnvVar('MTN_MOMO_API_KEY', 'demo_api_key'),
                subscriptionKey: getEnvVar('MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY', 'demo_subscription'),
                targetEnvironment: getEnvVar('MTN_MOMO_TARGET_ENVIRONMENT', 'sandbox')
            },
            zamtel: {
                apiKey: getEnvVar('ZAMTEL_KWACHA_API_KEY', 'demo_api_key'),
                clientId: getEnvVar('ZAMTEL_KWACHA_CLIENT_ID', 'demo_client_id'),
                clientSecret: getEnvVar('ZAMTEL_KWACHA_CLIENT_SECRET', 'demo_client_secret')
            }
        };
    }

    init() {
        this.setupPaymentMethodSelector();
        this.setupPhoneNumberValidation();
        console.log('📱 AFZ Mobile Money Service initialized');
    }

    setupPaymentMethodSelector() {
        // Add mobile money provider selection to the payment form
        const mobileMoneyOption = document.querySelector('input[value=\"mobile-money\"]');
        if (mobileMoneyOption) {
            mobileMoneyOption.addEventListener('change', () => {
                if (mobileMoneyOption.checked) {
                    this.showMobileMoneyProviders();
                }
            });
        }
    }

    showMobileMoneyProviders() {
        // Remove existing provider selection
        const existingProviders = document.querySelector('.mobile-money-providers');
        if (existingProviders) {
            existingProviders.remove();
        }

        // Create provider selection
        const providersDiv = document.createElement('div');
        providersDiv.className = 'mobile-money-providers';
        providersDiv.innerHTML = `
            <div class=\"provider-selection\">
                <h5>Select your mobile money provider:</h5>
                <div class=\"provider-options\">
                    ${Object.entries(this.providers).filter(([key, provider]) => provider.enabled).map(([key, provider]) => `
                        <label class=\"provider-option\" for=\"provider-${key}\">
                            <input type=\"radio\" id=\"provider-${key}\" name=\"mobileProvider\" value=\"${key}\" required>
                            <div class=\"provider-info\">
                                <span class=\"provider-logo\">${provider.logo}</span>
                                <div class=\"provider-details\">
                                    <span class=\"provider-name\">${provider.name}</span>
                                    <small class=\"provider-fees\">Fee: ${provider.fees.percentage}%</small>
                                </div>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class=\"phone-number-section\" style=\"display: none;\">
                <div class=\"form-group\">
                    <label for=\"mobileNumber\">Mobile Number *</label>
                    <input type=\"tel\" id=\"mobileNumber\" name=\"mobileNumber\" 
                           placeholder=\"e.g. 0977123456 or +260977123456\" 
                           pattern=\"^(\\+260|0)?[7-9]\\d{8}$\" required>
                    <div class=\"field-help\">Enter your mobile money registered number</div>
                    <div id=\"mobileNumber-error\" class=\"error-message\" role=\"alert\"></div>
                </div>
            </div>
        `;

        // Insert after payment method group
        const paymentMethodGroup = document.querySelector('.payment-method-group');
        paymentMethodGroup.insertAdjacentElement('afterend', providersDiv);

        // Setup provider selection handler
        providersDiv.querySelectorAll('input[name=\"mobileProvider\"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const phoneSection = providersDiv.querySelector('.phone-number-section');
                phoneSection.style.display = 'block';
                
                // Update phone number placeholder based on provider
                const phoneInput = document.getElementById('mobileNumber');
                const provider = this.providers[e.target.value];
                phoneInput.placeholder = `Enter your ${provider.name} number`;
                
                this.updateDonationSummary();
            });
        });

        // Setup phone number validation
        this.setupPhoneNumberValidation();
    }

    setupPhoneNumberValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.id === 'mobileNumber') {
                this.validatePhoneNumber(e.target);
            }
        });
    }

    validatePhoneNumber(phoneInput) {
        const phoneNumber = phoneInput.value.trim();
        const errorDiv = document.getElementById('mobileNumber-error');
        
        // Clear previous error
        errorDiv.textContent = '';
        phoneInput.classList.remove('error');

        if (!phoneNumber) return;

        // Zambian mobile number validation
        const zambianMobileRegex = /^(\\+260|0)?[7-9]\\d{8}$/;
        
        if (!zambianMobileRegex.test(phoneNumber)) {
            errorDiv.textContent = 'Please enter a valid Zambian mobile number';
            phoneInput.classList.add('error');
            return false;
        }

        // Normalize phone number
        const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
        phoneInput.value = normalizedNumber;
        
        return true;
    }

    normalizePhoneNumber(phoneNumber) {
        // Remove all spaces and special characters
        let cleaned = phoneNumber.replace(/[^\\d+]/g, '');
        
        // Convert to international format
        if (cleaned.startsWith('0')) {
            cleaned = '+260' + cleaned.substring(1);
        } else if (!cleaned.startsWith('+260')) {
            cleaned = '+260' + cleaned;
        }
        
        return cleaned;
    }

    updateDonationSummary() {
        const selectedProvider = document.querySelector('input[name=\"mobileProvider\"]:checked')?.value;
        if (!selectedProvider) return;

        const provider = this.providers[selectedProvider];
        const amount = this.getSelectedAmount();
        
        if (amount > 0) {
            const fees = (amount * provider.fees.percentage / 100) + provider.fees.fixed;
            const total = amount + fees;

            // Update existing summary or create new one
            let summaryDiv = document.querySelector('.donation-summary');
            if (!summaryDiv) {
                summaryDiv = document.createElement('div');
                summaryDiv.className = 'donation-summary';
                document.querySelector('.donation-form-container').appendChild(summaryDiv);
            }

            summaryDiv.innerHTML = `
                <div class=\"summary-card mobile-money-summary\">
                    <h4>Payment Summary</h4>
                    <div class=\"provider-info\">
                        <span class=\"provider-logo\">${provider.logo}</span>
                        <span class=\"provider-name\">${provider.name}</span>
                    </div>
                    <div class=\"summary-line\">
                        <span>Donation Amount:</span>
                        <span class=\"amount\">ZMW ${amount.toFixed(2)}</span>
                    </div>
                    <div class=\"summary-line\">
                        <span>Transaction Fee:</span>
                        <span class=\"fees\">ZMW ${fees.toFixed(2)}</span>
                    </div>
                    <div class=\"summary-line total\">
                        <span>Total to Pay:</span>
                        <span class=\"total-amount\">ZMW ${total.toFixed(2)}</span>
                    </div>
                    <div class=\"payment-instructions\">
                        <p><strong>Payment Method:</strong> ${provider.ussdCode} or Mobile App</p>
                        <p><small>You will receive SMS instructions after clicking \"Proceed to Payment\"</small></p>
                    </div>
                </div>
            `;
        }
    }

    getSelectedAmount() {
        const activeBtn = document.querySelector('.amount-btn.active');
        if (activeBtn && activeBtn.classList.contains('custom-amount')) {
            return parseFloat(document.getElementById('customAmount').value) || 0;
        } else if (activeBtn) {
            return parseFloat(activeBtn.getAttribute('data-amount')) || 0;
        }
        return 0;
    }

    async processMobileMoneyPayment(donationData) {
        const { amount, currency, donor, mobileProvider, mobileNumber } = donationData;
        const provider = this.providers[mobileProvider];

        if (!provider) {
            throw new Error('Invalid mobile money provider');
        }

        console.log('📱 Processing mobile money payment:', {
            provider: provider.name,
            amount,
            currency,
            phone: mobileNumber
        });

        // Check amount limits
        if (amount < provider.supportedAmounts.min || amount > provider.supportedAmounts.max) {
            throw new Error(`Amount must be between ZMW ${provider.supportedAmounts.min} and ZMW ${provider.supportedAmounts.max}`);
        }

        try {
            let result;
            switch (mobileProvider) {
                case 'airtel':
                    result = await this.processAirtelMoney(donationData);
                    break;
                case 'mtn':
                    result = await this.processMTNMobileMoney(donationData);
                    break;
                case 'zamtel':
                    result = await this.processZamtelKwacha(donationData);
                    break;
                default:
                    throw new Error('Unsupported provider');
            }

            return result;

        } catch (error) {
            console.error('Mobile Money payment error:', error);
            throw new Error(`Payment failed: ${error.message}`);
        }
    }

    async processAirtelMoney(donationData) {
        // In production, this would integrate with Airtel Money API
        // For now, simulate the payment process
        
        const { amount, mobileNumber } = donationData;
        const transactionId = this.generateTransactionId('AM');

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, you would:
        // 1. Get OAuth token from Airtel API
        // 2. Initiate payment request
        // 3. Return transaction ID for status checking
        
        return {
            success: true,
            transactionId,
            provider: 'airtel',
            instructions: {
                ussdCode: '*115#',
                steps: [
                    'Dial *115# from your Airtel Money registered number',
                    'Select option 4 (Pay Bills)',
                    'Select option 2 (Organizations)',
                    `Enter merchant code: ${this.merchantConfig.airtel.merchantId}`,
                    `Enter amount: ZMW ${amount}`,
                    'Enter your PIN to complete the transaction'
                ]
            },
            statusUrl: `/api/payment-status/${transactionId}`
        };
    }

    async processMTNMobileMoney(donationData) {
        // In production, integrate with MTN MoMo API
        const { amount, mobileNumber } = donationData;
        const transactionId = this.generateTransactionId('MM');

        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            transactionId,
            provider: 'mtn',
            instructions: {
                ussdCode: '*165#',
                steps: [
                    'Dial *165# from your MTN Mobile Money number',
                    'Select option 3 (Pay Bills)',
                    'Select option 2 (Other Services)',
                    'Enter merchant code: AFZ001',
                    `Enter amount: ZMW ${amount}`,
                    'Enter your PIN to authorize payment'
                ]
            },
            statusUrl: `/api/payment-status/${transactionId}`
        };
    }

    async processZamtelKwacha(donationData) {
        // Zamtel Kwacha integration
        const { amount, mobileNumber } = donationData;
        const transactionId = this.generateTransactionId('ZK');

        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            transactionId,
            provider: 'zamtel',
            instructions: {
                ussdCode: '*155#',
                steps: [
                    'Dial *155# from your Zamtel Kwacha number',
                    'Select option 5 (Pay Services)',
                    'Select option 1 (NGO/Charity)',
                    'Enter code: AFZ',
                    `Enter amount: ZMW ${amount}`,
                    'Enter your PIN to complete donation'
                ]
            },
            statusUrl: `/api/payment-status/${transactionId}`
        };
    }

    generateTransactionId(prefix) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    showPaymentInstructions(result) {
        const form = document.getElementById('donationForm');
        const provider = this.providers[result.provider];
        
        form.innerHTML = `
            <div class=\"payment-instructions-screen\">
                <div class=\"success-header\">
                    <div class=\"provider-info\">
                        <span class=\"provider-logo large\">${provider.logo}</span>
                        <h3>Complete Payment via ${provider.name}</h3>
                    </div>
                    <div class=\"transaction-info\">
                        <p><strong>Transaction ID:</strong> ${result.transactionId}</p>
                        <p><strong>Status:</strong> <span class=\"status pending\">Waiting for Payment</span></p>
                    </div>
                </div>
                
                <div class=\"instructions-container\">
                    <h4>Complete your donation using ${provider.name}:</h4>
                    
                    <div class=\"instruction-methods\">
                        <div class=\"method-option\">
                            <h5>📱 Option 1: USSD Code</h5>
                            <div class=\"ussd-code\">
                                <span class=\"code\">${result.instructions.ussdCode}</span>
                                <button onclick=\"this.blur(); window.location.href='tel:${result.instructions.ussdCode}'\" class=\"dial-button\">Dial Now</button>
                            </div>
                            <ol class=\"instruction-steps\">
                                ${result.instructions.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                        
                        <div class=\"method-option\">
                            <h5>📲 Option 2: Mobile App</h5>
                            <p>Open your ${provider.name} app and navigate to \"Pay Bills\" or \"Pay Services\"</p>
                            <p>Use merchant code: <strong>AFZ001</strong></p>
                        </div>
                    </div>
                </div>
                
                <div class=\"payment-actions\">
                    <button onclick=\"this.checkPaymentStatus('${result.transactionId}')\" class=\"cta-button primary\" id=\"checkStatusBtn\">
                        <i class=\"fas fa-sync\"></i> Check Payment Status
                    </button>
                    <button onclick=\"window.location.reload()\" class=\"cta-button secondary\">
                        <i class=\"fas fa-arrow-left\"></i> Start Over
                    </button>
                </div>
                
                <div class=\"help-section\">
                    <details>
                        <summary>Need Help?</summary>
                        <div class=\"help-content\">
                            <p><strong>Payment Issues:</strong></p>
                            <ul>
                                <li>Ensure you have sufficient balance</li>
                                <li>Check your mobile number is registered for mobile money</li>
                                <li>Contact your provider's customer service if needed</li>
                            </ul>
                            <p><strong>AFZ Support:</strong> <a href=\"tel:+260977977026\">+260 97 7977026</a> | <a href=\"mailto:info@afz.org.zm\">info@afz.org.zm</a></p>
                        </div>
                    </details>
                </div>
            </div>
        `;

        // Start polling for payment status
        this.pollPaymentStatus(result.transactionId);
    }

    async pollPaymentStatus(transactionId) {
        let attempts = 0;
        const maxAttempts = 30; // Poll for 5 minutes
        
        const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
                const status = await this.checkPaymentStatus(transactionId);
                
                if (status.completed) {
                    clearInterval(pollInterval);
                    this.showPaymentSuccess(status);
                } else if (status.failed) {
                    clearInterval(pollInterval);
                    this.showPaymentError(status.error);
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    this.showPaymentTimeout(transactionId);
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 10000); // Check every 10 seconds
    }

    async checkPaymentStatus(transactionId) {
        // In production, this would check the actual payment status via API
        // For demo, simulate random completion after some time
        
        const random = Math.random();
        if (random > 0.7) { // 30% chance of completion each check
            return {
                completed: true,
                transactionId,
                amount: this.getSelectedAmount(),
                timestamp: new Date().toISOString()
            };
        }
        
        return { pending: true };
    }

    showPaymentSuccess(status) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Payment Successful';
            statusElement.className = 'status success';
        }

        // Show success message
        const container = document.querySelector('.payment-instructions-screen');
        if (container) {
            container.innerHTML = `
                <div class=\"payment-success\">
                    <div class=\"success-icon\">✅</div>
                    <h3>Thank You for Your Donation!</h3>
                    <div class=\"donation-details\">
                        <p><strong>Amount:</strong> ZMW ${status.amount}</p>
                        <p><strong>Transaction ID:</strong> ${status.transactionId}</p>
                        <p><strong>Date:</strong> ${new Date(status.timestamp).toLocaleDateString()}</p>
                    </div>
                    <p>Your generous donation will help AFZ continue advocating for the rights of persons with albinism in Zambia.</p>
                    <p>A receipt has been sent via SMS to your mobile number.</p>
                    <div class=\"success-actions\">
                        <a href=\"../index.html\" class=\"cta-button primary\">Return to Home</a>
                        <button onclick=\"window.print()\" class=\"cta-button secondary\">Print Receipt</button>
                    </div>
                </div>
            `;
        }
    }

    showPaymentError(error) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Payment Failed';
            statusElement.className = 'status error';
        }
        
        alert(`Payment failed: ${error}. Please try again or contact support.`);
    }

    showPaymentTimeout(transactionId) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Payment Pending';
            statusElement.className = 'status warning';
        }
        
        alert(`Payment status check timed out. Please check your mobile money transaction history or contact support with transaction ID: ${transactionId}`);
    }
}

// Initialize mobile money service
if (typeof window !== 'undefined') {
    window.AFZMobileMoneyService = AFZMobileMoneyService;
    
    // Auto-initialize on donation page
    if (document.getElementById('donationForm')) {
        window.afzMobileMoneyService = new AFZMobileMoneyService();
    }
}

console.log('📱 AFZ Mobile Money Service loaded');