/**
 * KMS App - Module Router Framework
 * Handles navigation between 7 main modules:
 * IDEAS, DEVELOP, DEPLOY, TASKS, ANALYTICS, CLIENTS, FINANCE
 */

const ModuleRouter = {
    // Available modules configuration
    modules: {
        ideas: {
            id: 'ideas',
            name: 'IDEAS',
            icon: 'fa-lightbulb',
            color: '#f1c40f',
            description: 'Create & Plan Phase',
            showProjects: true,
            projectsCollapsed: false,
            tools: ['konsolidovat', 'ai-analyze', 'generate', 'visualize', 'backup']
        },
        develop: {
            id: 'develop',
            name: 'DEVELOP',
            icon: 'fa-code',
            color: '#3498db',
            description: 'Development Phase',
            showProjects: true,
            projectsCollapsed: false,
            hideFilters: ['search', 'status', 'category', 'priority', 'view-mode'],
            tools: ['terminal', 'analysis', 'cursor', 'backup', 'version'],
            tabs: ['overview', 'phases', 'tasks', 'guides', 'attachments', 'comments', 'history']
        },
        deploy: {
            id: 'deploy',
            name: 'DEPLOY',
            icon: 'fa-rocket',
            color: '#9b59b6',
            description: 'Release Phase',
            showProjects: true,
            projectsCollapsed: false,
            hideFilters: ['search', 'status', 'category', 'priority', 'view-mode', 'recent'],
            tools: ['export', 'backup', 'test-deploy', 'clients', 'billing']
        },
        tasks: {
            id: 'tasks',
            name: 'TASKS',
            icon: 'fa-tasks',
            color: '#e74c3c',
            description: 'Team Work',
            showProjects: true,
            projectsCollapsed: true, // Hidden by default
            tools: ['new-task', 'assign', 'stage', 'priority']
        },
        analytics: {
            id: 'analytics',
            name: 'ANALYTICS',
            icon: 'fa-chart-line',
            color: '#1abc9c',
            description: 'Monitoring',
            showProjects: true,
            projectsCollapsed: true, // Hidden by default
            tools: ['metrics', 'billing-stats', 'errors', 'ai-usage']
        },
        clients: {
            id: 'clients',
            name: 'CLIENTS',
            icon: 'fa-users',
            color: '#e67e22',
            description: 'Customer Management',
            showProjects: true,
            projectsCollapsed: true, // Hidden by default
            tools: ['new-client', 'contracts', 'orders', 'payments', 'send-invoice']
        },
        finance: {
            id: 'finance',
            name: 'FINANCE',
            icon: 'fa-money-bill-wave',
            color: '#27ae60',
            description: 'Financial Ops',
            showProjects: true,
            projectsCollapsed: true, // Hidden by default
            tools: ['create-invoice', 'payment-instructions', 'reminders', 'contracts']
        },
        logins: {
            id: 'logins',
            name: 'LOGINS',
            icon: 'fa-key',
            color: '#c0392b',
            description: 'Credentials Management',
            showProjects: true,
            projectsCollapsed: true, // Hidden by default
            tools: ['new-credential', 'test-all', 'export-vault', 'rotate-keys']
        }
    },

    // Current active module
    currentModule: 'develop',
    
    // Passed project from another module
    passedProject: null,

    /**
     * Initialize module router
     */
    init() {
        console.log('🚀 ModuleRouter initialized');
        this.renderModuleNav();
        this.loadModuleFromHash();
        
        // Handle browser back/forward
        window.addEventListener('hashchange', () => this.loadModuleFromHash());
    },

    /**
     * Load module from URL hash
     */
    loadModuleFromHash() {
        const hash = window.location.hash.slice(1);
        if (hash && this.modules[hash]) {
            this.switchModule(hash, false);
        } else {
            this.switchModule('develop', false);
        }
    },

    /**
     * Render module navigation bar
     */
    renderModuleNav() {
        const navHtml = `
            <nav class="module-nav" id="module-nav">
                <button class="module-nav-btn categories-btn ${app.projectSelectorOpen ? 'active' : ''}"
                        onclick="app.toggleProjectSelector()"
                        title="Browse Categories & Projects">
                    <i class="fas fa-folder-open"></i>
                </button>
                ${Object.values(this.modules).map(module => `
                    <button class="module-nav-btn ${this.currentModule === module.id ? 'active' : ''}"
                            data-module="${module.id}"
                            onclick="ModuleRouter.switchModule('${module.id}')"
                            title="${module.description}"
                            style="--module-color: ${module.color}">
                        <i class="fas ${module.icon}"></i>
                        <span class="module-name">${module.name}</span>
                    </button>
                `).join('')}
            </nav>
        `;

        // Insert nav after header
        const header = document.querySelector('.header');
        if (header && !document.getElementById('module-nav')) {
            header.insertAdjacentHTML('afterend', navHtml);
        }
    },

    /**
     * Switch to a different module
     */
    switchModule(moduleId, updateHash = true) {
        if (!this.modules[moduleId]) {
            console.error(`Module ${moduleId} not found`);
            return;
        }

        const prevModule = this.currentModule;
        this.currentModule = moduleId;
        const module = this.modules[moduleId];

        console.log(`📦 Switching to module: ${module.name}`);

        // Update URL hash
        if (updateHash) {
            window.location.hash = moduleId;
        }

        // Update nav buttons
        document.querySelectorAll('.module-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === moduleId);
        });

        // Update document title
        document.title = `KMS - ${module.name}`;

        // Apply module-specific settings
        this.applyModuleSettings(module);

        // Render module content
        this.renderModuleContent(module);

        // Emit module change event
        document.dispatchEvent(new CustomEvent('moduleChanged', {
            detail: { prevModule, currentModule: moduleId, module }
        }));
    },

    /**
     * Apply module-specific settings (hide/show filters, etc.)
     */
    applyModuleSettings(module) {
        // Handle filter visibility
        const filtersToHide = module.hideFilters || [];
        
        // Reset all filters to visible
        document.querySelectorAll('.filter-element').forEach(el => {
            el.style.display = '';
        });

        // Hide specific filters for this module
        filtersToHide.forEach(filter => {
            const el = document.querySelector(`[data-filter="${filter}"]`);
            if (el) el.style.display = 'none';
        });

        // Handle projects panel collapsed state
        const projectsPanel = document.getElementById('projects-panel');
        if (projectsPanel) {
            if (module.projectsCollapsed) {
                projectsPanel.classList.add('collapsed');
            } else {
                projectsPanel.classList.remove('collapsed');
            }
        }
    },

    /**
     * Render module-specific content
     */
    renderModuleContent(module) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Get module header HTML
        const headerHtml = this.renderModuleHeader(module);

        // Get module-specific content
        let contentHtml = '';
        switch (module.id) {
            case 'develop':
                contentHtml = this.renderDevelopModule(module);
                break;
            case 'tasks':
                contentHtml = this.renderTasksModule(module);
                break;
            case 'deploy':
                contentHtml = this.renderDeployModule(module);
                break;
            case 'clients':
                contentHtml = this.renderClientsModule(module);
                break;
            case 'finance':
                contentHtml = this.renderFinanceModule(module);
                break;
            case 'analytics':
                contentHtml = this.renderAnalyticsModule(module);
                break;
            case 'ideas':
                contentHtml = this.renderIdeasModule(module);
                break;
            case 'logins':
                // Call LoginsModule to render
                if (typeof LoginsModule !== 'undefined') {
                    setTimeout(() => LoginsModule.render(), 0);
                    return; // LoginsModule handles its own rendering
                }
                contentHtml = '<div class="module-placeholder">Loading LOGINS module...</div>';
                break;
            default:
                contentHtml = '<div class="module-placeholder">Module coming soon...</div>';
        }

        // Keep existing content but add module header
        // We'll update the module header area only, not replace all content
        let moduleHeader = document.getElementById('module-header');
        if (!moduleHeader) {
            mainContent.insertAdjacentHTML('afterbegin', `<div id="module-header">${headerHtml}</div>`);
        } else {
            moduleHeader.innerHTML = headerHtml;
        }
    },

    /**
     * Render module header with toolbar
     */
    renderModuleHeader(module) {
        return `
            <div class="module-header" style="--module-color: ${module.color}">
                <div class="module-header-info">
                    <i class="fas ${module.icon}"></i>
                    <h2>${module.name}</h2>
                    <span class="module-description">${module.description}</span>
                </div>
                <div class="module-toolbar">
                    ${this.renderModuleToolbar(module)}
                </div>
                ${this.passedProject ? `
                    <div class="passed-project-indicator">
                        <i class="fas fa-project-diagram"></i>
                        <span>Project: ${this.passedProject.name}</span>
                        <button onclick="ModuleRouter.clearPassedProject()" title="Clear filter">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render module-specific toolbar
     */
    renderModuleToolbar(module) {
        const toolbarConfig = {
            develop: [
                { action: 'terminal', icon: 'fa-terminal', label: 'Terminal' },
                { action: 'analysis', icon: 'fa-search', label: 'Analysis' },
                { action: 'load-tasks', icon: 'fa-tasks', label: 'Load Tasks' },
                { action: 'version-up', icon: 'fa-plus-circle', label: 'Version +1' }
            ],
            tasks: [
                { action: 'new-task', icon: 'fa-plus', label: 'New Task' },
                { action: 'assign', icon: 'fa-user-plus', label: 'Assign' },
                { action: 'change-stage', icon: 'fa-exchange-alt', label: 'Change Stage' }
            ],
            deploy: [
                { action: 'export', icon: 'fa-file-export', label: 'Export' },
                { action: 'backup', icon: 'fa-database', label: 'Backup' },
                { action: 'test-deploy', icon: 'fa-vial', label: 'Test Deploy' },
                { action: 'billing', icon: 'fa-file-invoice-dollar', label: 'Billing' }
            ],
            clients: [
                { action: 'new-client', icon: 'fa-user-plus', label: 'New Client' },
                { action: 'send-invoice', icon: 'fa-paper-plane', label: 'Send Invoice' },
                { action: 'contracts', icon: 'fa-file-contract', label: 'Contracts' }
            ],
            finance: [
                { action: 'create-invoice', icon: 'fa-file-invoice', label: 'Create Invoice' },
                { action: 'payments', icon: 'fa-credit-card', label: 'Payments' },
                { action: 'reminders', icon: 'fa-bell', label: 'Reminders' }
            ],
            analytics: [
                { action: 'refresh-metrics', icon: 'fa-sync', label: 'Refresh' },
                { action: 'export-report', icon: 'fa-download', label: 'Export Report' }
            ],
            ideas: [
                { action: 'consolidate', icon: 'fa-compress-alt', label: 'Consolidate' },
                { action: 'ai-analyze', icon: 'fa-brain', label: 'AI Analyze' },
                { action: 'generate', icon: 'fa-magic', label: 'Generate' },
                { action: 'visualize', icon: 'fa-project-diagram', label: 'Visualize' }
            ],
            logins: [
                { action: 'new-credential', icon: 'fa-plus', label: 'New Credential' },
                { action: 'test-all', icon: 'fa-vial', label: 'Test All' },
                { action: 'export-vault', icon: 'fa-download', label: 'Export Vault' },
                { action: 'rotate-keys', icon: 'fa-sync-alt', label: 'Rotate Keys' }
            ]
        };

        const tools = toolbarConfig[module.id] || [];
        return tools.map(tool => `
            <button class="module-tool-btn" onclick="ModuleRouter.executeAction('${tool.action}')" title="${tool.label}">
                <i class="fas ${tool.icon}"></i>
                <span>${tool.label}</span>
            </button>
        `).join('');
    },

    /**
     * Execute module action
     */
    executeAction(action) {
        console.log(`⚡ Executing action: ${action}`);
        
        const currentObject = StateManager.getCurrentObject();
        
        switch (action) {
            case 'terminal':
                if (currentObject) app.openTool('terminal', currentObject.id);
                break;
            case 'analysis':
                if (currentObject) app.openClaudeInProject(currentObject.id);
                break;
            case 'version-up':
                this.incrementVersion();
                break;
            case 'new-task':
                this.showNewTaskModal();
                break;
            case 'export':
                if (currentObject) app.showExportModal(currentObject.id);
                break;
            case 'backup':
                this.createBackup();
                break;
            case 'new-client':
                this.showNewClientModal();
                break;
            case 'create-invoice':
                this.showCreateInvoiceModal();
                break;
            case 'consolidate':
                this.consolidateProject();
                break;
            case 'ai-analyze':
                if (currentObject) app.openClaudeInProject(currentObject.id);
                break;
            case 'generate':
                if (typeof IdeasModule !== 'undefined') IdeasModule.generate();
                break;
            case 'visualize':
                if (typeof IdeasModule !== 'undefined') IdeasModule.visualize();
                break;
            case 'load-tasks':
                if (typeof TasksModule !== 'undefined') TasksModule.loadProjectTasks();
                break;
            case 'assign':
                showNotification('Assign task - select a task first', 'info');
                break;
            case 'change-stage':
                showNotification('Change stage - select a task first', 'info');
                break;
            case 'test-deploy':
                if (typeof DeployModule !== 'undefined') DeployModule.testDeploy();
                break;
            case 'billing':
                showNotification('Opening billing...', 'info');
                break;
            case 'send-invoice':
                if (typeof ClientsModule !== 'undefined') ClientsModule.sendBulkInvoice();
                break;
            case 'contracts':
                showNotification('Contracts management coming soon', 'info');
                break;
            case 'payments':
                if (typeof FinanceModule !== 'undefined') FinanceModule.recordPayment();
                break;
            case 'reminders':
                if (typeof FinanceModule !== 'undefined') FinanceModule.sendReminders();
                break;
            case 'refresh-metrics':
                if (typeof AnalyticsModule !== 'undefined') AnalyticsModule.refresh();
                break;
            case 'export-report':
                if (typeof AnalyticsModule !== 'undefined') AnalyticsModule.exportReport();
                break;
            case 'new-credential':
                if (typeof LoginsModule !== 'undefined') LoginsModule.createCredential();
                break;
            case 'test-all':
                if (typeof LoginsModule !== 'undefined') LoginsModule.testAllConnections();
                break;
            case 'export-vault':
                if (typeof LoginsModule !== 'undefined') LoginsModule.exportVault();
                break;
            case 'rotate-keys':
                if (typeof LoginsModule !== 'undefined') LoginsModule.rotateKeys();
                break;
            default:
                showNotification(`Action "${action}" coming soon`, 'info');
        }
    },

    /**
     * Pass project to another module
     */
    passProjectTo(moduleId, project) {
        this.passedProject = project;
        console.log(`📤 Passing project "${project.name}" to ${moduleId}`);
        this.switchModule(moduleId);
    },

    /**
     * Clear passed project filter
     */
    clearPassedProject() {
        this.passedProject = null;
        this.renderModuleContent(this.modules[this.currentModule]);
    },

    /**
     * Render DEVELOP module
     */
    renderDevelopModule(module) {
        return `
            <div class="develop-module">
                <div class="develop-tabs">
                    <button class="tab-btn active" data-tab="overview">Overview</button>
                    <button class="tab-btn" data-tab="phases">Phases</button>
                    <button class="tab-btn" data-tab="tasks">Tasks</button>
                    <button class="tab-btn" data-tab="guides">Guides</button>
                    <button class="tab-btn" data-tab="attachments">Attachments</button>
                    <button class="tab-btn" data-tab="comments">Comments</button>
                    <button class="tab-btn" data-tab="history">History</button>
                </div>
                <div class="develop-content" id="develop-tab-content">
                    <!-- Tab content will be rendered here -->
                </div>
            </div>
        `;
    },

    /**
     * Render TASKS module
     */
    renderTasksModule(module) {
        return `
            <div class="tasks-module">
                <div class="tasks-list" id="tasks-list">
                    <!-- Tasks will be loaded here -->
                </div>
            </div>
        `;
    },

    /**
     * Render DEPLOY module
     */
    renderDeployModule(module) {
        return `
            <div class="deploy-module">
                <div class="deploy-sections">
                    <div class="deploy-section clients-section">
                        <h3><i class="fas fa-users"></i> Clients</h3>
                        <div id="deploy-clients-list"></div>
                    </div>
                    <div class="deploy-section actions-section">
                        <h3><i class="fas fa-play"></i> Deploy Actions</h3>
                        <button class="deploy-action-btn" onclick="ModuleRouter.executeAction('test-deploy')">
                            <i class="fas fa-vial"></i> Test Deploy
                        </button>
                        <button class="deploy-action-btn" onclick="ModuleRouter.executeAction('backup')">
                            <i class="fas fa-database"></i> Backup
                        </button>
                        <button class="deploy-action-btn" onclick="ModuleRouter.executeAction('export')">
                            <i class="fas fa-file-export"></i> Export
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render CLIENTS module
     */
    renderClientsModule(module) {
        return `
            <div class="clients-module">
                <div class="clients-list" id="clients-list">
                    <!-- Clients will be loaded here -->
                </div>
            </div>
        `;
    },

    /**
     * Render FINANCE module
     */
    renderFinanceModule(module) {
        return `
            <div class="finance-module">
                <div class="finance-dashboard">
                    <div class="finance-card">
                        <h4>Pending Invoices</h4>
                        <div class="finance-value" id="pending-invoices">0</div>
                    </div>
                    <div class="finance-card">
                        <h4>Total Revenue</h4>
                        <div class="finance-value" id="total-revenue">0 CZK</div>
                    </div>
                    <div class="finance-card">
                        <h4>Outstanding</h4>
                        <div class="finance-value" id="outstanding">0 CZK</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render ANALYTICS module
     */
    renderAnalyticsModule(module) {
        return `
            <div class="analytics-module">
                <div class="analytics-charts">
                    <div class="chart-card">
                        <h4><i class="fas fa-chart-bar"></i> Usage Statistics</h4>
                        <div id="usage-chart" class="chart-container"></div>
                    </div>
                    <div class="chart-card">
                        <h4><i class="fas fa-exclamation-triangle"></i> Errors</h4>
                        <div id="errors-chart" class="chart-container"></div>
                    </div>
                    <div class="chart-card">
                        <h4><i class="fas fa-robot"></i> AI Usage</h4>
                        <div id="ai-usage-chart" class="chart-container"></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render IDEAS module
     */
    renderIdeasModule(module) {
        return `
            <div class="ideas-module">
                <div class="ideas-content">
                    <div class="ideas-section">
                        <h3><i class="fas fa-lightbulb"></i> Project Ideas</h3>
                        <div id="ideas-list"></div>
                    </div>
                    <div class="ideas-section">
                        <h3><i class="fas fa-brain"></i> AI Suggestions</h3>
                        <div id="ai-suggestions"></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Show new task modal
     */
    showNewTaskModal() {
        const modalHtml = `
            <div id="new-task-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-plus"></i> New Task</h2>
                        <span class="close-btn" onclick="document.getElementById('new-task-modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Task Name</label>
                            <input type="text" id="task-name" class="form-control" placeholder="Enter task name">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="task-description" class="form-control" rows="3" placeholder="Task description"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Priority</label>
                            <select id="task-priority" class="form-control">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Assign To</label>
                            <input type="text" id="task-assignee" class="form-control" placeholder="Team member">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('new-task-modal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="ModuleRouter.createTask()">Create Task</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Create task
     */
    async createTask() {
        const name = document.getElementById('task-name').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const assignee = document.getElementById('task-assignee').value;

        if (!name) {
            showNotification('Please enter task name', 'warning');
            return;
        }

        // TODO: Implement task creation API
        showNotification(`Task "${name}" created (demo)`, 'success');
        document.getElementById('new-task-modal').remove();
    },

    /**
     * Show new client modal
     */
    showNewClientModal() {
        showNotification('Client management coming soon', 'info');
    },

    /**
     * Show create invoice modal
     */
    showCreateInvoiceModal() {
        showNotification('Invoice creation coming soon', 'info');
    },

    /**
     * Increment project version
     */
    incrementVersion() {
        const currentObject = StateManager.getCurrentObject();
        if (!currentObject) {
            showNotification('Select a project first', 'warning');
            return;
        }
        showNotification('Version increment coming soon', 'info');
    },

    /**
     * Create backup
     */
    async createBackup() {
        const currentObject = StateManager.getCurrentObject();
        if (!currentObject) {
            showNotification('Select a project first', 'warning');
            return;
        }
        
        try {
            showNotification('Creating backup...', 'info');
            // Call backup API
            const response = await fetch(`/api/tools/backup/${currentObject.id}`, { method: 'POST' });
            if (response.ok) {
                showNotification('Backup created successfully', 'success');
            } else {
                showNotification('Backup failed', 'error');
            }
        } catch (error) {
            showNotification('Backup error: ' + error.message, 'error');
        }
    },

    /**
     * Consolidate project information
     */
    consolidateProject() {
        const currentObject = StateManager.getCurrentObject();
        if (!currentObject) {
            showNotification('Select a project first', 'warning');
            return;
        }
        showNotification('Consolidation coming soon', 'info');
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to allow other modules to load
    setTimeout(() => ModuleRouter.init(), 100);
});

// Export for global access
window.ModuleRouter = ModuleRouter;

