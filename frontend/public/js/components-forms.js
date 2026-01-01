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
                    <option value="category" ${editType === 'category' ? 'selected' : ''}>${isEdit ? 'Edit' : 'New'} Category</option>
                    <option value="project" ${editType === 'project' ? 'selected' : ''}>Projects</option>
                </select>
                <div class="icon-picker-inline" style="display: flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;">
                    <div class="icon-preview" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #e3f2fd; border-radius: 4px; cursor: pointer;" onclick="Components.showIconPicker('category')" title="Change icon">
                        <i class="fas ${iconValue}" id="category-icon-preview" style="color: #3498db; font-size: 0.9rem;"></i>
                    </div>
                    <button type="button" onclick="Components.showIconPicker('category')" style="background: none; border: none; padding: 0.15rem; cursor: pointer; color: #666;" title="Change icon">
                        <i class="fas fa-pen" style="font-size: 0.7rem;"></i>
                    </button>
                    <input type="hidden" name="icon" id="category-icon-input" value="${iconValue}">
                </div>
            </div>
            <button onclick="app.closeModal()" class="close-btn">&times;</button>
        </div>
        <form id="category-form" onsubmit="app.submitCategoryForm(event, ${category ? category.id : 'null'}, '${editType}')" style="padding: 0 1rem 1rem;">
            <input type="hidden" name="slug" id="category-slug-input" value="${category ? category.slug : ''}">
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Name *</label>
                <input type="text" name="name" id="category-name-input" required placeholder="My Category"
                    value="${category ? category.name : ''}" style="padding: 0.5rem; font-size: 0.9rem;"
                    oninput="if(!${isEdit}) document.getElementById('category-slug-input').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')">
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
                    <option value="subcategory" ${editType === 'subcategory' ? 'selected' : ''}>${isEdit ? 'Edit' : 'New'} Subcategory</option>
                    <option value="project" ${editType === 'project' ? 'selected' : ''}>Projects</option>
                </select>
                <div class="icon-picker-inline" style="display: flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;">
                    <div class="icon-preview" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #e3f2fd; border-radius: 4px; cursor: pointer;" onclick="Components.showIconPicker('subcategory')" title="Change icon">
                        <i class="fas ${iconValue}" id="subcategory-icon-preview" style="color: #3498db; font-size: 0.9rem;"></i>
                    </div>
                    <button type="button" onclick="Components.showIconPicker('subcategory')" style="background: none; border: none; padding: 0.15rem; cursor: pointer; color: #666;" title="Change icon">
                        <i class="fas fa-pen" style="font-size: 0.7rem;"></i>
                    </button>
                    <input type="hidden" name="icon" id="subcategory-icon-input" value="${iconValue}">
                </div>
            </div>
            <button onclick="app.closeModal()" class="close-btn">&times;</button>
        </div>
        <form id="subcategory-form" onsubmit="app.submitSubcategoryForm(event, ${categoryId}, ${subcategory ? subcategory.id : 'null'}, '${editType}')" style="padding: 0 1rem 1rem;">
            <input type="hidden" name="slug" id="subcategory-slug-input" value="${subcategory ? subcategory.slug : ''}">
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Name *</label>
                <input type="text" name="name" id="subcategory-name-input" required placeholder="My Subcategory"
                    value="${subcategory ? subcategory.name : ''}" style="padding: 0.5rem; font-size: 0.9rem;"
                    oninput="if(!${isEdit}) document.getElementById('subcategory-slug-input').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')">
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

// Icon picker modal
Components.showIconPicker = function(targetType) {
    const commonIcons = [
        'fa-folder', 'fa-folder-open', 'fa-file', 'fa-file-alt', 'fa-file-code',
        'fa-project-diagram', 'fa-sitemap', 'fa-cubes', 'fa-cube', 'fa-boxes',
        'fa-cog', 'fa-cogs', 'fa-wrench', 'fa-tools', 'fa-hammer',
        'fa-code', 'fa-terminal', 'fa-database', 'fa-server', 'fa-cloud',
        'fa-rocket', 'fa-bolt', 'fa-star', 'fa-heart', 'fa-flag',
        'fa-home', 'fa-building', 'fa-store', 'fa-industry', 'fa-warehouse',
        'fa-users', 'fa-user', 'fa-user-tie', 'fa-user-cog', 'fa-user-shield',
        'fa-chart-bar', 'fa-chart-line', 'fa-chart-pie', 'fa-tachometer-alt',
        'fa-money-bill', 'fa-credit-card', 'fa-coins', 'fa-wallet', 'fa-piggy-bank',
        'fa-book', 'fa-book-open', 'fa-bookmark', 'fa-graduation-cap', 'fa-lightbulb',
        'fa-lock', 'fa-key', 'fa-shield-alt', 'fa-fingerprint', 'fa-eye',
        'fa-globe', 'fa-map', 'fa-compass', 'fa-location-arrow', 'fa-route',
        'fa-shopping-cart', 'fa-box', 'fa-truck', 'fa-shipping-fast', 'fa-dolly',
        'fa-calendar', 'fa-clock', 'fa-hourglass', 'fa-stopwatch', 'fa-history',
        'fa-check', 'fa-check-circle', 'fa-tasks', 'fa-clipboard-list', 'fa-list-ul',
        'fa-bug', 'fa-flask', 'fa-microscope', 'fa-atom',
        'fa-paint-brush', 'fa-palette', 'fa-magic', 'fa-pen',
        'fa-mobile', 'fa-tablet', 'fa-laptop', 'fa-desktop', 'fa-tv',
        'fa-wifi', 'fa-signal', 'fa-satellite', 'fa-broadcast-tower',
        'fa-car', 'fa-bus', 'fa-plane', 'fa-train', 'fa-bicycle'
    ];

    const pickerHtml = '<div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">' +
        '<h4 style="margin: 0; font-size: 1rem;">Select Icon</h4>' +
        '<button onclick="Components.closeIconPicker()" class="close-btn">&times;</button>' +
        '</div>' +
        '<div style="padding: 0 1rem 1rem;">' +
        '<div class="icon-search" style="margin-bottom: 0.75rem;">' +
        '<input type="text" id="icon-search-input" placeholder="Search icons..." ' +
        'style="width: 100%; padding: 0.5rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 4px;" ' +
        'oninput="Components.filterIcons(this.value)">' +
        '</div>' +
        '<div id="icon-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.5rem; max-height: 300px; overflow-y: auto; padding: 0.25rem;">' +
        commonIcons.map(function(icon) {
            return '<div class="icon-option" onclick="Components.selectIcon(\'' + icon + '\', \'' + targetType + '\')" ' +
                'style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; ' +
                'background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; ' +
                'transition: all 0.2s;" data-icon="' + icon + '" ' +
                'onmouseover="this.style.background=\'#e3f2fd\'; this.style.borderColor=\'#3498db\';" ' +
                'onmouseout="this.style.background=\'#f8f9fa\'; this.style.borderColor=\'#e0e0e0\';">' +
                '<i class="fas ' + icon + '" style="font-size: 1rem; color: #333;"></i>' +
                '</div>';
        }).join('') +
        '</div>' +
        '<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0;">' +
        '<label style="font-size: 0.8rem; color: #666; margin-bottom: 0.25rem; display: block;">Custom icon class:</label>' +
        '<div style="display: flex; gap: 0.5rem;">' +
        '<input type="text" id="custom-icon-input" placeholder="fa-custom-icon" ' +
        'style="flex: 1; padding: 0.5rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 4px;">' +
        '<button type="button" onclick="Components.selectCustomIcon(\'' + targetType + '\')" ' +
        'class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Apply</button>' +
        '</div></div></div>';

    var pickerModal = document.createElement('div');
    pickerModal.id = 'icon-picker-modal';
    pickerModal.className = 'modal show';
    pickerModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001;';
    pickerModal.innerHTML = '<div class="modal-content" style="background: white; border-radius: 8px; max-width: 400px; width: 90%; max-height: 90vh; overflow: hidden;">' + pickerHtml + '</div>';
    
    pickerModal.onclick = function(e) {
        if (e.target === pickerModal) Components.closeIconPicker();
    };
    
    document.body.appendChild(pickerModal);
};

Components.closeIconPicker = function() {
    var picker = document.getElementById('icon-picker-modal');
    if (picker) picker.remove();
};

Components.selectIcon = function(icon, targetType) {
    var previewEl = document.getElementById(targetType + '-icon-preview');
    var inputEl = document.getElementById(targetType + '-icon-input');
    
    if (previewEl) previewEl.className = 'fas ' + icon;
    if (inputEl) inputEl.value = icon;
    
    Components.closeIconPicker();
};

Components.selectCustomIcon = function(targetType) {
    var customInput = document.getElementById('custom-icon-input');
    if (customInput && customInput.value) {
        var icon = customInput.value.trim();
        if (!icon.startsWith('fa-')) icon = 'fa-' + icon;
        Components.selectIcon(icon, targetType);
    }
};

Components.filterIcons = function(query) {
    var icons = document.querySelectorAll('#icon-grid .icon-option');
    var lowerQuery = query.toLowerCase();
    icons.forEach(function(iconEl) {
        var iconName = iconEl.dataset.icon || '';
        iconEl.style.display = iconName.includes(lowerQuery) ? 'flex' : 'none';
    });
};
