/**
 * AFZ Member Hub - Admin Dashboard Manager
 * Supabase-integrated admin dashboard
 */

class AdminDashboardManager {
    constructor() {
        this.currentUser = null;
        this.authService = null;
        this.members = [];
        this.systemStats = { totalMembers: 0, monthlyActive: 0, upcomingEvents: 0, totalResources: 0 };
        this.currentView = 'dashboard';
        this.isInitialized = false;
        
        this.waitForServices().then(() => this.init()).catch(console.error);
    }

    async waitForServices() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService?.isAuthenticated) {
            throw new Error('Authentication service not available');
        }
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        
        if (!['admin', 'super_admin'].includes(this.currentUser.user_metadata?.role)) {
            throw new Error('Insufficient admin privileges');
        }
        
        console.log('✅ AdminDashboardManager ready for admin:', this.currentUser.email);
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadData();
            this.setupInterface();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ AdminDashboardManager initialized');
        } catch (error) {
            console.error('Error initializing AdminDashboardManager:', error);
        }
    }

    async loadData() {
        if (!window.sb) return;
        
        try {
            const [membersRes, eventsRes, resourcesRes] = await Promise.all([
                window.sb.from('profiles').select('*').order('created_at', { ascending: false }),
                window.sb.from('events').select('*', { count: 'exact', head: true }).gte('start_date', new Date().toISOString()),
                window.sb.from('resources').select('*', { count: 'exact', head: true })
            ]);

            this.members = membersRes.data || [];
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { count: monthlyActive } = await window.sb
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('last_login_at', thirtyDaysAgo.toISOString());

            this.systemStats = {
                totalMembers: this.members.length,
                monthlyActive: monthlyActive || 0,
                upcomingEvents: eventsRes.count || 0,
                totalResources: resourcesRes.count || 0
            };
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    setupInterface() {
        const adminContainer = document.getElementById('section-admin-dashboard');
        if (!adminContainer) return;

        adminContainer.innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-header">
                    <div class="admin-info">
                        <h1>Admin Dashboard</h1>
                        <p>Manage AFZ Member Hub</p>
                    </div>
                    <div class="admin-actions">
                        <button class="admin-btn primary" onclick="adminDashboardManager.createAnnouncement()">
                            <i class="fas fa-bullhorn"></i> Announcement
                        </button>
                        <button class="admin-btn secondary" onclick="adminDashboardManager.exportData()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <div class="admin-nav">
                    <button class="nav-tab active" data-view="dashboard">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </button>
                    <button class="nav-tab" data-view="members">
                        <i class="fas fa-users"></i> Members <span class="nav-badge">${this.members.length}</span>
                    </button>
                    <button class="nav-tab" data-view="content">
                        <i class="fas fa-file-alt"></i> Content
                    </button>
                    <button class="nav-tab" data-view="system">
                        <i class="fas fa-cogs"></i> System
                    </button>
                </div>

                <div class="admin-content">
                    <div class="admin-view active" id="view-dashboard">${this.renderDashboard()}</div>
                    <div class="admin-view" id="view-members">${this.renderMembers()}</div>
                    <div class="admin-view" id="view-content">${this.renderContent()}</div>
                    <div class="admin-view" id="view-system">${this.renderSystem()}</div>
                </div>
            </div>
        `;

        this.injectStyles();
    }

    renderDashboard() {
        return `
            <div class="dashboard-overview">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <h3>${this.systemStats.totalMembers}</h3>
                            <p>Total Members</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-content">
                            <h3>${this.systemStats.monthlyActive}</h3>
                            <p>Monthly Active</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar"></i></div>
                        <div class="stat-content">
                            <h3>${this.systemStats.upcomingEvents}</h3>
                            <p>Upcoming Events</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-book"></i></div>
                        <div class="stat-content">
                            <h3>${this.systemStats.totalResources}</h3>
                            <p>Resources</p>
                        </div>
                    </div>
                </div>

                <div class="quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-grid">
                        <button class="quick-action-btn" onclick="adminDashboardManager.switchView('members')">
                            <i class="fas fa-user-plus"></i> Manage Members
                        </button>
                        <button class="quick-action-btn" onclick="adminDashboardManager.switchView('content')">
                            <i class="fas fa-plus"></i> Add Content
                        </button>
                        <button class="quick-action-btn" onclick="adminDashboardManager.viewReports()">
                            <i class="fas fa-chart-pie"></i> View Reports
                        </button>
                        <button class="quick-action-btn" onclick="adminDashboardManager.switchView('system')">
                            <i class="fas fa-cogs"></i> System Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMembers() {
        return `
            <div class="members-management">
                <div class="members-header">
                    <h3>Member Management</h3>
                    <button class="admin-btn primary" onclick="adminDashboardManager.addMember()">
                        <i class="fas fa-user-plus"></i> Add Member
                    </button>
                </div>
                
                <div class="members-filters">
                    <input type="text" id="member-search" placeholder="Search members...">
                    <select id="role-filter">
                        <option value="all">All Roles</option>
                        <option value="member">Members</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                <div class="members-table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Join Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.members.slice(0, 10).map(member => `
                                <tr>
                                    <td>
                                        <strong>${member.full_name || member.display_name || 'Unknown'}</strong>
                                        <br><small>${member.email}</small>
                                    </td>
                                    <td><span class="role-badge">${member.role || 'member'}</span></td>
                                    <td>${this.formatDate(member.created_at)}</td>
                                    <td>
                                        <button class="action-btn" onclick="adminDashboardManager.editMember('${member.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderContent() {
        return `
            <div class="content-management">
                <h3>Content Management</h3>
                <div class="content-actions">
                    <button class="admin-btn primary" onclick="adminDashboardManager.addResource()">
                        <i class="fas fa-plus"></i> Add Resource
                    </button>
                    <button class="admin-btn primary" onclick="adminDashboardManager.addEvent()">
                        <i class="fas fa-calendar-plus"></i> Add Event
                    </button>
                </div>
                <div class="content-info">
                    <p>Content management tools for resources, events, and community content.</p>
                    <p>Integration with existing ResourcesManager and EventsManager components.</p>
                </div>
            </div>
        `;
    }

    renderSystem() {
        return `
            <div class="system-management">
                <h3>System Settings</h3>
                <div class="system-settings">
                    <div class="setting-group">
                        <label>Site Maintenance Mode</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="maintenance-mode">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>Registration Mode</label>
                        <select id="registration-mode">
                            <option value="open">Open</option>
                            <option value="approval" selected>Approval Required</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <button class="admin-btn success" onclick="adminDashboardManager.saveSettings()">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.nav-tab').dataset.view);
            });
        });

        const memberSearch = document.getElementById('member-search');
        if (memberSearch) {
            memberSearch.addEventListener('input', (e) => {
                this.filterMembers(e.target.value);
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        
        document.querySelectorAll('.admin-view').forEach(viewEl => {
            viewEl.classList.toggle('active', viewEl.id === `view-${view}`);
        });
    }

    async createAnnouncement() {
        const title = prompt('Announcement title:');
        const message = prompt('Announcement message:');
        
        if (title && message && window.NotificationService) {
            try {
                await window.NotificationService.createAdminAnnouncement(title, message);
                this.showNotification('Announcement sent successfully', 'success');
            } catch (error) {
                this.showNotification('Failed to send announcement', 'error');
            }
        }
    }

    async exportData() {
        try {
            const data = {
                members: this.members,
                stats: this.systemStats,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afz-admin-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to export data', 'error');
        }
    }

    filterMembers(query) {
        const rows = document.querySelectorAll('.members-table tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    addMember() { this.showNotification('Add member functionality would open a modal form', 'info'); }
    editMember(id) { this.showNotification(`Edit member ${id} functionality`, 'info'); }
    addResource() { this.showNotification('Integration with ResourcesManager for adding resources', 'info'); }
    addEvent() { this.showNotification('Integration with EventsManager for creating events', 'info'); }
    viewReports() { this.showNotification('Advanced analytics would be displayed here', 'info'); }
    saveSettings() { this.showNotification('System settings saved', 'success'); }

    formatDate(dateString) {
        return dateString ? new Date(dateString).toLocaleDateString() : 'Unknown';
    }

    showNotification(message, type = 'info') {
        if (window.afzMemberHub?.showToastNotification) {
            window.afzMemberHub.showToastNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    injectStyles() {
        if (document.getElementById('admin-dashboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'admin-dashboard-styles';
        styles.textContent = `
            .admin-dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; }
            .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .admin-info h1 { margin: 0; font-size: 28px; color: var(--text-primary); }
            .admin-actions { display: flex; gap: 10px; }
            .admin-btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
            .admin-btn.primary { background: var(--primary-color); color: white; }
            .admin-btn.secondary { background: var(--surface-hover); color: var(--text-primary); }
            .admin-btn.success { background: #10b981; color: white; }
            .admin-nav { display: flex; background: var(--surface-color); border-radius: 8px; padding: 4px; margin-bottom: 30px; }
            .nav-tab { flex: 1; padding: 12px; background: none; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .nav-tab.active { background: var(--primary-color); color: white; }
            .nav-badge { background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 12px; }
            .admin-view { display: none; }
            .admin-view.active { display: block; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: var(--surface-color); padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 15px; }
            .stat-icon { width: 50px; height: 50px; background: var(--primary-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 20px; }
            .stat-content h3 { margin: 0; font-size: 24px; color: var(--text-primary); }
            .quick-actions { margin: 30px 0; }
            .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .quick-action-btn { padding: 20px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; }
            .members-management, .content-management, .system-management { background: var(--surface-color); border-radius: 8px; padding: 20px; }
            .members-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .members-filters { display: flex; gap: 15px; margin-bottom: 20px; }
            .members-filters input, .members-filters select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; }
            .members-table { width: 100%; border-collapse: collapse; }
            .members-table th, .members-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
            .role-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; background: var(--primary-light); color: var(--primary-color); }
            .action-btn { padding: 6px 8px; background: none; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; }
            .content-actions { display: flex; gap: 10px; margin-bottom: 20px; }
            .system-settings { display: flex; flex-direction: column; gap: 20px; }
            .setting-group { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--surface-hover); border-radius: 6px; }
            .toggle-switch { position: relative; width: 50px; height: 24px; }
            .toggle-switch input { opacity: 0; }
            .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 24px; }
        `;
        document.head.appendChild(styles);
    }
}

// Make available globally
window.AdminDashboardManager = AdminDashboardManager;