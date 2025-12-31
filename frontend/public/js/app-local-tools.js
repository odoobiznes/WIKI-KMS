/**
 * KMS App - Local Tools Module
 * Handles connection to local PC via tunnel and AI tools management
 */

const AppLocalTools = {
    tunnels: [],
    selectedTunnel: null,
    
    /**
     * Initialize local tools module
     */
    init() {
        console.log('📡 AppLocalTools initialized');
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh tunnels button
        const refreshBtn = document.getElementById('refresh-tunnels-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadTunnels();
        }
        
        // Download client button
        const downloadBtn = document.getElementById('download-client-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadClientScript();
        }
    },
    
    /**
     * Open local tools modal
     */
    async openModal() {
        const modal = document.getElementById('local-tools-modal');
        if (modal) {
            modal.style.display = 'flex';
            await this.loadTunnels();
        } else {
            // Create modal if it doesn't exist
            this.createModal();
            await this.loadTunnels();
        }
    },
    
    /**
     * Close local tools modal
     */
    closeModal() {
        const modal = document.getElementById('local-tools-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * Create the local tools modal
     */
    createModal() {
        const modalHtml = `
            <div id="local-tools-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>🖥️ Lokální PC Nástroje</h2>
                        <span class="close-btn" onclick="AppLocalTools.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="local-tools-info" style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="margin-top: 0;">📋 Jak to funguje</h4>
                            <ol style="margin-bottom: 0; padding-left: 20px;">
                                <li>Stáhněte si klientský skript</li>
                                <li>Spusťte ho na svém lokálním počítači</li>
                                <li>Váš počítač se objeví v seznamu níže</li>
                                <li>Můžete pak otevřít Cursor, Windsurf nebo terminál přímo na vašem PC</li>
                            </ol>
                        </div>
                        
                        <div class="local-tools-actions" style="margin-bottom: 20px;">
                            <button id="download-client-btn" class="btn btn-primary" onclick="AppLocalTools.downloadClientScript()">
                                ⬇️ Stáhnout klientský skript
                            </button>
                            <button id="refresh-tunnels-btn" class="btn btn-secondary" onclick="AppLocalTools.loadTunnels()">
                                🔄 Obnovit seznam
                            </button>
                        </div>
                        
                        <h3>Připojené počítače</h3>
                        <div id="tunnels-list" class="tunnels-list">
                            <div class="loading">Načítání...</div>
                        </div>
                        
                        <div id="tunnel-actions" class="tunnel-actions" style="display: none; margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                            <h4 id="tunnel-actions-title" style="margin-top: 0;">Akce pro počítač</h4>
                            <div class="tunnel-actions-buttons">
                                <button class="btn btn-tool" onclick="AppLocalTools.openTool('terminal')">
                                    🖥️ Terminál
                                </button>
                                <button class="btn btn-tool" onclick="AppLocalTools.openTool('cursor')">
                                    🎯 Cursor
                                </button>
                                <button class="btn btn-tool" onclick="AppLocalTools.openTool('windsurf')">
                                    🌊 Windsurf
                                </button>
                                <button class="btn btn-tool" onclick="AppLocalTools.openTool('claude')">
                                    🤖 Claude CLI
                                </button>
                            </div>
                            <div class="tunnel-path-input" style="margin-top: 15px;">
                                <label>Cesta k projektu (volitelné):</label>
                                <input type="text" id="local-project-path" placeholder="/home/user/project" style="width: 100%; padding: 8px; margin-top: 5px;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add styles if not present
        if (!document.getElementById('local-tools-styles')) {
            const styles = `
                <style id="local-tools-styles">
                    .tunnels-list {
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        max-height: 300px;
                        overflow-y: auto;
                    }
                    .tunnel-item {
                        display: flex;
                        align-items: center;
                        padding: 12px 15px;
                        border-bottom: 1px solid #eee;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .tunnel-item:last-child {
                        border-bottom: none;
                    }
                    .tunnel-item:hover {
                        background: #f5f5f5;
                    }
                    .tunnel-item.selected {
                        background: #e3f2fd;
                    }
                    .tunnel-os-icon {
                        font-size: 24px;
                        margin-right: 12px;
                    }
                    .tunnel-info {
                        flex: 1;
                    }
                    .tunnel-name {
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    .tunnel-details {
                        font-size: 12px;
                        color: #7f8c8d;
                    }
                    .tunnel-capabilities {
                        display: flex;
                        gap: 5px;
                        margin-top: 5px;
                    }
                    .capability-badge {
                        font-size: 10px;
                        padding: 2px 6px;
                        background: #3498db;
                        color: white;
                        border-radius: 10px;
                    }
                    .tunnel-status {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: #2ecc71;
                    }
                    .tunnel-status.disconnected {
                        background: #e74c3c;
                    }
                    .tunnel-actions-buttons {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .btn-tool {
                        padding: 10px 20px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-tool:hover {
                        background: #3498db;
                        color: white;
                        border-color: #3498db;
                    }
                    .no-tunnels {
                        text-align: center;
                        padding: 40px;
                        color: #7f8c8d;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    },
    
    /**
     * Load active tunnels from server
     */
    async loadTunnels() {
        const listEl = document.getElementById('tunnels-list');
        if (!listEl) return;
        
        listEl.innerHTML = '<div class="loading">Načítání...</div>';
        
        try {
            const response = await fetch('/api/tools/local/tunnels');
            const data = await response.json();
            
            this.tunnels = data.tunnels || [];
            this.renderTunnels();
        } catch (error) {
            console.error('Error loading tunnels:', error);
            listEl.innerHTML = '<div class="error">Chyba při načítání tunelů</div>';
        }
    },
    
    /**
     * Render tunnels list
     */
    renderTunnels() {
        const listEl = document.getElementById('tunnels-list');
        if (!listEl) return;
        
        if (this.tunnels.length === 0) {
            listEl.innerHTML = `
                <div class="no-tunnels">
                    <div style="font-size: 48px; margin-bottom: 10px;">🖥️</div>
                    <div>Žádné připojené počítače</div>
                    <div style="font-size: 12px; margin-top: 10px;">
                        Stáhněte klientský skript a spusťte ho na vašem PC
                    </div>
                </div>
            `;
            return;
        }
        
        const osIcons = {
            'windows': '🪟',
            'linux': '🐧',
            'darwin': '🍎',
            'macos': '🍎'
        };
        
        listEl.innerHTML = this.tunnels.map(tunnel => `
            <div class="tunnel-item ${this.selectedTunnel === tunnel.tunnel_id ? 'selected' : ''}" 
                 onclick="AppLocalTools.selectTunnel('${tunnel.tunnel_id}')">
                <div class="tunnel-os-icon">${osIcons[tunnel.machine_os] || '💻'}</div>
                <div class="tunnel-info">
                    <div class="tunnel-name">${tunnel.machine_name}</div>
                    <div class="tunnel-details">
                        ${tunnel.username}@${tunnel.machine_os} • 
                        Připojeno: ${new Date(tunnel.connected_at).toLocaleString('cs-CZ')}
                    </div>
                    <div class="tunnel-capabilities">
                        ${tunnel.capabilities.map(cap => `<span class="capability-badge">${cap}</span>`).join('')}
                    </div>
                </div>
                <div class="tunnel-status"></div>
            </div>
        `).join('');
    },
    
    /**
     * Select a tunnel
     */
    selectTunnel(tunnelId) {
        this.selectedTunnel = tunnelId;
        this.renderTunnels();
        
        const tunnel = this.tunnels.find(t => t.tunnel_id === tunnelId);
        const actionsEl = document.getElementById('tunnel-actions');
        const titleEl = document.getElementById('tunnel-actions-title');
        
        if (actionsEl && tunnel) {
            actionsEl.style.display = 'block';
            titleEl.textContent = `Akce pro ${tunnel.machine_name}`;
        }
    },
    
    /**
     * Open a tool on the selected local PC
     */
    async openTool(tool) {
        if (!this.selectedTunnel) {
            showNotification('Vyberte nejprve počítač', 'warning');
            return;
        }
        
        const projectPath = document.getElementById('local-project-path')?.value || null;
        
        try {
            showNotification(`Otevírám ${tool}...`, 'info');
            
            const response = await fetch('/api/tools/local/tool/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tunnel_id: this.selectedTunnel,
                    tool: tool,
                    project_path: projectPath
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(`${tool} otevřen úspěšně`, 'success');
            } else {
                showNotification(`Chyba: ${data.error || data.detail}`, 'error');
            }
        } catch (error) {
            console.error('Error opening tool:', error);
            showNotification(`Chyba při otevírání ${tool}`, 'error');
        }
    },
    
    /**
     * Execute command on local PC
     */
    async executeCommand(command, workingDir = null) {
        if (!this.selectedTunnel) {
            showNotification('Vyberte nejprve počítač', 'warning');
            return null;
        }
        
        try {
            const response = await fetch('/api/tools/local/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tunnel_id: this.selectedTunnel,
                    command: command,
                    working_dir: workingDir
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error executing command:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Download client script
     */
    async downloadClientScript() {
        try {
            const response = await fetch('/api/tools/local/client-script');
            const data = await response.json();
            
            // Create download
            const blob = new Blob([data.script], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show instructions
            showNotification('Skript stažen! ' + data.instructions[2], 'success');
        } catch (error) {
            console.error('Error downloading client script:', error);
            showNotification('Chyba při stahování skriptu', 'error');
        }
    },
    
    /**
     * Open tool for current project on local PC
     * @param {string} tool - Tool name (cursor, windsurf, claude)
     * @param {number} objectId - Project object ID
     */
    async openToolForProject(tool, objectId) {
        // First, get the object path
        try {
            const response = await fetch(`/api/objects/${objectId}`);
            const objectData = await response.json();
            const projectPath = objectData.file_path;
            
            // Check if we have a tunnel
            if (this.tunnels.length === 0) {
                await this.loadTunnels();
            }
            
            if (this.tunnels.length === 0) {
                // No tunnels - show modal to setup
                this.openModal();
                showNotification('Připojte nejprve lokální počítač', 'info');
                return;
            }
            
            // If only one tunnel, use it automatically
            if (this.tunnels.length === 1 && !this.selectedTunnel) {
                this.selectedTunnel = this.tunnels[0].tunnel_id;
            }
            
            if (!this.selectedTunnel) {
                this.openModal();
                showNotification('Vyberte cílový počítač', 'info');
                return;
            }
            
            // Open the tool with project path
            await this.openTool(tool);
        } catch (error) {
            console.error('Error opening tool for project:', error);
            showNotification('Chyba při otevírání nástroje', 'error');
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    AppLocalTools.init();
});

// Export for global access
window.AppLocalTools = AppLocalTools;

