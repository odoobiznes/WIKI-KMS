/**
 * KMS Application - Main Entry Point
 * Purpose: Integruje všechny moduly a poskytuje jednotné API
 * Dependencies: api.js, components.js, js/*.js moduly
 * Author: KMS Team
 * Version: 2.0.0
 * 
 * Modular Architecture:
 * - app-state.js: State management
 * - app-auth.js: Authentication
 * - app-ui-helpers.js: UI utilities
 * - app-categories.js: Category management
 * - app-objects.js: Object/Project management
 * - app-documents.js: Document management
 * - app-tools.js: Tool integrations
 * - app-git.js: Git operations
 * - app-stats.js: Statistics
 * - app-folders.js: Folder browser
 * - app-folder-picker.js: Folder picker
 * - app-import.js: Import/Export
 * - app-forms.js: Form handling
 */

// Check authentication on app load
if (!API.getToken() && !window.location.pathname.includes('login.html')) {
    window.location.href = '/login.html';
}

// Main Application - Facade pattern for backward compatibility
const app = {
    // State reference
    get state() {
        return AppState;
    },

    // ==================== INITIALIZATION ====================
    async init() {
        console.log('KMS App initializing (modular architecture v2.0)...');

        // Initialize resizable sidebar
        AppUIHelpers.initResizableSidebar();

        // Restore selected project from localStorage
        this.restoreSelectedProject();

        // Show loading state
        const mainView = document.getElementById('main-view');
        const categoriesTree = document.getElementById('categories-tree');

        if (categoriesTree) {
            categoriesTree.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        }

        try {
            // Load user info
            await AppAuth.loadUserInfo();

            // Load data in parallel for faster startup
            const [categories, stats, health] = await Promise.allSettled([
                API.getCategories(),
                API.getStats(),
                API.getHealth()
            ]);

            // Process categories
            if (categories.status === 'fulfilled') {
                StateManager.setCategories(categories.value);
                Components.renderCategoriesTree(categories.value, StateManager.getCurrentFilter(), StateManager.getExpandedCategories());
            } else {
                console.error('Failed to load categories:', categories.reason);
                const errorMsg = categories.reason?.message || categories.reason?.detail || 'Neznámá chyba';
                if (categoriesTree) {
                    categoriesTree.innerHTML = `<div class="text-center p-3 text-danger">
                        <i class="fas fa-exclamation-triangle"></i> Failed to load<br>
                        <small style="color: #999;">${errorMsg}</small>
                    </div>`;
                }
            }

            // Process stats
            if (stats.status === 'fulfilled') {
                const statCat = document.getElementById('stat-categories');
                const statObj = document.getElementById('stat-objects');
                const statDoc = document.getElementById('stat-documents');
                if (statCat) statCat.textContent = stats.value.counts?.categories || 0;
                if (statObj) statObj.textContent = stats.value.counts?.objects || 0;
                if (statDoc) statDoc.textContent = stats.value.counts?.documents || 0;
            }

            // Process health
            const statusEl = document.getElementById('sync-status');
            if (health.status === 'fulfilled' && health.value.status === 'healthy') {
                statusEl.innerHTML = '<i class="fas fa-circle"></i>';
                statusEl.title = 'Healthy';
            } else {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i>';
                statusEl.title = 'Unhealthy';
            }

            // Setup event listeners
            AppUIHelpers.setupEventListeners();

            console.log('KMS App initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            Components.showToast('Failed to initialize app', 'error');

            if (mainView) {
                mainView.innerHTML = `
                    <div class="alert alert-danger m-4">
                        <h4><i class="fas fa-exclamation-triangle"></i> Failed to Initialize</h4>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
            }
        }
    },

    // ==================== CATEGORIES ====================
    loadCategories: () => AppCategories.loadCategories(),
    filterCategories: (filter) => AppCategories.filterCategories(filter),
    toggleCategory: (categoryId) => AppCategories.toggleCategory(categoryId),
    toggleSubcategory: (subcategoryId) => AppCategories.toggleSubcategory(subcategoryId),
    selectCategory: (categoryId) => AppCategories.selectCategory(categoryId),
    createCategory: () => AppCategories.createCategory(),
    editCategory: (categoryId) => AppCategories.editCategory(categoryId),
    deleteCategory: (categoryId) => AppCategories.deleteCategory(categoryId),
    createSubcategoryInCategory: (categoryId) => AppCategories.createSubcategoryInCategory(categoryId),
    editSubcategory: (subcategoryId) => AppCategories.editSubcategory(subcategoryId),
    deleteSubcategory: (subcategoryId) => AppCategories.deleteSubcategory(subcategoryId),
    loadCategoryChildren: (categoryId, container) => AppCategories.loadCategoryChildren(categoryId, container),
    loadSubcategoryProjects: (subcategoryId, container) => AppCategories.loadSubcategoryProjects(subcategoryId, container),

    // ==================== OBJECTS ====================
    selectObject: (objectId) => AppObjects.selectObject(objectId),
    createObjectInCategory: (categoryId) => AppObjects.createObjectInCategory(categoryId),
    createObjectInSubcategory: (subcategoryId, categoryId) => AppObjects.createObjectInSubcategory(subcategoryId, categoryId),
    editProject: (projectId) => AppObjects.editProject(projectId),
    deleteProject: (projectId) => AppObjects.deleteProject(projectId),
    submitObjectForm: (event, categoryId, objectId) => AppObjects.submitObjectForm(event, categoryId, objectId),

    // ==================== DOCUMENTS ====================
    viewDocument: (documentId) => AppDocuments.viewDocument(documentId),
    saveDocument: (documentId) => AppDocuments.saveDocument(documentId),
    createDocument: (objectId) => AppDocuments.createDocument(objectId),
    editDocumentMetadata: (documentId) => AppDocuments.editDocumentMetadata(documentId),
    submitDocumentCreate: (objectId, documentId) => AppDocuments.submitDocumentCreate(objectId, documentId),
    deleteDocument: (documentId) => AppDocuments.deleteDocument(documentId),
    editDocument: (documentId) => AppDocuments.editDocument(documentId),
    filterDocuments: (filter) => AppDocuments.filterDocuments(filter),
    setDocumentView: (view) => AppDocuments.setDocumentView(view),
    getFilteredDocuments: (documents) => AppDocuments.getFilteredDocuments(documents),
    applyDocumentFilter: () => AppDocuments.applyDocumentFilter(),

    // ==================== TOOLS ====================
    openTool: (tool, objectId) => AppTools.openTool(tool, objectId),
    openLocalTerminal: (objectId) => AppTools.openLocalTerminal(objectId),
    openClaudModal: (objectId) => AppTools.openClaudModal(objectId),
    closeClaudeModal: () => AppTools.closeClaudeModal(),
    sendClaudeMessage: () => AppTools.sendClaudeMessage(),
    openClaudeInProject: (objectId) => AppTools.openClaudeInProject(objectId),
    openClaudeInLocalTerminal: (objectId) => AppTools.openClaudeInLocalTerminal(objectId),
    get currentClaudeObjectId() { return StateManager.getCurrentClaudeObjectId(); },
    set currentClaudeObjectId(val) { StateManager.setCurrentClaudeObjectId(val); },

    // ==================== GIT ====================
    gitOperation: (objectId, operation) => AppGit.gitOperation(objectId, operation),

    // ==================== STATS ====================
    loadStats: () => AppStats.loadStats(),
    checkHealth: () => AppStats.checkHealth(),
    refresh: () => AppStats.refresh(),

    // ==================== FOLDERS ====================
    renderFolderContents: (object, folderPath, viewMode) => AppFolders.renderFolderContents(object, folderPath, viewMode),
    navigateProjectFolder: (path, type, objectId) => AppFolders.navigateProjectFolder(path, type, objectId),
    navigateProjectFolderUp: (objectId) => AppFolders.navigateProjectFolderUp(objectId),
    toggleProjectFolderView: (objectId) => AppFolders.toggleProjectFolderView(objectId),
    openFile: (filePath) => AppFolders.openFile(filePath),
    getFileIcon: (filename) => AppUIHelpers.getFileIcon(filename),

    // ==================== FOLDER PICKER ====================
    openFolderPicker: (inputId, startPath, allowAny) => AppFolderPicker.openFolderPicker(inputId, startPath, allowAny),
    closeFolderPicker: () => AppFolderPicker.closeFolderPicker(),
    loadMCPanel: (panel, path) => AppFolderPicker.loadMCPanel(panel, path),
    selectMCItem: (panel, index, path, type) => AppFolderPicker.selectMCItem(panel, index, path, type),
    openMCItem: (panel, path, type) => AppFolderPicker.openMCItem(panel, path, type),
    navigateMCUp: () => AppFolderPicker.navigateMCUp(),
    navigateToManualPathMC: () => AppFolderPicker.navigateToManualPathMC(),
    selectFolderPathMC: (inputId) => AppFolderPicker.selectFolderPathMC(inputId),
    createNewFolderMC: () => AppFolderPicker.createNewFolderMC(),
    closeNewFolderModal: () => AppFolderPicker.closeNewFolderModal(),
    submitNewFolder: (currentPath) => AppFolderPicker.submitNewFolder(currentPath),
    get mcState() { return StateManager.getMCState(); },
    set mcState(val) { StateManager.setMCState(val); },

    // ==================== IMPORT/EXPORT ====================
    showImportModal: (objectId) => AppImport.showImportModal(objectId),
    updateImportForm: () => AppImport.updateImportForm(),
    submitImport: (event, objectId) => AppImport.submitImport(event, objectId),
    showExportModal: (objectId) => AppImport.showExportModal(objectId),
    selectExportFolder: () => AppImport.selectExportFolder(),
    submitExport: (event, objectId) => AppImport.submitExport(event, objectId),

    // ==================== FORMS ====================
    submitCategoryForm: (event, categoryId, editType) => AppForms.submitCategoryForm(event, categoryId, editType),
    handleEditTypeChange: (currentType, categoryId, isEmpty) => AppForms.handleEditTypeChange(currentType, categoryId, isEmpty),
    submitSubcategoryForm: (event, categoryId, subcategoryId, editType) => AppForms.submitSubcategoryForm(event, categoryId, subcategoryId, editType),
    handleEditTypeChangeSubcategory: (currentType, subcategoryId, isEmpty) => AppForms.handleEditTypeChangeSubcategory(currentType, subcategoryId, isEmpty),

    // ==================== UI HELPERS ====================
    showModal: (content) => AppUIHelpers.showModal(content),
    closeModal: () => AppUIHelpers.closeModal(),
    toggleFilterDropdown: () => AppUIHelpers.toggleFilterDropdown(),
    toggleDocumentFilterDropdown: () => AppUIHelpers.toggleDocumentFilterDropdown(),
    toggleDocumentViewDropdown: () => AppUIHelpers.toggleDocumentViewDropdown(),
    toggleToolsDropdown: () => AppUIHelpers.toggleToolsDropdown(),
    toggleObjectInfo: (objectId) => AppUIHelpers.toggleObjectInfo(objectId),
    search: () => AppUIHelpers.search(),
    searchSubcategory: (query, selectId) => AppUIHelpers.searchSubcategory(query, selectId),
    escapeHtml: (text) => AppUIHelpers.escapeHtml(text),
    initResizableSidebar: () => AppUIHelpers.initResizableSidebar(),

    // ==================== AUTH ====================
    loadUserInfo: () => AppAuth.loadUserInfo(),
    toggleUserMenu: () => AppAuth.toggleUserMenu(),
    logout: () => AppAuth.logout(),
    showChangePassword: () => AppAuth.showChangePassword(),

    // ==================== CATEGORIES SIDEBAR ====================
    projectSelectorOpen: false,
    
    toggleProjectSelector() {
        this.projectSelectorOpen = !this.projectSelectorOpen;
        const sidebar = document.getElementById('categories-sidebar');
        const btn = document.querySelector('.module-nav-btn.categories-btn');
        
        if (this.projectSelectorOpen) {
            if (sidebar) sidebar.style.display = 'flex';
            btn?.classList.add('active');
                } else {
            if (sidebar) sidebar.style.display = 'none';
            btn?.classList.remove('active');
        }
    },
    
    closeProjectSelector() {
        // Don't auto-close sidebar - keep it open for browsing
        // User can toggle it manually with the button
    },
    
    updateHeaderProject(project) {
        const headerName = document.getElementById('header-project-name');
        const headerContainer = document.getElementById('header-current-project');
        
        // Get project name - API uses object_name, not name
        const projectName = project?.object_name || project?.name;
        
        if (headerName) {
            if (project && projectName) {
                headerName.textContent = projectName;
                headerContainer?.classList.remove('no-project');
                // Save to localStorage
                localStorage.setItem('kms-selected-project', JSON.stringify({
                    id: project.id,
                    name: projectName
                }));
                } else {
                headerName.textContent = 'No project selected';
                headerContainer?.classList.add('no-project');
            }
        }
    },
    
    restoreSelectedProject() {
        const saved = localStorage.getItem('kms-selected-project');
        if (saved) {
            try {
                const project = JSON.parse(saved);
                // Update header
                const headerName = document.getElementById('header-project-name');
                const headerContainer = document.getElementById('header-current-project');
                if (headerName && project.name) {
                    headerName.textContent = project.name;
                    headerContainer?.classList.remove('no-project');
                }
                // Auto-load the saved project
                if (project.id) {
                    // Load project asynchronously
                    setTimeout(() => AppObjects.selectObject(project.id), 500);
                }
            } catch (e) {
                console.warn('Failed to restore project:', e);
            }
        }
    },

    // ==================== LEGACY SUPPORT ====================
    // Keep these for any old code that may still reference them directly
    folderPickerState: null,
    importState: null,
    
    // Drag and drop handlers (placeholder - implement if needed)
    handleDragStart: (event, id, type, subcategoryId) => {
        event.dataTransfer.setData('application/json', JSON.stringify({ id, type, subcategoryId }));
    },
    handleDragOver: (event) => {
        event.preventDefault();
    },
    handleDrop: (event, targetId, targetType, targetSubcategoryId) => {
        event.preventDefault();
        // Implement drag-drop logic if needed
    },
    handleDragEnd: (event) => {
        // Clean up after drag
    },
    
    // Synch modal
    showSynchModal: async function(objectId) {
        // Forward to AppImport or implement separately
        Components.showToast('Synchronizace bude implementována', 'info');
    },
    selectSynchFolder: function() {
        if ('showDirectoryPicker' in window) {
            window.showDirectoryPicker().then(handle => {
                AppState.synchFolderPath = handle.name;
                document.getElementById('synch-folder-selected').style.display = 'block';
                document.getElementById('synch-folder-name').textContent = handle.name;
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    Components.showToast('Chyba při výběru složky', 'error');
                }
            });
        }
    },
    submitSynch: async function(event, objectId) {
        event.preventDefault();
        Components.showToast('Synchronizace bude implementována', 'info');
    },

    // File content modal (forward to AppFolders)
    showFileContentModal: (fileName, content, contentType) => AppFolders.showFileContentModal(fileName, content, contentType),
    closeFileContentModal: () => AppFolders.closeFileContentModal(),
    showImageModal: (fileName, imageUrl) => AppFolders.showImageModal(fileName, imageUrl),
    closeImageModal: () => AppFolders.closeImageModal(),
    downloadFileContent: (fileName, content) => AppFolders.downloadFileContent(fileName, content),
    
    // Open folder (legacy)
    openFolder: function(path) {
        Components.showToast('Navigace do složky zatím není implementována', 'info');
    },

    // Legacy folder picker methods
    navigateToManualPath: async function() {
        const input = document.getElementById('folder-path-manual');
        if (input && input.value.trim()) {
            await this.loadFolderPicker(input.value.trim());
        }
    },
    createNewFolder: async function() {
        AppFolderPicker.createNewFolderMC();
    },
    loadFolderPicker: async function(path) {
        // Legacy - forward to MC panel
        AppFolderPicker.loadMCPanel('single', path);
    },
    navigateUp: function() {
        AppFolderPicker.navigateMCUp();
    },
    selectFolderPath: function(inputIdOrPath) {
        if (typeof inputIdOrPath === 'string' && inputIdOrPath.startsWith('/')) {
            const mcState = StateManager.getMCState() || {};
            mcState.selectedPath = inputIdOrPath;
            StateManager.setMCState(mcState);
            inputIdOrPath = mcState.inputId;
        }
        AppFolderPicker.selectFolderPathMC(inputIdOrPath);
    },
    selectCurrentFolder: function() {
        const mcState = StateManager.getMCState();
        if (mcState && mcState.currentPath) {
            this.selectFolderPath(mcState.currentPath);
        }
    },
    showImportOption: function(folderPath, inputId) {
        if (confirm(`Chceš importovat projekt do složky?\n\n${folderPath}`)) {
            AppImport.showImportModal(StateManager.getCurrentObject()?.id);
        }
    },
    openImportModal: function(targetPath, inputId) {
        AppImport.showImportModal(StateManager.getCurrentObject()?.id);
    },
    handleImportSourceChange: function() {
        AppImport.updateImportForm();
    },
    startImport: function(targetPath) {
        // Legacy - form submit handles this
    },
    closeImportModal: function() {
        AppUIHelpers.closeModal();
    },
    updateMCPanelSelection: (panel) => AppFolderPicker.updateMCPanelSelection(panel),
    updateMCPanelBorders: () => {}, // Not needed for single panel
    switchMCPanel: () => {}, // Not needed for single panel
    navigateMCDown: () => AppFolderPicker.navigateMCDown(),
    navigateMCUpInList: () => AppFolderPicker.navigateMCUpInList(),
    navigateMCEnter: () => AppFolderPicker.navigateMCEnter(),
    setupMCKeyboard: () => AppFolderPicker.setupMCKeyboard(),
    updateMCStatus: () => AppFolderPicker.updateMCStatus(),

    // Folder view helpers
    renderFolderTreeView: (object, folderPath, files) => AppFolders.renderFolderTreeView(object, folderPath, files),
    renderFolderListView: (object, folderPath, files) => AppFolders.renderFolderListView(object, folderPath, files)
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
