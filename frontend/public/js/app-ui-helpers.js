/**
 * Module: AppUIHelpers
 * Purpose: UI utility funkce - modals, dropdowns, sidebar, search
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppUIHelpers = {
    /**
     * Initialize resizable sidebar
     */
    initResizableSidebar() {
        const handle = document.getElementById('sidebar-resize-handle');
        const sidebar = document.getElementById('categories-sidebar');
        if (!handle || !sidebar) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const diff = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(800, startWidth + diff));
            sidebar.style.width = newWidth + 'px';
            localStorage.setItem('sidebarWidth', newWidth);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });

        // Restore saved width
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            sidebar.style.width = savedWidth + 'px';
        }
    },

    /**
     * Show modal with content
     */
    showModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = content;
        modal.classList.add('show');
    },

    /**
     * Close modal - works for both static and dynamic modals
     */
    closeModal() {
        // Try static modal first
        const staticModal = document.getElementById('modal');
        if (staticModal) {
            staticModal.classList.remove('show');
        }
        
        // Also try any visible dynamic modal with common modal classes
        const dynamicModals = document.querySelectorAll('.modal[style*="display: flex"], .modal[style*="display:flex"], .modal.show');
        dynamicModals.forEach(modal => {
            modal.style.display = 'none';
            modal.remove();
        });
        
        // Remove modal overlay if exists
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(overlay => overlay.remove());
    },

    /**
     * Toggle filter dropdown
     */
    toggleFilterDropdown() {
        const dropdown = document.getElementById('filter-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                setTimeout(() => {
                    document.addEventListener('click', function closeFilter(e) {
                        if (!dropdown.contains(e.target) && !e.target.closest('.filter-dropdown-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeFilter);
                        }
                    });
                }, 100);
            }
        }
    },

    /**
     * Toggle document filter dropdown
     */
    toggleDocumentFilterDropdown() {
        const dropdown = document.getElementById('document-filter-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                setTimeout(() => {
                    document.addEventListener('click', function closeFilter(e) {
                        if (!dropdown.contains(e.target) && !e.target.closest('.document-filter-dropdown-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeFilter);
                        }
                    });
                }, 100);
            }
        }
    },

    /**
     * Toggle document view dropdown
     */
    toggleDocumentViewDropdown() {
        const dropdown = document.getElementById('document-view-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                setTimeout(() => {
                    document.addEventListener('click', function closeView(e) {
                        if (!dropdown.contains(e.target) && !e.target.closest('.document-view-dropdown-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeView);
                        }
                    });
                }, 100);
            }
        }
    },

    /**
     * Toggle tools dropdown
     */
    toggleToolsDropdown() {
        const dropdown = document.getElementById('tools-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                dropdown.innerHTML = Components.renderToolsDropdown(StateManager.getCurrentObject());

                setTimeout(() => {
                    document.addEventListener('click', function closeTools(e) {
                        if (!dropdown.contains(e.target) && !e.target.closest('#tools-toggle-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeTools);
                        }
                    });
                }, 100);
            }
        }
    },

    /**
     * Toggle object info dropdown
     */
    toggleObjectInfo(objectId) {
        const dropdown = document.getElementById(`object-info-dropdown-${objectId}`);
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                setTimeout(() => {
                    document.addEventListener('click', function closeInfo(e) {
                        if (!dropdown.contains(e.target) && !e.target.closest('.object-info-btn')) {
                            dropdown.style.display = 'none';
                            document.removeEventListener('click', closeInfo);
                        }
                    });
                }, 100);
            }
        }
    },

    /**
     * Global search
     */
    async search() {
        const query = document.getElementById('global-search').value.trim();
        if (!query) {
            Components.showToast('Please enter a search query', 'info');
            return;
        }

        try {
            const results = await API.search(query);
            Components.renderSearchResults(query, results);
        } catch (error) {
            console.error('Search error:', error);
            Components.showToast('Search failed', 'error');
        }
    },

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get file icon based on extension
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'md': 'fa-file-alt',
            'txt': 'fa-file-alt',
            'json': 'fa-file-code',
            'js': 'fa-file-code',
            'py': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'yaml': 'fa-file-code',
            'yml': 'fa-file-code',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'pdf': 'fa-file-pdf',
            'zip': 'fa-file-archive',
            'tar': 'fa-file-archive',
            'gz': 'fa-file-archive',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel'
        };
        return iconMap[ext] || 'fa-file';
    },

    /**
     * Search subcategory in select element
     */
    searchSubcategory(query, selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const options = Array.from(select.options);
        const searchTerm = query.toLowerCase();

        options.forEach(option => {
            if (option.value === '') {
                option.style.display = '';
                return;
            }
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Global search on Enter
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search();
                }
            });
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppUIHelpers = AppUIHelpers;
    
    // Global closeModal function for use in onclick handlers
    window.closeModal = function() {
        AppUIHelpers.closeModal();
    };
}

