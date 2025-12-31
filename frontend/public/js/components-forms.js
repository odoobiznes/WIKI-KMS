/**
 * KMS Components - Forms module
 * Contains form rendering functions for categories, subcategories, objects, and documents
 */

// Render document create form
Components.renderDocumentCreateForm = function(objectId, objectName, document = null) {
    const isEdit = document !== null;
    const currentIcon = document ? (document.icon || document.metadata?.icon || 'fa-file') : 'fa-file';
    const iconValue = currentIcon.startsWith('fa-') ? currentIcon : `fa-${currentIcon}`;

    return `
        <div class="document-create-form">
            <div class="form-header">
                <h3><i class="fas fa-${isEdit ? 'edit' : 'file-plus'}"></i> ${isEdit ? 'Edit' : 'Create New'} Document</h3>
                <p style="color: #7f8c8d; font-size: 0.875rem; margin: 0.25rem 0 1rem 0;">Project: ${objectName}</p>
                <button onclick="app.closeModal()" class="close-btn">&times;</button>
            </div>

            <form id="document-create-form" onsubmit="event.preventDefault(); app.submitDocumentCreate(${objectId}, ${document ? document.id : 'null'}); return false;">
                <div class="form-group">
                    <label>Icon</label>
                    <div class="icon-picker">
                        <div class="icon-preview">
                            <i class="fas ${iconValue}" id="document-icon-preview"></i>
                        </div>
                        <input type="text" name="icon" id="document-icon-input"
                            placeholder="fa-file" value="${iconValue}"
                            oninput="document.getElementById('document-icon-preview').className = 'fas ' + (this.value || 'fa-file')">
                        <small style="color: #7f8c8d; font-size: 0.75rem;">Font Awesome icon class (e.g., fa-file, fa-code, fa-image)</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="doc-folder">Folder *</label>
                    <select id="doc-folder" name="folder" required class="form-control" ${isEdit ? 'disabled' : ''}>
                        <option value="docs" ${document && document.folder === 'docs' ? 'selected' : ''}>docs</option>
                        <option value="code" ${document && document.folder === 'code' ? 'selected' : ''}>code</option>
                        <option value="plany" ${document && document.folder === 'plany' ? 'selected' : ''}>plany</option>
                        <option value="instrukce" ${document && document.folder === 'instrukce' ? 'selected' : ''}>instrukce</option>
                    </select>
                    ${isEdit ? '<small style="color: #7f8c8d; font-size: 0.75rem;">Folder cannot be changed</small>' : ''}
                </div>

                <div class="form-group">
                    <label for="doc-filename">Filename *</label>
                    <input
                        type="text"
                        id="doc-filename"
                        name="filename"
                        required
                        class="form-control"
                        placeholder="example.md"
                        pattern="[a-zA-Z0-9._-]+"
                        title="Only letters, numbers, dots, dashes and underscores"
                    />
                    <small style="color: #7f8c8d; font-size: 0.8rem;">e.g., README.md, config.json, notes.txt</small>
                </div>

                <div class="form-group">
                    <label for="doc-content">Content</label>
                    <textarea
                        id="doc-content"
                        name="content"
                        class="form-control"
                        rows="10"
                        placeholder="Enter document content here..."
                        style="font-family: 'Courier New', monospace; font-size: 0.875rem;"
                    ></textarea>
                </div>

                <div class="form-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" onclick="app.closeModal()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Create Document
                    </button>
                </div>
            </form>
        </div>
    `;
};

// Create category form
Components.categoryForm = async function(category = null) {
    const isEdit = category !== null;
    const currentIcon = category ? (category.icon || category.metadata?.icon || 'fa-folder') : 'fa-folder';
    const iconValue = currentIcon.startsWith('fa-') ? currentIcon : `fa-${currentIcon}`;

    // Check if category is empty (no subcategories or projects)
    let isEmpty = true;
    let hasSubcategories = false;
    let hasProjects = false;
    if (isEdit && category) {
        try {
            const subcategories = await API.getSubcategories(category.id);
            hasSubcategories = subcategories && subcategories.length > 0;

            // Check projects in all subcategories
            if (hasSubcategories) {
                for (const sub of subcategories) {
                    const objects = await API.getObjects(category.id, sub.id).catch(() => []);
                    if (objects && objects.length > 0) {
                        hasProjects = true;
                        break;
                    }
                }
            }
            isEmpty = !hasSubcategories && !hasProjects;
        } catch (error) {
            console.error('Error checking category status:', error);
        }
    }

    // Determine if this is a project (has folder_path in metadata)
    const isProject = category && category.metadata && category.metadata.folder_path;
    const folderPath = isProject ? category.metadata.folder_path : '';
    const editType = isProject ? 'project' : 'category';

    return `
        <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <div class="form-header-title" style="display: flex; align-items: center; gap: 0.5rem;">
                <select id="edit-type-select" onchange="app.handleEditTypeChange('${editType}', ${category ? category.id : 'null'}, ${isEmpty})" style="font-size: 0.95rem; font-weight: 600; padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: white;">
                    <option value="category" ${editType === 'category' ? 'selected' : ''}>Edit Category</option>
                    <option value="project" ${editType === 'project' ? 'selected' : ''}>Projects</option>
                </select>
            </div>
            <button onclick="app.closeModal()" class="close-btn">&times;</button>
        </div>
        <form id="category-form" onsubmit="app.submitCategoryForm(event, ${category ? category.id : 'null'}, '${editType}')" style="padding: 0 1rem 1rem;">
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Slug *</label>
                <input type="text" name="slug" required pattern="[a-z0-9-]+" placeholder="my-category"
                    value="${category ? category.slug : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Name *</label>
                <input type="text" name="name" required placeholder="My Category"
                    value="${category ? category.name : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Icon</label>
                <div class="icon-picker" style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="icon-preview" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #e3f2fd; border-radius: 4px;">
                        <i class="fas ${iconValue}" id="category-icon-preview" style="color: #3498db;"></i>
                    </div>
                    <input type="text" name="icon" id="category-icon-input" placeholder="fa-folder" value="${iconValue}"
                        oninput="document.getElementById('category-icon-preview').className = 'fas ' + (this.value || 'fa-folder')"
                        style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                </div>
            </div>
            <div class="form-group" id="folder-path-group" style="display: ${editType === 'project' ? 'block' : 'none'}; margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta k Složce projektu *</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" name="folder_path" id="category-folder-path-input" placeholder="/opt/kms/category-name" value="${folderPath}"
                        ${editType === 'project' ? 'required' : ''} style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    <button type="button" onclick="app.openFolderPicker('category-folder-path-input')"
                        class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; white-space: nowrap;">
                        <i class="fas fa-folder-open"></i> Vybrat cestu
                    </button>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Type *</label>
                <select name="type" required id="category-type-select" ${!isEmpty && isEdit ? 'disabled' : ''}
                    style="padding: 0.5rem; font-size: 0.9rem; width: 100%;">
                    <option value="product" ${category && category.type === 'product' ? 'selected' : ''}>Product</option>
                    <option value="system" ${category && category.type === 'system' ? 'selected' : ''}>System</option>
                    <option value="project" ${isProject ? 'selected' : ''} ${!isEmpty && isEdit ? 'disabled' : ''}>Project</option>
                </select>
                ${!isEmpty && isEdit ? '<small style="color: #e74c3c; font-size: 0.7rem; display: block; margin-top: 0.25rem;">⚠️ Nelze změnit typ</small>' : ''}
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Description</label>
                <textarea name="description" placeholder="Category description..." rows="2" style="padding: 0.5rem; font-size: 0.9rem; resize: vertical;">${category ? (category.description || '') : ''}</textarea>
            </div>
            <div class="form-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0;">
                <button type="button" onclick="app.closeModal()" class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
};

// Create/Edit subcategory form
Components.subcategoryForm = async function(categoryId, subcategory = null) {
    const isEdit = subcategory !== null;
    const currentIcon = subcategory ? (subcategory.icon || subcategory.metadata?.icon || 'fa-folder') : 'fa-folder';
    const iconValue = currentIcon.startsWith('fa-') ? currentIcon : `fa-${currentIcon}`;

    // Check if subcategory is empty (no projects)
    let isEmpty = true;
    if (isEdit && subcategory) {
        try {
            const objects = await API.getObjects(categoryId, subcategory.id).catch(() => []);
            isEmpty = !objects || objects.length === 0;
        } catch (error) {
            console.error('Error checking subcategory status:', error);
        }
    }

    // Determine if this is a project (has folder_path in metadata)
    const isProject = subcategory && subcategory.metadata && subcategory.metadata.folder_path;
    const folderPath = isProject ? subcategory.metadata.folder_path : '';
    const editType = isProject ? 'project' : 'subcategory';

    return `
        <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <div class="form-header-title" style="display: flex; align-items: center; gap: 0.5rem;">
                <select id="edit-type-select-subcategory" onchange="app.handleEditTypeChangeSubcategory('${editType}', ${subcategory ? subcategory.id : 'null'}, ${isEmpty})" style="font-size: 0.95rem; font-weight: 600; padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: white;">
                    <option value="subcategory" ${editType === 'subcategory' ? 'selected' : ''}>Edit Subcategory</option>
                    <option value="project" ${editType === 'project' ? 'selected' : ''}>Projects</option>
                </select>
            </div>
            <button onclick="app.closeModal()" class="close-btn">&times;</button>
        </div>
        <form id="subcategory-form" onsubmit="app.submitSubcategoryForm(event, ${categoryId}, ${subcategory ? subcategory.id : 'null'}, '${editType}')" style="padding: 0 1rem 1rem;">
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Slug *</label>
                <input type="text" name="slug" required pattern="[a-z0-9-]+" placeholder="my-subcategory"
                    value="${subcategory ? subcategory.slug : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Name *</label>
                <input type="text" name="name" required placeholder="My Subcategory"
                    value="${subcategory ? subcategory.name : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Icon</label>
                <div class="icon-picker" style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="icon-preview" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #e3f2fd; border-radius: 4px;">
                        <i class="fas ${iconValue}" id="subcategory-icon-preview" style="color: #3498db;"></i>
                    </div>
                    <input type="text" name="icon" id="subcategory-icon-input" placeholder="fa-folder" value="${iconValue}"
                        oninput="document.getElementById('subcategory-icon-preview').className = 'fas ' + (this.value || 'fa-folder')"
                        style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                </div>
            </div>
            <div class="form-group" id="folder-path-group-subcategory" style="display: ${editType === 'project' ? 'block' : 'none'}; margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta k Složce projektu *</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" name="folder_path" id="subcategory-folder-path-input" placeholder="/opt/kms/category-name/subcategory-name" value="${folderPath}"
                        ${editType === 'project' ? 'required' : ''} style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    <button type="button" onclick="app.openFolderPicker('subcategory-folder-path-input')"
                        class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; white-space: nowrap;">
                        <i class="fas fa-folder-open"></i> Vybrat cestu
                    </button>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Description</label>
                <textarea name="description" placeholder="Subcategory description..." rows="2" style="padding: 0.5rem; font-size: 0.9rem; resize: vertical;">${subcategory ? (subcategory.description || '') : ''}</textarea>
            </div>
            <div class="form-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0;">
                <button type="button" onclick="app.closeModal()" class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
};

// Create object form - requires subcategory (folder)
Components.objectForm = async function(categoryId, object = null, subcategoryId = null) {
    const isEdit = object !== null;
    // Load subcategories for this category
    let subcategories = [];
    try {
        subcategories = await API.getSubcategories(categoryId);
    } catch (error) {
        console.error('Error loading subcategories:', error);
    }

    // Use provided subcategoryId or from object
    const selectedSubcategoryId = subcategoryId || (object && object.subcategory_id) || null;

    const subcategoryOptions = subcategories.length > 0
        ? subcategories.map(sub => `<option value="${sub.id}" ${selectedSubcategoryId === sub.id ? 'selected' : ''}>${sub.name}</option>`).join('')
        : '<option value="">No subcategories available</option>';

    const currentIcon = object ? (object.icon || object.metadata?.icon || 'fa-folder') : 'fa-folder';
    const iconValue = currentIcon.startsWith('fa-') ? currentIcon : `fa-${currentIcon}`;

    return `
        <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; margin: 0;"><i class="fas fa-${isEdit ? 'edit' : 'folder-plus'}"></i> ${isEdit ? 'Edit' : 'Create'} Project</h3>
            <button onclick="app.closeModal()" class="close-btn">&times;</button>
        </div>
        <form id="object-form" onsubmit="app.submitObjectForm(event, ${categoryId}, ${object ? object.id : 'null'})" style="padding: 0 1rem 1rem;">
            ${selectedSubcategoryId ? `<input type="hidden" name="subcategory_id" value="${selectedSubcategoryId}">` : ''}
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Name *</label>
                <input type="text" name="name" required placeholder="Project Name"
                    value="${object ? (object.object_name || object.name || '') : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Slug</label>
                <input type="text" name="slug" pattern="[a-z0-9-]+" placeholder="Auto-generated from name"
                    value="${object ? (object.slug || '') : ''}" style="padding: 0.5rem; font-size: 0.9rem;">
            </div>
            <div class="form-group" id="folder-path-group-object" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta k Složce projektu *</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" name="folder_path" id="folder-path-input" placeholder="/opt/kms/category-name/subcategory-name/object-name"
                        value="${object && object.metadata && object.metadata.folder_path ? object.metadata.folder_path : ''}"
                        required style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    <button type="button" onclick="app.openFolderPicker('folder-path-input')"
                        class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; white-space: nowrap;">
                        <i class="fas fa-folder-open"></i> Vybrat cestu
                    </button>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Icon</label>
                <div class="icon-picker" style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="icon-preview" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #e3f2fd; border-radius: 4px;">
                        <i class="fas ${iconValue}" id="object-icon-preview" style="color: #3498db;"></i>
                    </div>
                    <input type="text" name="icon" id="object-icon-input" placeholder="fa-folder" value="${iconValue}"
                        oninput="document.getElementById('object-icon-preview').className = 'fas ' + (this.value || 'fa-folder')"
                        style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Description</label>
                <textarea name="description" placeholder="Project description..." rows="2"
                    style="padding: 0.5rem; font-size: 0.9rem; resize: vertical;">${object ? (object.description || '') : ''}</textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Status</label>
                    <select name="status" style="padding: 0.5rem; font-size: 0.9rem; width: 100%;">
                        <option value="draft" ${object && object.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="active" ${!object || object.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="archived" ${object && object.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Author</label>
                    <input type="text" name="author" placeholder="Your name"
                        value="${object ? (object.author || '') : ''}" style="padding: 0.5rem; font-size: 0.9rem; width: 100%;">
                </div>
            </div>
            <div class="form-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0;">
                <button type="button" onclick="app.closeModal()" class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        </form>
    `;
};

