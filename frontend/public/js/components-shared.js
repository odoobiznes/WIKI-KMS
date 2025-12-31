/**
 * KMS Components - Shared/Unified Components
 * Reusable components across all modules
 */

const SharedComponents = {
    
    /**
     * Unified Project Panel Component
     * Shows list of projects with configurable behavior for each module
     * 
     * @param {Object} options - Configuration options
     * @param {boolean} options.collapsed - Start collapsed (for Tasks, Analytics, Clients, Finance)
     * @param {Object} options.passedProject - Pre-selected project from another module
     * @param {string} options.moduleId - Current module ID
     * @param {Function} options.onProjectSelect - Callback when project is selected
     */
    renderProjectPanel(options = {}) {
        const {
            collapsed = false,
            passedProject = null,
            moduleId = 'develop',
            onProjectSelect = null
        } = options;

        const projects = StateManager.getObjects() || [];
        const currentProject = passedProject || StateManager.getCurrentObject();

        return `
            <div class="unified-project-panel ${collapsed ? 'collapsed' : ''}" id="unified-project-panel">
                <div class="project-panel-header" onclick="SharedComponents.toggleProjectPanel()">
                    <div class="project-panel-title">
                        <i class="fas fa-project-diagram"></i>
                        <span>Projects</span>
                        <span class="project-count">(${projects.length})</span>
                    </div>
                    <div class="project-panel-toggle">
                        <i class="fas fa-chevron-${collapsed ? 'down' : 'up'}"></i>
                    </div>
                </div>
                
                ${currentProject ? `
                    <div class="current-project-badge">
                        <i class="fas fa-folder-open"></i>
                        <span>${currentProject.object_name || currentProject.name}</span>
                        <button onclick="SharedComponents.passProjectToModule()" title="Pass to module">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                ` : ''}
                
                <div class="project-panel-content" style="${collapsed ? 'display: none;' : ''}">
                    <div class="project-search">
                        <input type="text" 
                               placeholder="Search projects..." 
                               oninput="SharedComponents.filterProjects(this.value)"
                               id="project-search-input">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <div class="project-list" id="project-list">
                        ${projects.length > 0 ? this.renderProjectList(projects, currentProject) : `
                            <div class="no-projects">
                                <i class="fas fa-folder-open"></i>
                                <p>No projects found</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render project list items
     */
    renderProjectList(projects, currentProject) {
        return projects.map(project => `
            <div class="project-item ${currentProject?.id === project.id ? 'selected' : ''}"
                 onclick="SharedComponents.selectProject(${project.id})"
                 data-project-id="${project.id}"
                 data-project-name="${(project.object_name || project.name || '').toLowerCase()}">
                <div class="project-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="project-info">
                    <div class="project-name">${project.object_name || project.name}</div>
                    <div class="project-path">${project.file_path || ''}</div>
                </div>
                <div class="project-actions">
                    <button onclick="event.stopPropagation(); SharedComponents.passProject(${project.id})" 
                            title="Pass to other module">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Toggle project panel collapsed state
     */
    toggleProjectPanel() {
        const panel = document.getElementById('unified-project-panel');
        const content = panel.querySelector('.project-panel-content');
        const icon = panel.querySelector('.project-panel-toggle i');
        
        panel.classList.toggle('collapsed');
        
        if (panel.classList.contains('collapsed')) {
            content.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        } else {
            content.style.display = '';
            icon.className = 'fas fa-chevron-up';
        }
    },

    /**
     * Filter projects by search term
     */
    filterProjects(searchTerm) {
        const items = document.querySelectorAll('.project-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.dataset.projectName || '';
            item.style.display = name.includes(term) ? '' : 'none';
        });
    },

    /**
     * Select a project
     */
    selectProject(projectId) {
        const projects = StateManager.getObjects() || [];
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            StateManager.setCurrentObject(project);
            
            // Update UI
            document.querySelectorAll('.project-item').forEach(item => {
                item.classList.toggle('selected', parseInt(item.dataset.projectId) === projectId);
            });
            
            // Update current project badge
            const badge = document.querySelector('.current-project-badge span');
            if (badge) {
                badge.textContent = project.object_name || project.name;
            }
            
            // Load project data based on current module
            if (typeof app !== 'undefined' && app.loadObject) {
                app.loadObject(projectId);
            }
            
            // Emit event
            document.dispatchEvent(new CustomEvent('projectSelected', {
                detail: { project }
            }));
        }
    },

    /**
     * Pass project to another module
     */
    passProject(projectId) {
        const projects = StateManager.getObjects() || [];
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return;
        
        // Show module selector modal
        const modalHtml = `
            <div id="pass-project-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-arrow-up"></i> Pass Project</h2>
                        <span class="close-btn" onclick="document.getElementById('pass-project-modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 1rem;">
                            <strong>${project.object_name || project.name}</strong>
                        </p>
                        <p style="color: #7f8c8d; margin-bottom: 1rem;">
                            Select target module:
                        </p>
                        <div class="module-selector">
                            ${Object.values(ModuleRouter.modules).map(mod => `
                                <button class="module-select-btn" 
                                        onclick="SharedComponents.executePassProject(${projectId}, '${mod.id}')"
                                        style="--module-color: ${mod.color}">
                                    <i class="fas ${mod.icon}"></i>
                                    <span>${mod.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Execute project pass to module
     */
    executePassProject(projectId, moduleId) {
        const projects = StateManager.getObjects() || [];
        const project = projects.find(p => p.id === projectId);
        
        if (project && typeof ModuleRouter !== 'undefined') {
            ModuleRouter.passProjectTo(moduleId, project);
        }
        
        // Close modal
        const modal = document.getElementById('pass-project-modal');
        if (modal) modal.remove();
    },

    /**
     * Pass current project to module selector
     */
    passProjectToModule() {
        const currentProject = StateManager.getCurrentObject();
        if (currentProject) {
            this.passProject(currentProject.id);
        }
    },

    /**
     * Unified Toolbar Component
     * Module-specific toolbar with common and custom actions
     * 
     * @param {Object} options - Configuration options
     * @param {string} options.moduleId - Current module ID
     * @param {Array} options.customTools - Custom tools for this module
     * @param {boolean} options.showCommonTools - Show common tools (terminal, git, etc.)
     */
    renderUnifiedToolbar(options = {}) {
        const {
            moduleId = 'develop',
            customTools = [],
            showCommonTools = true
        } = options;

        const currentObject = StateManager.getCurrentObject();
        const module = typeof ModuleRouter !== 'undefined' ? ModuleRouter.modules[moduleId] : null;

        const commonTools = showCommonTools ? [
            { id: 'terminal', icon: 'fa-terminal', label: 'Terminal', action: `app.openTool('terminal', ${currentObject?.id || 0})` },
            { id: 'vscode', icon: 'fa-code', label: 'VS Code', action: `app.openTool('vscode', ${currentObject?.id || 0})` },
            { id: 'git-status', icon: 'fa-git-alt', label: 'Git Status', action: `app.gitOperation(${currentObject?.id || 0}, 'status')` },
            { id: 'claude', icon: 'fa-robot', label: 'Claude AI', action: `app.openClaudeInProject(${currentObject?.id || 0})` }
        ] : [];

        const allTools = [...commonTools, ...customTools];

        return `
            <div class="unified-toolbar" id="unified-toolbar">
                <div class="toolbar-section common-tools">
                    ${commonTools.map(tool => `
                        <button class="toolbar-btn" 
                                onclick="${tool.action}" 
                                title="${tool.label}"
                                ${!currentObject ? 'disabled' : ''}>
                            <i class="fas ${tool.icon}"></i>
                            <span class="toolbar-label">${tool.label}</span>
                        </button>
                    `).join('')}
                </div>
                
                ${customTools.length > 0 ? `
                    <div class="toolbar-divider"></div>
                    <div class="toolbar-section module-tools">
                        ${customTools.map(tool => `
                            <button class="toolbar-btn ${tool.primary ? 'primary' : ''}" 
                                    onclick="${tool.action}" 
                                    title="${tool.label}"
                                    ${tool.requiresProject && !currentObject ? 'disabled' : ''}>
                                <i class="fas ${tool.icon}"></i>
                                <span class="toolbar-label">${tool.label}</span>
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${currentObject ? `
                    <div class="toolbar-divider"></div>
                    <div class="toolbar-project-info">
                        <i class="fas fa-folder-open"></i>
                        <span>${currentObject.object_name || currentObject.name}</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render hidden projects toggle
     * For modules that hide projects by default
     */
    renderHiddenProjectsToggle(isHidden = true) {
        return `
            <div class="hidden-projects-toggle">
                <button onclick="SharedComponents.toggleHiddenProjects()" 
                        class="toggle-btn ${isHidden ? '' : 'active'}">
                    <i class="fas fa-${isHidden ? 'eye-slash' : 'eye'}"></i>
                    <span>${isHidden ? 'Show Projects' : 'Hide Projects'}</span>
                </button>
            </div>
        `;
    },

    /**
     * Toggle hidden projects visibility
     */
    toggleHiddenProjects() {
        const panel = document.getElementById('unified-project-panel');
        const toggle = document.querySelector('.hidden-projects-toggle .toggle-btn');
        const icon = toggle.querySelector('i');
        const text = toggle.querySelector('span');
        
        if (panel.classList.contains('collapsed')) {
            panel.classList.remove('collapsed');
            panel.querySelector('.project-panel-content').style.display = '';
            toggle.classList.add('active');
            icon.className = 'fas fa-eye';
            text.textContent = 'Hide Projects';
        } else {
            panel.classList.add('collapsed');
            panel.querySelector('.project-panel-content').style.display = 'none';
            toggle.classList.remove('active');
            icon.className = 'fas fa-eye-slash';
            text.textContent = 'Show Projects';
        }
    },

    /**
     * Render stage workflow component
     * For DEVELOP module stage progression
     */
    renderStageWorkflow(stages = [], currentStage = 0) {
        const defaultStages = [
            { id: 'analyze', name: 'Analyze', icon: 'fa-search' },
            { id: 'create-tz', name: 'Create TZ', icon: 'fa-file-alt' },
            { id: 'approve', name: 'Approve', icon: 'fa-check-circle' },
            { id: 'realize', name: 'Realize', icon: 'fa-cogs' },
            { id: 'security', name: 'Security', icon: 'fa-shield-alt' },
            { id: 'test', name: 'Test', icon: 'fa-vial' },
            { id: 'fix', name: 'Fix', icon: 'fa-wrench' },
            { id: 'docs', name: 'Docs', icon: 'fa-book' }
        ];

        const workflowStages = stages.length > 0 ? stages : defaultStages;

        return `
            <div class="stage-workflow">
                ${workflowStages.map((stage, index) => `
                    <div class="stage-item ${index < currentStage ? 'completed' : ''} ${index === currentStage ? 'active' : ''}"
                         onclick="SharedComponents.setStage(${index})">
                        <div class="stage-icon">
                            <i class="fas ${stage.icon}"></i>
                        </div>
                        <div class="stage-name">${stage.name}</div>
                        ${index < workflowStages.length - 1 ? '<div class="stage-connector"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Set workflow stage
     */
    setStage(stageIndex) {
        document.querySelectorAll('.stage-item').forEach((item, index) => {
            item.classList.remove('active', 'completed');
            if (index < stageIndex) item.classList.add('completed');
            if (index === stageIndex) item.classList.add('active');
        });

        // Save stage to project metadata
        const currentObject = StateManager.getCurrentObject();
        if (currentObject) {
            // TODO: Save to API
            showNotification(`Stage updated`, 'success');
        }
    },

    /**
     * Initialize shared components
     */
    init() {
        console.log('🧩 SharedComponents initialized');
        
        // Add styles for shared components
        if (!document.getElementById('shared-components-styles')) {
            const styles = `
                <style id="shared-components-styles">
                    /* Project Panel Styles */
                    .unified-project-panel {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                        margin-bottom: 1rem;
                        overflow: hidden;
                    }
                    
                    .project-panel-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        background: #f8f9fa;
                        cursor: pointer;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .project-panel-header:hover {
                        background: #e9ecef;
                    }
                    
                    .project-panel-title {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    
                    .project-count {
                        color: #7f8c8d;
                        font-weight: normal;
                        font-size: 0.9rem;
                    }
                    
                    .current-project-badge {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: #e8f4fd;
                        border-bottom: 1px solid #b8daff;
                        font-size: 0.9rem;
                    }
                    
                    .current-project-badge button {
                        margin-left: auto;
                        background: none;
                        border: none;
                        color: #3498db;
                        cursor: pointer;
                        padding: 0.25rem;
                    }
                    
                    .project-search {
                        position: relative;
                        padding: 0.75rem;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .project-search input {
                        width: 100%;
                        padding: 0.5rem 0.75rem 0.5rem 2rem;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 0.9rem;
                    }
                    
                    .project-search i {
                        position: absolute;
                        left: 1.25rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #adb5bd;
                    }
                    
                    .project-list {
                        max-height: 300px;
                        overflow-y: auto;
                    }
                    
                    .project-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem 1rem;
                        cursor: pointer;
                        transition: background 0.2s;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    
                    .project-item:hover {
                        background: #f8f9fa;
                    }
                    
                    .project-item.selected {
                        background: #e8f4fd;
                        border-left: 3px solid #3498db;
                    }
                    
                    .project-icon {
                        color: #f39c12;
                    }
                    
                    .project-info {
                        flex: 1;
                        min-width: 0;
                    }
                    
                    .project-name {
                        font-weight: 500;
                        color: #2c3e50;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .project-path {
                        font-size: 0.75rem;
                        color: #7f8c8d;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .project-actions button {
                        background: none;
                        border: none;
                        color: #adb5bd;
                        cursor: pointer;
                        padding: 0.25rem;
                        transition: color 0.2s;
                    }
                    
                    .project-actions button:hover {
                        color: #3498db;
                    }
                    
                    .no-projects {
                        text-align: center;
                        padding: 2rem;
                        color: #7f8c8d;
                    }
                    
                    .no-projects i {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    /* Module Selector */
                    .module-selector {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.5rem;
                    }
                    
                    .module-select-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem;
                        background: #f8f9fa;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .module-select-btn:hover {
                        background: var(--module-color);
                        border-color: var(--module-color);
                        color: white;
                    }
                    
                    /* Unified Toolbar */
                    .unified-toolbar {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: #f8f9fa;
                        border-bottom: 1px solid #e9ecef;
                        flex-wrap: wrap;
                    }
                    
                    .toolbar-section {
                        display: flex;
                        gap: 0.25rem;
                    }
                    
                    .toolbar-divider {
                        width: 1px;
                        height: 24px;
                        background: #ddd;
                        margin: 0 0.5rem;
                    }
                    
                    .toolbar-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.35rem;
                        padding: 0.4rem 0.6rem;
                        background: white;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.8rem;
                        transition: all 0.2s;
                    }
                    
                    .toolbar-btn:hover:not(:disabled) {
                        background: #3498db;
                        border-color: #3498db;
                        color: white;
                    }
                    
                    .toolbar-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    .toolbar-btn.primary {
                        background: #3498db;
                        border-color: #3498db;
                        color: white;
                    }
                    
                    .toolbar-btn.primary:hover {
                        background: #2980b9;
                    }
                    
                    .toolbar-project-info {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.4rem 0.75rem;
                        background: #e8f4fd;
                        border-radius: 4px;
                        font-size: 0.85rem;
                        color: #0c5460;
                        margin-left: auto;
                    }
                    
                    /* Hidden Projects Toggle */
                    .hidden-projects-toggle {
                        margin-bottom: 1rem;
                    }
                    
                    .hidden-projects-toggle .toggle-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: #f8f9fa;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .hidden-projects-toggle .toggle-btn:hover,
                    .hidden-projects-toggle .toggle-btn.active {
                        background: #3498db;
                        border-color: #3498db;
                        color: white;
                    }
                    
                    /* Stage Workflow */
                    .stage-workflow {
                        display: flex;
                        align-items: center;
                        padding: 1rem;
                        overflow-x: auto;
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                    }
                    
                    .stage-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                        position: relative;
                        cursor: pointer;
                        min-width: 80px;
                    }
                    
                    .stage-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: #e9ecef;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6c757d;
                        transition: all 0.2s;
                    }
                    
                    .stage-item.completed .stage-icon {
                        background: #27ae60;
                        color: white;
                    }
                    
                    .stage-item.active .stage-icon {
                        background: #3498db;
                        color: white;
                        box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
                    }
                    
                    .stage-name {
                        font-size: 0.75rem;
                        color: #6c757d;
                        text-align: center;
                    }
                    
                    .stage-item.active .stage-name,
                    .stage-item.completed .stage-name {
                        color: #2c3e50;
                        font-weight: 500;
                    }
                    
                    .stage-connector {
                        position: absolute;
                        right: -20px;
                        top: 20px;
                        width: 40px;
                        height: 2px;
                        background: #e9ecef;
                    }
                    
                    .stage-item.completed .stage-connector {
                        background: #27ae60;
                    }
                    
                    @media (max-width: 768px) {
                        .toolbar-label {
                            display: none;
                        }
                        
                        .module-selector {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    SharedComponents.init();
});

// Export for global access
window.SharedComponents = SharedComponents;

