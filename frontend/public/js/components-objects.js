/**
 * KMS Components - Objects module
 * Renders object view with documents
 */

// Render object view
Components.renderObjectView = function(object, documents, viewMode = 'list') {
    const mainView = document.getElementById('main-view');

    // Status icon only (no text)
    const statusIcon = object.status
        ? `<span class="status-icon ${object.status}" title="${object.status}"></span>`
        : '';

    // Truncate description for compact header
    const shortDescription = object.description
        ? (object.description.length > 60 ? object.description.substring(0, 60) + '...' : object.description)
        : 'No description';

    const currentViewMode = viewMode || 'tiles';
    const docsHTML = this.renderDocuments(documents || [], currentViewMode);

    mainView.innerHTML = `
        <div class="object-view">
            <div class="object-header-compact">
                <div class="object-header-title">
                    <h2 class="object-name">${object.object_name || object.name}</h2>
                </div>
                <div class="object-header-description">
                    <span class="object-desc-text">${shortDescription}</span>
                </div>
                <div class="object-header-actions">
                    <button class="object-info-btn" onclick="app.toggleObjectInfo(${object.id})" title="More info">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <div class="object-header-status">
                    ${statusIcon}
                </div>
                <div class="object-header-docs-controls">
                    <div class="document-view-dropdown-wrapper">
                        <button class="document-view-dropdown-btn" onclick="app.toggleDocumentViewDropdown()" title="View mode">
                            <i class="fas fa-${currentViewMode === 'tiles' ? 'th' : currentViewMode === 'list' ? 'list' : 'columns'}"></i>
                            <span id="document-view-label">${currentViewMode === 'tiles' ? 'Tiles' : currentViewMode === 'list' ? 'List' : 'Kanban'}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="document-view-dropdown" class="document-view-dropdown" style="display: none;">
                            <button onclick="app.setDocumentView('tiles'); app.toggleDocumentViewDropdown();" class="document-view-option ${currentViewMode === 'tiles' ? 'active' : ''}" data-view="tiles">
                                <i class="fas fa-th"></i> Tiles
                            </button>
                            <button onclick="app.setDocumentView('list'); app.toggleDocumentViewDropdown();" class="document-view-option ${currentViewMode === 'list' ? 'active' : ''}" data-view="list">
                                <i class="fas fa-list"></i> List
                            </button>
                            <button onclick="app.setDocumentView('kanban'); app.toggleDocumentViewDropdown();" class="document-view-option ${currentViewMode === 'kanban' ? 'active' : ''}" data-view="kanban">
                                <i class="fas fa-columns"></i> Kanban
                            </button>
                        </div>
                    </div>
                    <button onclick="app.createDocument(${object.id})" class="btn-icon-only" title="New Document">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="document-filter-dropdown-wrapper">
                        <button class="document-filter-dropdown-btn" onclick="app.toggleDocumentFilterDropdown()" title="Filter documents">
                            <i class="fas fa-filter"></i>
                            <span id="document-filter-label">All</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="document-filter-dropdown" class="document-filter-dropdown" style="display: none;">
                            <button onclick="app.filterDocuments('all'); app.toggleDocumentFilterDropdown();" class="document-filter-option" data-filter="all">
                                All
                            </button>
                            <button onclick="app.filterDocuments('doc'); app.toggleDocumentFilterDropdown();" class="document-filter-option" data-filter="doc">
                                Doc
                            </button>
                            <button onclick="app.filterDocuments('code'); app.toggleDocumentFilterDropdown();" class="document-filter-option" data-filter="code">
                                Code
                            </button>
                            <button onclick="app.filterDocuments('plany'); app.toggleDocumentFilterDropdown();" class="document-filter-option" data-filter="plany">
                                Plany
                            </button>
                            <button onclick="app.filterDocuments('instrukce'); app.toggleDocumentFilterDropdown();" class="document-filter-option" data-filter="instrukce">
                                Instrukce
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Object Info Dropdown (hidden by default) -->
            <div id="object-info-dropdown-${object.id}" class="object-info-dropdown" style="display: none;">
                <div class="object-info-content">
                    <div class="info-row">
                        <span class="info-label">Category:</span>
                        <span class="info-value">${object.category_name}${object.subcategory_name ? ' / ' + object.subcategory_name : ''}</span>
                    </div>
                    ${object.description ? `
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span class="info-value">${object.description}</span>
                    </div>
                    ` : ''}
                    ${object.author ? `
                    <div class="info-row">
                        <span class="info-label">Author:</span>
                        <span class="info-value">${object.author}</span>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="info-label">Created:</span>
                        <span class="info-value">${new Date(object.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Updated:</span>
                        <span class="info-value">${new Date(object.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div id="documents-container" class="documents-container">
                ${docsHTML}
            </div>
        </div>
    `;
};

