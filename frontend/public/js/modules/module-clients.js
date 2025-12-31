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
    projectsHidden: true,
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
    },

    loadClients() {
        // Demo data
        this.clients = [
            { id: 1, name: 'ABC Company', email: 'contact@abc.cz', phone: '+420 123 456 789', status: 'active', totalBilled: 125000 },
            { id: 2, name: 'XYZ Corp', email: 'info@xyz.com', phone: '+420 987 654 321', status: 'active', totalBilled: 89000 },
            { id: 3, name: 'Tech Solutions', email: 'support@techsol.cz', phone: '+420 111 222 333', status: 'pending', totalBilled: 0 }
        ];
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        // Note: Toolbar is rendered by ModuleRouter.renderModuleHeader()
        mainView.innerHTML = `
            <div class="clients-module-container">
                ${this.renderProjectToggle()}
                ${this.renderClientsList()}
            </div>
        `;
    },

    renderProjectToggle() {
        return `
            <div class="clients-project-section ${this.projectsHidden ? 'collapsed' : ''}">
                <div class="project-toggle-header" onclick="ClientsModule.toggleProjects()">
                    <div class="project-toggle-info">
                        <i class="fas fa-${this.projectsHidden ? 'eye-slash' : 'eye'}"></i>
                        <span>${this.projectsHidden ? 'Show Projects' : 'Hide Projects'}</span>
                    </div>
                    <i class="fas fa-chevron-${this.projectsHidden ? 'down' : 'up'}"></i>
                </div>
            </div>
        `;
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

    toggleProjects() {
        this.projectsHidden = !this.projectsHidden;
        this.render();
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

