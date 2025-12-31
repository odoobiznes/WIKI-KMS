/**
 * Module: AppDocuments
 * Purpose: Správa dokumentů - zobrazení, vytváření, editace, mazání
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppDocuments = {
    /**
     * View document content
     */
    async viewDocument(documentId) {
        try {
            const [document, content] = await Promise.all([
                API.getDocument(documentId),
                API.getDocumentContent(documentId)
            ]);

            Components.renderDocumentViewer(document, content);
        } catch (error) {
            console.error('Error viewing document:', error);
            Components.showToast('Failed to load document', 'error');
        }
    },

    /**
     * Save document content
     */
    async saveDocument(documentId) {
        try {
            const textarea = document.getElementById('document-editor-textarea');
            if (!textarea) {
                Components.showToast('Editor not found', 'error');
                return;
            }

            const content = textarea.value;
            await API.updateDocument(documentId, { content: content });
            Components.showToast('Document saved successfully', 'success');

            // Reload document view
            await this.viewDocument(documentId);
        } catch (error) {
            console.error('Error saving document:', error);
            Components.showToast('Failed to save document', 'error');
        }
    },

    /**
     * Create new document
     */
    createDocument(objectId) {
        const obj = StateManager.getCurrentObject();
        if (!obj) {
            Components.showToast('No project selected', 'error');
            return;
        }

        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = Components.renderDocumentCreateForm(objectId, obj.name);
        modal.classList.add('show');

        setTimeout(() => {
            const filenameInput = document.getElementById('doc-filename');
            if (filenameInput) filenameInput.focus();
        }, 100);
    },

    /**
     * Edit document metadata
     */
    async editDocumentMetadata(documentId) {
        try {
            const document = await API.getDocument(documentId);
            const obj = StateManager.getCurrentObject();
            if (!obj) {
                Components.showToast('No project selected', 'error');
                return;
            }

            const modal = document.getElementById('modal');
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = Components.renderDocumentCreateForm(obj.id, obj.name, document);
            modal.classList.add('show');
        } catch (error) {
            console.error('Error loading document for edit:', error);
            Components.showToast('Failed to load document', 'error');
        }
    },

    /**
     * Submit document create/edit form
     */
    async submitDocumentCreate(objectId, documentId = null) {
        const form = document.getElementById('document-create-form');
        if (!form) return;

        const formData = new FormData(form);
        const folder = formData.get('folder');
        const filename = formData.get('filename')?.trim();
        const content = formData.get('content') || '';
        const icon = formData.get('icon') || '';

        const isEdit = documentId !== null;

        if (!isEdit) {
            if (!filename) {
                Components.showToast('Filename is required', 'error');
                return;
            }

            if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
                Components.showToast('Invalid filename. Use only letters, numbers, dots, dashes and underscores', 'error');
                return;
            }
        }

        try {
            if (isEdit) {
                const updateData = {
                    metadata: {
                        icon: icon || undefined
                    }
                };
                if (filename) {
                    updateData.filename = filename;
                }
                await API.updateDocument(documentId, updateData);
                Components.showToast('Document updated successfully', 'success');
            } else {
                const obj = StateManager.getCurrentObject();
                const basePath = obj.file_path || (obj.subcategory_slug
                    ? `categories/${obj.category_slug || 'unknown'}/subcategories/${obj.subcategory_slug}/objects/${obj.object_slug || obj.slug || 'unknown'}`
                    : `categories/${obj.category_slug || 'unknown'}/objects/${obj.object_slug || obj.slug || 'unknown'}`);
                const filepath = `${basePath}/${folder}/${filename}`;

                await API.createDocument({
                    object_id: objectId,
                    folder: folder,
                    filename: filename,
                    filepath: filepath,
                    content: content,
                    content_type: 'text/plain',
                    metadata: {
                        icon: icon || undefined
                    }
                });
                Components.showToast('Document created successfully', 'success');
            }

            AppUIHelpers.closeModal();
            await AppObjects.selectObject(objectId);
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} document:`, error);
            Components.showToast(`Failed to ${isEdit ? 'update' : 'create'} document`, 'error');
        }
    },

    /**
     * Delete document
     */
    async deleteDocument(documentId) {
        if (!confirm('Opravdu chceš smazat tento dokument?')) {
            return;
        }

        try {
            await API.deleteDocument(documentId);
            Components.showToast('Dokument smazán', 'success');

            const currentObject = StateManager.getCurrentObject();
            if (currentObject) {
                await AppObjects.selectObject(currentObject.id);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            Components.showToast('Chyba při mazání dokumentu', 'error');
        }
    },

    /**
     * Edit document content
     */
    async editDocument(documentId) {
        try {
            const [document, content] = await Promise.all([
                API.getDocument(documentId),
                API.getDocumentContent(documentId)
            ]);

            Components.renderDocumentEditor(document, content);
        } catch (error) {
            console.error('Error loading document for edit:', error);
            Components.showToast('Failed to load document', 'error');
        }
    },

    /**
     * Filter documents by folder
     */
    filterDocuments(filter) {
        StateManager.setCurrentDocumentFilter(filter);

        const filterLabel = document.getElementById('document-filter-label');
        if (filterLabel) {
            const labels = {
                'all': 'All',
                'doc': 'Doc',
                'code': 'Code',
                'plany': 'Plany',
                'instrukce': 'Instrukce'
            };
            filterLabel.textContent = labels[filter] || 'All';
        }

        document.querySelectorAll('.document-filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.applyDocumentFilter();
    },

    /**
     * Set document view mode
     */
    setDocumentView(view) {
        StateManager.setDocumentView(view);

        const viewLabel = document.getElementById('document-view-label');
        const viewBtn = document.querySelector('.document-view-dropdown-btn');
        if (viewLabel && viewBtn) {
            const labels = { 'tiles': 'Tiles', 'list': 'List', 'kanban': 'Kanban' };
            const icons = { 'tiles': 'th', 'list': 'list', 'kanban': 'columns' };
            viewLabel.textContent = labels[view] || 'Tiles';
            const iconEl = viewBtn.querySelector('i.fas');
            if (iconEl) {
                iconEl.className = `fas fa-${icons[view] || 'th'}`;
            }
        }

        document.querySelectorAll('.document-view-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Re-render documents
        const currentObject = StateManager.getCurrentObject();
        if (currentObject) {
            const documents = StateManager.getDocuments();
            const filteredDocs = this.getFilteredDocuments(documents);
            const container = document.getElementById('documents-container');
            if (container) {
                container.innerHTML = Components.renderDocuments(filteredDocs, view);
            }
        }
    },

    /**
     * Get filtered documents
     */
    getFilteredDocuments(documents) {
        const filter = StateManager.getCurrentDocumentFilter();
        if (filter === 'all') {
            return documents;
        }
        return documents.filter(doc => {
            const folder = (doc.folder || '').toLowerCase();
            return folder.includes(filter);
        });
    },

    /**
     * Apply document filter to current view
     */
    applyDocumentFilter() {
        const currentObject = StateManager.getCurrentObject();
        if (currentObject) {
            const documents = StateManager.getDocuments();
            const filteredDocs = this.getFilteredDocuments(documents);
            const viewMode = StateManager.getDocumentView();
            const container = document.getElementById('documents-container');
            if (container) {
                container.innerHTML = Components.renderDocuments(filteredDocs, viewMode);
            }
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppDocuments = AppDocuments;
}

