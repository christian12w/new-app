/**
 * AFZ Member Hub - Real-time Resources Manager
 * Comprehensive resource library with Supabase integration
 */

class ResourcesManager {
    constructor() {
        this.currentUser = null;
        this.authService = null;
        this.resources = [];
        this.categories = [];
        this.currentFilter = { category: 'all', type: 'all', search: '' };
        this.isInitialized = false;
        
        // Initialize after auth service is ready
        this.waitForServices().then(() => {
            this.init();
        }).catch(error => {
            console.error('ResourcesManager initialization failed:', error);
        });
    }

    async waitForServices() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService || !window.afzAuthService.isAuthenticated) {
            throw new Error('Authentication service not available');
        }
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        console.log('✅ ResourcesManager services ready for user:', this.currentUser.email);
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadCategories();
            await this.loadResources();
            await this.setupResourcesInterface();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ ResourcesManager initialized successfully');
        } catch (error) {
            console.error('Error initializing ResourcesManager:', error);
        }
    }

    async loadCategories() {
        if (!window.sb) return;
        
        try {
            const { data: categories, error } = await window.sb
                .from('resource_categories')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            this.categories = categories || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = this.getDefaultCategories();
        }
    }

    async loadResources(filters = {}) {
        if (!window.sb) return;
        
        try {
            let query = window.sb
                .from('resources')
                .select(`
                    *,
                    category:category_id(name, color, icon),
                    author:author_id(full_name, display_name, avatar_url)
                `);

            // Apply filters
            if (filters.category && filters.category !== 'all') {
                query = query.eq('category_id', filters.category);
            }
            if (filters.type && filters.type !== 'all') {
                query = query.eq('resource_type', filters.type);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            query = query.eq('status', 'published');
            query = query.order('created_at', { ascending: false });

            const { data: resources, error } = await query;
            if (error) throw error;

            this.resources = resources || [];
            this.renderResourcesList();
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showNotification('Failed to load resources', 'error');
        }
    }

    async setupResourcesInterface() {
        const resourcesContainer = document.getElementById('section-resources');
        if (!resourcesContainer) return;

        resourcesContainer.innerHTML = `
            <div class="resources-manager">
                <!-- Resources Header -->
                <div class="resources-header">
                    <div class="resources-info">
                        <h1>Resource Library</h1>
                        <p>Access and discover valuable community resources</p>
                    </div>
                    <div class="resources-actions">
                        <button class="action-btn" id="upload-resource-btn">
                            <i class="fas fa-plus"></i> Upload Resource
                        </button>
                    </div>
                </div>

                <!-- Resources Stats -->
                <div class="resources-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="total-resources">${this.resources.length}</h3>
                            <p>Total Resources</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="total-downloads">---</h3>
                            <p>Downloads</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tags"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.categories.length}</h3>
                            <p>Categories</p>
                        </div>
                    </div>
                </div>

                <!-- Filters and Search -->
                <div class="resources-controls">
                    <div class="search-section">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="resources-search" placeholder="Search resources...">
                        </div>
                    </div>
                    <div class="filter-section">
                        <select id="category-filter" class="filter-select">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                        <select id="type-filter" class="filter-select">
                            <option value="all">All Types</option>
                            <option value="document">Documents</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="image">Images</option>
                            <option value="link">Links</option>
                            <option value="toolkit">Toolkits</option>
                        </select>
                    </div>
                </div>

                <!-- Resources Grid -->
                <div class="resources-grid" id="resources-grid">
                    ${this.renderResourcesGrid()}
                </div>

                <!-- Empty State -->
                <div class="empty-state" id="resources-empty" style="display: none;">
                    <div class="empty-icon">
                        <i class="fas fa-folder-open"></i>
                    </div>
                    <h3>No resources found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            </div>

            <!-- Resource Detail Modal -->
            ${this.renderResourceModal()}

            <!-- Upload Modal -->
            ${this.renderUploadModal()}
        `;

        this.injectStyles();
    }

    renderResourcesGrid() {
        if (!this.resources || this.resources.length === 0) {
            return '';
        }

        return this.resources.map(resource => `
            <div class="resource-card" data-resource-id="${resource.id}">
                <div class="resource-thumbnail">
                    ${this.renderResourceThumbnail(resource)}
                    <div class="resource-type-badge ${resource.resource_type}">
                        <i class="fas ${this.getTypeIcon(resource.resource_type)}"></i>
                    </div>
                </div>
                <div class="resource-content">
                    <h3 class="resource-title">${resource.title}</h3>
                    <p class="resource-description">${this.truncateText(resource.description, 100)}</p>
                    <div class="resource-meta">
                        <div class="resource-category">
                            <i class="fas fa-tag"></i>
                            <span>${resource.category?.name || 'Uncategorized'}</span>
                        </div>
                        <div class="resource-author">
                            <i class="fas fa-user"></i>
                            <span>${resource.author?.display_name || resource.author?.full_name || 'Unknown'}</span>
                        </div>
                        <div class="resource-stats">
                            <span><i class="fas fa-download"></i> ${resource.download_count || 0}</span>
                            <span><i class="fas fa-eye"></i> ${resource.view_count || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="resource-actions">
                    <button class="btn btn-primary" onclick="resourcesManager.viewResource('${resource.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${resource.download_allowed ? `
                        <button class="btn btn-secondary" onclick="resourcesManager.downloadResource('${resource.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="resourcesManager.bookmarkResource('${resource.id}')">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderResourceThumbnail(resource) {
        if (resource.file_url && resource.resource_type === 'image') {
            return `<img src="${resource.file_url}" alt="${resource.title}" loading="lazy">`;
        }
        
        const defaultThumbnails = {
            document: '/images/placeholders/document.svg',
            video: '/images/placeholders/video.svg',
            audio: '/images/placeholders/audio.svg',
            toolkit: '/images/placeholders/toolkit.svg',
            link: '/images/placeholders/link.svg'
        };
        
        const thumbnailUrl = defaultThumbnails[resource.resource_type] || '/images/placeholders/default.svg';
        return `<img src="${thumbnailUrl}" alt="${resource.title}" loading="lazy">`;
    }

    getTypeIcon(type) {
        const icons = {
            document: 'fa-file-alt',
            video: 'fa-video',
            audio: 'fa-volume-up',
            image: 'fa-image',
            link: 'fa-external-link-alt',
            toolkit: 'fa-toolbox',
            guide: 'fa-book'
        };
        return icons[type] || 'fa-file';
    }

    async viewResource(resourceId) {
        try {
            const resource = this.resources.find(r => r.id === resourceId);
            if (!resource) return;

            await this.trackInteraction(resourceId, 'view');
            this.showResourceModal(resource);
        } catch (error) {
            console.error('Error viewing resource:', error);
        }
    }

    async downloadResource(resourceId) {
        try {
            const resource = this.resources.find(r => r.id === resourceId);
            if (!resource || !resource.file_url) {
                this.showNotification('Resource file not available', 'error');
                return;
            }

            await this.trackInteraction(resourceId, 'download');

            const link = document.createElement('a');
            link.href = resource.file_url;
            link.download = resource.title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Download started', 'success');
        } catch (error) {
            console.error('Error downloading resource:', error);
            this.showNotification('Download failed', 'error');
        }
    }

    async bookmarkResource(resourceId) {
        try {
            await this.trackInteraction(resourceId, 'bookmark');
            this.showNotification('Resource bookmarked', 'success');
        } catch (error) {
            console.error('Error bookmarking resource:', error);
            this.showNotification('Failed to bookmark resource', 'error');
        }
    }

    async trackInteraction(resourceId, interactionType) {
        if (!window.sb || !this.currentUser) return;

        try {
            const { error } = await window.sb
                .from('resource_interactions')
                .upsert({
                    user_id: this.currentUser.id,
                    resource_id: resourceId,
                    interaction_type: interactionType
                });

            if (error && !error.message.includes('duplicate')) {
                throw error;
            }

            const resource = this.resources.find(r => r.id === resourceId);
            if (resource) {
                if (interactionType === 'download') {
                    resource.download_count = (resource.download_count || 0) + 1;
                } else if (interactionType === 'view') {
                    resource.view_count = (resource.view_count || 0) + 1;
                }
            }
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('resources-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilter.search = e.target.value;
                this.debounceSearch();
            });
        }

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter.category = e.target.value;
                this.applyFilters();
            });
        }

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilter.type = e.target.value;
                this.applyFilters();
            });
        }

        const uploadBtn = document.getElementById('upload-resource-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    async applyFilters() {
        await this.loadResources(this.currentFilter);
        this.updateEmptyState();
    }

    updateEmptyState() {
        const grid = document.getElementById('resources-grid');
        const emptyState = document.getElementById('resources-empty');
        
        if (this.resources.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            grid.innerHTML = this.renderResourcesGrid();
        }
    }

    renderResourcesList() {
        this.updateEmptyState();
    }

    showResourceModal(resource) {
        const modal = document.getElementById('resource-modal');
        const modalBody = document.getElementById('resource-modal-body');
        
        modalBody.innerHTML = `
            <div class="resource-detail">
                <div class="resource-header">
                    <div class="resource-thumbnail-large">
                        ${this.renderResourceThumbnail(resource)}
                    </div>
                    <div class="resource-info">
                        <h2>${resource.title}</h2>
                        <p class="resource-description">${resource.description || 'No description available.'}</p>
                        <div class="resource-metadata">
                            <div class="meta-item">
                                <i class="fas fa-tag"></i>
                                <span>${resource.category?.name || 'Uncategorized'}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span>${resource.author?.display_name || resource.author?.full_name || 'Unknown Author'}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${this.formatDate(resource.created_at)}</span>
                            </div>
                            ${resource.file_size ? `
                                <div class="meta-item">
                                    <i class="fas fa-hdd"></i>
                                    <span>${this.formatFileSize(resource.file_size)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="resource-actions-modal">
                    ${resource.download_allowed ? `
                        <button class="btn btn-primary btn-lg" onclick="resourcesManager.downloadResource('${resource.id}')">
                            <i class="fas fa-download"></i> Download Resource
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="resourcesManager.bookmarkResource('${resource.id}')">
                        <i class="fas fa-bookmark"></i> Bookmark
                    </button>
                    <button class="btn btn-outline" onclick="resourcesManager.shareResource('${resource.id}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
                ${resource.content ? `
                    <div class="resource-content-preview">
                        <h3>Content</h3>
                        <div class="content-text">${resource.content}</div>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    async shareResource(resourceId) {
        try {
            await this.trackInteraction(resourceId, 'share');
            
            if (navigator.share) {
                const resource = this.resources.find(r => r.id === resourceId);
                await navigator.share({
                    title: resource.title,
                    text: resource.description,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                this.showNotification('Link copied to clipboard', 'success');
            }
        } catch (error) {
            console.error('Error sharing resource:', error);
        }
    }

    showUploadModal() {
        const modal = document.getElementById('upload-modal');
        modal.style.display = 'flex';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderResourceModal() {
        return `
            <div class="modal-overlay" id="resource-modal" style="display: none;">
                <div class="modal-container large">
                    <div class="modal-header">
                        <h3>Resource Details</h3>
                        <button class="modal-close" onclick="resourcesManager.closeModal('resource-modal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="resource-modal-body">
                        <!-- Resource details will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    renderUploadModal() {
        return `
            <div class="modal-overlay" id="upload-modal" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>Upload Resource</h3>
                        <button class="modal-close" onclick="resourcesManager.closeModal('upload-modal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="upload-info">
                            <div class="info-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="info-content">
                                <h4>Resource Upload</h4>
                                <p>Resource uploads are managed through the admin dashboard to ensure quality and appropriate content.</p>
                                <p>Please contact an administrator to upload new resources to the library.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="resourcesManager.closeModal('upload-modal')">
                            Close
                        </button>
                        <button class="btn btn-primary" onclick="resourcesManager.contactAdmin()">
                            Contact Admin
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    contactAdmin() {
        this.showNotification('Admin contact feature coming soon', 'info');
        this.closeModal('upload-modal');
    }

    getDefaultCategories() {
        return [
            { id: 'health', name: 'Health & Wellness', color: '#ef4444' },
            { id: 'education', name: 'Education', color: '#3b82f6' },
            { id: 'advocacy', name: 'Advocacy', color: '#10b981' },
            { id: 'support', name: 'Support Groups', color: '#f59e0b' },
            { id: 'legal', name: 'Legal Resources', color: '#8b5cf6' }
        ];
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        if (window.afzMemberHub?.showToastNotification) {
            window.afzMemberHub.showToastNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    injectStyles() {
        if (document.getElementById('resources-manager-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'resources-manager-styles';
        styles.textContent = `
            .resources-manager { padding: 20px; max-width: 1200px; margin: 0 auto; }
            .resources-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .resources-info h1 { margin: 0; font-size: 28px; color: var(--text-primary); }
            .resources-info p { margin: 5px 0 0; color: var(--text-secondary); }
            .resources-actions .action-btn { padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer; }
            .resources-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: var(--surface-color); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 15px; }
            .stat-icon { width: 50px; height: 50px; background: var(--primary-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 20px; }
            .stat-info h3 { margin: 0; font-size: 24px; color: var(--text-primary); }
            .stat-info p { margin: 5px 0 0; color: var(--text-secondary); }
            .resources-controls { display: flex; gap: 20px; margin-bottom: 30px; align-items: center; }
            .search-section { flex: 1; }
            .search-box { position: relative; max-width: 400px; }
            .search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
            .search-box input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--surface-color); }
            .filter-section { display: flex; gap: 10px; }
            .filter-select { padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--surface-color); }
            .resources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
            .resource-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .resource-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
            .resource-thumbnail { position: relative; height: 200px; overflow: hidden; background: var(--surface-hover); }
            .resource-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
            .resource-type-badge { position: absolute; top: 10px; right: 10px; background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
            .resource-content { padding: 20px; }
            .resource-title { margin: 0 0 10px; font-size: 18px; font-weight: 600; color: var(--text-primary); }
            .resource-description { margin: 0 0 15px; color: var(--text-secondary); line-height: 1.5; }
            .resource-meta { display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--text-secondary); }
            .resource-meta > div { display: flex; align-items: center; gap: 6px; }
            .resource-stats { display: flex; gap: 15px; margin-top: 10px; }
            .resource-actions { display: flex; gap: 8px; padding: 0 20px 20px; }
            .resource-actions .btn { flex: 1; padding: 8px 12px; font-size: 14px; }
            .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
            .empty-icon { font-size: 64px; color: var(--text-secondary); margin-bottom: 20px; }
            .empty-state h3 { margin: 0 0 10px; color: var(--text-primary); }
            .empty-state p { margin: 0; color: var(--text-secondary); }
            .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .modal-container { background: var(--surface-color); border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
            .modal-container.large { max-width: 800px; }
            .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border-color); }
            .modal-header h3 { margin: 0; }
            .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-secondary); }
            .modal-body { padding: 20px; }
            .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid var(--border-color); }
            .resource-detail .resource-header { display: flex; gap: 20px; margin-bottom: 20px; }
            .resource-thumbnail-large { width: 150px; height: 150px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: var(--surface-hover); }
            .resource-thumbnail-large img { width: 100%; height: 100%; object-fit: cover; }
            .resource-metadata { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
            .meta-item { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); }
            .resource-actions-modal { display: flex; gap: 10px; margin: 20px 0; }
            .resource-content-preview { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color); }
            .content-text { color: var(--text-secondary); line-height: 1.6; }
            .upload-info { display: flex; gap: 15px; padding: 20px; background: var(--surface-hover); border-radius: 8px; }
            .info-icon { font-size: 24px; color: var(--primary-color); }
            .info-content h4 { margin: 0 0 10px; color: var(--text-primary); }
            .info-content p { margin: 0 0 10px; color: var(--text-secondary); line-height: 1.5; }
            @media (max-width: 768px) {
                .resources-controls { flex-direction: column; align-items: stretch; }
                .search-box { max-width: none; }
                .filter-section { justify-content: space-between; }
                .resource-detail .resource-header { flex-direction: column; }
                .resource-thumbnail-large { width: 100%; height: 200px; }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Export for use in member hub
window.ResourcesManager = ResourcesManager;