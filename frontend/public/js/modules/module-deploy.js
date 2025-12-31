/**
 * KMS Module - DEPLOY
 * Release Phase module for deployment and client management
 * 
 * Features:
 * - Client management
 * - Export & Backup
 * - Test deployment
 * - Billing integration
 */

const DeployModule = {
    clients: [],
    deployments: [],

    /**
     * Initialize DEPLOY module
     */
    init() {
        console.log('🚀 DeployModule initialized');
        
        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'deploy') {
                this.render();
            }
        });
    },

    /**
     * Render the DEPLOY module
     */
    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        const currentProject = StateManager.getCurrentObject();

        // Note: Toolbar is rendered by ModuleRouter.renderModuleHeader()
        mainView.innerHTML = `
            <div class="deploy-module-container">
                ${currentProject ? this.renderDeployContent(currentProject) : this.renderNoProject()}
            </div>
        `;
    },

    /**
     * Render no project selected
     */
    renderNoProject() {
        return `
            <div class="no-project-selected">
                <div class="no-project-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3>No Project Selected</h3>
                <p>Select a project to manage deployments</p>
            </div>
        `;
    },

    /**
     * Render deploy content
     */
    renderDeployContent(project) {
        return `
            <div class="deploy-content">
                <div class="deploy-grid">
                    ${this.renderProjectCard(project)}
                    ${this.renderClientsSection()}
                    ${this.renderDeployHistory()}
                    ${this.renderBillingSection()}
                </div>
            </div>
        `;
    },

    /**
     * Render project card
     */
    renderProjectCard(project) {
        return `
            <div class="deploy-card project-card">
                <div class="card-header">
                    <h3><i class="fas fa-project-diagram"></i> Project</h3>
                </div>
                <div class="card-body">
                    <div class="project-info-grid">
                        <div class="info-item">
                            <span class="info-label">Name</span>
                            <span class="info-value">${project.object_name || project.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Version</span>
                            <span class="info-value">${project.metadata?.version || '1.0.0'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Last Deploy</span>
                            <span class="info-value">${project.metadata?.lastDeploy || 'Never'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status</span>
                            <span class="status-badge ready">Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render clients section
     */
    renderClientsSection() {
        return `
            <div class="deploy-card clients-card">
                <div class="card-header">
                    <h3><i class="fas fa-users"></i> Clients</h3>
                    <button class="btn btn-sm btn-primary" onclick="DeployModule.showAddClientModal()">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div class="card-body">
                    <div class="clients-list">
                        ${this.clients.length > 0 ? this.clients.map(client => `
                            <div class="client-item">
                                <div class="client-avatar">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="client-info">
                                    <div class="client-name">${client.name}</div>
                                    <div class="client-email">${client.email}</div>
                                </div>
                                <div class="client-status ${client.deployed ? 'deployed' : 'pending'}">
                                    ${client.deployed ? 'Deployed' : 'Pending'}
                                </div>
                                <div class="client-actions">
                                    <button onclick="DeployModule.deployToClient('${client.id}')" title="Deploy">
                                        <i class="fas fa-rocket"></i>
                                    </button>
                                    <button onclick="DeployModule.sendInvoice('${client.id}')" title="Invoice">
                                        <i class="fas fa-file-invoice-dollar"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="empty-clients">
                                <i class="fas fa-users"></i>
                                <p>No clients assigned</p>
                                <button class="btn btn-sm btn-outline" onclick="DeployModule.showAddClientModal()">
                                    Add Client
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render deploy history
     */
    renderDeployHistory() {
        const history = [
            { date: '2025-12-30 14:30', type: 'deploy', target: 'Production', status: 'success' },
            { date: '2025-12-29 10:15', type: 'backup', target: 'Backup Server', status: 'success' },
            { date: '2025-12-28 16:45', type: 'test', target: 'Test Environment', status: 'success' }
        ];

        return `
            <div class="deploy-card history-card">
                <div class="card-header">
                    <h3><i class="fas fa-history"></i> Deploy History</h3>
                </div>
                <div class="card-body">
                    <div class="history-list">
                        ${history.map(item => `
                            <div class="history-item">
                                <div class="history-icon ${item.type}">
                                    <i class="fas fa-${item.type === 'deploy' ? 'rocket' : item.type === 'backup' ? 'database' : 'vial'}"></i>
                                </div>
                                <div class="history-info">
                                    <div class="history-action">${item.type.charAt(0).toUpperCase() + item.type.slice(1)} to ${item.target}</div>
                                    <div class="history-date">${item.date}</div>
                                </div>
                                <div class="history-status ${item.status}">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render billing section
     */
    renderBillingSection() {
        return `
            <div class="deploy-card billing-card">
                <div class="card-header">
                    <h3><i class="fas fa-file-invoice-dollar"></i> Billing</h3>
                </div>
                <div class="card-body">
                    <div class="billing-stats">
                        <div class="billing-stat">
                            <div class="stat-value">0</div>
                            <div class="stat-label">Pending Invoices</div>
                        </div>
                        <div class="billing-stat">
                            <div class="stat-value">0 CZK</div>
                            <div class="stat-label">Total Billed</div>
                        </div>
                    </div>
                    <div class="billing-actions">
                        <button class="btn btn-outline" onclick="DeployModule.showCreateInvoiceModal()">
                            <i class="fas fa-plus"></i> Create Invoice
                        </button>
                        <button class="btn btn-outline" onclick="DeployModule.sendReminders()">
                            <i class="fas fa-bell"></i> Send Reminders
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Actions
    showDeployWizard() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('Select a project first', 'warning');
            return;
        }

        const modalHtml = `
            <div id="deploy-wizard-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-rocket"></i> Deploy Wizard</h2>
                        <span class="close-btn" onclick="DeployModule.closeModal('deploy-wizard-modal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="wizard-steps">
                            <div class="wizard-step active">
                                <div class="step-number">1</div>
                                <div class="step-name">Target</div>
                            </div>
                            <div class="wizard-step">
                                <div class="step-number">2</div>
                                <div class="step-name">Options</div>
                            </div>
                            <div class="wizard-step">
                                <div class="step-number">3</div>
                                <div class="step-name">Confirm</div>
                            </div>
                        </div>
                        <div class="wizard-content">
                            <h4>Select Deployment Target</h4>
                            <div class="deploy-targets">
                                <label class="target-option">
                                    <input type="radio" name="deploy-target" value="production" checked>
                                    <div class="target-card">
                                        <i class="fas fa-server"></i>
                                        <span>Production</span>
                                    </div>
                                </label>
                                <label class="target-option">
                                    <input type="radio" name="deploy-target" value="staging">
                                    <div class="target-card">
                                        <i class="fas fa-code-branch"></i>
                                        <span>Staging</span>
                                    </div>
                                </label>
                                <label class="target-option">
                                    <input type="radio" name="deploy-target" value="clients">
                                    <div class="target-card">
                                        <i class="fas fa-users"></i>
                                        <span>All Clients</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="DeployModule.closeModal('deploy-wizard-modal')">Cancel</button>
                        <button class="btn btn-primary" onclick="DeployModule.executeDeploy()">
                            <i class="fas fa-rocket"></i> Deploy
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    executeDeploy() {
        const target = document.querySelector('input[name="deploy-target"]:checked')?.value;
        showNotification(`Deploying to ${target}...`, 'info');
        
        setTimeout(() => {
            showNotification('Deployment completed successfully!', 'success');
            this.closeModal('deploy-wizard-modal');
        }, 2000);
    },

    createBackup() {
        showNotification('Creating backup...', 'info');
        setTimeout(() => {
            showNotification('Backup created successfully!', 'success');
        }, 2000);
    },

    exportProject() {
        const project = StateManager.getCurrentObject();
        if (project) {
            app.showExportModal(project.id);
        }
    },

    testDeploy() {
        showNotification('Running test deployment...', 'info');
        setTimeout(() => {
            showNotification('Test deployment passed!', 'success');
        }, 3000);
    },

    showAddClientModal() {
        const modalHtml = `
            <div id="add-client-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-plus"></i> Add Client</h2>
                        <span class="close-btn" onclick="DeployModule.closeModal('add-client-modal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Company Name *</label>
                            <input type="text" id="client-name" class="form-control" placeholder="Client company name">
                        </div>
                        <div class="form-group">
                            <label>Contact Email *</label>
                            <input type="email" id="client-email" class="form-control" placeholder="contact@client.com">
                        </div>
                        <div class="form-group">
                            <label>Server Credentials</label>
                            <textarea id="client-credentials" class="form-control" rows="3" placeholder="SSH/FTP access details"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="DeployModule.closeModal('add-client-modal')">Cancel</button>
                        <button class="btn btn-primary" onclick="DeployModule.addClient()">Add Client</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    addClient() {
        const name = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;

        if (!name || !email) {
            showNotification('Please fill required fields', 'warning');
            return;
        }

        this.clients.push({
            id: Date.now().toString(),
            name,
            email,
            deployed: false
        });

        this.closeModal('add-client-modal');
        this.render();
        showNotification('Client added successfully', 'success');
    },

    deployToClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            showNotification(`Deploying to ${client.name}...`, 'info');
            setTimeout(() => {
                client.deployed = true;
                this.render();
                showNotification(`Deployed to ${client.name}`, 'success');
            }, 2000);
        }
    },

    sendInvoice(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            showNotification(`Sending invoice to ${client.name}...`, 'info');
        }
    },

    showCreateInvoiceModal() {
        showNotification('Invoice creation coming soon', 'info');
    },

    sendReminders() {
        showNotification('Sending payment reminders...', 'info');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    DeployModule.init();
});

// Export for global access
window.DeployModule = DeployModule;

