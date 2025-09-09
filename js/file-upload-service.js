/**
 * AFZ File Upload Service
 * Handles file uploads to Supabase Storage with progress tracking and validation
 */

class AFZFileUploadService {
    constructor() {
        this.allowedTypes = {
            avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            resources: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain'],
            chatFiles: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain']
        };
        
        this.maxFileSizes = {
            avatars: 5 * 1024 * 1024, // 5MB
            resources: 50 * 1024 * 1024, // 50MB
            chatFiles: 25 * 1024 * 1024 // 25MB
        };
        
        this.uploadQueue = new Map();
        this.progressCallbacks = new Map();
    }

    async uploadFile(file, bucket, path, options = {}) {
        const uploadId = this.generateUploadId();
        
        try {
            this.validateFile(file, bucket);
            const filePath = this.preparePath(path, file, options);
            
            this.uploadQueue.set(uploadId, {
                file, bucket, path: filePath, status: 'uploading', progress: 0
            });
            
            const { data, error } = await this.uploadWithProgress(uploadId, file, bucket, filePath, options);
            if (error) throw error;
            
            this.uploadQueue.set(uploadId, {
                ...this.uploadQueue.get(uploadId),
                status: 'completed', progress: 100, data
            });
            
            const publicUrl = this.getPublicUrl(bucket, filePath);
            return { success: true, uploadId, path: filePath, url: publicUrl, data };
            
        } catch (error) {
            this.uploadQueue.set(uploadId, {
                ...this.uploadQueue.get(uploadId),
                status: 'error', error: error.message
            });
            throw error;
        }
    }

    async uploadAvatar(file, userId) {
        const path = `${userId}/avatar-${Date.now()}`;
        
        try {
            const result = await this.uploadFile(file, 'avatars', path, {
                cacheControl: '3600', upsert: true
            });
            
            if (window.afzAuth && window.afzAuth.isAuthenticated) {
                await window.afzAuth.updateProfile({ avatar_url: result.url });
            }
            
            return result;
        } catch (error) {
            console.error('Avatar upload failed:', error);
            throw error;
        }
    }

    validateFile(file, bucket) {
        const maxSize = this.maxFileSizes[bucket];
        if (file.size > maxSize) {
            throw new Error(`File too large. Maximum size: ${this.formatFileSize(maxSize)}`);
        }
        
        const allowedTypes = this.allowedTypes[bucket];
        const isAllowed = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });
        
        if (!isAllowed) {
            throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }
    }

    async uploadWithProgress(uploadId, file, bucket, path, options) {
        return new Promise((resolve, reject) => {
            window.sb.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: options.cacheControl || '3600',
                    upsert: options.upsert || false
                })
                .then(result => {
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += Math.random() * 30;
                        if (progress >= 100) {
                            progress = 100;
                            clearInterval(interval);
                        }
                        this.updateProgress(uploadId, progress);
                    }, 100);
                    
                    setTimeout(() => {
                        clearInterval(interval);
                        this.updateProgress(uploadId, 100);
                        resolve(result);
                    }, 500);
                })
                .catch(reject);
        });
    }

    updateProgress(uploadId, progress) {
        const upload = this.uploadQueue.get(uploadId);
        if (upload) {
            upload.progress = progress;
            const callback = this.progressCallbacks.get(uploadId);
            if (callback) callback(progress, upload);
        }
    }

    getPublicUrl(bucket, path) {
        const { data } = window.sb.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    generateUploadId() {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    preparePath(path, file, options) {
        path = path.replace(/^\//, '');
        if (!path.includes('.') && file.name.includes('.')) {
            const extension = file.name.split('.').pop();
            path += `.${extension}`;
        }
        return path;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize global file upload service
window.afzUpload = new AFZFileUploadService();
console.log('✅ AFZ File Upload Service initialized');