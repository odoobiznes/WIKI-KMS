/**
 * Module: AppCategories
 * Purpose: Správa kategorií, podkategorií a jejich zobrazení
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppCategories = {
    /**
     * Load all categories
     */
    async loadCategories() {
        try {
            const categories = await API.getCategories();
            StateManager.setCategories(categories);
            Components.renderCategoriesTree(
                categories,
                StateManager.getCurrentFilter(),
                StateManager.getExpandedCategories()
            );
        } catch (error) {
            console.error('Error loading categories:', error);
            Components.showToast('Failed to load categories', 'error');
        }
    },

    /**
     * Filter categories by type
     */
    filterCategories(filter) {
        StateManager.setCurrentFilter(filter);
        Components.renderCategoriesTree(
            StateManager.getCategories(),
            filter,
            StateManager.getExpandedCategories()
        );

        // Update filter label
        const filterLabel = document.getElementById('filter-label');
        if (filterLabel) {
            filterLabel.textContent = filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1);
        }

        // Update filter dropdown options
        document.querySelectorAll('.filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
    },

    /**
     * Toggle category expanded state
     */
    async toggleCategory(categoryId) {
        const expandedCategories = StateManager.getExpandedCategories();
        const wasExpanded = expandedCategories[categoryId];

        // Close all other categories (accordion behavior)
        Object.keys(expandedCategories).forEach(id => {
            if (id != categoryId && expandedCategories[id]) {
                StateManager.setExpanded(id, false);

                const categoryItem = document.querySelector(`[data-category-id="${id}"]`);
                if (categoryItem) {
                    categoryItem.classList.remove('expanded');
                    const childrenDiv = categoryItem.querySelector(`[data-category-children="${id}"]`);
                    if (childrenDiv) {
                        childrenDiv.style.display = 'none';
                    }
                }
            }
        });

        const isExpanded = !wasExpanded;
        StateManager.setExpanded(categoryId, isExpanded);

        const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (categoryItem) {
            const childrenDiv = categoryItem.querySelector(`[data-category-children="${categoryId}"]`);

            if (isExpanded) {
                categoryItem.classList.add('expanded');
            } else {
                categoryItem.classList.remove('expanded');
            }

            if (childrenDiv) {
                if (isExpanded) {
                    childrenDiv.style.display = 'block';
                    this.loadCategoryChildren(categoryId, childrenDiv);
                } else {
                    childrenDiv.style.display = 'none';
                }
            }
        }
    },

    /**
     * Load category children (subcategories and objects)
     */
    async loadCategoryChildren(categoryId, container) {
        try {
            container.innerHTML = '<div class="tree-loading">Loading...</div>';

            const [subcategories, objects] = await Promise.all([
                API.getSubcategories(categoryId).catch(() => []),
                API.getObjects(categoryId).catch(() => [])
            ]);

            let html = '';

            // Render subcategories
            if (subcategories && subcategories.length > 0) {
                subcategories.forEach(sub => {
                    const icon = sub.icon || sub.metadata?.icon || 'fa-folder-open';
                    const iconClass = icon.startsWith('fa-') ? `fas ${icon}` : icon;
                    html += `
                        <div class="tree-item subcategory-item" data-subcategory-id="${sub.id}" onclick="app.toggleSubcategory(${sub.id})">
                            <div class="tree-item-content">
                                <i class="${iconClass} tree-item-icon"></i>
                                <span class="tree-item-label">${sub.name}</span>
                                <div class="tree-item-actions" onclick="event.stopPropagation();">
                                    <div class="tree-dropdown">
                                        <button class="tree-dropdown-toggle" onclick="app.toggleTreeDropdown(event, 'subcategory-${sub.id}')" title="Menu">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div class="tree-dropdown-menu" id="subcategory-${sub.id}-dropdown" style="display: none;">
                                            <button onclick="app.createObjectInSubcategory(${sub.id}, ${categoryId}); app.closeTreeDropdown('subcategory-${sub.id}');" class="tree-dropdown-item">
                                                <i class="fas fa-folder-plus" style="color: #3498db;"></i> Přidat projekt
                                            </button>
                                            <button onclick="app.editSubcategory(${sub.id}); app.closeTreeDropdown('subcategory-${sub.id}');" class="tree-dropdown-item">
                                                <i class="fas fa-edit"></i> Upravit
                                            </button>
                                            <button onclick="app.deleteSubcategory(${sub.id}); app.closeTreeDropdown('subcategory-${sub.id}');" class="tree-dropdown-item tree-dropdown-item-danger">
                                                <i class="fas fa-trash"></i> Smazat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="tree-children" data-subcategory-children="${sub.id}" style="display: none;" onclick="event.stopPropagation();">
                                <div class="tree-loading">Načítání...</div>
                            </div>
                        </div>
                    `;
                });
            }

            // Render projects directly in category
            if (objects && objects.length > 0) {
                objects.forEach(obj => {
                    const icon = obj.icon || obj.metadata?.icon || 'fa-folder';
                    const iconClass = icon.startsWith('fa-') ? `fas ${icon}` : icon;
                    html += `
                        <div class="tree-item project-item" data-project-id="${obj.id}" onclick="app.selectObject(${obj.id})">
                            <div class="tree-item-content">
                                <i class="${iconClass} tree-item-icon"></i>
                                <span class="tree-item-label">${obj.object_name}</span>
                                <div class="tree-item-actions" onclick="event.stopPropagation();">
                                    <div class="tree-dropdown">
                                        <button class="tree-dropdown-toggle" onclick="app.toggleTreeDropdown(event, 'project-${obj.id}')" title="Menu">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div class="tree-dropdown-menu" id="project-${obj.id}-dropdown" style="display: none;">
                                            <button onclick="app.editProject(${obj.id}); app.closeTreeDropdown('project-${obj.id}');" class="tree-dropdown-item">
                                                <i class="fas fa-edit"></i> Editovat
                                            </button>
                                            <button onclick="app.deleteProject(${obj.id}); app.closeTreeDropdown('project-${obj.id}');" class="tree-dropdown-item tree-dropdown-item-danger">
                                                <i class="fas fa-trash"></i> Smazat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            if (!html) {
                html = '<div class="tree-empty">No items</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading category children:', error);
            container.innerHTML = '<div class="tree-error">Error loading</div>';
        }
    },

    /**
     * Toggle subcategory expanded state
     */
    async toggleSubcategory(subcategoryId) {
        const subcategoryItem = document.querySelector(`[data-subcategory-id="${subcategoryId}"]`);
        if (subcategoryItem) {
            const childrenDiv = subcategoryItem.querySelector(`[data-subcategory-children="${subcategoryId}"]`);
            const isExpanded = childrenDiv.style.display !== 'none';

            if (isExpanded) {
                subcategoryItem.classList.remove('expanded');
            } else {
                subcategoryItem.classList.add('expanded');
            }

            if (childrenDiv) {
                if (!isExpanded) {
                    childrenDiv.style.display = 'block';
                    this.loadSubcategoryProjects(subcategoryId, childrenDiv);
                } else {
                    childrenDiv.style.display = 'none';
                }
            }
        }
    },

    /**
     * Load subcategory projects
     */
    async loadSubcategoryProjects(subcategoryId, container) {
        try {
            container.innerHTML = '<div class="tree-loading">Načítání...</div>';

            const objects = await API.getObjects(null, subcategoryId).catch(() => []);

            let html = '';
            if (objects && objects.length > 0) {
                objects.forEach(obj => {
                    const icon = obj.icon || obj.metadata?.icon || 'fa-folder';
                    const iconClass = icon.startsWith('fa-') ? `fas ${icon}` : icon;
                    html += `
                        <div class="tree-item project-item" data-project-id="${obj.id}" onclick="app.selectObject(${obj.id})">
                            <div class="tree-item-content">
                                <i class="${iconClass} tree-item-icon"></i>
                                <span class="tree-item-label">${obj.object_name}</span>
                                <div class="tree-item-actions" onclick="event.stopPropagation();">
                                    <div class="tree-dropdown">
                                        <button class="tree-dropdown-toggle" onclick="app.toggleTreeDropdown(event, 'project-${obj.id}')" title="Menu">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div class="tree-dropdown-menu" id="project-${obj.id}-dropdown" style="display: none;">
                                            <button onclick="app.editProject(${obj.id}); app.closeTreeDropdown('project-${obj.id}');" class="tree-dropdown-item">
                                                <i class="fas fa-edit"></i> Upravit
                                            </button>
                                            <button onclick="app.deleteProject(${obj.id}); app.closeTreeDropdown('project-${obj.id}');" class="tree-dropdown-item tree-dropdown-item-danger">
                                                <i class="fas fa-trash"></i> Smazat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                html = '<div class="tree-empty">Žádné projekty</div>';
            }

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading subcategory projects:', error);
            container.innerHTML = '<div class="tree-error">Chyba načítání</div>';
        }
    },

    /**
     * Select category and load objects
     */
    async selectCategory(categoryId) {
        // Expand category if not already expanded
        if (!StateManager.isExpanded(categoryId)) {
            await this.toggleCategory(categoryId);
        }

        // Highlight selected category
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
        });
        const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (categoryItem) {
            categoryItem.classList.add('active');
        }

        // Show loading state
        const mainView = document.getElementById('main-view');
        if (mainView) {
            mainView.innerHTML = `
                <div class="text-center p-5">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                    <p class="mt-3">Loading category...</p>
                </div>
            `;
        }

        try {
            const category = StateManager.getCategories().find(c => c.id === categoryId);
            StateManager.setCurrentCategory(category);

            const objects = await API.getObjects(categoryId);
            Components.renderCategoryObjects(category, objects);
        } catch (error) {
            console.error('Error selecting category:', error);
            Components.showToast('Failed to load category', 'error');
            if (mainView) {
                mainView.innerHTML = `
                    <div class="alert alert-warning m-4">
                        <h5><i class="fas fa-exclamation-triangle"></i> Failed to Load Category</h5>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Create new category
     */
    async createCategory() {
        const formContent = await Components.categoryForm();
        AppUIHelpers.showModal(formContent);
    },

    /**
     * Edit category
     */
    async editCategory(categoryId) {
        try {
            const category = await API.getCategory(categoryId);
            const formContent = await Components.categoryForm(category);
            AppUIHelpers.showModal(formContent);
        } catch (error) {
            console.error('Error loading category for edit:', error);
            Components.showToast('Failed to load category', 'error');
        }
    },

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
        if (!confirm('Opravdu chceš smazat tuto kategorii? Všechny projekty v této kategorii budou také smazány.')) {
            return;
        }

        try {
            await API.deleteCategory(categoryId);
            Components.showToast('Kategorie smazána', 'success');
            await this.loadCategories();
            await AppStats.loadStats();

            // Clear main view if deleted category was selected
            if (StateManager.getCurrentCategory()?.id === categoryId) {
                document.getElementById('main-view').innerHTML = Components.welcomeScreen();
                StateManager.setCurrentCategory(null);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            Components.showToast('Chyba při mazání kategorie', 'error');
        }
    },

    /**
     * Create subcategory in category
     */
    async createSubcategoryInCategory(categoryId) {
        const formContent = await Components.subcategoryForm(categoryId);
        AppUIHelpers.showModal(formContent);
    },

    /**
     * Edit subcategory
     */
    async editSubcategory(subcategoryId) {
        try {
            const subcategory = await API.getSubcategory(subcategoryId);
            const categoryId = subcategory.category_id;
            const formContent = await Components.subcategoryForm(categoryId, subcategory);
            AppUIHelpers.showModal(formContent);
        } catch (error) {
            console.error('Error loading subcategory for edit:', error);
            Components.showToast('Failed to load subcategory', 'error');
        }
    },

    /**
     * Delete subcategory
     */
    async deleteSubcategory(subcategoryId) {
        if (!confirm('Opravdu chceš smazat tuto podkategorii? Pokud obsahuje projekty, musíš je nejdříve smazat nebo přesunout.')) {
            return;
        }

        try {
            await API.deleteSubcategory(subcategoryId);
            Components.showToast('Podkategorie smazána', 'success');
            await this.loadCategories();
            await AppStats.loadStats();
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            const errorMessage = error.message || 'Chyba při mazání podkategorie';
            Components.showToast(errorMessage, 'error');
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppCategories = AppCategories;
}
