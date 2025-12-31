/**
 * Module: AppFolderPicker
 * Purpose: MC Commander style folder picker pro výběr složek projektů
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppFolderPicker = {
    /**
     * Open folder picker modal
     */
    async openFolderPicker(inputId, startPath = '/opt/kms', allowAny = true) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'folder-picker-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; width: 90vw; height: 80vh; display: flex; flex-direction: column;">
                <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                    <h3 style="font-size: 1rem; margin: 0;"><i class="fas fa-folder-open"></i> Průvodce výběrem složky projektu</h3>
                    <button onclick="AppFolderPicker.closeFolderPicker()" class="close-btn">&times;</button>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; padding: 0.5rem; overflow: hidden;">
                    <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
                        <input type="text" id="folder-path-manual" placeholder="/opt/kms nebo /mnt/network"
                            value="${startPath}" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; font-family: monospace; border: 1px solid #ddd; border-radius: 4px;"
                            onkeypress="if(event.key==='Enter') AppFolderPicker.navigateToManualPathMC()">
                        <button type="button" onclick="AppFolderPicker.navigateToManualPathMC()" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" title="Přejít na cestu">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button type="button" onclick="AppFolderPicker.createNewFolderMC()" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #27ae60; border-color: #27ae60;" title="Vytvořit novou složku">
                            <i class="fas fa-folder-plus"></i> Nová složka
                        </button>
                        <button type="button" onclick="AppFolderPicker.navigateMCUp()" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" title="Nadřazená složka">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; border: 2px solid #3498db; border-radius: 4px; background: #f8f9fa; overflow: hidden;">
                        <div style="padding: 0.5rem; background: #3498db; color: white; font-weight: 600; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fas fa-folder"></i> Aktuální složka</span>
                            <span id="mc-current-path" style="font-family: monospace; font-size: 0.75rem; font-weight: normal;">${startPath}</span>
                        </div>
                        <div style="flex: 1; overflow-y: auto; background: white;">
                            <div id="mc-content" style="padding: 0.25rem;">
                                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                                    <i class="fas fa-spinner fa-spin"></i> Načítání...
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.75rem; color: #7f8c8d;">
                            <span id="mc-status">Enter: Otevřít | ↑↓: Navigace | Backspace: Nahoru</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" onclick="AppFolderPicker.closeFolderPicker()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                                Zrušit
                            </button>
                            <button type="button" onclick="AppFolderPicker.selectFolderPathMC('${inputId}')" class="btn btn-primary" id="select-folder-btn-mc" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                                <i class="fas fa-check"></i> Vybrat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Initialize MC state
        const mcState = {
            activePanel: 'single',
            currentPath: startPath,
            singlePath: startPath,
            selectedIndex: 0,
            inputId: inputId,
            allowAny: allowAny,
            useSudo: true
        };
        StateManager.setMCState(mcState);

        await this.loadMCPanel('single', startPath);
        this.setupMCKeyboard();
    },

    /**
     * Load MC panel content
     */
    async loadMCPanel(panel, path) {
        const contentEl = document.getElementById('mc-content');
        const pathEl = document.getElementById('mc-current-path');

        try {
            const mcState = StateManager.getMCState() || { allowAny: true, useSudo: true };
            mcState.allowAny = mcState.allowAny !== false;
            mcState.useSudo = mcState.useSudo !== false;

            if (pathEl) {
                pathEl.textContent = path;
            }

            mcState.currentPath = path;
            StateManager.setMCState(mcState);

            const url = `/tools/files/list?path=${encodeURIComponent(path)}&allow_any=${mcState.allowAny}&use_sudo=${mcState.useSudo}`;
            const data = await API.request(url);

            if (!data.files || data.files.length === 0) {
                contentEl.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                        <i class="fas fa-folder-open" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 0.5rem;"></i><br>
                        <div>Složka je prázdná</div>
                    </div>
                `;
                return;
            }

            const folders = data.files.filter(f => f.type === 'directory').sort((a, b) => a.name.localeCompare(b.name));
            const files = data.files.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
            const allItems = [...folders, ...files];

            let html = '';
            allItems.forEach((item, index) => {
                const isSelected = index === mcState.selectedIndex;
                const isFolder = item.type === 'directory';
                const icon = isFolder ? 'fa-folder' : AppUIHelpers.getFileIcon(item.name);
                const iconColor = isFolder ? '#f39c12' : '#95a5a6';
                const bgColor = isSelected ? '#e3f2fd' : 'transparent';

                html += `
                    <div class="mc-item"
                         data-index="${index}"
                         data-path="${item.path.replace(/'/g, "\\'")}"
                         data-type="${item.type}"
                         onclick="AppFolderPicker.selectMCItem('${panel}', ${index}, '${item.path.replace(/'/g, "\\'")}', '${item.type}')"
                         ondblclick="AppFolderPicker.openMCItem('${panel}', '${item.path.replace(/'/g, "\\'")}', '${item.type}')"
                         style="padding: 0.4rem 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: ${bgColor}; border-left: 3px solid ${isSelected ? '#3498db' : 'transparent'};"
                         onmouseover="if(!this.style.background.includes('e3f2fd')) this.style.background='#f5f5f5'"
                         onmouseout="if(!this.style.background.includes('e3f2fd')) this.style.background='${bgColor}'">
                        <i class="fas ${icon}" style="color: ${iconColor}; width: 20px; text-align: center;"></i>
                        <span style="flex: 1; font-size: 0.85rem; font-family: monospace;">${item.name}</span>
                        ${isFolder ? '<i class="fas fa-chevron-right" style="color: #bdc3c7; font-size: 0.7rem;"></i>' : ''}
                    </div>
                `;
            });

            contentEl.innerHTML = html;
            this.updateMCPanelSelection('single');
            this.updateMCStatus();
        } catch (error) {
            console.error(`Error loading panel:`, error);
            let errorMessage = error.message || 'Neznámá chyba';
            if (error.status === 403) {
                errorMessage = 'Nemáš oprávnění k této složce';
            } else if (error.status === 404) {
                errorMessage = 'Složka neexistuje';
            }
            contentEl.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-circle"></i><br>
                    <strong>Chyba</strong><br>
                    <span style="font-size: 0.85rem;">${errorMessage}</span>
                </div>
            `;
        }
    },

    /**
     * Select MC item
     */
    selectMCItem(panel, index, path, type) {
        const mcState = StateManager.getMCState();
        if (mcState) {
            mcState.selectedIndex = index;
            StateManager.setMCState(mcState);
        }
        this.updateMCPanelSelection(panel);
        this.updateMCStatus();
    },

    /**
     * Open MC item (navigate into folder)
     */
    openMCItem(panel, path, type) {
        if (type === 'directory') {
            this.loadMCPanel(panel, path);
            const mcState = StateManager.getMCState();
            if (mcState) {
                mcState.selectedIndex = 0;
                StateManager.setMCState(mcState);
            }
        }
    },

    /**
     * Update MC panel selection
     */
    updateMCPanelSelection(panel) {
        const contentEl = document.getElementById('mc-content');
        if (!contentEl) return;
        
        const mcState = StateManager.getMCState();
        const items = contentEl.querySelectorAll('.mc-item');
        items.forEach((item, index) => {
            if (!item || !item.style) return;
            const isSelected = index === mcState?.selectedIndex;
            item.style.background = isSelected ? '#e3f2fd' : 'transparent';
            item.style.borderLeft = isSelected ? '3px solid #3498db' : '3px solid transparent';
        });
    },

    /**
     * Navigate up in folder structure
     */
    navigateMCUp() {
        const mcState = StateManager.getMCState();
        const currentPath = mcState?.currentPath || '/opt/kms';
        const pathParts = currentPath.split('/').filter(p => p);
        if (pathParts.length > 0) {
            pathParts.pop();
            const parentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
            this.loadMCPanel('single', parentPath);
            if (mcState) {
                mcState.selectedIndex = 0;
                StateManager.setMCState(mcState);
            }
        }
    },

    /**
     * Navigate to manual path
     */
    navigateToManualPathMC() {
        const input = document.getElementById('folder-path-manual');
        if (input && input.value.trim()) {
            this.loadMCPanel('single', input.value.trim());
            const mcState = StateManager.getMCState();
            if (mcState) {
                mcState.selectedIndex = 0;
                StateManager.setMCState(mcState);
            }
        }
    },

    /**
     * Select folder and close picker
     */
    selectFolderPathMC(inputId) {
        const mcState = StateManager.getMCState();
        const selectedPath = mcState?.currentPath;
        const input = document.getElementById(inputId);
        if (input && selectedPath) {
            input.value = selectedPath;
            this.closeFolderPicker();
            Components.showToast(`Cesta vybrána: ${selectedPath}`, 'success');
        }
    },

    /**
     * Create new folder
     */
    createNewFolderMC() {
        const mcState = StateManager.getMCState();
        if (!mcState) {
            Components.showToast('Chyba: Stav není inicializován.', 'error');
            return;
        }

        const currentPath = mcState.currentPath || '/opt/kms';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'new-folder-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="form-header" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
                    <h3 style="font-size: 1rem; margin: 0;"><i class="fas fa-folder-plus"></i> Vytvořit novou složku</h3>
                    <button onclick="AppFolderPicker.closeNewFolderModal()" class="close-btn">&times;</button>
                </div>
                <div style="padding: 0 1rem 1rem;">
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.85rem; margin-bottom: 0.25rem; display: block; font-weight: 500;">Název složky *</label>
                        <input type="text" id="new-folder-name" placeholder="např. my-project"
                            style="width: 100%; padding: 0.5rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 4px;"
                            autofocus>
                        <small style="color: #7f8c8d; display: block; margin-top: 0.25rem; font-size: 0.75rem;">
                            <i class="fas fa-info-circle"></i> Použij pouze písmena, čísla, pomlčky a podtržítka
                        </small>
                    </div>
                    <div style="padding: 0.5rem; background: #e3f2fd; border-radius: 4px; margin-bottom: 0.75rem;">
                        <div style="font-size: 0.75rem; color: #7f8c8d; margin-bottom: 0.25rem;">Složka bude vytvořena v:</div>
                        <div style="font-family: monospace; font-size: 0.85rem; color: #2c3e50; font-weight: 500;">${currentPath}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" onclick="AppFolderPicker.closeNewFolderModal()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                            Zrušit
                        </button>
                        <button type="button" onclick="AppFolderPicker.submitNewFolder('${currentPath.replace(/'/g, "\\'")}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: #27ae60; border-color: #27ae60;">
                            <i class="fas fa-check"></i> Vytvořit
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';

        setTimeout(() => {
            const input = document.getElementById('new-folder-name');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.submitNewFolder(currentPath);
                    }
                });
            }
        }, 100);
    },

    /**
     * Submit new folder creation
     */
    submitNewFolder(currentPath) {
        const input = document.getElementById('new-folder-name');
        if (!input) {
            this.closeNewFolderModal();
            return;
        }

        const folderName = input.value.trim();
        if (!folderName) {
            Components.showToast('Zadej prosím název složky', 'error');
            input.focus();
            return;
        }

        const cleanName = folderName.replace(/[\/\\\?\*\|<>:"]/g, '_');
        if (cleanName !== folderName) {
            const confirmed = confirm(`Název složky byl upraven z "${folderName}" na "${cleanName}".\n\nPokračovat?`);
            if (!confirmed) {
                input.focus();
                return;
            }
        }

        const newPath = currentPath.endsWith('/')
            ? currentPath + cleanName
            : currentPath + '/' + cleanName;

        this.closeNewFolderModal();
        Components.showToast('Vytváření složky...', 'info');

        API.request(`/tools/files/create-folder?path=${encodeURIComponent(newPath)}&allow_any=true&use_sudo=true`, { method: 'POST' })
            .then(result => {
                Components.showToast(result.message || `Složka "${cleanName}" vytvořena`, 'success');
                this.loadMCPanel('single', currentPath);
            })
            .catch(error => {
                console.error('Error creating folder:', error);
                const errorMsg = error.message || error.detail || 'Chyba při vytváření složky';
                Components.showToast(errorMsg, 'error');
            });
    },

    /**
     * Close new folder modal
     */
    closeNewFolderModal() {
        const modal = document.getElementById('new-folder-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Setup keyboard shortcuts
     */
    setupMCKeyboard() {
        const modal = document.getElementById('folder-picker-modal');
        if (!modal) return;

        const handleKeyDown = (e) => {
            const mcState = StateManager.getMCState();
            if (!mcState) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateMCUpInList();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateMCDown();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.navigateMCEnter();
            } else if (e.key === 'Backspace' && !e.target.matches('input')) {
                e.preventDefault();
                this.navigateMCUp();
            }
        };

        modal.addEventListener('keydown', handleKeyDown);
        modal.focus();
        modal.setAttribute('tabindex', '0');
    },

    /**
     * Navigate down in list
     */
    navigateMCDown() {
        const contentEl = document.getElementById('mc-content');
        if (!contentEl) return;
        
        const items = contentEl.querySelectorAll('.mc-item');
        const mcState = StateManager.getMCState();
        if (items.length > 0 && mcState) {
            const currentIndex = mcState.selectedIndex || 0;
            const nextIndex = Math.min(currentIndex + 1, items.length - 1);
            mcState.selectedIndex = nextIndex;
            StateManager.setMCState(mcState);
            this.updateMCPanelSelection('single');
            const nextItem = items[nextIndex];
            if (nextItem) {
                nextItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    },

    /**
     * Navigate up in list
     */
    navigateMCUpInList() {
        const contentEl = document.getElementById('mc-content');
        if (!contentEl) return;
        
        const items = contentEl.querySelectorAll('.mc-item');
        const mcState = StateManager.getMCState();
        if (items.length > 0 && mcState) {
            const currentIndex = mcState.selectedIndex || 0;
            const prevIndex = Math.max(currentIndex - 1, 0);
            mcState.selectedIndex = prevIndex;
            StateManager.setMCState(mcState);
            this.updateMCPanelSelection('single');
            const prevItem = items[prevIndex];
            if (prevItem) {
                prevItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    },

    /**
     * Enter on selected item
     */
    navigateMCEnter() {
        const contentEl = document.getElementById('mc-content');
        if (!contentEl) return;
        
        const items = contentEl.querySelectorAll('.mc-item');
        const mcState = StateManager.getMCState();
        const selectedIndex = mcState?.selectedIndex || 0;
        if (items[selectedIndex]) {
            const path = items[selectedIndex].dataset.path;
            const type = items[selectedIndex].dataset.type;
            this.openMCItem('single', path, type);
        }
    },

    /**
     * Update status bar
     */
    updateMCStatus() {
        const statusEl = document.getElementById('mc-status');
        const mcState = StateManager.getMCState();
        if (statusEl && mcState) {
            const path = mcState.currentPath || '/';
            statusEl.textContent = `Cesta: ${path}`;
        }
    },

    /**
     * Close folder picker
     */
    closeFolderPicker() {
        const modal = document.getElementById('folder-picker-modal');
        if (modal) {
            modal.remove();
        }
        StateManager.setFolderPickerState(null);
        StateManager.setMCState(null);
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppFolderPicker = AppFolderPicker;
}

