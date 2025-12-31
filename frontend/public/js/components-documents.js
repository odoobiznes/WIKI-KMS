/**
 * KMS Components - Documents module
 * Renders documents in various view modes
 */

// Render documents based on view mode
Components.renderDocuments = function(documents, viewMode = 'list') {
    if (!documents || documents.length === 0) {
        return '<p style="color: #7f8c8d;">No documents found</p>';
    }

    switch(viewMode) {
        case 'list':
            return this.renderDocumentsList(documents);
        case 'kanban':
            return this.renderDocumentsKanban(documents);
        case 'tiles':
        default:
            return this.renderDocumentsTiles(documents);
    }
};

// Render documents as tiles (grid)
Components.renderDocumentsTiles = function(documents) {
    return `<div class="documents-grid">${documents.map(doc => `
        <div class="document-card">
            <div class="document-card-header">
                <span class="folder">${doc.folder}</span>
                <div class="document-actions">
                    <i class="fas fa-eye" onclick="app.viewDocument(${doc.id}); event.stopPropagation();" title="View"></i>
                    <i class="fas fa-edit" onclick="app.editDocumentMetadata(${doc.id}); event.stopPropagation();" title="Edit"></i>
                    <i class="fas fa-trash" onclick="app.deleteDocument(${doc.id}); event.stopPropagation();" title="Delete"></i>
                </div>
            </div>
            <div class="document-card-icon">
                ${this.getDocumentIcon(doc.filename, doc)}
            </div>
            <h4 onclick="app.viewDocument(${doc.id})">${doc.filename}</h4>
            <div class="meta">
                ${this.formatFileSize(doc.size_bytes || 0)} • v${doc.version || 1}
            </div>
        </div>
    `).join('')}</div>`;
};

// Render documents as list (compact, single line)
Components.renderDocumentsList = function(documents) {
    return `<div class="documents-list">${documents.map(doc => `
        <div class="document-list-item">
            <div class="document-list-icon">
                ${this.getDocumentIcon(doc.filename, doc)}
            </div>
            <div class="document-list-content" onclick="app.viewDocument(${doc.id})">
                <span class="document-name">${doc.filename}</span>
                <span class="document-folder">${doc.folder}</span>
                <span class="document-size">${this.formatFileSize(doc.size_bytes || 0)}</span>
                <span class="document-version">v${doc.version || 1}</span>
            </div>
            <div class="document-list-actions">
                <i class="fas fa-eye" onclick="app.viewDocument(${doc.id})" title="View"></i>
                <i class="fas fa-edit" onclick="app.editDocumentMetadata(${doc.id})" title="Edit"></i>
                <i class="fas fa-trash" onclick="app.deleteDocument(${doc.id})" title="Delete"></i>
            </div>
        </div>
    `).join('')}</div>`;
};

// Render documents as kanban
Components.renderDocumentsKanban = function(documents) {
    // Group documents by folder (type)
    const grouped = {};
    documents.forEach(doc => {
        const folder = doc.folder || 'other';
        if (!grouped[folder]) {
            grouped[folder] = [];
        }
        grouped[folder].push(doc);
    });

    const columns = Object.keys(grouped).map(folder => `
        <div class="kanban-column">
            <div class="kanban-column-header">
                <h4>${folder}</h4>
                <span class="kanban-count">${grouped[folder].length}</span>
            </div>
            <div class="kanban-column-content">
                ${grouped[folder].map(doc => `
                    <div class="kanban-card">
                        <div class="kanban-card-icon">
                            ${this.getDocumentIcon(doc.filename, doc)}
                        </div>
                        <h5 onclick="app.viewDocument(${doc.id})">${doc.filename}</h5>
                        <div class="kanban-meta">
                            ${this.formatFileSize(doc.size_bytes || 0)} • v${doc.version || 1}
                        </div>
                        <div class="kanban-actions">
                            <i class="fas fa-eye" onclick="app.viewDocument(${doc.id})" title="View"></i>
                            <i class="fas fa-edit" onclick="app.editDocumentMetadata(${doc.id})" title="Edit"></i>
                            <i class="fas fa-trash" onclick="app.deleteDocument(${doc.id})" title="Delete"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    return `<div class="documents-kanban">${columns}</div>`;
};

// Render document viewer
Components.renderDocumentViewer = function(doc, content) {
    const mainView = document.getElementById('main-view');

    mainView.innerHTML = `
        <div class="document-viewer">
            <div class="object-header">
                <div>
                    <h2>${doc.filename}</h2>
                    <p style="color: #7f8c8d; margin-top: 0.25rem; font-size: 0.85rem;">
                        ${doc.folder} • Version ${doc.version}
                    </p>
                </div>
                <button onclick="app.editDocument(${doc.id})" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>

            <div class="document-content" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 0.875rem; margin: 0;">${this.escapeHtml(content)}</pre>
            </div>
        </div>
    `;
};

// Render document editor
Components.renderDocumentEditor = function(doc, content) {
    const mainView = document.getElementById('main-view');

    mainView.innerHTML = `
        <div class="document-editor">
            <div class="object-header">
                <div>
                    <h2>${doc.filename}</h2>
                    <p style="color: #7f8c8d; margin-top: 0.25rem; font-size: 0.85rem;">
                        ${doc.folder} • Version ${doc.version}
                    </p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="app.saveDocument(${doc.id})" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save
                    </button>
                    <button onclick="app.viewDocument(${doc.id})" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>

            <div class="document-editor-content" style="margin-top: 1rem;">
                <textarea id="document-editor-textarea" style="width: 100%; min-height: 500px; padding: 1rem; font-family: 'Courier New', monospace; font-size: 0.875rem; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${this.escapeHtml(content)}</textarea>
            </div>
        </div>
    `;
};

