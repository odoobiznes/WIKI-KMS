/**
 * KMS Module - LOGINS
 * Credentials Management module
 *
 * Features:
 * - API keys management
 * - SSH keys management
 * - Database passwords
 * - OAuth tokens
 * - SSL certificates
 * - Service credentials
 * - Encrypted storage with Age
 * - Audit logging
 */

const LoginsModule = {
    projectsHidden: true,
    credentials: [],
    categories: [],
    currentFilter: 'all',
    currentCategory: 'all',

    init() {
        console.log('🔐 LoginsModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'logins') {
                this.loadData();
                this.render();
            }
        });
    },

    async loadData() {
        try {
            // Load categories
            const categoriesResponse = await API.get('/api/logins/categories');
            if (categoriesResponse && categoriesResponse.categories) {
                this.categories = categoriesResponse.categories;
            }

            // Load credentials
            const credentialsResponse = await API.get('/api/logins/credentials');
            if (credentialsResponse) {
                this.credentials = Array.isArray(credentialsResponse) ? credentialsResponse : [];
            }
        } catch (error) {
            console.error('Error loading logins data:', error);
            showNotification('Failed to load credentials', 'error');
            this.credentials = [];
            this.categories = [];
        }
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        mainView.innerHTML = `
            <div class="logins-module-container">
                ${this.renderProjectToggle()}
                ${this.renderDashboard()}
            </div>
        `;
    },

    renderProjectToggle() {
        return `
            <div class="logins-project-section ${this.projectsHidden ? 'collapsed' : ''}">
                <div class="project-toggle-header" onclick="LoginsModule.toggleProjects()">
                    <div class="project-toggle-info">
                        <i class="fas fa-${this.projectsHidden ? 'eye-slash' : 'eye'}"></i>
                        <span>${this.projectsHidden ? 'Show Projects' : 'Hide Projects'}</span>
                    </div>
                    <i class="fas fa-chevron-${this.projectsHidden ? 'down' : 'up'}"></i>
                </div>
            </div>
        `;
    },

    renderDashboard() {
        const stats = this.calculateStats();

        return `
            <div class="logins-dashboard">
                ${this.renderStats(stats)}
                ${this.renderFilters()}
                ${this.renderCredentialsList()}
            </div>
        `;
    },

    calculateStats() {
        return {
            total: this.credentials.length,
            apiKeys: this.credentials.filter(c => c.category === 'api_key').length,
            sshKeys: this.credentials.filter(c => c.category === 'ssh_key').length,
            databases: this.credentials.filter(c => c.category === 'database').length,
            expiring: this.credentials.filter(c => {
                if (!c.expires_at) return false;
                const expiryDate = new Date(c.expires_at);
                const daysUntilExpiry = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
                return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            }).length
        };
    },

    renderStats(stats) {
        return `
            <div class="logins-stats">
                <div class="logins-stat-card total">
                    <div class="stat-icon"><i class="fas fa-key"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Total Credentials</div>
                    </div>
                </div>
                <div class="logins-stat-card api">
                    <div class="stat-icon"><i class="fas fa-code"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.apiKeys}</div>
                        <div class="stat-label">API Keys</div>
                    </div>
                </div>
                <div class="logins-stat-card ssh">
                    <div class="stat-icon"><i class="fas fa-server"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.sshKeys}</div>
                        <div class="stat-label">SSH Keys</div>
                    </div>
                </div>
                <div class="logins-stat-card db">
                    <div class="stat-icon"><i class="fas fa-database"></i></div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.databases}</div>
                        <div class="stat-label">Databases</div>
                    </div>
                </div>
                ${stats.expiring > 0 ? `
                    <div class="logins-stat-card warning">
                        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.expiring}</div>
                            <div class="stat-label">Expiring Soon</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderFilters() {
        return `
            <div class="logins-filters">
                <div class="filters-left">
                    <input type="text" id="logins-search" placeholder="🔍 Search credentials..." class="search-input"
                        onkeyup="LoginsModule.handleSearch(this.value)">

                    <select id="category-filter" class="filter-select" onchange="LoginsModule.filterByCategory(this.value)">
                        <option value="all">All Categories</option>
                        ${this.categories.map(cat => `
                            <option value="${cat.value}" ${this.currentCategory === cat.value ? 'selected' : ''}>
                                ${cat.label}
                            </option>
                        `).join('')}
                    </select>

                    <select id="environment-filter" class="filter-select" onchange="LoginsModule.filterByEnvironment(this.value)">
                        <option value="all">All Environments</option>
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="development">Development</option>
                    </select>
                </div>
                <div class="filters-right">
                    <button class="btn btn-primary" onclick="LoginsModule.showCreateModal()">
                        <i class="fas fa-plus"></i> New Credential
                    </button>
                </div>
            </div>
        `;
    },

    renderCredentialsList() {
        const filteredCredentials = this.getFilteredCredentials();

        if (filteredCredentials.length === 0) {
            return `
                <div class="logins-empty-state">
                    <i class="fas fa-key"></i>
                    <h3>No Credentials Found</h3>
                    <p>Create your first credential to get started</p>
                    <button class="btn btn-primary" onclick="LoginsModule.showCreateModal()">
                        <i class="fas fa-plus"></i> Create Credential
                    </button>
                </div>
            `;
        }

        return `
            <div class="logins-content">
                <table class="logins-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Environment</th>
                            <th>Last Used</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredCredentials.map(cred => this.renderCredentialRow(cred)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCredentialRow(cred) {
        const category = this.categories.find(c => c.value === cred.category);
        const categoryIcon = category ? category.icon : 'fa-key';
        const lastUsed = cred.last_used_at
            ? this.formatRelativeTime(cred.last_used_at)
            : 'Never';

        const isExpiring = cred.expires_at && this.isDaysUntilExpiry(cred.expires_at) <= 30;
        const isExpired = cred.expires_at && new Date(cred.expires_at) < new Date();

        return `
            <tr class="${!cred.is_active ? 'inactive' : ''}">
                <td>
                    <div class="credential-name">
                        <i class="fas ${categoryIcon}"></i>
                        <strong>${this.escapeHtml(cred.key_name)}</strong>
                    </div>
                    ${cred.description ? `<div class="credential-desc">${this.escapeHtml(cred.description)}</div>` : ''}
                    ${cred.tags && cred.tags.length > 0 ? `
                        <div class="credential-tags">
                            ${cred.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <span class="category-badge category-${cred.category}">
                        ${category ? category.label : cred.category}
                    </span>
                </td>
                <td>
                    <span class="env-badge env-${cred.environment}">${cred.environment}</span>
                </td>
                <td>
                    ${lastUsed}
                    ${cred.decrypt_count > 0 ? `<br><small>(${cred.decrypt_count} times)</small>` : ''}
                </td>
                <td>
                    ${!cred.is_active ? '<span class="status-badge inactive">Inactive</span>' :
                      isExpired ? '<span class="status-badge expired">Expired</span>' :
                      isExpiring ? '<span class="status-badge warning">Expiring Soon</span>' :
                      '<span class="status-badge active">Active</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="LoginsModule.viewSecret(${cred.id})" title="View Secret" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="LoginsModule.copyToClipboard(${cred.id})" title="Copy to Clipboard" class="btn-icon">
                            <i class="fas fa-copy"></i>
                        </button>
                        ${cred.category === 'database' || cred.category === 'api_key' || cred.category === 'ssh_key' ? `
                            <button onclick="LoginsModule.testConnection(${cred.id})" title="Test Connection" class="btn-icon">
                                <i class="fas fa-plug"></i>
                            </button>
                        ` : ''}
                        <button onclick="LoginsModule.showEditModal(${cred.id})" title="Edit" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="LoginsModule.deleteCredential(${cred.id})" title="Delete" class="btn-icon danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    getFilteredCredentials() {
        let filtered = [...this.credentials];

        // Filter by category
        if (this.currentCategory && this.currentCategory !== 'all') {
            filtered = filtered.filter(c => c.category === this.currentCategory);
        }

        // Filter by search term
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.key_name.toLowerCase().includes(term) ||
                (c.description && c.description.toLowerCase().includes(term)) ||
                (c.tags && c.tags.some(tag => tag.toLowerCase().includes(term)))
            );
        }

        return filtered;
    },

    toggleProjects() {
        this.projectsHidden = !this.projectsHidden;
        this.render();
    },

    handleSearch(term) {
        this.searchTerm = term;
        this.render();
    },

    filterByCategory(category) {
        this.currentCategory = category;
        this.render();
    },

    filterByEnvironment(env) {
        this.currentEnvironment = env;
        // TODO: Implement environment filtering
        this.render();
    },

    showCreateModal() {
        const modalHtml = `
            <div id="credential-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-key"></i> Create New Credential</h2>
                        <span class="close-btn" onclick="LoginsModule.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" id="cred-name" class="form-control" placeholder="e.g., GitHub API Token">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Category *</label>
                                <select id="cred-category" class="form-control">
                                    <option value="">Select category...</option>
                                    ${this.categories.map(cat => `
                                        <option value="${cat.value}">
                                            ${cat.label}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Environment *</label>
                                <select id="cred-environment" class="form-control">
                                    <option value="production">Production</option>
                                    <option value="staging">Staging</option>
                                    <option value="development" selected>Development</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" id="cred-description" class="form-control" placeholder="Brief description">
                        </div>

                        <div class="form-group">
                            <label>Secret Value * <small>(will be encrypted)</small></label>
                            <textarea id="cred-value" class="form-control" rows="3" placeholder="Paste your secret here..."></textarea>
                            <button type="button" class="btn btn-sm btn-secondary mt-1" onclick="LoginsModule.toggleValueVisibility()">
                                <i class="fas fa-eye" id="toggle-icon"></i> <span id="toggle-text">Show</span>
                            </button>
                        </div>

                        <div class="form-group">
                            <label>Tags <small>(comma separated)</small></label>
                            <input type="text" id="cred-tags" class="form-control" placeholder="e.g., github, api, production">
                        </div>

                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="cred-notes" class="form-control" rows="2" placeholder="Additional notes..."></textarea>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="cred-auto-rotate">
                                Auto-rotate credential
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="LoginsModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="LoginsModule.createCredential()">
                            <i class="fas fa-save"></i> Create Credential
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Set value field to password type
        document.getElementById('cred-value').type = 'password';
    },

    toggleValueVisibility() {
        const valueField = document.getElementById('cred-value');
        const icon = document.getElementById('toggle-icon');
        const text = document.getElementById('toggle-text');

        if (valueField.type === 'password') {
            valueField.type = 'text';
            icon.className = 'fas fa-eye-slash';
            text.textContent = 'Hide';
        } else {
            valueField.type = 'password';
            icon.className = 'fas fa-eye';
            text.textContent = 'Show';
        }
    },

    async createCredential() {
        const name = document.getElementById('cred-name').value.trim();
        const category = document.getElementById('cred-category').value;
        const environment = document.getElementById('cred-environment').value;
        const description = document.getElementById('cred-description').value.trim();
        const plainValue = document.getElementById('cred-value').value;
        const tags = document.getElementById('cred-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const notes = document.getElementById('cred-notes').value.trim();
        const autoRotate = document.getElementById('cred-auto-rotate').checked;

        // Validation
        if (!name || !category || !plainValue) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }

        try {
            const response = await API.post('/api/logins/credentials', {
                key_name: name,
                category: category,
                environment: environment,
                description: description || null,
                plain_value: plainValue,
                tags: tags,
                notes: notes || null,
                auto_rotate: autoRotate
            });

            if (response) {
                this.closeModal();
                await this.loadData();
                this.render();
                showNotification('Credential created successfully', 'success');
            }
        } catch (error) {
            console.error('Error creating credential:', error);
            showNotification(error.message || 'Failed to create credential', 'error');
        }
    },

    async viewSecret(credentialId) {
        const credential = this.credentials.find(c => c.id === credentialId);
        if (!credential) return;

        try {
            const response = await API.post(`/api/logins/credentials/${credentialId}/decrypt`);

            if (response && response.plain_value) {
                const modalHtml = `
                    <div id="secret-modal" class="modal" style="display: flex;">
                        <div class="modal-content secret-modal" style="max-width: 600px;">
                            <div class="modal-header">
                                <h2><i class="fas fa-eye"></i> View Secret - ${this.escapeHtml(credential.key_name)}</h2>
                                <span class="close-btn" onclick="LoginsModule.closeSecretModal()">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="secret-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    This secret will auto-hide in 30 seconds
                                </div>

                                <div class="secret-value-container">
                                    <label>Decrypted Value:</label>
                                    <textarea id="secret-value" class="form-control secret-value" readonly rows="4">${this.escapeHtml(response.plain_value)}</textarea>
                                    <button class="btn btn-sm btn-secondary mt-1" onclick="LoginsModule.copySecretValue()">
                                        <i class="fas fa-copy"></i> Copy to Clipboard
                                    </button>
                                </div>

                                <div class="secret-info mt-3">
                                    <div class="info-row">
                                        <strong>Category:</strong> ${credential.category}
                                    </div>
                                    <div class="info-row">
                                        <strong>Environment:</strong> ${credential.environment}
                                    </div>
                                    <div class="info-row">
                                        <strong>Last Used:</strong> ${credential.last_used_at ? new Date(credential.last_used_at).toLocaleString() : 'Never'}
                                    </div>
                                    <div class="info-row">
                                        <strong>Decrypt Count:</strong> ${credential.decrypt_count || 0} times
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-secondary" onclick="LoginsModule.closeSecretModal()">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                // Auto-close after 30 seconds
                setTimeout(() => {
                    this.closeSecretModal();
                }, 30000);
            }
        } catch (error) {
            console.error('Error decrypting credential:', error);
            showNotification('Failed to decrypt credential', 'error');
        }
    },

    async copyToClipboard(credentialId) {
        try {
            const response = await API.post(`/api/logins/credentials/${credentialId}/decrypt`);

            if (response && response.plain_value) {
                await navigator.clipboard.writeText(response.plain_value);
                showNotification('Secret copied to clipboard! Will auto-clear in 60s', 'success');

                // Auto-clear clipboard after 60 seconds
                setTimeout(() => {
                    navigator.clipboard.writeText('');
                }, 60000);
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            showNotification('Failed to copy secret', 'error');
        }
    },

    async testConnection(credentialId) {
        const credential = this.credentials.find(c => c.id === credentialId);
        if (!credential) return;

        showNotification(`Testing ${credential.key_name}...`, 'info');

        try {
            const response = await API.post(`/api/logins/credentials/${credentialId}/test`);

            if (response) {
                if (response.success) {
                    showNotification(`✓ Connection successful: ${response.message}`, 'success');
                } else {
                    showNotification(`✗ Connection failed: ${response.message}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            showNotification('Connection test failed', 'error');
        }
    },

    async deleteCredential(credentialId) {
        const credential = this.credentials.find(c => c.id === credentialId);
        if (!credential) return;

        if (!confirm(`Are you sure you want to delete "${credential.key_name}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            await API.delete(`/api/logins/credentials/${credentialId}`);

            await this.loadData();
            this.render();
            showNotification('Credential deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting credential:', error);
            showNotification('Failed to delete credential', 'error');
        }
    },

    copySecretValue() {
        const secretValue = document.getElementById('secret-value');
        if (secretValue) {
            secretValue.select();
            document.execCommand('copy');
            showNotification('Secret copied to clipboard!', 'success');
        }
    },

    closeModal() {
        const modal = document.getElementById('credential-modal');
        if (modal) modal.remove();
    },

    closeSecretModal() {
        const modal = document.getElementById('secret-modal');
        if (modal) modal.remove();
    },

    // Utility functions
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    },

    isDaysUntilExpiry(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => LoginsModule.init());
window.LoginsModule = LoginsModule;
