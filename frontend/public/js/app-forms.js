/**
 * Module: AppForms
 * Purpose: Zpracování formulářů - kategorie, podkategorie, objekty
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppForms = {
    /**
     * Submit category form
     */
    async submitCategoryForm(event, categoryId = null, editType = 'category') {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const type = formData.get('type');
        const folderPath = formData.get('folder_path');
        const isProject = editType === 'project' || type === 'project';

        // Validate type change
        if (categoryId && type) {
            try {
                const category = await API.getCategory(categoryId);
                const currentType = category.type;
                const isCurrentlyProject = category.metadata?.folder_path;

                if ((currentType !== type) || (isCurrentlyProject !== isProject)) {
                    const subcategories = await API.getSubcategories(categoryId).catch(() => []);
                    let hasContent = subcategories && subcategories.length > 0;

                    if (hasContent && isProject) {
                        Components.showToast('Nelze změnit kategorii na projekt - obsahuje podkategorie nebo projekty', 'error');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error validating type change:', error);
            }
        }

        const data = {
            slug: formData.get('slug'),
            name: formData.get('name'),
            type: isProject ? 'project' : type,
            description: formData.get('description') || '',
            metadata: {}
        };

        if (isProject && folderPath) {
            data.metadata.folder_path = folderPath;
        }

        const icon = formData.get('icon');
        if (icon) {
            data.metadata.icon = icon;
            data.icon = icon;
        }

        try {
            if (categoryId) {
                await API.updateCategory(categoryId, data);
                Components.showToast(`${isProject ? 'Projekt' : 'Kategorie'} aktualizována`, 'success');
            } else {
                await API.createCategory(data);
                Components.showToast(`${isProject ? 'Projekt' : 'Kategorie'} vytvořena`, 'success');
            }
            AppUIHelpers.closeModal();
            await AppCategories.loadCategories();
            await AppStats.loadStats();
        } catch (error) {
            console.error('Error saving category:', error);
            Components.showToast(`Chyba při ${categoryId ? 'aktualizaci' : 'vytváření'} ${isProject ? 'projektu' : 'kategorie'}`, 'error');
        }
    },

    /**
     * Handle edit type change for category
     */
    handleEditTypeChange(currentType, categoryId, isEmpty) {
        const select = document.getElementById('edit-type-select');
        const newType = select.value;
        const folderPathGroup = document.getElementById('folder-path-group');
        const folderPathInput = folderPathGroup.querySelector('input[name="folder_path"]');
        const typeSelect = document.getElementById('category-type-select');

        if (newType === 'project') {
            folderPathGroup.style.display = 'block';
            if (folderPathInput) {
                folderPathInput.required = true;
            }
            if (typeSelect) {
                typeSelect.value = 'project';
            }
        } else {
            folderPathGroup.style.display = 'none';
            if (folderPathInput) {
                folderPathInput.required = false;
            }
            if (typeSelect && (!typeSelect.value || typeSelect.value === 'project')) {
                typeSelect.value = 'product';
            }
        }
    },

    /**
     * Submit subcategory form
     */
    async submitSubcategoryForm(event, categoryId, subcategoryId = null, editType = 'subcategory') {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const name = formData.get('name');
        const slug = formData.get('slug') || name.toLowerCase().replace(/\s+/g, '-');
        const icon = formData.get('icon') || '';
        const folderPath = formData.get('folder_path');
        const isProject = editType === 'project';

        // Validate type change
        if (subcategoryId && isProject) {
            try {
                const subcategory = await API.getSubcategory(subcategoryId);
                const isCurrentlyProject = subcategory.metadata?.folder_path;

                if (!isCurrentlyProject) {
                    const objects = await API.getObjects(categoryId, subcategoryId).catch(() => []);
                    const hasContent = objects && objects.length > 0;

                    if (hasContent) {
                        Components.showToast('Nelze změnit podkategorii na projekt - obsahuje projekty', 'error');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error validating type change:', error);
            }
        }

        const data = {
            category_id: categoryId,
            slug: slug,
            name: name,
            description: formData.get('description') || '',
            metadata: {}
        };

        if (isProject && folderPath) {
            data.metadata.folder_path = folderPath;
        }

        if (icon) {
            data.metadata.icon = icon;
            data.icon = icon;
        }

        try {
            if (subcategoryId) {
                await API.updateSubcategory(subcategoryId, data);
                Components.showToast(`${isProject ? 'Projekt' : 'Podkategorie'} aktualizována`, 'success');
            } else {
                await API.createSubcategory(data);
                Components.showToast(`${isProject ? 'Projekt' : 'Podkategorie'} vytvořena`, 'success');
            }
            AppUIHelpers.closeModal();
            await AppCategories.loadCategories();
            await AppStats.loadStats();
        } catch (error) {
            console.error(`Error ${subcategoryId ? 'updating' : 'creating'} subcategory:`, error);
            Components.showToast(`Chyba při ${subcategoryId ? 'aktualizaci' : 'vytváření'} ${isProject ? 'projektu' : 'podkategorie'}`, 'error');
        }
    },

    /**
     * Handle edit type change for subcategory
     */
    handleEditTypeChangeSubcategory(currentType, subcategoryId, isEmpty) {
        const select = document.getElementById('edit-type-select-subcategory');
        const newType = select.value;
        const folderPathGroup = document.getElementById('folder-path-group-subcategory');
        const folderPathInput = folderPathGroup.querySelector('input[name="folder_path"]');

        if (newType === 'project') {
            folderPathGroup.style.display = 'block';
            if (folderPathInput) {
                folderPathInput.required = true;
            }
        } else {
            folderPathGroup.style.display = 'none';
            if (folderPathInput) {
                folderPathInput.required = false;
            }
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppForms = AppForms;
}

