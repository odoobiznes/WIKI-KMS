/**
 * Module: AppFolders
 * Purpose: Folder picker, folder browser, navigace v souborech
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppFolders = {
    /**
     * Render folder contents for project
     */
    async renderFolderContents(object, folderPath, viewMode = 'tree') {
        try {
            StateManager.setProjectFolder(object.id, folderPath);

            const url = `${API.baseURL}/tools/files/list?path=${encodeURIComponent(folderPath)}&allow_any=true&use_sudo=true`;
            const response = await fetch(url, {
                headers: API.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to load folder contents: ${response.statusText}`);
            }

            const contents = await response.json();

            StateManager.setCurrentFolderPath(folderPath);
            StateManager.setCurrentFolderFiles(contents.files || []);

            if (viewMode === 'tree') {
                await this.renderFolderTreeView(object, folderPath, contents.files || []);
            } else {
                await this.renderFolderListView(object, folderPath, contents.files || []);
            }
        } catch (error) {
            console.error('Error loading folder contents:', error);
            Components.showToast('Chyba při načítání obsahu složky', 'error');
            const docsResponse = await API.getObjectDocuments(object.id);
            StateManager.setDocuments(docsResponse.documents || []);
            Components.renderObjectView(object, StateManager.getDocuments(), 'list');
        }
    },

    /**
     * Render folder tree view
     */
    async renderFolderTreeView(object, folderPath, files) {
        const mainView = document.getElementById('main-view');

        const folders = files.filter(f => f.type === 'directory').sort((a, b) => a.name.localeCompare(b.name));
        const fileList = files.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
        const allItems = [...folders, ...fileList];

        let treeHTML = '';
        allItems.forEach((item) => {
            const isFolder = item.type === 'directory';
            const icon = isFolder ? 'fa-folder' : AppUIHelpers.getFileIcon(item.name);
            const iconColor = isFolder ? '#f39c12' : '#95a5a6';
            const size = item.size ? Components.formatFileSize(item.size) : '-';

            treeHTML += `
                <div class="folder-tree-item"
                     data-path="${item.path.replace(/'/g, "\\'")}"
                     data-type="${item.type}"
                     onclick="app.navigateProjectFolder('${item.path.replace(/'/g, "\\'")}', '${item.type}', ${object.id})"
                     style="padding: 0.5rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; border-left: 3px solid transparent; transition: all 0.2s;"
                     onmouseover="this.style.background='#f5f5f5'; this.style.borderLeftColor='#3498db'"
                     onmouseout="this.style.background='transparent'; this.style.borderLeftColor='transparent'">
                    <i class="fas ${icon}" style="color: ${iconColor}; width: 20px; text-align: center;"></i>
                    <span style="flex: 1; font-size: 0.9rem;">${item.name}</span>
                    ${isFolder ? '<i class="fas fa-chevron-right" style="color: #bdc3c7; font-size: 0.7rem;"></i>' : `<span style="color: #7f8c8d; font-size: 0.8rem;">${size}</span>`}
                </div>
            `;
        });

        const breadcrumbHTML = this.buildBreadcrumb(folderPath, object.id);

        mainView.innerHTML = `
            <div class="object-view">
                <div class="object-header-compact">
                    <div class="object-header-title">
                        <h2 class="object-name">${object.object_name || object.name}</h2>
                    </div>
                    <div class="object-header-description">
                        <span class="object-desc-text">${object.description || 'No description'}</span>
                    </div>
                    <div class="object-header-actions">
                        <button class="btn-icon-only" onclick="app.toggleProjectFolderView(${object.id})" title="Přepnout na seznam">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="object-info-btn" onclick="app.toggleObjectInfo(${object.id})" title="More info">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div style="padding: 0.4rem 0.6rem; background: #f5f7fa; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0;">
                        <i class="fas fa-folder" style="color: #f39c12; font-size: 0.8rem;"></i>
                        <strong style="font-size: 0.8rem;">Cesta:</strong>
                        <div style="font-family: monospace; font-size: 0.75rem; word-break: break-all; flex: 1;">
                            ${breadcrumbHTML}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="app.navigateProjectFolderUp(${object.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap;">
                        <i class="fas fa-arrow-up"></i> Nahoru
                    </button>
                </div>
                <div id="project-folder-tree" style="max-height: 600px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px; background: white;">
                    ${treeHTML || '<div style="text-align: center; padding: 2rem; color: #7f8c8d;">Složka je prázdná</div>'}
                </div>
            </div>
        `;
    },

    /**
     * Render folder list view
     */
    async renderFolderListView(object, folderPath, files) {
        const mainView = document.getElementById('main-view');

        const folders = files.filter(f => f.type === 'directory').sort((a, b) => a.name.localeCompare(b.name));
        const fileList = files.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
        const allItems = [...folders, ...fileList];

        const filesHTML = allItems.length > 0
            ? allItems.map(file => {
                const icon = file.type === 'directory' ? 'fa-folder' : AppUIHelpers.getFileIcon(file.name);
                const size = file.size ? Components.formatFileSize(file.size) : '-';
                return `
                    <div class="document-card" onclick="app.navigateProjectFolder('${file.path.replace(/'/g, "\\'")}', '${file.type}', ${object.id})">
                        <div class="document-card-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <h4>${file.name}</h4>
                        <div class="meta">
                            ${file.type === 'directory' ? 'Folder' : 'File'} • ${size}
                        </div>
                    </div>
                `;
            }).join('')
            : '<p style="color: #7f8c8d;">Složka je prázdná</p>';

        const breadcrumbHTML = this.buildBreadcrumb(folderPath, object.id);

        mainView.innerHTML = `
            <div class="object-view">
                <div class="object-header-compact">
                    <div class="object-header-title">
                        <h2 class="object-name">${object.object_name || object.name}</h2>
                    </div>
                    <div class="object-header-description">
                        <span class="object-desc-text">${object.description || 'No description'}</span>
                    </div>
                    <div class="object-header-actions">
                        <button class="btn-icon-only" onclick="app.toggleProjectFolderView(${object.id})" title="Přepnout na strom">
                            <i class="fas fa-sitemap"></i>
                        </button>
                        <button class="object-info-btn" onclick="app.toggleObjectInfo(${object.id})" title="More info">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div style="padding: 0.4rem 0.6rem; background: #f5f7fa; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0;">
                        <i class="fas fa-folder" style="color: #f39c12; font-size: 0.8rem;"></i>
                        <strong style="font-size: 0.8rem;">Cesta:</strong>
                        <div style="font-family: monospace; font-size: 0.75rem; word-break: break-all; flex: 1;">
                            ${breadcrumbHTML}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="app.navigateProjectFolderUp(${object.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap;">
                        <i class="fas fa-arrow-up"></i> Nahoru
                    </button>
                </div>
                <div id="documents-container" class="documents-container">
                    <div class="documents-grid">
                        ${filesHTML}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Build breadcrumb navigation
     */
    buildBreadcrumb(folderPath, objectId) {
        const pathParts = folderPath.split('/').filter(p => p);
        let breadcrumbHTML = '';
        let currentPath = '';

        pathParts.forEach((part, index) => {
            if (index === 0) {
                currentPath = '/' + part;
            } else {
                currentPath += '/' + part;
            }
            const isLast = index === pathParts.length - 1;
            const separator = index > 0 ? ' <span style="color: #7f8c8d;">/</span> ' : '';
            breadcrumbHTML += `${separator}<span style="color: ${isLast ? '#2c3e50' : '#3498db'}; cursor: pointer; ${isLast ? 'font-weight: 600;' : ''}" onclick="app.navigateProjectFolder('${currentPath.replace(/'/g, "\\'")}', 'directory', ${objectId})" title="${isLast ? 'Aktuální složka' : 'Klikni pro otevření'}">${part}</span>`;
        });

        return breadcrumbHTML;
    },

    /**
     * Navigate to folder or open file
     */
    async navigateProjectFolder(path, type, objectId) {
        if (type === 'directory') {
            const object = await API.getObject(objectId);
            const viewMode = StateManager.getProjectFolderViewMode();
            await this.renderFolderContents(object, path, viewMode);
        } else {
            await this.openFile(path);
        }
    },

    /**
     * Navigate up in folder structure
     */
    async navigateProjectFolderUp(objectId) {
        const currentPath = StateManager.getCurrentFolderPath();
        if (!currentPath) return;

        const pathParts = currentPath.split('/').filter(p => p);
        if (pathParts.length > 0) {
            pathParts.pop();
            const parentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
            const object = await API.getObject(objectId);
            const viewMode = StateManager.getProjectFolderViewMode();
            await this.renderFolderContents(object, parentPath, viewMode);
        }
    },

    /**
     * Toggle project folder view mode
     */
    async toggleProjectFolderView(objectId) {
        const currentViewMode = StateManager.getProjectFolderViewMode();
        const newViewMode = currentViewMode === 'tree' ? 'list' : 'tree';
        StateManager.setProjectFolderViewMode(newViewMode);

        const object = await API.getObject(objectId);
        const folderPath = StateManager.getCurrentFolderPath() || object.metadata?.folder_path;
        if (folderPath) {
            await this.renderFolderContents(object, folderPath, newViewMode);
        }
    },

    /**
     * Open file (text or binary)
     */
    async openFile(filePath) {
        try {
            Components.showToast('Načítám soubor...', 'info');

            const response = await API.downloadFile(filePath, true, true);
            const contentType = response.headers.get('content-type') || '';
            const fileName = filePath.split('/').pop();

            const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
            const textExtensions = ['.txt', '.json', '.xml', '.html', '.css', '.js', '.py', '.md', '.yml', '.yaml', '.sh', '.sql', '.log', '.conf', '.ini', '.env'];
            const isTextFile = textTypes.some(t => contentType.includes(t)) ||
                              textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
            const isImage = contentType.startsWith('image/');

            if (isTextFile) {
                const text = await response.text();
                this.showFileContentModal(fileName, text, contentType);
            } else if (isImage) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                this.showImageModal(fileName, imageUrl);
            } else {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                Components.showToast(`Soubor ${fileName} stažen`, 'success');
            }
        } catch (error) {
            console.error('Error opening file:', error);
            Components.showToast(`Chyba při otevírání souboru: ${error.message}`, 'error');
        }
    },

    /**
     * Show file content in modal
     */
    showFileContentModal(fileName, content, contentType) {
        const modal = document.createElement('div');
        modal.id = 'file-content-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh; width: 1200px;">
                <div class="modal-header">
                    <h3><i class="fas fa-file-code"></i> ${fileName}</h3>
                    <button class="modal-close" onclick="AppFolders.closeFileContentModal()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 1rem; background: #f5f7fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <button class="btn btn-secondary" onclick="AppFolders.downloadFileContent('${fileName}', document.querySelector('#file-content-modal pre code').textContent)">
                                <i class="fas fa-download"></i> Stáhnout
                            </button>
                        </div>
                        <div style="color: #7f8c8d; font-size: 0.85rem;">
                            ${Components.formatFileSize(new Blob([content]).size)}
                        </div>
                    </div>
                    <pre style="margin: 0; padding: 1rem; overflow: auto; flex: 1; background: #2c3e50; color: #ecf0f1; font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.5;"><code>${AppUIHelpers.escapeHtml(content)}</code></pre>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFileContentModal();
            }
        });
    },

    /**
     * Show image in modal
     */
    showImageModal(fileName, imageUrl) {
        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; max-height: 95vh; width: auto; height: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-image"></i> ${fileName}</h3>
                    <button class="modal-close" onclick="AppFolders.closeImageModal()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1rem; text-align: center; background: #2c3e50; overflow: auto;">
                    <img src="${imageUrl}" alt="${fileName}" style="max-width: 100%; max-height: 85vh; object-fit: contain; border-radius: 4px;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImageModal();
            }
        });
    },

    /**
     * Close file content modal
     */
    closeFileContentModal() {
        const modal = document.getElementById('file-content-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Close image modal
     */
    closeImageModal() {
        const modal = document.getElementById('image-modal');
        if (modal) {
            const img = modal.querySelector('img');
            if (img && img.src) {
                URL.revokeObjectURL(img.src);
            }
            modal.remove();
        }
    },

    /**
     * Download file content
     */
    downloadFileContent(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Components.showToast(`Soubor ${fileName} stažen`, 'success');
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppFolders = AppFolders;
}
