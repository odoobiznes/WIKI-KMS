/**
 * KMS Module - DEVELOP
 * Development Phase module with tabs and stage workflow
 *
 * Features:
 * - Tabs: Overview, Phases, Tasks, Guides, Attachments, Comments, History
 * - Stage workflow: Analyze → CreateTZ → Approve → Realize → Security → Test → Fix → Docs
 * - Auto-buttons for semi-automatic processing
 * - No search/status/category/priority filters
 */

const DevelopModule = {
    currentTab: 'overview',
    currentStage: 0,
    statsHidden: true, // Statistics section hidden by default

    // Stage definitions
    stages: [
        { id: 'analyze', name: 'Analyze', icon: 'fa-search', description: 'Analyze requirements and existing code' },
        { id: 'create-tz', name: 'Create TZ', icon: 'fa-file-alt', description: 'Create technical specification' },
        { id: 'approve', name: 'Approve', icon: 'fa-check-circle', description: 'Get approval for implementation' },
        { id: 'realize', name: 'Realize', icon: 'fa-cogs', description: 'Implement the solution' },
        { id: 'security', name: 'Security', icon: 'fa-shield-alt', description: 'Security review and hardening' },
        { id: 'test', name: 'Test', icon: 'fa-vial', description: 'Testing and QA' },
        { id: 'fix', name: 'Fix', icon: 'fa-wrench', description: 'Bug fixes and improvements' },
        { id: 'docs', name: 'Docs', icon: 'fa-book', description: 'Documentation' }
    ],

    // Tab definitions
    tabs: [
        { id: 'overview', name: 'Overview', icon: 'fa-home' },
        { id: 'phases', name: 'Phases', icon: 'fa-tasks' },
        { id: 'tasks', name: 'Tasks', icon: 'fa-check-square' },
        { id: 'guides', name: 'Guides', icon: 'fa-book-open' },
        { id: 'attachments', name: 'Attachments', icon: 'fa-paperclip' },
        { id: 'comments', name: 'Comments', icon: 'fa-comments' },
        { id: 'history', name: 'History', icon: 'fa-history' }
    ],

    /**
     * Initialize DEVELOP module
     */
    init() {
        console.log('🔧 DevelopModule initialized');

        // Listen for module changes
        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'develop') {
                this.render();
            }
        });

        // Listen for project selection
        document.addEventListener('projectSelected', () => {
            if (ModuleRouter.currentModule === 'develop') {
                this.render();
            }
        });
    },

    /**
     * Render the DEVELOP module
     */
    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        const currentObject = StateManager.getCurrentObject();

        mainView.innerHTML = `
            <div class="develop-module-container">
                ${this.renderModuleHeader()}
                ${currentObject ? this.renderProjectContent(currentObject) : this.renderNoProject()}
            </div>
        `;

        // Load history if project is selected
        if (currentObject) {
            setTimeout(() => this.loadWorkHistory(currentObject.id), 100);
        }
    },

    renderModuleHeader() {
        return `
            <div class="module-header-row">
                <div class="module-header-left">
                    <h2><i class="fas fa-code"></i> Develop</h2>
                    <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                            onclick="DevelopModule.toggleStats()"
                            title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                        <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
                <div class="module-header-actions">
                    <button class="btn btn-secondary" onclick="DevelopModule.openTerminal()">
                        <i class="fas fa-terminal"></i> Terminal
                    </button>
                    <button class="btn btn-secondary" onclick="DevelopModule.runAnalysis()">
                        <i class="fas fa-search"></i> Analysis
                    </button>
                    <button class="btn btn-secondary" onclick="DevelopModule.loadTasks()">
                        <i class="fas fa-list"></i> Tasks
                    </button>
                    <button class="btn btn-secondary" onclick="DevelopModule.runTest()">
                        <i class="fas fa-vial"></i> Test
                    </button>
                    <button class="btn btn-secondary" onclick="DevelopModule.runFix()">
                        <i class="fas fa-wrench"></i> Fix
                    </button>
                    <button class="btn btn-secondary" onclick="DevelopModule.generateDocs()">
                        <i class="fas fa-book"></i> Docs
                    </button>
                    <button class="btn btn-primary" onclick="DevelopModule.incrementVersion()">
                        <i class="fas fa-plus-circle"></i> Version +1
                    </button>
                </div>
            </div>
            <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                ${this.renderStats()}
            </div>
        `;
    },

    renderStats() {
        return `
            <div class="resources-stats">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-code-branch"></i></div>
                    <div class="stat-content">
                        <h3>${this.currentStage + 1}/${this.stages.length}</h3>
                        <p>Current Stage</p>
                    </div>
                </div>
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                    <div class="stat-content">
                        <h3>0</h3>
                        <p>Tasks</p>
                    </div>
                </div>
                <div class="stat-card stat-secondary">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <h3>0</h3>
                        <p>Completed</p>
                    </div>
                </div>
            </div>
        `;
    },

    toggleStats() {
        this.statsHidden = !this.statsHidden;
        const statsSection = document.querySelector('.develop-module-container .module-stats-section');
        const toggleBtn = document.querySelector('.develop-module-container .btn-icon-toggle');
        if (statsSection) {
            statsSection.classList.toggle('hidden', this.statsHidden);
        }
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', !this.statsHidden);
            toggleBtn.querySelector('i').className = `fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}`;
            toggleBtn.title = this.statsHidden ? 'Show Statistics' : 'Hide Statistics';
        }
    },

    /**
     * Render content when project is selected
     */
    renderProjectContent(project) {
        return `
            <div class="develop-content" id="develop-content">
                ${this.renderOverviewContent()}
            </div>
        `;
    },

    /**
     * Render overview content (simplified, no tabs)
     */
    renderOverviewContent() {
        const project = StateManager.getCurrentObject();
        if (!project) return '<p>No project selected</p>';

        return `
            <div class="develop-overview">
                <div class="develop-overview-card">
                    <h3><i class="fas fa-code"></i> ${project.object_name || 'Unnamed Project'}</h3>
                    <p>Use the buttons in the header to perform development tasks.</p>
                </div>
                <div class="develop-history-card">
                    <h4><i class="fas fa-history"></i> Work History & Log</h4>
                    <div class="develop-history-list" id="develop-history-list">
                        <div class="history-loading">Loading history...</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render no project selected message
     */
    renderNoProject() {
        return `
            <div class="no-project-selected">
                <div class="no-project-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3>No Project Selected</h3>
                <p>Select a project from the sidebar to start development</p>
            </div>
        `;
    },



    /**
     * Run tests
     */
    runTest() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'warning');
            return;
        }
        showNotification('Running tests...', 'info');
        this.logAction('test', 'Ran tests');
        // TODO: Implement test execution
    },

    /**
     * Run fixes
     */
    runFix() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'warning');
            return;
        }
        showNotification('Running fixes...', 'info');
        this.logAction('fix', 'Ran fixes');
        // TODO: Implement fix execution
    },

    /**
     * Generate documentation
     */
    generateDocs() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'warning');
            return;
        }
        showNotification('Generating documentation...', 'info');
        this.logAction('docs', 'Generated documentation');
        // TODO: Implement documentation generation
    },

    // OLD FUNCTIONS - TO BE REMOVED (keeping for reference)
    /**
     * Render Overview tab
     */

    /**
     * Render Phases tab
     */

    /**
     * Render Tasks tab
     */

    /**
     * Render Guides tab
     */

    /**
     * Render Attachments tab
     */

    /**
     * Render Comments tab
     */

    /**
     * Render History tab
     */

    /**
     * Setup event listeners
     */

    /**
     * Switch tab
     */

    /**
     * Set workflow stage
     */

    /**
     * Go to next stage
     */

    // Tool actions
    openTerminal() {
        const obj = StateManager.getCurrentObject();
        if (obj) {
            app.openTool('terminal', obj.id);
            this.logAction('terminal', 'Opened terminal');
        }
    },

    runAnalysis() {
        const obj = StateManager.getCurrentObject();
        if (obj) {
            app.openClaudeInProject(obj.id);
            this.logAction('analysis', 'Started analysis');
        }
    },

    loadTasks() {
        const obj = StateManager.getCurrentObject();
        if (obj) {
            showNotification('Loading tasks...', 'info');
            this.logAction('tasks', 'Loaded project tasks');
            // TODO: Load tasks from API
        }
    },

    incrementVersion() {
        const obj = StateManager.getCurrentObject();
        if (obj) {
            showNotification('Version incremented', 'success');
            this.logAction('version', 'Incremented version');
            // TODO: Implement version increment
        }
    },

    openInCursor() {
        const obj = StateManager.getCurrentObject();
        if (obj) app.openTool('cursor', obj.id);
    },

    openInVSCode() {
        const obj = StateManager.getCurrentObject();
        if (obj) app.openTool('vscode', obj.id);
    },

    gitStatus() {
        const obj = StateManager.getCurrentObject();
        if (obj) app.gitOperation(obj.id, 'status');
    },

    runTests() {
        showNotification('Running tests...', 'info');
    },

    addPhase() {
        showNotification('Add phase dialog coming soon', 'info');
    },

    addTask() {
        showNotification('Add task dialog coming soon', 'info');
    },

    generateGuide() {
        showNotification('Generating guide with AI...', 'info');
    },

    viewGuide(guideId) {
        showNotification(`Opening guide: ${guideId}`, 'info');
    },

    uploadAttachment() {
        showNotification('Upload dialog coming soon', 'info');
    },

    addComment() {
        const textarea = document.getElementById('new-comment');
        if (textarea && textarea.value.trim()) {
            showNotification('Comment added', 'success');
            textarea.value = '';
        }
    },

    /**
     * Load work history for project
     */
    async loadWorkHistory(projectId) {
        try {
            const project = await API.getObject(projectId);
            const metadata = project.metadata || {};
            const history = metadata.develop_history || [];

            this.displayWorkHistory(history);
        } catch (error) {
            console.error('Error loading work history:', error);
            const container = document.getElementById('develop-history-list');
            if (container) {
                container.innerHTML = '<div class="history-error">Error loading history</div>';
            }
        }
    },

    /**
     * Display work history
     */
    displayWorkHistory(history) {
        const container = document.getElementById('develop-history-list');
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = '<div class="history-empty">No work history yet. Start working to see your actions here.</div>';
            return;
        }

        // Sort by timestamp (newest first)
        const sortedHistory = [...history].sort((a, b) => {
            const timeA = new Date(a.timestamp || 0);
            const timeB = new Date(b.timestamp || 0);
            return timeB - timeA;
        });

        container.innerHTML = sortedHistory.map(item => {
            const time = new Date(item.timestamp);
            const timeStr = time.toLocaleString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const iconMap = {
                'terminal': 'fa-terminal',
                'analysis': 'fa-search',
                'tasks': 'fa-list',
                'test': 'fa-vial',
                'fix': 'fa-wrench',
                'docs': 'fa-book',
                'version': 'fa-plus-circle',
                'git': 'fa-code-branch',
                'deploy': 'fa-rocket'
            };

            const icon = iconMap[item.action] || 'fa-circle';

            return `
                <div class="history-item">
                    <div class="history-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="history-content">
                        <div class="history-action">${item.description || item.action}</div>
                        <div class="history-meta">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Log an action to work history
     */
    async logAction(action, description) {
        const project = StateManager.getCurrentObject();
        if (!project) return;

        try {
            const fullProject = await API.getObject(project.id);
            const metadata = fullProject.metadata || {};

            if (!metadata.develop_history) {
                metadata.develop_history = [];
            }

            metadata.develop_history.push({
                timestamp: new Date().toISOString(),
                action: action,
                description: description
            });

            // Keep only last 100 entries
            if (metadata.develop_history.length > 100) {
                metadata.develop_history = metadata.develop_history.slice(-100);
            }

            await API.put(`/objects/${project.id}`, { metadata });

            // Update display
            this.displayWorkHistory(metadata.develop_history);
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    DevelopModule.init();
});

// Export for global access
window.DevelopModule = DevelopModule;
