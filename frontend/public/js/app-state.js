/**
 * Module: AppState
 * Purpose: Centralizovaný state management pro KMS aplikaci
 * Dependencies: None
 * Author: KMS Team
 * Version: 1.0.0
 */

// Application State
const AppState = {
    categories: [],
    currentCategory: null,
    currentObject: null,
    currentFilter: 'all',
    currentDocumentFilter: 'all',
    documentView: 'list',
    expandedCategories: {},
    documents: [],
    projectFolders: {}, // Store folder paths for each project
    currentFolderPath: null, // Current folder path being viewed
    currentFolderFiles: [], // Current folder files
    projectFolderViewMode: 'tree', // 'tree' or 'list'
    currentClaudeObjectId: null,
    exportFolderPath: null,
    synchFolderPath: null,
    folderPickerState: null,
    mcState: null,
    importState: null,
    selectedImportFiles: null  // Files selected for import via drag & drop
};

// State getters and setters
const StateManager = {
    get(key) {
        return AppState[key];
    },
    
    set(key, value) {
        AppState[key] = value;
    },
    
    getState() {
        return AppState;
    },
    
    // Categories
    getCategories() {
        return AppState.categories;
    },
    
    setCategories(categories) {
        AppState.categories = categories;
    },
    
    getCurrentCategory() {
        return AppState.currentCategory;
    },
    
    setCurrentCategory(category) {
        AppState.currentCategory = category;
    },
    
    // Objects
    getCurrentObject() {
        return AppState.currentObject;
    },
    
    setCurrentObject(object) {
        AppState.currentObject = object;
    },
    
    // Documents
    getDocuments() {
        return AppState.documents;
    },
    
    setDocuments(documents) {
        AppState.documents = documents;
    },
    
    // Filters
    getCurrentFilter() {
        return AppState.currentFilter;
    },
    
    setCurrentFilter(filter) {
        AppState.currentFilter = filter;
    },
    
    getCurrentDocumentFilter() {
        return AppState.currentDocumentFilter;
    },
    
    setCurrentDocumentFilter(filter) {
        AppState.currentDocumentFilter = filter;
    },
    
    // View modes
    getDocumentView() {
        return AppState.documentView;
    },
    
    setDocumentView(view) {
        AppState.documentView = view;
    },
    
    getProjectFolderViewMode() {
        return AppState.projectFolderViewMode;
    },
    
    setProjectFolderViewMode(mode) {
        AppState.projectFolderViewMode = mode;
    },
    
    // Expanded categories
    getExpandedCategories() {
        return AppState.expandedCategories;
    },
    
    isExpanded(categoryId) {
        return AppState.expandedCategories[categoryId] || false;
    },
    
    setExpanded(categoryId, expanded) {
        if (!AppState.expandedCategories) {
            AppState.expandedCategories = {};
        }
        AppState.expandedCategories[categoryId] = expanded;
    },
    
    collapseAll() {
        Object.keys(AppState.expandedCategories).forEach(id => {
            AppState.expandedCategories[id] = false;
        });
    },
    
    // Project folders
    getProjectFolder(objectId) {
        return AppState.projectFolders[objectId];
    },
    
    setProjectFolder(objectId, path) {
        if (!AppState.projectFolders) {
            AppState.projectFolders = {};
        }
        AppState.projectFolders[objectId] = path;
    },
    
    // Current folder
    getCurrentFolderPath() {
        return AppState.currentFolderPath;
    },
    
    setCurrentFolderPath(path) {
        AppState.currentFolderPath = path;
    },
    
    getCurrentFolderFiles() {
        return AppState.currentFolderFiles;
    },
    
    setCurrentFolderFiles(files) {
        AppState.currentFolderFiles = files;
    },
    
    // Claude
    getCurrentClaudeObjectId() {
        return AppState.currentClaudeObjectId;
    },
    
    setCurrentClaudeObjectId(id) {
        AppState.currentClaudeObjectId = id;
    },
    
    // MC State (folder picker)
    getMCState() {
        return AppState.mcState;
    },
    
    setMCState(state) {
        AppState.mcState = state;
    },
    
    // Folder picker state
    getFolderPickerState() {
        return AppState.folderPickerState;
    },
    
    setFolderPickerState(state) {
        AppState.folderPickerState = state;
    },
    
    // Import state
    getImportState() {
        return AppState.importState;
    },
    
    setImportState(state) {
        AppState.importState = state;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppState = AppState;
    window.StateManager = StateManager;
}

