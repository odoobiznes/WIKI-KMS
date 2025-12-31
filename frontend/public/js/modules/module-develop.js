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

        // Note: Toolbar is rendered by ModuleRouter.renderModuleHeader()
        mainView.innerHTML = `
            <div class="develop-module-container">
                ${currentObject ? this.renderProjectContent(currentObject) : this.renderNoProject()}
            </div>
        `;

        // Setup tab event listeners
        this.setupEventListeners();
    },

    /**
     * Render content when project is selected
     */
    renderProjectContent(project) {
        return `
            ${this.renderStageWorkflow()}
            ${this.renderTabs()}
            <div class="develop-content" id="develop-tab-content">
                ${this.renderTabContent()}
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
     * Render stage workflow
     */
    renderStageWorkflow() {
        return `
            <div class="develop-stage-workflow">
                <div class="stage-workflow-header">
                    <h4><i class="fas fa-stream"></i> Development Workflow</h4>
                    <div class="stage-progress">
                        Stage ${this.currentStage + 1} of ${this.stages.length}
                    </div>
                </div>
                <div class="stage-workflow-content">
                    ${this.stages.map((stage, index) => `
                        <div class="stage-step ${index < this.currentStage ? 'completed' : ''} ${index === this.currentStage ? 'active' : ''}"
                             onclick="DevelopModule.setStage(${index})"
                             title="${stage.description}">
                            <div class="stage-step-icon">
                                ${index < this.currentStage ? '<i class="fas fa-check"></i>' : `<i class="fas ${stage.icon}"></i>`}
                            </div>
                            <div class="stage-step-name">${stage.name}</div>
                            ${index < this.stages.length - 1 ? '<div class="stage-step-line"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="stage-actions">
                    <button class="btn btn-secondary" onclick="DevelopModule.prevStage()" ${this.currentStage === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    <button class="btn btn-primary" onclick="DevelopModule.nextStage()" ${this.currentStage === this.stages.length - 1 ? 'disabled' : ''}>
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="btn btn-success" onclick="DevelopModule.autoProcess()">
                        <i class="fas fa-magic"></i> Auto Process
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render tabs
     */
    renderTabs() {
        return `
            <div class="develop-tabs">
                ${this.tabs.map(tab => `
                    <button class="develop-tab ${this.currentTab === tab.id ? 'active' : ''}"
                            onclick="DevelopModule.switchTab('${tab.id}')"
                            data-tab="${tab.id}">
                        <i class="fas ${tab.icon}"></i>
                        <span>${tab.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render tab content
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'overview':
                return this.renderOverviewTab();
            case 'phases':
                return this.renderPhasesTab();
            case 'tasks':
                return this.renderTasksTab();
            case 'guides':
                return this.renderGuidesTab();
            case 'attachments':
                return this.renderAttachmentsTab();
            case 'comments':
                return this.renderCommentsTab();
            case 'history':
                return this.renderHistoryTab();
            default:
                return '<p>Tab content not found</p>';
        }
    },

    /**
     * Render Overview tab
     */
    renderOverviewTab() {
        const project = StateManager.getCurrentObject();
        
        return `
            <div class="tab-content overview-tab">
                <div class="overview-grid">
                    <div class="overview-card project-info-card">
                        <h4><i class="fas fa-info-circle"></i> Project Info</h4>
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${project?.object_name || project?.name || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Path:</span>
                            <span class="info-value">${project?.file_path || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Stage:</span>
                            <span class="info-value">${this.stages[this.currentStage].name}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Version:</span>
                            <span class="info-value">${project?.metadata?.version || '1.0.0'}</span>
                        </div>
                    </div>
                    
                    <div class="overview-card quick-actions-card">
                        <h4><i class="fas fa-bolt"></i> Quick Actions</h4>
                        <div class="quick-actions-grid">
                            <button onclick="DevelopModule.openInCursor()">
                                <i class="fas fa-magic"></i> Open in Cursor
                            </button>
                            <button onclick="DevelopModule.openInVSCode()">
                                <i class="fas fa-code"></i> Open in VS Code
                            </button>
                            <button onclick="DevelopModule.gitStatus()">
                                <i class="fab fa-git-alt"></i> Git Status
                            </button>
                            <button onclick="DevelopModule.runTests()">
                                <i class="fas fa-vial"></i> Run Tests
                            </button>
                        </div>
                    </div>
                    
                    <div class="overview-card stats-card">
                        <h4><i class="fas fa-chart-pie"></i> Progress Stats</h4>
                        <div class="progress-stats">
                            <div class="stat-item">
                                <div class="stat-value">${Math.round((this.currentStage / this.stages.length) * 100)}%</div>
                                <div class="stat-label">Workflow Progress</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">0</div>
                                <div class="stat-label">Open Tasks</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">0</div>
                                <div class="stat-label">Comments</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card recent-activity-card">
                        <h4><i class="fas fa-clock"></i> Recent Activity</h4>
                        <div class="activity-list">
                            <div class="activity-item">
                                <i class="fas fa-code-branch"></i>
                                <span>No recent activity</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Phases tab
     */
    renderPhasesTab() {
        return `
            <div class="tab-content phases-tab">
                <div class="phases-header">
                    <h4>Development Phases</h4>
                    <button class="btn btn-primary btn-sm" onclick="DevelopModule.addPhase()">
                        <i class="fas fa-plus"></i> Add Phase
                    </button>
                </div>
                <div class="phases-list" id="phases-list">
                    <div class="phase-item">
                        <div class="phase-number">1</div>
                        <div class="phase-content">
                            <div class="phase-name">Initial Setup</div>
                            <div class="phase-description">Set up project structure and dependencies</div>
                        </div>
                        <div class="phase-status completed">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <div class="phase-item">
                        <div class="phase-number">2</div>
                        <div class="phase-content">
                            <div class="phase-name">Core Development</div>
                            <div class="phase-description">Implement main features</div>
                        </div>
                        <div class="phase-status in-progress">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </div>
                    <div class="phase-item">
                        <div class="phase-number">3</div>
                        <div class="phase-content">
                            <div class="phase-name">Testing & QA</div>
                            <div class="phase-description">Test all functionality</div>
                        </div>
                        <div class="phase-status pending">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Tasks tab
     */
    renderTasksTab() {
        return `
            <div class="tab-content tasks-tab">
                <div class="tasks-header">
                    <h4>Tasks</h4>
                    <div class="tasks-actions">
                        <button class="btn btn-secondary btn-sm" onclick="DevelopModule.loadTasks()">
                            <i class="fas fa-sync"></i> Reload
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="DevelopModule.addTask()">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                    </div>
                </div>
                <div class="tasks-list" id="tasks-list">
                    <div class="task-item priority-high">
                        <input type="checkbox" class="task-checkbox">
                        <div class="task-content">
                            <div class="task-name">Implement user authentication</div>
                            <div class="task-meta">
                                <span class="task-priority high">High</span>
                                <span class="task-assignee"><i class="fas fa-user"></i> Developer</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button title="Edit"><i class="fas fa-edit"></i></button>
                            <button title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="task-item priority-medium">
                        <input type="checkbox" class="task-checkbox">
                        <div class="task-content">
                            <div class="task-name">Create API documentation</div>
                            <div class="task-meta">
                                <span class="task-priority medium">Medium</span>
                                <span class="task-assignee"><i class="fas fa-user"></i> Developer</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button title="Edit"><i class="fas fa-edit"></i></button>
                            <button title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Guides tab
     */
    renderGuidesTab() {
        return `
            <div class="tab-content guides-tab">
                <div class="guides-header">
                    <h4>Development Guides</h4>
                    <button class="btn btn-primary btn-sm" onclick="DevelopModule.generateGuide()">
                        <i class="fas fa-magic"></i> Generate Guide
                    </button>
                </div>
                <div class="guides-list" id="guides-list">
                    <div class="guide-item">
                        <div class="guide-icon"><i class="fas fa-book"></i></div>
                        <div class="guide-content">
                            <div class="guide-title">Getting Started</div>
                            <div class="guide-description">Quick start guide for new developers</div>
                        </div>
                        <button class="btn btn-link" onclick="DevelopModule.viewGuide('getting-started')">
                            View <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                    <div class="guide-item">
                        <div class="guide-icon"><i class="fas fa-cogs"></i></div>
                        <div class="guide-content">
                            <div class="guide-title">Configuration</div>
                            <div class="guide-description">How to configure the system</div>
                        </div>
                        <button class="btn btn-link" onclick="DevelopModule.viewGuide('configuration')">
                            View <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Attachments tab
     */
    renderAttachmentsTab() {
        return `
            <div class="tab-content attachments-tab">
                <div class="attachments-header">
                    <h4>Attachments</h4>
                    <button class="btn btn-primary btn-sm" onclick="DevelopModule.uploadAttachment()">
                        <i class="fas fa-upload"></i> Upload
                    </button>
                </div>
                <div class="attachments-grid" id="attachments-grid">
                    <div class="attachment-item">
                        <div class="attachment-icon"><i class="fas fa-file-pdf"></i></div>
                        <div class="attachment-name">specification.pdf</div>
                        <div class="attachment-size">2.4 MB</div>
                    </div>
                    <div class="attachment-item">
                        <div class="attachment-icon"><i class="fas fa-file-image"></i></div>
                        <div class="attachment-name">mockup.png</div>
                        <div class="attachment-size">856 KB</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render Comments tab
     */
    renderCommentsTab() {
        return `
            <div class="tab-content comments-tab">
                <div class="comments-list" id="comments-list">
                    <div class="comment-item">
                        <div class="comment-avatar"><i class="fas fa-user"></i></div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">Developer</span>
                                <span class="comment-date">Today at 10:30</span>
                            </div>
                            <div class="comment-text">Started working on the authentication module.</div>
                        </div>
                    </div>
                </div>
                <div class="comment-input">
                    <textarea placeholder="Add a comment..." id="new-comment"></textarea>
                    <button class="btn btn-primary" onclick="DevelopModule.addComment()">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render History tab
     */
    renderHistoryTab() {
        return `
            <div class="tab-content history-tab">
                <div class="history-list" id="history-list">
                    <div class="history-item">
                        <div class="history-icon"><i class="fas fa-code-branch"></i></div>
                        <div class="history-content">
                            <div class="history-action">Git commit: "Initial commit"</div>
                            <div class="history-meta">Today at 09:00 by Developer</div>
                        </div>
                    </div>
                    <div class="history-item">
                        <div class="history-icon"><i class="fas fa-plus"></i></div>
                        <div class="history-content">
                            <div class="history-action">Project created</div>
                            <div class="history-meta">Yesterday at 14:30 by Admin</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab click handling is done via onclick in render
    },

    /**
     * Switch tab
     */
    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab buttons
        document.querySelectorAll('.develop-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update tab content
        const contentEl = document.getElementById('develop-tab-content');
        if (contentEl) {
            contentEl.innerHTML = this.renderTabContent();
        }
    },

    /**
     * Set workflow stage
     */
    setStage(stageIndex) {
        this.currentStage = stageIndex;
        
        // Update stage UI
        document.querySelectorAll('.stage-step').forEach((step, index) => {
            step.classList.remove('completed', 'active');
            if (index < stageIndex) step.classList.add('completed');
            if (index === stageIndex) step.classList.add('active');
        });
        
        // Update progress display
        const progress = document.querySelector('.stage-progress');
        if (progress) {
            progress.textContent = `Stage ${stageIndex + 1} of ${this.stages.length}`;
        }

        showNotification(`Stage: ${this.stages[stageIndex].name}`, 'info');
    },

    /**
     * Go to next stage
     */
    nextStage() {
        if (this.currentStage < this.stages.length - 1) {
            this.setStage(this.currentStage + 1);
        }
    },

    /**
     * Go to previous stage
     */
    prevStage() {
        if (this.currentStage > 0) {
            this.setStage(this.currentStage - 1);
        }
    },

    /**
     * Auto process current stage
     */
    autoProcess() {
        const stage = this.stages[this.currentStage];
        showNotification(`Auto-processing: ${stage.name}...`, 'info');
        
        // TODO: Implement auto-processing logic for each stage
        setTimeout(() => {
            showNotification(`${stage.name} completed`, 'success');
            this.nextStage();
        }, 2000);
    },

    // Tool actions
    openTerminal() {
        const obj = StateManager.getCurrentObject();
        if (obj) app.openTool('terminal', obj.id);
    },

    runAnalysis() {
        const obj = StateManager.getCurrentObject();
        if (obj) app.openClaudeInProject(obj.id);
    },

    loadTasks() {
        showNotification('Loading tasks...', 'info');
        // TODO: Load tasks from API
    },

    incrementVersion() {
        showNotification('Version incremented', 'success');
        // TODO: Implement version increment
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
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    DevelopModule.init();
});

// Export for global access
window.DevelopModule = DevelopModule;

