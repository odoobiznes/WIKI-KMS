/**
 * KMS Module - CLIENTS
 * Customer Management module
 *
 * Features:
 * - Client list with filtering
 * - Billing info, contacts, credentials
 * - Software catalog
 * - Documents (Contracts, Orders, Instructions)
 * - Billing/Payment history
 */

const ClientsModule = {
    statsHidden: true, // Statistics section hidden by default
    clients: [],
    currentClient: null,

    init() {
        console.log('👥 ClientsModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'clients') {
                this.loadClients();
                this.render();
            }
        });

        document.addEventListener('projectSelected', () => {
            if (ModuleRouter.currentModule === 'clients') {
                this.loadClients();
                this.render();
            }
        });
    },

    loadClients() {
        // Demo data
        const allClients = [
            { id: 1, name: 'ABC Company', email: 'contact@abc.cz', phone: '+420 123 456 789', status: 'active', totalBilled: 125000, project_id: 1, project_name: 'tests' },
            { id: 2, name: 'XYZ Corp', email: 'info@xyz.com', phone: '+420 987 654 321', status: 'active', totalBilled: 89000, project_id: 2, project_name: 'other-project' },
            { id: 3, name: 'Tech Solutions', email: 'support@techsol.cz', phone: '+420 111 222 333', status: 'pending', totalBilled: 0, project_id: 1, project_name: 'tests' }
        ];

        // Filter by selected project
        const currentProject = StateManager.getCurrentObject();
        if (currentProject) {
            const projectName = currentProject.object_name || currentProject.name || '';
            const projectId = currentProject.id;

            this.clients = allClients.filter(client => {
                return client.project_id === projectId ||
                       (client.project_name && projectName &&
                        client.project_name.toLowerCase().includes(projectName.toLowerCase()));
            });
        } else {
            this.clients = allClients;
        }
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        mainView.innerHTML = `
            <div class="clients-module-container">
                ${this.renderModuleHeader()}
                ${this.renderClientsList()}
            </div>
        `;
    },

    renderModuleHeader() {
        const stats = this.calculateStats();
        return `
            <div class="module-header-row">
                <div class="module-header-left">
                    <h2><i class="fas fa-users"></i> Clients</h2>
                    <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                            onclick="ClientsModule.toggleStats()"
                            title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                        <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
                <div class="module-header-actions">
                    <button class="btn btn-primary" onclick="ClientsModule.showNewClientModal()">
                        <i class="fas fa-plus"></i> New Client
                    </button>
                    <button class="btn btn-secondary" onclick="ClientsModule.loadClients(); ClientsModule.render();">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                <div class="resources-stats">
                    <div class="stat-card stat-primary">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <h3>${stats.total}</h3>
                            <p>Total Clients</p>
                        </div>
                    </div>
                    <div class="stat-card stat-info">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <h3>${stats.active}</h3>
                            <p>Active</p>
                        </div>
                    </div>
                    <div class="stat-card stat-secondary">
                        <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                        <div class="stat-content">
                            <h3>${stats.totalBilled.toLocaleString()}</h3>
                            <p>Total Billed (CZK)</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    calculateStats() {
        return {
            total: this.clients.length,
            active: this.clients.filter(c => c.status === 'active').length,
            pending: this.clients.filter(c => c.status === 'pending').length,
            totalBilled: this.clients.reduce((sum, c) => sum + (c.totalBilled || 0), 0)
        };
    },

    renderClientsList() {
        return `
            <div class="clients-content">
                <div class="clients-grid">
                    ${this.clients.map(client => `
                        <div class="client-card" onclick="ClientsModule.selectClient(${client.id})">
                            <div class="client-card-header">
                                <div class="client-avatar">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="client-status ${client.status}">${client.status}</div>
                            </div>
                            <div class="client-card-body">
                                <h4>${client.name}</h4>
                                <p><i class="fas fa-envelope"></i> ${client.email}</p>
                                <p><i class="fas fa-phone"></i> ${client.phone}</p>
                            </div>
                            <div class="client-card-footer">
                                <div class="client-billed">
                                    <span class="billed-label">Total Billed</span>
                                    <span class="billed-value">${client.totalBilled.toLocaleString()} CZK</span>
                                </div>
                                <div class="client-actions">
                                    <button onclick="event.stopPropagation(); ClientsModule.sendInvoice(${client.id})" title="Send Invoice">
                                        <i class="fas fa-file-invoice-dollar"></i>
                                    </button>
                                    <button onclick="event.stopPropagation(); ClientsModule.editClient(${client.id})" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="event.stopPropagation(); ClientsModule.viewClientDetails(${client.id})" title="Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}

                    <div class="client-card add-client" onclick="ClientsModule.showNewClientModal()">
                        <i class="fas fa-plus"></i>
                        <span>Add Client</span>
                    </div>
                </div>
            </div>
        `;
    },

    toggleStats() {
        this.statsHidden = !this.statsHidden;
        const statsSection = document.querySelector('.module-stats-section');
        const toggleBtn = document.querySelector('.btn-icon-toggle');
        if (statsSection) {
            statsSection.classList.toggle('hidden', this.statsHidden);
        }
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', !this.statsHidden);
            toggleBtn.querySelector('i').className = `fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}`;
            toggleBtn.title = this.statsHidden ? 'Show Statistics' : 'Hide Statistics';
        }
    },

    searchClients(term) {
        // TODO: Implement search
    },

    selectClient(clientId) {
        this.currentClient = this.clients.find(c => c.id === clientId);
        this.viewClientDetails(clientId);
    },

    showNewClientModal() {
        const modalHtml = `
            <div id="new-client-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-plus"></i> New Client</h2>
                        <span class="close-btn" onclick="ClientsModule.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Company Name *</label>
                                <input type="text" id="client-name" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Contact Person</label>
                                <input type="text" id="client-contact" class="form-control">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="client-email" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" id="client-phone" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea id="client-address" class="form-control" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="client-notes" class="form-control" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ClientsModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="ClientsModule.createClient()">Create Client</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    createClient() {
        const name = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;

        if (!name || !email) {
            showNotification('Please fill required fields', 'warning');
            return;
        }

        this.clients.push({
            id: Date.now(),
            name,
            email,
            phone: document.getElementById('client-phone').value || '',
            status: 'pending',
            totalBilled: 0
        });

        this.closeModal();
        this.render();
        showNotification('Client created successfully', 'success');
    },

    editClient(clientId) {
        showNotification('Edit client coming soon', 'info');
    },

    viewClientDetails(clientId) {
        showNotification('Client details coming soon', 'info');
    },

    sendInvoice(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            showNotification(`Sending invoice to ${client.name}...`, 'info');
        }
    },

    sendBulkInvoice() {
        showNotification('Bulk invoice sending coming soon', 'info');
    },

    exportClients() {
        showNotification('Exporting clients...', 'info');
    },

    closeModal() {
        const modal = document.getElementById('new-client-modal');
        if (modal) modal.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => ClientsModule.init());
window.ClientsModule = ClientsModule;
