/**
 * KMS Module - RESOURCES
 * System Resource Management module
 *
 * Features:
 * - Network ports tracking
 * - IP addresses allocation
 * - Disk mounts management
 * - tmpfs RAM mounts tracking
 * - Databases and users
 * - Systemd services
 * - Domains and subdomains
 * - SSL certificates
 * - Docker resources
 * - Conflict detection
 * - Availability checking
 * - Auto-discovery of available resources
 */

const ResourcesModule = {
    projectsHidden: true,
    resources: [],
    resourceTypes: [],
    conflicts: [],
    summary: [],
    currentFilter: 'all',
    currentType: 'all',
    currentStatus: 'active',
    currentEnvironment: 'all',

    init() {
        console.log('🔧 ResourcesModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'resources') {
                this.loadData();
                this.render();
            }
        });
    },

    async loadData() {
        try {
            // Load all resources
            const resourcesResponse = await API.get('/api/resources');
            if (resourcesResponse) {
                this.resources = Array.isArray(resourcesResponse) ? resourcesResponse : [];
            }

            // Load summary
            const summaryResponse = await API.get('/api/resources/summary');
            if (summaryResponse) {
                this.summary = Array.isArray(summaryResponse) ? summaryResponse : [];
            }

            // Load conflicts
            const conflictsResponse = await API.get('/api/resources/conflicts');
            if (conflictsResponse) {
                this.conflicts = Array.isArray(conflictsResponse) ? conflictsResponse : [];
            }

            // Extract unique resource types
            this.resourceTypes = [...new Set(this.resources.map(r => r.resource_type))].sort();

        } catch (error) {
            console.error('Error loading resources data:', error);
            showNotification('Failed to load resources', 'error');
            this.resources = [];
            this.conflicts = [];
            this.summary = [];
        }
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        mainView.innerHTML = `
            <div class="resources-module-container">
                ${this.renderProjectToggle()}
                ${this.renderDashboard()}
            </div>
        `;

        this.attachEventListeners();
    },

    renderProjectToggle() {
        return `
            <div class="resources-project-section ${this.projectsHidden ? 'collapsed' : ''}">
                <div class="project-toggle-header" onclick="ResourcesModule.toggleProjects()">
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
            <div class="resources-dashboard">
                <div class="resources-header">
                    <h2><i class="fas fa-server"></i> System Resources</h2>
                    <div class="resources-actions">
                        <button class="btn btn-primary" onclick="ResourcesModule.showAllocateModal()">
                            <i class="fas fa-plus"></i> Allocate Resource
                        </button>
                        <button class="btn btn-secondary" onclick="ResourcesModule.showFindPortsModal()">
                            <i class="fas fa-search"></i> Find Available Ports
                        </button>
                        <button class="btn btn-secondary" onclick="ResourcesModule.refresh()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>

                ${this.renderStats(stats)}

                ${this.conflicts.length > 0 ? this.renderConflicts() : ''}

                ${this.renderFilters()}
                ${this.renderResourcesList()}
            </div>
        `;
    },

    calculateStats() {
        const active = this.resources.filter(r => r.status === 'active');
        const reserved = this.resources.filter(r => r.status === 'reserved');
        const released = this.resources.filter(r => r.status === 'released');

        return {
            total: this.resources.length,
            active: active.length,
            reserved: reserved.length,
            released: released.length,
            conflicts: this.conflicts.length,
            byType: this.summary.reduce((acc, item) => {
                acc[item.resource_type] = item.count;
                return acc;
            }, {})
        };
    },

    renderStats(stats) {
        return `
            <div class="resources-stats">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <h3>${stats.active}</h3>
                        <p>Active Resources</p>
                    </div>
                </div>
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-lock"></i></div>
                    <div class="stat-content">
                        <h3>${stats.reserved}</h3>
                        <p>Reserved</p>
                    </div>
                </div>
                <div class="stat-card stat-secondary">
                    <div class="stat-icon"><i class="fas fa-box"></i></div>
                    <div class="stat-content">
                        <h3>${stats.total}</h3>
                        <p>Total Resources</p>
                    </div>
                </div>
                ${stats.conflicts > 0 ? `
                    <div class="stat-card stat-danger">
                        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="stat-content">
                            <h3>${stats.conflicts}</h3>
                            <p>Conflicts</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderConflicts() {
        return `
            <div class="resources-conflicts">
                <div class="conflicts-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Resource Conflicts</h3>
                </div>
                <div class="conflicts-list">
                    ${this.conflicts.map(conflict => `
                        <div class="conflict-item severity-${conflict.severity}">
                            <div class="conflict-icon">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <div class="conflict-details">
                                <strong>${conflict.resource_type}: ${conflict.resource_value}</strong>
                                <p>${conflict.conflict_reason}</p>
                                <small>Detected: ${this.formatDate(conflict.detected_at)}</small>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="ResourcesModule.resolveConflict(${conflict.id})">
                                Resolve
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderFilters() {
        return `
            <div class="resources-filters">
                <div class="filter-group">
                    <label>Type:</label>
                    <select id="filter-type" onchange="ResourcesModule.applyFilters()">
                        <option value="all">All Types</option>
                        ${this.resourceTypes.map(type => `
                            <option value="${type}" ${this.currentType === type ? 'selected' : ''}>
                                ${this.formatResourceType(type)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="filter-status" onchange="ResourcesModule.applyFilters()">
                        <option value="all">All Statuses</option>
                        <option value="active" ${this.currentStatus === 'active' ? 'selected' : ''}>Active</option>
                        <option value="reserved" ${this.currentStatus === 'reserved' ? 'selected' : ''}>Reserved</option>
                        <option value="released" ${this.currentStatus === 'released' ? 'selected' : ''}>Released</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Environment:</label>
                    <select id="filter-environment" onchange="ResourcesModule.applyFilters()">
                        <option value="all">All Environments</option>
                        <option value="production" ${this.currentEnvironment === 'production' ? 'selected' : ''}>Production</option>
                        <option value="staging" ${this.currentEnvironment === 'staging' ? 'selected' : ''}>Staging</option>
                        <option value="development" ${this.currentEnvironment === 'development' ? 'selected' : ''}>Development</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Search:</label>
                    <input type="text" id="filter-search" placeholder="Search resources..." oninput="ResourcesModule.applyFilters()">
                </div>
            </div>
        `;
    },

    renderResourcesList() {
        const filtered = this.getFilteredResources();

        if (filtered.length === 0) {
            return `
                <div class="resources-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No resources found matching your filters</p>
                </div>
            `;
        }

        return `
            <div class="resources-list">
                <div class="resources-grid">
                    ${filtered.map(resource => this.renderResourceCard(resource)).join('')}
                </div>
            </div>
        `;
    },

    renderResourceCard(resource) {
        const typeIcon = this.getResourceTypeIcon(resource.resource_type);
        const statusClass = resource.status === 'active' ? 'status-active' :
                           resource.status === 'reserved' ? 'status-reserved' : 'status-released';

        return `
            <div class="resource-card ${statusClass}" data-resource-id="${resource.id}">
                <div class="resource-card-header">
                    <div class="resource-type">
                        <i class="fas fa-${typeIcon}"></i>
                        <span>${this.formatResourceType(resource.resource_type)}</span>
                    </div>
                    <div class="resource-status ${statusClass}">
                        ${resource.status}
                    </div>
                </div>
                <div class="resource-card-body">
                    <h4>${resource.resource_name}</h4>
                    <div class="resource-value">
                        <code>${resource.resource_value}</code>
                        <button class="btn-icon-sm" onclick="ResourcesModule.copyToClipboard('${resource.resource_value.replace(/'/g, "\\'")}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    ${resource.owner_service ? `
                        <div class="resource-owner">
                            <i class="fas fa-user"></i> ${resource.owner_service}
                        </div>
                    ` : ''}
                    ${resource.description ? `
                        <div class="resource-description">
                            ${resource.description}
                        </div>
                    ` : ''}
                    <div class="resource-meta">
                        <span><i class="fas fa-server"></i> ${resource.server_hostname || 'Unknown'}</span>
                        <span><i class="fas fa-tag"></i> ${resource.environment}</span>
                    </div>
                    ${resource.is_locked ? `
                        <div class="resource-locked">
                            <i class="fas fa-lock"></i> Locked
                        </div>
                    ` : ''}
                </div>
                <div class="resource-card-footer">
                    <small>Allocated: ${this.formatDate(resource.allocated_at)}</small>
                    <div class="resource-actions">
                        <button class="btn-icon-sm" onclick="ResourcesModule.viewDetails(${resource.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon-sm" onclick="ResourcesModule.viewHistory(${resource.id})" title="View History">
                            <i class="fas fa-history"></i>
                        </button>
                        ${!resource.is_locked ? `
                            <button class="btn-icon-sm" onclick="ResourcesModule.editResource(${resource.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon-sm btn-danger" onclick="ResourcesModule.releaseResource(${resource.id})" title="Release">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    getFilteredResources() {
        let filtered = [...this.resources];

        // Filter by type
        if (this.currentType !== 'all') {
            filtered = filtered.filter(r => r.resource_type === this.currentType);
        }

        // Filter by status
        if (this.currentStatus !== 'all') {
            filtered = filtered.filter(r => r.status === this.currentStatus);
        }

        // Filter by environment
        if (this.currentEnvironment !== 'all') {
            filtered = filtered.filter(r => r.environment === this.currentEnvironment);
        }

        // Search filter
        const searchInput = document.getElementById('filter-search');
        if (searchInput && searchInput.value) {
            const search = searchInput.value.toLowerCase();
            filtered = filtered.filter(r =>
                r.resource_name.toLowerCase().includes(search) ||
                r.resource_value.toLowerCase().includes(search) ||
                (r.owner_service && r.owner_service.toLowerCase().includes(search)) ||
                (r.description && r.description.toLowerCase().includes(search))
            );
        }

        return filtered;
    },

    applyFilters() {
        this.currentType = document.getElementById('filter-type')?.value || 'all';
        this.currentStatus = document.getElementById('filter-status')?.value || 'all';
        this.currentEnvironment = document.getElementById('filter-environment')?.value || 'all';
        this.render();
    },

    async showAllocateModal() {
        const modalHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-plus"></i> Allocate New Resource</h3>
                <button onclick="closeModal()" class="btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="allocate-resource-form">
                    <div class="form-group">
                        <label>Resource Type *</label>
                        <select id="resource-type" required onchange="ResourcesModule.updateResourceTypeFields()">
                            <option value="">Select type...</option>
                            <option value="port">Network Port</option>
                            <option value="ip_address">IP Address</option>
                            <option value="directory">Directory</option>
                            <option value="tmpfs">tmpfs Mount</option>
                            <option value="database">Database</option>
                            <option value="db_user">Database User</option>
                            <option value="systemd">Systemd Service</option>
                            <option value="domain">Domain</option>
                            <option value="ssl_cert">SSL Certificate</option>
                            <option value="nginx_conf">Nginx Config</option>
                            <option value="socket">Socket</option>
                            <option value="redis_db">Redis DB</option>
                            <option value="cron_job">Cron Job</option>
                            <option value="user">System User</option>
                            <option value="env_var">Environment Variable</option>
                            <option value="backup_path">Backup Path</option>
                            <option value="log_path">Log Path</option>
                            <option value="secret">Secret</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Resource Name *</label>
                        <input type="text" id="resource-name" required placeholder="e.g., KMS API Port">
                    </div>
                    <div class="form-group">
                        <label>Resource Value *</label>
                        <input type="text" id="resource-value" required placeholder="e.g., 8000">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="ResourcesModule.checkAvailability()">
                            <i class="fas fa-check"></i> Check Availability
                        </button>
                    </div>
                    <div id="availability-result"></div>
                    <div class="form-group">
                        <label>Owner Service</label>
                        <input type="text" id="owner-service" placeholder="e.g., kms-api">
                    </div>
                    <div class="form-group">
                        <label>Assigned To</label>
                        <input type="text" id="assigned-to" placeholder="e.g., DevOps Team">
                    </div>
                    <div class="form-group">
                        <label>Environment</label>
                        <select id="environment">
                            <option value="production">Production</option>
                            <option value="staging">Staging</option>
                            <option value="development">Development</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Server Hostname</label>
                        <input type="text" id="server-hostname" placeholder="e.g., devsoft.it-enterprise.solutions">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="description" rows="3" placeholder="Describe this resource..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="notes" rows="2" placeholder="Additional notes..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="ResourcesModule.submitAllocate()" class="btn btn-primary">
                    <i class="fas fa-save"></i> Allocate Resource
                </button>
            </div>
        `;

        document.getElementById('modal-body').innerHTML = modalHtml;
        document.getElementById('modal').style.display = 'flex';
    },

    async checkAvailability() {
        const type = document.getElementById('resource-type').value;
        const value = document.getElementById('resource-value').value;
        const environment = document.getElementById('environment').value;

        if (!type || !value) {
            showNotification('Please select resource type and enter value', 'warning');
            return;
        }

        try {
            const result = await API.post('/api/resources/check-availability', {
                resource_type: type,
                resource_value: value,
                environment: environment
            });

            const resultDiv = document.getElementById('availability-result');
            if (result.available) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> Resource is available!
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Resource is already allocated!
                    </div>
                `;
            }
        } catch (error) {
            showNotification('Failed to check availability', 'error');
        }
    },

    async submitAllocate() {
        const data = {
            resource_type: document.getElementById('resource-type').value,
            resource_name: document.getElementById('resource-name').value,
            resource_value: document.getElementById('resource-value').value,
            owner_service: document.getElementById('owner-service').value || null,
            assigned_to: document.getElementById('assigned-to').value || null,
            environment: document.getElementById('environment').value,
            server_hostname: document.getElementById('server-hostname').value || null,
            description: document.getElementById('description').value || null,
            notes: document.getElementById('notes').value || null,
            metadata: {}
        };

        if (!data.resource_type || !data.resource_name || !data.resource_value) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        try {
            await API.post('/api/resources', data);
            showNotification('Resource allocated successfully', 'success');
            closeModal();
            this.loadData();
            this.render();
        } catch (error) {
            if (error.message && error.message.includes('already allocated')) {
                showNotification('Resource already allocated to another service', 'error');
            } else {
                showNotification('Failed to allocate resource', 'error');
            }
        }
    },

    async showFindPortsModal() {
        const modalHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-search"></i> Find Available Ports</h3>
                <button onclick="closeModal()" class="btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="find-ports-form">
                    <div class="form-group">
                        <label>Start Port</label>
                        <input type="number" id="start-port" value="8000" min="1024" max="65535">
                    </div>
                    <div class="form-group">
                        <label>End Port</label>
                        <input type="number" id="end-port" value="9000" min="1024" max="65535">
                    </div>
                    <div class="form-group">
                        <label>Number of Ports</label>
                        <input type="number" id="port-count" value="5" min="1" max="100">
                    </div>
                    <div class="form-group">
                        <label>Environment</label>
                        <select id="port-environment">
                            <option value="production">Production</option>
                            <option value="staging">Staging</option>
                            <option value="development">Development</option>
                        </select>
                    </div>
                </form>
                <div id="available-ports-result"></div>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-secondary">Close</button>
                <button onclick="ResourcesModule.findAvailablePorts()" class="btn btn-primary">
                    <i class="fas fa-search"></i> Find Ports
                </button>
            </div>
        `;

        document.getElementById('modal-body').innerHTML = modalHtml;
        document.getElementById('modal').style.display = 'flex';
    },

    async findAvailablePorts() {
        const startPort = parseInt(document.getElementById('start-port').value);
        const endPort = parseInt(document.getElementById('end-port').value);
        const count = parseInt(document.getElementById('port-count').value);
        const environment = document.getElementById('port-environment').value;

        try {
            const result = await API.post('/api/resources/find-available-ports', {
                start_port: startPort,
                end_port: endPort,
                count: count,
                environment: environment
            });

            const resultDiv = document.getElementById('available-ports-result');
            if (result.available_ports && result.available_ports.length > 0) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Available Ports:</h4>
                        <div class="available-ports-list">
                            ${result.available_ports.map(port => `
                                <span class="port-badge">${port}</span>
                            `).join('')}
                        </div>
                        <p><small>Found ${result.count} of ${result.requested_count} requested ports</small></p>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> No available ports found in range ${startPort}-${endPort}
                    </div>
                `;
            }
        } catch (error) {
            showNotification('Failed to find available ports', 'error');
        }
    },

    async viewDetails(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        const modalHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-info-circle"></i> Resource Details</h3>
                <button onclick="closeModal()" class="btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="resource-details">
                    <div class="detail-row">
                        <strong>Type:</strong>
                        <span>${this.formatResourceType(resource.resource_type)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Name:</strong>
                        <span>${resource.resource_name}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Value:</strong>
                        <code>${resource.resource_value}</code>
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong>
                        <span class="badge badge-${resource.status}">${resource.status}</span>
                    </div>
                    ${resource.owner_service ? `
                        <div class="detail-row">
                            <strong>Owner Service:</strong>
                            <span>${resource.owner_service}</span>
                        </div>
                    ` : ''}
                    ${resource.assigned_to ? `
                        <div class="detail-row">
                            <strong>Assigned To:</strong>
                            <span>${resource.assigned_to}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <strong>Environment:</strong>
                        <span>${resource.environment}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Server:</strong>
                        <span>${resource.server_hostname || 'Unknown'}</span>
                    </div>
                    ${resource.description ? `
                        <div class="detail-row">
                            <strong>Description:</strong>
                            <span>${resource.description}</span>
                        </div>
                    ` : ''}
                    ${resource.notes ? `
                        <div class="detail-row">
                            <strong>Notes:</strong>
                            <span>${resource.notes}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <strong>Locked:</strong>
                        <span>${resource.is_locked ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Allocated:</strong>
                        <span>${this.formatDate(resource.allocated_at)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Created:</strong>
                        <span>${this.formatDate(resource.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Updated:</strong>
                        <span>${this.formatDate(resource.updated_at)}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-secondary">Close</button>
            </div>
        `;

        document.getElementById('modal-body').innerHTML = modalHtml;
        document.getElementById('modal').style.display = 'flex';
    },

    async viewHistory(resourceId) {
        try {
            const history = await API.get(`/api/resources/${resourceId}/history`);

            const modalHtml = `
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Resource History</h3>
                    <button onclick="closeModal()" class="btn-icon"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="resource-history">
                        ${history.length === 0 ? `
                            <p>No history available</p>
                        ` : `
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Action</th>
                                        <th>Status Change</th>
                                        <th>Changed By</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${history.map(h => `
                                        <tr>
                                            <td>${this.formatDate(h.created_at)}</td>
                                            <td><span class="badge badge-info">${h.action}</span></td>
                                            <td>${h.old_status || '-'} → ${h.new_status || '-'}</td>
                                            <td>${h.changed_by_username || 'System'}</td>
                                            <td>${h.ip_address || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal()" class="btn btn-secondary">Close</button>
                </div>
            `;

            document.getElementById('modal-body').innerHTML = modalHtml;
            document.getElementById('modal').style.display = 'flex';
        } catch (error) {
            showNotification('Failed to load history', 'error');
        }
    },

    async editResource(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        const modalHtml = `
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Resource</h3>
                <button onclick="closeModal()" class="btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="edit-resource-form">
                    <input type="hidden" id="edit-resource-id" value="${resource.id}">
                    <div class="form-group">
                        <label>Resource Name</label>
                        <input type="text" id="edit-resource-name" value="${resource.resource_name}">
                    </div>
                    <div class="form-group">
                        <label>Assigned To</label>
                        <input type="text" id="edit-assigned-to" value="${resource.assigned_to || ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="edit-description" rows="3">${resource.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="edit-notes" rows="2">${resource.notes || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="ResourcesModule.submitEdit()" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        `;

        document.getElementById('modal-body').innerHTML = modalHtml;
        document.getElementById('modal').style.display = 'flex';
    },

    async submitEdit() {
        const resourceId = document.getElementById('edit-resource-id').value;
        const data = {
            resource_name: document.getElementById('edit-resource-name').value,
            assigned_to: document.getElementById('edit-assigned-to').value || null,
            description: document.getElementById('edit-description').value || null,
            notes: document.getElementById('edit-notes').value || null
        };

        try {
            await API.put(`/api/resources/${resourceId}`, data);
            showNotification('Resource updated successfully', 'success');
            closeModal();
            this.loadData();
            this.render();
        } catch (error) {
            showNotification('Failed to update resource', 'error');
        }
    },

    async releaseResource(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;

        if (!confirm(`Are you sure you want to release resource "${resource.resource_name}" (${resource.resource_value})?`)) {
            return;
        }

        try {
            await API.delete(`/api/resources/${resourceId}`);
            showNotification('Resource released successfully', 'success');
            this.loadData();
            this.render();
        } catch (error) {
            showNotification('Failed to release resource', 'error');
        }
    },

    async refresh() {
        await this.loadData();
        this.render();
        showNotification('Resources refreshed', 'success');
    },

    toggleProjects() {
        this.projectsHidden = !this.projectsHidden;
        this.render();
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy', 'error');
        });
    },

    getResourceTypeIcon(type) {
        const icons = {
            'port': 'network-wired',
            'ip_address': 'globe',
            'directory': 'folder',
            'tmpfs': 'memory',
            'database': 'database',
            'db_user': 'user-shield',
            'systemd': 'cog',
            'domain': 'globe',
            'ssl_cert': 'certificate',
            'nginx_conf': 'file-code',
            'socket': 'plug',
            'redis_db': 'database',
            'cron_job': 'clock',
            'user': 'user',
            'env_var': 'code',
            'backup_path': 'hdd',
            'log_path': 'file-alt',
            'secret': 'key'
        };
        return icons[type] || 'cube';
    },

    formatResourceType(type) {
        const names = {
            'port': 'Network Port',
            'ip_address': 'IP Address',
            'directory': 'Directory',
            'tmpfs': 'tmpfs Mount',
            'database': 'Database',
            'db_user': 'Database User',
            'systemd': 'Systemd Service',
            'domain': 'Domain',
            'ssl_cert': 'SSL Certificate',
            'nginx_conf': 'Nginx Config',
            'socket': 'Socket',
            'redis_db': 'Redis DB',
            'cron_job': 'Cron Job',
            'user': 'System User',
            'env_var': 'Environment Variable',
            'backup_path': 'Backup Path',
            'log_path': 'Log Path',
            'secret': 'Secret'
        };
        return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ');
    },

    updateResourceTypeFields() {
        // Can add type-specific field logic here if needed
    },

    attachEventListeners() {
        // Additional event listeners if needed
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ResourcesModule.init());
} else {
    ResourcesModule.init();
}
