/**
 * KMS Components - Categories module
 * Renders category tree and category objects view
 */

// Render categories tree with expandable structure
Components.renderCategoriesTree = function(categories, filter = 'all', expandedCategories = null) {
    const tree = document.getElementById('categories-tree');
    if (!categories || categories.length === 0) {
        tree.innerHTML = '<div class="loading">No categories found</div>';
        return;
    }

    const filtered = filter === 'all'
        ? categories
        : categories.filter(c => c.type === filter);

    // Ensure expandedCategories is an object
    if (!expandedCategories || typeof expandedCategories !== 'object') {
        expandedCategories = {};
    }

    const html = filtered.map(category => {
        const isExpanded = expandedCategories[category.id] || false;
        const icon = category.icon || category.metadata?.icon || 'fa-folder';
        const iconClass = icon.startsWith('fa-') ? `fas ${icon}` : icon;

        return `
            <div class="tree-item category-item" data-category-id="${category.id}">
                <div class="tree-item-content" onclick="app.selectCategory(${category.id})">
                    <i class="${iconClass} tree-item-icon"></i>
                    <span class="tree-item-label">${category.name}</span>
                    <div class="tree-item-actions" onclick="event.stopPropagation();">
                        <div class="tree-dropdown">
                            <button class="tree-dropdown-toggle" onclick="app.toggleTreeDropdown(event, 'category-${category.id}')" title="Menu">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="tree-dropdown-menu" id="category-${category.id}-dropdown" style="display: none;">
                                <button onclick="app.createSubcategoryInCategory(${category.id}); app.closeTreeDropdown('category-${category.id}');" class="tree-dropdown-item">
                                    <i class="fas fa-plus" style="color: #27ae60;"></i> Přidat podkategorii
                                </button>
                                <button onclick="app.createObjectInCategory(${category.id}); app.closeTreeDropdown('category-${category.id}');" class="tree-dropdown-item">
                                    <i class="fas fa-folder-plus" style="color: #3498db;"></i> Přidat projekt
                                </button>
                                <button onclick="app.createCategory(); app.closeTreeDropdown('category-${category.id}');" class="tree-dropdown-item">
                                    <i class="fas fa-folder" style="color: #9b59b6;"></i> Nová kategorie
                                </button>
                                <div class="tree-dropdown-divider"></div>
                                <button onclick="app.editCategory(${category.id}); app.closeTreeDropdown('category-${category.id}');" class="tree-dropdown-item">
                                    <i class="fas fa-edit"></i> Upravit
                                </button>
                                <button onclick="app.deleteCategory(${category.id}); app.closeTreeDropdown('category-${category.id}');" class="tree-dropdown-item tree-dropdown-item-danger">
                                    <i class="fas fa-trash"></i> Smazat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tree-children" data-category-children="${category.id}" style="display: ${isExpanded ? 'block' : 'none'};">
                    <div class="tree-loading">Načítání...</div>
                </div>
            </div>
        `;
    }).join('');

    tree.innerHTML = html;
};

// Render category objects
Components.renderCategoryObjects = function(category, objects) {
    const mainView = document.getElementById('main-view');

    if (!objects || objects.length === 0) {
        mainView.innerHTML = `
            <div class="category-view">
                <h2>${category.name}</h2>
                <p style="color: #7f8c8d; margin: 1rem 0 2rem;">
                    ${category.description || 'No description'}
                </p>
                <p style="color: #7f8c8d;">No objects in this category</p>
                <button onclick="app.createObjectInCategory(${category.id})" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Create Object
                </button>
            </div>
        `;
        return;
    }

    const objectsHTML = objects.map(obj => {
        const icon = obj.icon || obj.metadata?.icon || 'fa-folder';
        const iconClass = icon.startsWith('fa-') ? `fas ${icon}` : icon;

        return `
        <div class="document-card project-card" data-project-id="${obj.id}">
            <div class="project-card-content" onclick="app.selectObject(${obj.id})">
                <div class="project-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="project-info">
                    <span class="folder">${obj.category_name}</span>
                    <h4>${obj.object_name}</h4>
                    <div class="meta">
                        ${obj.subcategory_name || 'No subcategory'} •
                        ${obj.status}
                    </div>
                </div>
            </div>
            <div class="project-actions" onclick="event.stopPropagation();">
                <i class="fas fa-edit project-action-icon" onclick="app.editProject(${obj.id})" title="Edit"></i>
                <i class="fas fa-trash project-action-icon" onclick="app.deleteProject(${obj.id})" title="Delete"></i>
            </div>
        </div>
    `;
    }).join('');

    mainView.innerHTML = `
        <div class="category-view">
            <div class="object-header">
                <div>
                    <h2>${category.name}</h2>
                    <p style="color: #7f8c8d; margin-top: 0.5rem;">
                        ${category.description || 'No description'}
                    </p>
                </div>
                <button onclick="app.createObjectInCategory(${category.id})" class="btn btn-primary">
                    <i class="fas fa-plus"></i> New Object
                </button>
            </div>
            <h3 style="margin: 2rem 0 1rem;">Projekty (${objects.length})</h3>
            <div class="documents-grid">
                ${objectsHTML}
            </div>
        </div>
    `;
};

// Render search results
Components.renderSearchResults = function(query, results) {
    const mainView = document.getElementById('main-view');

    if (!results || results.length === 0) {
        mainView.innerHTML = `
            <div class="search-results">
                <h3>Search Results for "${query}"</h3>
                <p style="color: #7f8c8d; padding: 2rem;">No results found</p>
            </div>
        `;
        return;
    }

    const html = results.map(result => `
        <div class="search-result" onclick="app.viewDocument(${result.document_id})">
            <h4>${result.filename}</h4>
            <div class="path">
                ${result.object_name} / ${result.folder}
            </div>
            <div style="color: #7f8c8d; font-size: 0.85rem; margin-top: 0.5rem;">
                Relevance: ${(result.rank * 100).toFixed(1)}%
            </div>
        </div>
    `).join('');

    mainView.innerHTML = `
        <div class="search-results">
            <h3>Search Results for "${query}"</h3>
            <p style="color: #7f8c8d; margin-bottom: 1.5rem;">
                Found ${results.length} document${results.length !== 1 ? 's' : ''}
            </p>
            ${html}
        </div>
    `;
};
