// AFZ Member Portal - Supabase Configuration
// Production-ready Supabase client setup and configuration

// Production configuration management
class AFZSupabaseConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfiguration();
        this.client = null;
        this.validateAndInitialize();
    }

    detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            }
        }
        return 'production';
    }

    loadConfiguration() {
        // Check if global AFZConfig is available
        if (window.AFZConfig) {
            return window.AFZConfig.getSupabaseConfig();
        }

        // Fallback to environment-specific configuration
        const configs = {
            development: {
                url: 'https://vzkbvhqvrazbxbhkynfy.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J2aHF2cmF6YnhiaGt5bmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg3MTEsImV4cCI6MjA3Mjc0NDcxMX0.e0SZ_Jl1BRDiAyOqYUDY1jKCphKTeYg2UseVMzMJ-ak',
                redirectUrl: `${window.location.origin}/pages/member-hub.html`
            },
            staging: {
                url: this.getEnvVar('SUPABASE_URL', 'https://vzkbvhqvrazbxbhkynfy.supabase.co'),
                anonKey: this.getEnvVar('SUPABASE_ANON_KEY', 'your-staging-anon-key'),
                redirectUrl: this.getEnvVar('SUPABASE_REDIRECT_URL', `${window.location.origin}/pages/member-hub.html`)
            },
            production: {
                url: this.getEnvVar('SUPABASE_URL', 'https://vzkbvhqvrazbxbhkynfy.supabase.co'),
                anonKey: this.getEnvVar('SUPABASE_ANON_KEY', 'your-production-anon-key'),
                redirectUrl: this.getEnvVar('SUPABASE_REDIRECT_URL', `${window.location.origin}/pages/member-hub.html`)
            }
        };

        return configs[this.environment] || configs.development;
    }

    getEnvVar(key, defaultValue = '') {
        // Try multiple sources for environment variables
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
        if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
            return window.__ENV__[key];
        }
        if (typeof document !== 'undefined') {
            const meta = document.querySelector(`meta[name="env-${key.toLowerCase()}"]`);
            if (meta) return meta.getAttribute('content');
        }
        return defaultValue;
    }

    validateAndInitialize() {
        const errors = [];
        
        if (!this.config.url || this.config.url.includes('your-project')) {
            errors.push('Supabase URL not configured');
        }
        
        if (!this.config.anonKey || this.config.anonKey.includes('your-') || this.config.anonKey.length < 50) {
            errors.push('Supabase Anonymous Key not configured');
        }
        
        if (errors.length > 0) {
            if (this.environment === 'development') {
                console.warn('⚠️ Supabase Configuration Warnings:', errors);
            } else {
                console.error('❌ Supabase Configuration Errors:', errors);
            }
        }
        
        this.initializeClient();
    }

    initializeClient() {
        try {
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase library not loaded');
            }
            
            this.client = supabase.createClient(this.config.url, this.config.anonKey, {
                auth: {
                    redirectTo: this.config.redirectUrl,
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            
            console.log('✅ Supabase client initialized successfully');
            console.log('🌍 Environment:', this.environment);
            
        } catch (error) {
            console.error('❌ Error initializing Supabase client:', error);
            this.client = null;
        }
    }

    getSupabaseClient() {
        return this.client;
    }
    
    getConfig() {
        return this.config;
    }
}

// Initialize configuration
const afzSupabaseConfig = new AFZSupabaseConfig();
const supabaseClient = afzSupabaseConfig.getSupabaseClient();

// Legacy compatibility - keeping existing function names
function initializeSupabase() {
    return afzSupabaseConfig.getSupabaseClient();
}

function getSupabaseClient() {
    return afzSupabaseConfig.getSupabaseClient();
}

// Storage bucket configuration
const STORAGE_BUCKETS = {
    AVATARS: 'avatars',
    RESOURCES: 'resources', 
    EVENTS: 'events',
    CHAT_FILES: 'chat-files'
};

// File upload configurations
const UPLOAD_CONFIG = {
    avatars: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        folder: 'user-avatars'
    },
    resources: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mp3', 'audio/wav', 'audio/ogg'
        ],
        folder: 'community-resources'
    },
    events: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        folder: 'event-images'
    },
    chatFiles: {
        maxSize: 25 * 1024 * 1024, // 25MB
        allowedTypes: [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm',
            'audio/mp3', 'audio/wav'
        ],
        folder: 'chat-attachments'
    }
};

// File validation utility
function validateFile(file, uploadType) {
    const config = UPLOAD_CONFIG[uploadType];
    if (!config) {
        return { valid: false, error: 'Invalid upload type' };
    }
    
    // Check file size
    if (file.size > config.maxSize) {
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }
    
    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
        return { valid: false, error: 'File type not allowed' };
    }
    
    return { valid: true };
}

// Generate unique file name
function generateFileName(originalName, userId, uploadType) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const config = UPLOAD_CONFIG[uploadType];
    
    return `${config.folder}/${userId}/${timestamp}_${randomString}.${extension}`;
}

// Upload file to Supabase Storage
async function uploadFile(file, uploadType, userId, onProgress = null) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        // Validate file
        const validation = validateFile(file, uploadType);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Generate file path
        const fileName = generateFileName(file.name, userId, uploadType);
        const bucketName = STORAGE_BUCKETS[uploadType.toUpperCase()] || STORAGE_BUCKETS.RESOURCES;
        
        // Upload file
        const { data, error } = await client.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get public URL
        const { data: urlData } = client.storage
            .from(bucketName)
            .getPublicUrl(fileName);
        
        return {
            success: true,
            fileName: fileName,
            publicUrl: urlData.publicUrl,
            bucket: bucketName
        };
        
    } catch (error) {
        console.error('File upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete file from Supabase Storage
async function deleteFile(fileName, bucketName) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        const { error } = await client.storage
            .from(bucketName)
            .remove([fileName]);
        
        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('File delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get download URL for private files
async function getDownloadUrl(fileName, bucketName, expiresIn = 3600) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await client.storage
            .from(bucketName)
            .createSignedUrl(fileName, expiresIn);
        
        if (error) {
            throw new Error(`URL generation failed: ${error.message}`);
        }
        
        return {
            success: true,
            signedUrl: data.signedUrl
        };
        
    } catch (error) {
        console.error('Download URL error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.SupabaseConfig = {
        initializeSupabase,
        getSupabaseClient,
        uploadFile,
        deleteFile,
        getDownloadUrl,
        validateFile,
        STORAGE_BUCKETS,
        UPLOAD_CONFIG,
        // New production config methods
        getConfig: () => afzSupabaseConfig.getConfig(),
        getEnvironment: () => afzSupabaseConfig.environment,
        config: afzSupabaseConfig
    };
    
    // Make client globally available for backward compatibility
    window.sb = supabaseClient;
    window.supabaseClient = supabaseClient;
}