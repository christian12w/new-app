// AFZ Member Portal - File Upload Component
// Reusable file upload component with progress tracking and validation

class FileUploadComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            uploadType: options.uploadType || 'resources',
            maxFiles: options.maxFiles || 1,
            allowMultiple: options.allowMultiple || false,
            showPreview: options.showPreview !== false,
            showProgress: options.showProgress !== false,
            onSuccess: options.onSuccess || (() => {}),
            onError: options.onError || (() => {}),
            onProgress: options.onProgress || (() => {}),
            customValidation: options.customValidation || null,
            ...options
        };
        
        this.uploadedFiles = [];
        this.currentUploads = [];
        
        this.init();
    }
    
    init() {
        this.createUploadInterface();
        this.bindEvents();
    }
    
    createUploadInterface() {
        const config = window.SupabaseConfig.UPLOAD_CONFIG[this.options.uploadType];
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        
        this.container.innerHTML = `
            <div class="file-upload-component">
                <div class="upload-area" id="${this.container.id}-upload-area">
                    <div class="upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="upload-text">
                        <h4>Drop files here or click to browse</h4>
                        <p>Maximum file size: ${maxSizeMB}MB</p>
                        <p>Allowed formats: ${this.getFormattedFileTypes()}</p>
                    </div>
                    <input type="file" 
                           id="${this.container.id}-file-input" 
                           ${this.options.allowMultiple ? 'multiple' : ''} 
                           accept="${this.getAcceptString()}"
                           style="display: none;">
                    <button type="button" class="browse-btn" onclick="document.getElementById('${this.container.id}-file-input').click()">
                        <i class="fas fa-folder-open"></i> Browse Files
                    </button>
                </div>
                
                ${this.options.showProgress ? `
                <div class="upload-progress" id="${this.container.id}-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">
                        <span class="progress-percentage">0%</span>
                        <span class="progress-status">Ready to upload</span>
                    </div>
                </div>
                ` : ''}
                
                ${this.options.showPreview ? `
                <div class="file-preview" id="${this.container.id}-preview"></div>
                ` : ''}
                
                <div class="upload-results" id="${this.container.id}-results"></div>
            </div>
        `;
        
        this.addStyles();
    }
    
    addStyles() {
        if (document.getElementById('file-upload-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'file-upload-styles';
        styles.textContent = `
            .file-upload-component {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
            }
            
            .upload-area {
                border: 2px dashed #e0e7ff;
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                background: #f8fafc;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .upload-area:hover, .upload-area.dragover {
                border-color: #4f46e5;
                background: #eef2ff;
            }
            
            .upload-icon {
                font-size: 3rem;
                color: #6b7280;
                margin-bottom: 1rem;
            }
            
            .upload-text h4 {
                margin: 0 0 0.5rem 0;
                color: #374151;
                font-weight: 600;
            }
            
            .upload-text p {
                margin: 0.25rem 0;
                color: #6b7280;
                font-size: 0.9rem;
            }
            
            .browse-btn {
                background: #4f46e5;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 1rem;
                transition: background 0.2s;
            }
            
            .browse-btn:hover {
                background: #4338ca;
            }
            
            .upload-progress {
                margin: 1rem 0;
                padding: 1rem;
                background: #f1f5f9;
                border-radius: 8px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            
            .progress-fill {
                height: 100%;
                background: #10b981;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
                color: #64748b;
            }
            
            .file-preview {
                margin: 1rem 0;
            }
            
            .file-preview-item {
                display: flex;
                align-items: center;
                padding: 0.75rem;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }
            
            .file-preview-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f1f5f9;
                border-radius: 6px;
                margin-right: 0.75rem;
            }
            
            .file-preview-info {
                flex: 1;
            }
            
            .file-preview-name {
                font-weight: 500;
                color: #374151;
                margin-bottom: 0.25rem;
            }
            
            .file-preview-size {
                font-size: 0.8rem;
                color: #6b7280;
            }
            
            .file-preview-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .file-action-btn {
                padding: 0.25rem 0.5rem;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            
            .file-action-btn:hover {
                background: #f9fafb;
            }
            
            .file-action-btn.delete {
                color: #dc2626;
                border-color: #fecaca;
            }
            
            .file-action-btn.delete:hover {
                background: #fef2f2;
            }
            
            .upload-results {
                margin-top: 1rem;
            }
            
            .upload-result {
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .upload-result.success {
                background: #ecfdf5;
                color: #059669;
                border: 1px solid #a7f3d0;
            }
            
            .upload-result.error {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            .file-upload-component.disabled .upload-area {
                opacity: 0.6;
                pointer-events: none;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    bindEvents() {
        const uploadArea = this.container.querySelector(`#${this.container.id}-upload-area`);
        const fileInput = this.container.querySelector(`#${this.container.id}-file-input`);
        
        // Click to browse
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(Array.from(e.dataTransfer.files));
        });
    }
    
    handleFiles(files) {
        // Validate file count
        if (!this.options.allowMultiple && files.length > 1) {
            this.showError('Only one file is allowed');
            return;
        }
        
        if (files.length > this.options.maxFiles) {
            this.showError(`Maximum ${this.options.maxFiles} files allowed`);
            return;
        }
        
        // Validate each file
        const validFiles = [];
        for (const file of files) {
            const validation = window.SupabaseConfig.validateFile(file, this.options.uploadType);
            if (validation.valid) {
                // Custom validation if provided
                if (this.options.customValidation) {
                    const customResult = this.options.customValidation(file);
                    if (!customResult.valid) {
                        this.showError(`${file.name}: ${customResult.error}`);
                        continue;
                    }
                }
                validFiles.push(file);
            } else {
                this.showError(`${file.name}: ${validation.error}`);
            }
        }
        
        if (validFiles.length === 0) return;
        
        // Show preview if enabled
        if (this.options.showPreview) {
            this.showPreview(validFiles);
        } else {
            // Start upload immediately
            this.uploadFiles(validFiles);
        }
    }
    
    showPreview(files) {
        const previewContainer = this.container.querySelector(`#${this.container.id}-preview`);
        previewContainer.innerHTML = '<h4>Files ready for upload:</h4>';
        
        files.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.innerHTML = `
                <div class="file-preview-icon">
                    <i class="fas ${this.getFileIcon(file.type)}"></i>
                </div>
                <div class="file-preview-info">
                    <div class="file-preview-name">${file.name}</div>
                    <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
                </div>
                <div class="file-preview-actions">
                    <button class="file-action-btn delete" onclick="this.closest('.file-preview-item').remove()">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
            
            previewContainer.appendChild(previewItem);
        });
        
        // Add upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'browse-btn';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Files';
        uploadBtn.style.marginTop = '1rem';
        uploadBtn.onclick = () => {
            const remainingItems = previewContainer.querySelectorAll('.file-preview-item');
            const remainingFiles = Array.from(remainingItems).map((item, index) => files[index]).filter(Boolean);
            this.uploadFiles(remainingFiles);
        };
        
        previewContainer.appendChild(uploadBtn);
    }
    
    async uploadFiles(files) {
        if (!files.length) return;
        
        this.setLoading(true);
        this.showProgress(0, 'Starting upload...');
        
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                this.showProgress(
                    (i / files.length) * 100, 
                    `Uploading ${file.name}...`
                );
                
                // Get current user ID (you'll need to implement this based on your auth system)
                const userId = await this.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }
                
                const result = await window.SupabaseConfig.uploadFile(
                    file, 
                    this.options.uploadType, 
                    userId,
                    (progress) => {
                        const overallProgress = ((i + progress / 100) / files.length) * 100;
                        this.showProgress(overallProgress, `Uploading ${file.name}...`);
                    }
                );
                
                if (result.success) {
                    results.push({ file: file.name, success: true, url: result.publicUrl });
                    this.showResult(file.name, 'success', 'Uploaded successfully');
                } else {
                    results.push({ file: file.name, success: false, error: result.error });
                    this.showResult(file.name, 'error', result.error);
                }
                
            } catch (error) {
                results.push({ file: file.name, success: false, error: error.message });
                this.showResult(file.name, 'error', error.message);
            }
        }
        
        this.showProgress(100, 'Upload complete');
        this.setLoading(false);
        
        // Clear preview
        if (this.options.showPreview) {
            const previewContainer = this.container.querySelector(`#${this.container.id}-preview`);
            previewContainer.innerHTML = '';
        }
        
        // Trigger callbacks
        const successfulUploads = results.filter(r => r.success);
        const failedUploads = results.filter(r => !r.success);
        
        if (successfulUploads.length > 0) {
            this.options.onSuccess(successfulUploads);
        }
        
        if (failedUploads.length > 0) {
            this.options.onError(failedUploads);
        }
    }
    
    async getCurrentUserId() {
        // This should be implemented based on your authentication system
        const client = window.SupabaseConfig.getSupabaseClient();
        if (!client) return null;
        
        const { data: { user } } = await client.auth.getUser();
        return user?.id || null;
    }
    
    showProgress(percentage, status) {
        if (!this.options.showProgress) return;
        
        const progressContainer = this.container.querySelector(`#${this.container.id}-progress`);
        const progressFill = progressContainer.querySelector('.progress-fill');
        const progressPercentage = progressContainer.querySelector('.progress-percentage');
        const progressStatus = progressContainer.querySelector('.progress-status');
        
        progressContainer.style.display = 'block';
        progressFill.style.width = `${Math.round(percentage)}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        progressStatus.textContent = status;
    }
    
    showResult(fileName, type, message) {
        const resultsContainer = this.container.querySelector(`#${this.container.id}-results`);
        
        const resultItem = document.createElement('div');
        resultItem.className = `upload-result ${type}`;
        resultItem.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <strong>${fileName}:</strong> ${message}
        `;
        
        resultsContainer.appendChild(resultItem);
        
        // Auto-remove after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                if (resultItem.parentNode) {
                    resultItem.remove();
                }
            }, 5000);
        }
    }
    
    showError(message) {
        this.showResult('Error', 'error', message);
    }
    
    setLoading(loading) {
        if (loading) {
            this.container.classList.add('disabled');
        } else {
            this.container.classList.remove('disabled');
        }
    }
    
    getAcceptString() {
        const config = window.SupabaseConfig.UPLOAD_CONFIG[this.options.uploadType];
        return config.allowedTypes.join(',');
    }
    
    getFormattedFileTypes() {
        const config = window.SupabaseConfig.UPLOAD_CONFIG[this.options.uploadType];
        const extensions = config.allowedTypes.map(type => {
            const extensionMap = {
                'image/jpeg': 'JPG',
                'image/jpg': 'JPG', 
                'image/png': 'PNG',
                'image/gif': 'GIF',
                'image/webp': 'WebP',
                'application/pdf': 'PDF',
                'application/msword': 'DOC',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
                'video/mp4': 'MP4',
                'audio/mp3': 'MP3'
            };
            return extensionMap[type] || type.split('/')[1].toUpperCase();
        });
        
        return extensions.join(', ');
    }
    
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-image';
        if (mimeType.startsWith('video/')) return 'fa-video';
        if (mimeType.startsWith('audio/')) return 'fa-music';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('word')) return 'fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fa-file-powerpoint';
        return 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        if (bytes < 1073741824) return Math.round(bytes / 1048576) + ' MB';
        return Math.round(bytes / 1073741824) + ' GB';
    }
    
    // Public methods for external control
    reset() {
        this.uploadedFiles = [];
        this.currentUploads = [];
        
        const previewContainer = this.container.querySelector(`#${this.container.id}-preview`);
        const resultsContainer = this.container.querySelector(`#${this.container.id}-results`);
        const progressContainer = this.container.querySelector(`#${this.container.id}-progress`);
        
        if (previewContainer) previewContainer.innerHTML = '';
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (progressContainer) progressContainer.style.display = 'none';
        
        this.setLoading(false);
    }
    
    disable() {
        this.setLoading(true);
    }
    
    enable() {
        this.setLoading(false);
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.FileUploadComponent = FileUploadComponent;
}