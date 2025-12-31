/**
 * Module: AppObjects
 * Purpose: Správa objektů/projektů - výběr, vytváření, editace, mazání
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppObjects = {
    /**
     * Select and display object
     */
    async selectObject(objectId) {
        const mainView = document.getElementById('main-view');
        if (mainView) {
            mainView.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                    <p class="mt-3">Loading object...</p>
                </div>
            `;
        }

        try {
            const object = await API.getObject(objectId);
            StateManager.setCurrentObject(object);
            
            // Update state with project
            if (typeof app !== 'undefined') {
                app.updateHeaderProject(object);
            }
            
            // Highlight selected project in tree
            document.querySelectorAll('.tree-item.selected-project').forEach(el => {
                el.classList.remove('selected-project');
            });
            const projectEl = document.querySelector(`.tree-item[data-object-id="${objectId}"]`);
            if (projectEl) {
                projectEl.classList.add('selected-project');
            }

            // Get folder path from metadata or state
            let folderPath = object.metadata?.folder_path;
            if (!folderPath) {
                folderPath = StateManager.getProjectFolder(objectId);
            }

            // Update state with folder path
            if (folderPath) {
                StateManager.setProjectFolder(objectId, folderPath);
            }

            if (folderPath) {
                // Show folder contents
                const viewMode = StateManager.getProjectFolderViewMode();
                await AppFolders.renderFolderContents(object, folderPath, viewMode);
            } else {
                // Show documents
                const docsResponse = await API.getObjectDocuments(objectId);
                StateManager.setDocuments(docsResponse.documents || []);
                const viewMode = StateManager.getDocumentView();
                Components.renderObjectView(object, StateManager.getDocuments(), viewMode);
            }

            // Update view dropdown
            setTimeout(() => {
                const viewLabel = document.getElementById('document-view-label');
                const viewBtn = document.querySelector('.document-view-dropdown-btn');
                const viewMode = StateManager.getDocumentView();
                if (viewLabel && viewBtn) {
                    const labels = { 'tiles': 'Tiles', 'list': 'List', 'kanban': 'Kanban' };
                    const icons = { 'tiles': 'th', 'list': 'list', 'kanban': 'columns' };
                    viewLabel.textContent = labels[viewMode] || 'Tiles';
                    const iconEl = viewBtn.querySelector('i.fas');
                    if (iconEl) {
                        iconEl.className = `fas fa-${icons[viewMode] || 'th'}`;
                    }
                }
                document.querySelectorAll('.document-view-option').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.view === viewMode) {
                        btn.classList.add('active');
                    }
                });
            }, 100);
        } catch (error) {
            console.error('Error selecting object:', error);
            Components.showToast('Failed to load object', 'error');
            if (mainView) {
                mainView.innerHTML = `
                    <div class="alert alert-danger m-4">
                        <h5><i class="fas fa-exclamation-triangle"></i> Failed to Load Object</h5>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Create object in category
     */
    async createObjectInCategory(categoryId) {
        const formContent = await Components.objectForm(categoryId);
        AppUIHelpers.showModal(formContent);
    },

    /**
     * Create object in subcategory
     */
    async createObjectInSubcategory(subcategoryId, categoryId) {
        const formContent = await Components.objectForm(categoryId, null, subcategoryId);
        AppUIHelpers.showModal(formContent);
    },

    /**
     * Edit project
     */
    async editProject(projectId) {
        try {
            const object = await API.getObject(projectId);
            const categoryId = object.category_id;

            // Ensure metadata is an object
            if (!object.metadata || typeof object.metadata === 'string') {
                try {
                    object.metadata = typeof object.metadata === 'string' ? JSON.parse(object.metadata) : {};
                } catch (e) {
                    object.metadata = {};
                }
            }

            // Load folder_path from state if available
            const stateFolderPath = StateManager.getProjectFolder(projectId);
            if (stateFolderPath) {
                object.metadata.folder_path = stateFolderPath;
            } else if (object.metadata?.folder_path) {
                StateManager.setProjectFolder(projectId, object.metadata.folder_path);
            }

            const formContent = await Components.objectForm(categoryId, object);
            AppUIHelpers.showModal(formContent);
        } catch (error) {
            console.error('Error loading project for edit:', error);
            Components.showToast('Failed to load project', 'error');
        }
    },

    /**
     * Delete project
     */
    async deleteProject(projectId) {
        if (!confirm('Opravdu chceš smazat tento projekt?')) {
            return;
        }

        try {
            await API.deleteObject(projectId);
            Components.showToast('Projekt smazán', 'success');
            
            const currentCategory = StateManager.getCurrentCategory();
            if (currentCategory) {
                await AppCategories.selectCategory(currentCategory.id);
            } else {
                await app.init();
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            Components.showToast('Chyba při mazání projektu', 'error');
        }
    },

    /**
     * Submit object form
     */
    async submitObjectForm(event, categoryId, objectId = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const name = formData.get('name');
        const slug = formData.get('slug') || name.toLowerCase().replace(/\s+/g, '-');
        const folderPath = formData.get('folder_path');
        const isEdit = objectId !== null;

        // Require folder path
        if (!folderPath || folderPath.trim() === '') {
            Components.showToast('Prosím zadej cestu ke složce projektu', 'error');
            return;
        }

        const icon = formData.get('icon') || '';
        const data = {
            name: name,
            slug: slug,
            description: formData.get('description') || '',
            status: formData.get('status') || 'active',
            author: formData.get('author') || 'Unknown',
            metadata: {
                icon: icon || undefined,
                folder_path: folderPath
            }
        };

        if (icon) {
            data.icon = icon;
        }

        // For new objects, determine subcategory
        if (!isEdit) {
            const category = StateManager.getCategories().find(c => c.id === categoryId);
            let subcategoryId = formData.get('subcategory_id') || null;
            
            if (subcategoryId && subcategoryId !== '') {
                subcategoryId = parseInt(subcategoryId);
            } else {
                subcategoryId = null;
            }

            // Try to find matching subcategory from folder_path
            if (!subcategoryId && folderPath) {
                const pathParts = folderPath.replace('/opt/kms/', '').split('/');
                if (pathParts.length >= 2) {
                    try {
                        const subcategories = await API.getSubcategories(categoryId);
                        const potentialSubcategorySlug = pathParts[1];
                        const subcategory = subcategories.find(s => s.slug === potentialSubcategorySlug);
                        if (subcategory) {
                            subcategoryId = subcategory.id;
                        }
                    } catch (error) {
                        console.error('Error loading subcategories:', error);
                    }
                }
            }

            if (subcategoryId) {
                data.category_id = categoryId;
                data.subcategory_id = subcategoryId;
                const subcategory = (await API.getSubcategories(categoryId)).find(s => s.id === subcategoryId);
                if (subcategory && category) {
                    data.file_path = `categories/${category.slug}/subcategories/${subcategory.slug}/objects/${slug}`;
                }
            } else {
                data.category_id = categoryId;
                if (category) {
                    data.file_path = `categories/${category.slug}/objects/${slug}`;
                }
            }
        }

        try {
            if (isEdit) {
                await API.updateObject(objectId, data);
                Components.showToast('Project updated successfully', 'success');
            } else {
                await API.createObject(data);
                Components.showToast('Project created successfully', 'success');
            }
            AppUIHelpers.closeModal();

            // Store folder_path in state
            if (folderPath) {
                if (isEdit && objectId) {
                    StateManager.setProjectFolder(objectId, folderPath);
                }
            }

            // Refresh view
            if (isEdit && StateManager.getCurrentObject()?.id === objectId) {
                await this.selectObject(objectId);
            } else if (isEdit && objectId) {
                await this.selectObject(objectId);
            } else if (StateManager.getCurrentCategory()) {
                await AppCategories.selectCategory(StateManager.getCurrentCategory().id);
            } else if (categoryId) {
                await AppCategories.selectCategory(categoryId);
            }
            await AppStats.loadStats();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} object:`, error);
            Components.showToast(`Failed to ${isEdit ? 'update' : 'create'} project`, 'error');
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppObjects = AppObjects;
}

