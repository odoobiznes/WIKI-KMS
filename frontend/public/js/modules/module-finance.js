/**
 * KMS Module - FINANCE
 * Financial Operations module
 *
 * Features:
 * - Invoice creation and management
 * - Payment tracking
 * - Reminders
 * - Contracts and order confirmations
 * - Financial reports
 */

const FinanceModule = {
    statsHidden: true, // Statistics section hidden by default
    invoices: [],
    payments: [],

    init() {
        console.log('💰 FinanceModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'finance') {
                this.loadData();
                this.render();
            }
        });

        document.addEventListener('projectSelected', () => {
            if (ModuleRouter.currentModule === 'finance') {
                this.loadData();
                this.render();
            }
        });
    },

    loadData() {
        // Demo data
        const allInvoices = [
            { id: 1, number: 'INV-2025-001', client: 'ABC Company', amount: 25000, status: 'paid', date: '2025-12-15', project_id: 1, project_name: 'tests' },
            { id: 2, number: 'INV-2025-002', client: 'XYZ Corp', amount: 18500, status: 'pending', date: '2025-12-28', project_id: 2, project_name: 'other-project' },
            { id: 3, number: 'INV-2025-003', client: 'Tech Solutions', amount: 32000, status: 'overdue', date: '2025-12-01', project_id: 1, project_name: 'tests' }
        ];

        // Filter by selected project
        const currentProject = StateManager.getCurrentObject();
        if (currentProject) {
            const projectName = currentProject.object_name || currentProject.name || '';
            const projectId = currentProject.id;

            this.invoices = allInvoices.filter(invoice => {
                return invoice.project_id === projectId ||
                       (invoice.project_name && projectName &&
                        invoice.project_name.toLowerCase().includes(projectName.toLowerCase()));
            });
        } else {
            this.invoices = allInvoices;
        }
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        mainView.innerHTML = `
            <div class="finance-module-container">
                ${this.renderModuleHeader()}
                ${this.renderInvoicesTable()}
            </div>
        `;
    },

    renderModuleHeader() {
        const totalPending = this.invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
        const totalOverdue = this.invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
        const totalPaid = this.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

        return `
            <div class="module-header-row">
                <div class="module-header-left">
                    <h2><i class="fas fa-money-bill-wave"></i> Finance</h2>
                    <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                            onclick="FinanceModule.toggleStats()"
                            title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                        <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
                <div class="module-header-actions">
                    <button class="btn btn-primary" onclick="FinanceModule.showCreateInvoiceModal()">
                        <i class="fas fa-plus"></i> Create Invoice
                    </button>
                    <button class="btn btn-secondary" onclick="FinanceModule.loadData(); FinanceModule.render();">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                <div class="resources-stats">
                    <div class="stat-card stat-primary" style="--module-color: #27ae60">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <h3>${totalPaid.toLocaleString()} CZK</h3>
                            <p>Paid</p>
                        </div>
                    </div>
                    <div class="stat-card stat-info" style="--module-color: #f39c12">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-content">
                            <h3>${totalPending.toLocaleString()} CZK</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div class="stat-card stat-danger" style="--module-color: #e74c3c">
                        <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
                        <div class="stat-content">
                            <h3>${totalOverdue.toLocaleString()} CZK</h3>
                            <p>Overdue</p>
                        </div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <div class="stat-icon"><i class="fas fa-coins"></i></div>
                        <div class="stat-content">
                            <h3>${(totalPaid + totalPending + totalOverdue).toLocaleString()} CZK</h3>
                            <p>Total</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderInvoicesTable() {
        return `
            <div class="finance-content">
                <div class="invoices-section">
                    <div class="section-header">
                        <h4><i class="fas fa-file-invoice"></i> Recent Invoices</h4>
                    </div>
                    <table class="finance-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.invoices.map(inv => `
                                    <tr>
                                        <td><strong>${inv.number}</strong></td>
                                        <td>${inv.client}</td>
                                        <td>${inv.amount.toLocaleString()} CZK</td>
                                        <td>${inv.date}</td>
                                        <td><span class="status-badge ${inv.status}">${inv.status}</span></td>
                                        <td>
                                            <button onclick="FinanceModule.viewInvoice(${inv.id})" title="View">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="FinanceModule.sendInvoice(${inv.id})" title="Send">
                                                <i class="fas fa-paper-plane"></i>
                                            </button>
                                            ${inv.status !== 'paid' ? `
                                                <button onclick="FinanceModule.markPaid(${inv.id})" title="Mark Paid">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
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

    showCreateInvoiceModal() {
        const modalHtml = `
            <div id="invoice-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-file-invoice"></i> Create Invoice</h2>
                        <span class="close-btn" onclick="FinanceModule.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Client *</label>
                            <select id="invoice-client" class="form-control">
                                <option value="">Select client...</option>
                                <option value="ABC Company">ABC Company</option>
                                <option value="XYZ Corp">XYZ Corp</option>
                                <option value="Tech Solutions">Tech Solutions</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount (CZK) *</label>
                                <input type="number" id="invoice-amount" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Due Date</label>
                                <input type="date" id="invoice-due" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="invoice-desc" class="form-control" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="FinanceModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="FinanceModule.createInvoice()">Create Invoice</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    createInvoice() {
        const client = document.getElementById('invoice-client').value;
        const amount = parseFloat(document.getElementById('invoice-amount').value);

        if (!client || !amount) {
            showNotification('Please fill required fields', 'warning');
            return;
        }

        this.invoices.push({
            id: Date.now(),
            number: `INV-2025-${String(this.invoices.length + 1).padStart(3, '0')}`,
            client,
            amount,
            status: 'pending',
            date: new Date().toISOString().split('T')[0]
        });

        this.closeModal();
        this.render();
        showNotification('Invoice created successfully', 'success');
    },

    viewInvoice(id) {
        showNotification('Invoice preview coming soon', 'info');
    },

    sendInvoice(id) {
        const invoice = this.invoices.find(i => i.id === id);
        if (invoice) {
            showNotification(`Sending ${invoice.number} to ${invoice.client}...`, 'info');
        }
    },

    markPaid(id) {
        const invoice = this.invoices.find(i => i.id === id);
        if (invoice) {
            invoice.status = 'paid';
            this.render();
            showNotification(`${invoice.number} marked as paid`, 'success');
        }
    },

    recordPayment() {
        showNotification('Payment recording coming soon', 'info');
    },

    sendReminders() {
        const overdue = this.invoices.filter(i => i.status === 'overdue');
        if (overdue.length > 0) {
            showNotification(`Sending reminders for ${overdue.length} overdue invoices...`, 'info');
        } else {
            showNotification('No overdue invoices', 'info');
        }
    },

    exportReport() {
        showNotification('Exporting financial report...', 'info');
    },

    closeModal() {
        const modal = document.getElementById('invoice-modal');
        if (modal) modal.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => FinanceModule.init());
window.FinanceModule = FinanceModule;
