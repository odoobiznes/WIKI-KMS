/**
 * Module: AppImport
 * Purpose: Import a export projektů - GitHub, GitLab, SFTP, SMB, NFS, lokální
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppImport = {
    /**
     * Show import modal
     */
    async showImportModal(objectId) {
        const object = await API.getObject(objectId);
        const targetPath = object.metadata?.folder_path || `/opt/kms/${object.object_name || object.name}`;

        const importModalHTML = `
            <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; margin: 0;"><i class="fas fa-file-import"></i> Import Project</h3>
                <button onclick="app.closeModal()" class="close-btn">&times;</button>
            </div>
            <form id="import-form" onsubmit="AppImport.submitImport(event, ${objectId})" style="padding: 0 1rem 1rem;">
                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Zdroj *</label>
                    <select name="source_type" id="import-source-type" onchange="AppImport.updateImportForm()" required style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                        <option value="local_computer">Místní počítač (z prohlížeče)</option>
                        <option value="folder">Lokální složka na serveru</option>
                        <option value="github">GitHub</option>
                        <option value="gitlab">GitLab</option>
                        <option value="git">Git URL</option>
                        <option value="sftp">SFTP</option>
                        <option value="smb">SMB/CIFS (Síťový disk)</option>
                        <option value="nfs">NFS</option>
                    </select>
                </div>

                <!-- Local Computer fields with Drag & Drop -->
                <div id="import-local_computer-fields" style="display: block;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.5rem; display: block; font-weight: 500;">Import z místního počítače *</label>
                        
                        <!-- Drag & Drop Zone -->
                        <div id="drop-zone" 
                             style="border: 2px dashed #3498db; border-radius: 8px; padding: 2rem; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%); transition: all 0.3s ease; cursor: pointer;"
                             ondragover="AppImport.handleDragOver(event)"
                             ondragleave="AppImport.handleDragLeave(event)"
                             ondrop="AppImport.handleDrop(event)"
                             onclick="document.getElementById('local-files-input').click()">
                            <input type="file" id="local-files-input" webkitdirectory directory multiple style="display: none;">
                            <div id="drop-zone-content">
                                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #3498db; margin-bottom: 1rem;"></i>
                                <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50;">Přetáhněte složku sem</h4>
                                <p style="color: #7f8c8d; margin: 0; font-size: 0.9rem;">nebo klikněte pro výběr složky</p>
                            </div>
                        </div>
                        
                        <!-- Alternative: Use File System Access API -->
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                            <button type="button" onclick="AppImport.selectFolderAdvanced()" 
                                    style="flex: 1; padding: 0.5rem; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i class="fas fa-folder-open"></i>
                                <span>Pokročilý výběr složky</span>
                            </button>
                            <button type="button" onclick="document.getElementById('local-files-input').click()" 
                                    style="flex: 1; padding: 0.5rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i class="fas fa-file-upload"></i>
                                <span>Vybrat soubory</span>
                            </button>
                        </div>
                        
                        <!-- Preview Area -->
                        <div id="local-files-preview" style="margin-top: 0.75rem; padding: 0.75rem; background: #f5f5f5; border-radius: 4px; max-height: 200px; overflow-y: auto; display: none; border: 1px solid #27ae60;">
                            <div style="font-size: 0.85rem; color: #2c3e50; font-weight: 500; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: #27ae60;"></i> 
                                <span id="local-folder-name">Vybraná složka</span>
                            </div>
                            <div id="local-files-list" style="font-size: 0.8rem; font-family: monospace; color: #2c3e50;"></div>
                            <button type="button" onclick="AppImport.clearSelection()" 
                                    style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                                <i class="fas fa-times"></i> Zrušit výběr
                            </button>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div id="upload-progress" style="display: none; margin-top: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                <span style="font-size: 0.8rem; color: #2c3e50;">Nahrávání...</span>
                                <span id="upload-progress-text" style="font-size: 0.8rem; color: #3498db;">0%</span>
                            </div>
                            <div style="height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                                <div id="upload-progress-bar" style="height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); width: 0%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GitHub fields -->
                <div id="import-github-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">GitHub Repo (user/repo) *</label>
                        <input type="text" name="github_repo" placeholder="username/repository" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Branch</label>
                        <input type="text" name="github_branch" placeholder="main" value="main" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- GitLab fields -->
                <div id="import-gitlab-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">GitLab Repo (user/repo) *</label>
                        <input type="text" name="gitlab_repo" placeholder="username/repository" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Branch</label>
                        <input type="text" name="gitlab_branch" placeholder="main" value="main" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Access Token</label>
                        <input type="password" name="gitlab_token" placeholder="Pro privátní repozitáře" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- Git URL fields -->
                <div id="import-git-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Git URL *</label>
                        <input type="text" name="git_url" placeholder="https://git.example.com/repo.git" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- SFTP fields -->
                <div id="import-sftp-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Host *</label>
                        <input type="text" name="sftp_host" placeholder="sftp.example.com" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Port</label>
                        <input type="number" name="sftp_port" placeholder="22" value="22" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Username *</label>
                        <input type="text" name="sftp_user" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Password *</label>
                        <input type="password" name="sftp_password" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Remote Path *</label>
                        <input type="text" name="sftp_path" placeholder="/path/to/project" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- SMB fields -->
                <div id="import-smb-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">SMB Share (//server/share) *</label>
                        <input type="text" name="smb_share" placeholder="//server/share" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Username</label>
                        <input type="text" name="smb_user" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Password</label>
                        <input type="password" name="smb_password" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta ve share</label>
                        <input type="text" name="source_path" placeholder="/subfolder" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- NFS fields -->
                <div id="import-nfs-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">NFS Path (server:/path) *</label>
                        <input type="text" name="nfs_path" placeholder="server:/export/path" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta v exportu</label>
                        <input type="text" name="source_path" placeholder="/subfolder" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <!-- Folder fields -->
                <div id="import-folder-fields" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cesta ke složce *</label>
                        <input type="text" name="source_path" placeholder="/path/to/source" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0.75rem;">
                    <label style="font-size: 0.85rem; margin-bottom: 0.25rem;">Cílová cesta *</label>
                    <input type="text" name="target_path" value="${targetPath}" required style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                </div>

                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" onclick="app.closeModal()" class="btn btn-secondary" style="padding: 0.5rem 1rem;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Import</button>
                </div>
            </form>
        `;

        AppUIHelpers.showModal(importModalHTML);
        setTimeout(() => {
            this.updateImportForm();
        }, 50);
    },

    /**
     * Update import form based on selected source type
     */
    updateImportForm() {
        const sourceType = document.getElementById('import-source-type').value;

        // Hide all field groups
        ['github', 'gitlab', 'git', 'sftp', 'smb', 'nfs', 'folder', 'local_computer'].forEach(type => {
            const el = document.getElementById(`import-${type}-fields`);
            if (el) el.style.display = 'none';
        });

        // Show relevant fields
        const el = document.getElementById(`import-${sourceType}-fields`);
        if (el) el.style.display = 'block';

        // Setup file input listener for local_computer
        if (sourceType === 'local_computer') {
            this.setupLocalFileInput();
        }
    },

    /**
     * Setup local file input
     */
    setupLocalFileInput() {
        const fileInput = document.getElementById('local-files-input');
        if (fileInput) {
            fileInput.onchange = (e) => this.handleFilesSelected(Array.from(e.target.files));
        }
    },

    /**
     * Handle drag over event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#27ae60';
            dropZone.style.background = 'linear-gradient(135deg, #d5f4e6 0%, #c3e8d5 100%)';
        }
    },

    /**
     * Handle drag leave event
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#3498db';
            dropZone.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%)';
        }
    },

    /**
     * Handle drop event
     */
    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = '#3498db';
            dropZone.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%)';
        }

        const items = event.dataTransfer.items;
        if (items) {
            const files = [];
            const entries = [];
            
            // Get entries first
            for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry();
                if (entry) {
                    entries.push(entry);
                }
            }
            
            // Process entries recursively
            for (const entry of entries) {
                await this.processEntry(entry, '', files);
            }
            
            if (files.length > 0) {
                this.handleFilesSelected(files);
            }
        } else if (event.dataTransfer.files) {
            this.handleFilesSelected(Array.from(event.dataTransfer.files));
        }
    },

    /**
     * Process file entry recursively (for directory support)
     */
    async processEntry(entry, path, files) {
        return new Promise((resolve) => {
            if (entry.isFile) {
                entry.file(file => {
                    // Add path info to file
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: path ? `${path}/${file.name}` : file.name,
                        writable: false
                    });
                    files.push(file);
                    resolve();
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                const readEntries = () => {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length === 0) {
                            resolve();
                        } else {
                            for (const childEntry of entries) {
                                await this.processEntry(
                                    childEntry, 
                                    path ? `${path}/${entry.name}` : entry.name, 
                                    files
                                );
                            }
                            readEntries();
                        }
                    });
                };
                readEntries();
            }
        });
    },

    /**
     * Handle files selected (from input or drag & drop)
     */
    handleFilesSelected(files) {
        const preview = document.getElementById('local-files-preview');
        const list = document.getElementById('local-files-list');
        const folderName = document.getElementById('local-folder-name');
        const dropZone = document.getElementById('drop-zone');

        if (files.length > 0) {
            // Get folder name from first file's path
            let rootFolder = '';
            if (files[0].webkitRelativePath) {
                rootFolder = files[0].webkitRelativePath.split('/')[0];
            }

            preview.style.display = 'block';
            folderName.textContent = rootFolder || 'Vybrané soubory';

            // Show file statistics
            const totalSize = files.reduce((sum, f) => sum + f.size, 0);
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            
            // Group by extension
            const extensions = {};
            files.forEach(f => {
                const ext = f.name.split('.').pop()?.toLowerCase() || 'other';
                extensions[ext] = (extensions[ext] || 0) + 1;
            });
            
            const extSummary = Object.entries(extensions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([ext, count]) => `${ext}: ${count}`)
                .join(', ');

            list.innerHTML = `
                <div style="margin-bottom: 0.5rem;">
                    <strong>${files.length}</strong> souborů (<strong>${totalSizeMB}</strong> MB)
                </div>
                <div style="color: #7f8c8d; font-size: 0.75rem;">
                    ${extSummary}${Object.keys(extensions).length > 5 ? '...' : ''}
                </div>
            `;

            // Update drop zone
            if (dropZone) {
                dropZone.style.borderColor = '#27ae60';
                dropZone.innerHTML = `
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #27ae60; margin-bottom: 1rem;"></i>
                    <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50;">Složka připravena k importu</h4>
                    <p style="color: #27ae60; margin: 0; font-size: 0.9rem;">${rootFolder || 'Vybrané soubory'}</p>
                `;
            }

            // Store files for later upload
            AppState.selectedImportFiles = files;
        } else {
            this.clearSelection();
        }
    },

    /**
     * Clear file selection
     */
    clearSelection() {
        const preview = document.getElementById('local-files-preview');
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('local-files-input');

        if (preview) preview.style.display = 'none';
        if (fileInput) fileInput.value = '';
        
        if (dropZone) {
            dropZone.style.borderColor = '#3498db';
            dropZone.innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #3498db; margin-bottom: 1rem;"></i>
                <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50;">Přetáhněte složku sem</h4>
                <p style="color: #7f8c8d; margin: 0; font-size: 0.9rem;">nebo klikněte pro výběr složky</p>
            `;
        }
        
        AppState.selectedImportFiles = null;
    },

    /**
     * Select folder using File System Access API (advanced)
     */
    async selectFolderAdvanced() {
        if (!('showDirectoryPicker' in window)) {
            Components.showToast('Váš prohlížeč nepodporuje pokročilý výběr složky. Použijte klasický výběr.', 'info');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker();
            const files = [];
            
            async function processHandle(handle, path = '') {
                if (handle.kind === 'file') {
                    const file = await handle.getFile();
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: path ? `${path}/${file.name}` : file.name,
                        writable: false
                    });
                    files.push(file);
                } else if (handle.kind === 'directory') {
                    for await (const entry of handle.values()) {
                        await processHandle(entry, path ? `${path}/${handle.name}` : handle.name);
                    }
                }
            }

            Components.showToast('Načítám soubory...', 'info');
            
            // Process directory contents
            for await (const entry of dirHandle.values()) {
                await processHandle(entry, dirHandle.name);
            }

            if (files.length > 0) {
                // Add root folder to paths
                const rootName = dirHandle.name;
                files.forEach(file => {
                    if (!file.webkitRelativePath.startsWith(rootName)) {
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: `${rootName}/${file.webkitRelativePath}`,
                            writable: false
                        });
                    }
                });
                
                this.handleFilesSelected(files);
                Components.showToast(`Načteno ${files.length} souborů`, 'success');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Folder selection error:', err);
                Components.showToast('Chyba při výběru složky', 'error');
            }
        }
    },

    /**
     * Submit import form
     */
    async submitImport(event, objectId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        const sourceType = formData.get('source_type');
        const targetPath = formData.get('target_path');

        // Handle local computer upload
        if (sourceType === 'local_computer') {
            // Use stored files from drag & drop or file input
            let files = AppState.selectedImportFiles;
            
            // Fallback to file input
            if (!files || files.length === 0) {
                const fileInput = document.getElementById('local-files-input');
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    files = Array.from(fileInput.files);
                }
            }
            
            if (!files || files.length === 0) {
                Components.showToast('Vyber prosím složku z místního počítače', 'error');
                return;
            }

            try {
                // Show progress
                const progressEl = document.getElementById('upload-progress');
                const progressBar = document.getElementById('upload-progress-bar');
                const progressText = document.getElementById('upload-progress-text');
                
                if (progressEl) progressEl.style.display = 'block';

                Components.showToast(`Nahrávání ${files.length} souborů...`, 'info');

                const uploadFormData = new FormData();
                uploadFormData.append('target_path', targetPath);

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const filePath = file.webkitRelativePath || file.name;
                    uploadFormData.append('files', file, filePath);
                    
                    // Update progress
                    const progress = Math.round(((i + 1) / files.length) * 50);
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (progressText) progressText.textContent = `${progress}% (přidávání souborů)`;
                }

                // Upload
                if (progressBar) progressBar.style.width = '60%';
                if (progressText) progressText.textContent = '60% (nahrávání na server...)';
                
                const response = await API.uploadImportFiles(uploadFormData);
                
                if (progressBar) progressBar.style.width = '100%';
                if (progressText) progressText.textContent = '100% (dokončeno)';
                
                Components.showToast(response.message || `Nahráno ${response.files_count} souborů`, 'success');
                
                // Clear state
                AppState.selectedImportFiles = null;
                
                setTimeout(() => {
                    AppUIHelpers.closeModal();
                    if (StateManager.getCurrentObject()?.id === objectId) {
                        AppObjects.selectObject(objectId);
                    }
                }, 500);
            } catch (error) {
                console.error('Error uploading files:', error);
                Components.showToast(error.message || 'Chyba při nahrávání souborů', 'error');
                
                // Hide progress on error
                const progressEl = document.getElementById('upload-progress');
                if (progressEl) progressEl.style.display = 'none';
            }
            return;
        }

        const importData = {
            source_type: sourceType,
            target_path: targetPath,
            source_path: formData.get('source_path') || ''
        };

        // Add source-specific fields
        if (sourceType === 'github') {
            importData.github_repo = formData.get('github_repo');
            importData.github_branch = formData.get('github_branch') || 'main';
        } else if (sourceType === 'gitlab') {
            importData.gitlab_repo = formData.get('gitlab_repo');
            importData.gitlab_branch = formData.get('gitlab_branch') || 'main';
            importData.gitlab_token = formData.get('gitlab_token') || null;
        } else if (sourceType === 'git') {
            importData.git_url = formData.get('git_url');
        } else if (sourceType === 'sftp') {
            importData.sftp_host = formData.get('sftp_host');
            importData.sftp_port = parseInt(formData.get('sftp_port')) || 22;
            importData.sftp_user = formData.get('sftp_user');
            importData.sftp_password = formData.get('sftp_password');
            importData.sftp_path = formData.get('sftp_path');
        } else if (sourceType === 'smb') {
            importData.smb_share = formData.get('smb_share');
            importData.smb_user = formData.get('smb_user') || null;
            importData.smb_password = formData.get('smb_password') || null;
        } else if (sourceType === 'nfs') {
            importData.nfs_path = formData.get('nfs_path');
        }

        try {
            Components.showToast('Import probíhá...', 'info');
            const response = await API.importProject(importData);
            Components.showToast(response.message || 'Import úspěšný', 'success');
            AppUIHelpers.closeModal();

            if (StateManager.getCurrentObject()?.id === objectId) {
                await AppObjects.selectObject(objectId);
            }
        } catch (error) {
            console.error('Error importing project:', error);
            Components.showToast(error.message || 'Chyba při importu projektu', 'error');
        }
    },

    /**
     * Show export modal
     */
    async showExportModal(objectId) {
        const object = await API.getObject(objectId);
        const folderPath = object.metadata?.folder_path || object.file_path || '/opt/kms';

        const exportModalHTML = `
            <div style="padding: 1rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fas fa-file-export"></i> Export Project</h3>
                <form id="export-form" onsubmit="AppImport.submitExport(event, ${objectId})">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">Zdrojová cesta *</label>
                        <input type="text" name="source_path" value="${folderPath}" required style="width: 100%; padding: 0.5rem; font-size: 0.9rem; font-family: monospace;">
                    </div>

                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">Exportovat na místní počítač</label>
                        <button type="button" class="btn btn-secondary" onclick="AppImport.selectExportFolder()" style="width: 100%; padding: 0.5rem;">
                            <i class="fas fa-folder-open"></i> Vyber složku pro export
                        </button>
                        <div id="export-folder-selected" style="margin-top: 0.5rem; padding: 0.5rem; background: #f5f7fa; border-radius: 4px; font-size: 0.85rem; display: none;">
                            <i class="fas fa-folder"></i> <span id="export-folder-name"></span>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">GitHub repozitáře pro commit & push:</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="export-github-private" checked style="margin: 0;">
                            <span>Private GitHub (odooobiznes)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="export-github-public" checked style="margin: 0;">
                            <span>Public GitHub (it-enterpr)</span>
                        </label>
                    </div>

                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" onclick="app.closeModal()" class="btn btn-secondary" style="padding: 0.5rem 1rem;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-download"></i> Exportovat
                        </button>
                    </div>
                </form>
            </div>
        `;

        AppUIHelpers.showModal(exportModalHTML);
        AppState.exportFolderPath = null;
    },

    /**
     * Select export folder
     */
    selectExportFolder() {
        if ('showDirectoryPicker' in window) {
            window.showDirectoryPicker().then(handle => {
                AppState.exportFolderPath = handle.name;
                document.getElementById('export-folder-selected').style.display = 'block';
                document.getElementById('export-folder-name').textContent = handle.name;
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    Components.showToast('Chyba při výběru složky', 'error');
                }
            });
        } else {
            Components.showToast('Váš prohlížeč nepodporuje výběr složky.', 'info');
        }
    },

    /**
     * Submit export form
     */
    async submitExport(event, objectId) {
        event.preventDefault();

        const sourcePath = document.querySelector('#export-form input[name="source_path"]').value;
        const githubPrivate = document.getElementById('export-github-private').checked;
        const githubPublic = document.getElementById('export-github-public').checked;
        const localFolder = AppState.exportFolderPath;

        if (!localFolder) {
            Components.showToast('Vyberte složku pro export', 'error');
            return;
        }

        try {
            Components.showToast('Exportuji projekt...', 'info');
            const result = await API.exportProject(objectId, {
                source_path: sourcePath,
                local_folder: localFolder,
                github_private: githubPrivate,
                github_public: githubPublic
            });
            Components.showToast('Projekt úspěšně exportován', 'success');
            AppUIHelpers.closeModal();
        } catch (error) {
            console.error('Export error:', error);
            Components.showToast(`Chyba při exportu: ${error.message}`, 'error');
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppImport = AppImport;
}

