/**
 * KMS Components - Main file
 * 
 * This file initializes the Components object and serves as the entry point.
 * Individual components are loaded from separate module files:
 * - components-base.js: Helper functions and utilities
 * - components-categories.js: Category tree rendering
 * - components-objects.js: Object view rendering
 * - components-documents.js: Document rendering (tiles, list, kanban)
 * - components-forms.js: Form rendering for CRUD operations
 * - components-tools.js: Tools dropdown and Claude modal
 * 
 * Total lines before refactoring: 990
 * Now split into ~150-200 lines per file
 */

// Initialize Components namespace
if (typeof Components === 'undefined') {
    window.Components = {};
}

// Log initialization
console.log('KMS Components initialized');
