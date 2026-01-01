/**
 * KMS Components - Tools module
 * Contains tools dropdown and Claude AI modal
 */

// Render tools dropdown
Components.renderToolsDropdown = function(currentObject) {
    if (!currentObject) {
        return `
            <div class="tools-dropdown-header">
                <h3><i class="fas fa-tools"></i> Tools</h3>
                <button class="tools-dropdown-close" onclick="app.toggleToolsDropdown()" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="tools-dropdown-content">
                <p class="text-muted" style="text-align: center; padding: 2rem 1rem; color: #7f8c8d;">
                    Select a project to use tools
                </p>
            </div>
        `;
    }

    return `
        <div class="tools-dropdown-header">
            <h3><i class="fas fa-tools"></i> Tools</h3>
            <button class="tools-dropdown-close" onclick="app.toggleToolsDropdown()" title="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="tools-dropdown-content">
            <div class="tools-dropdown-project">
                <i class="fas fa-folder"></i> ${currentObject.object_name || currentObject.name}
            </div>

            <div class="tool-category">
                <h4><i class="fas fa-code"></i> Development</h4>
                <button class="tool-btn" onclick="app.openTool('vscode', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-file-code"></i> VS Code
                </button>
                <button class="tool-btn" onclick="app.openTool('cursor', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-magic"></i> Cursor AI
                </button>
                <button class="tool-btn" onclick="app.openTool('windsurf', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-wind"></i> Windsurf
                </button>
            </div>

            <div class="tool-category">
                <h4><i class="fas fa-terminal"></i> Terminal</h4>
                <button class="tool-btn" onclick="app.openTool('terminal', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-terminal"></i> Terminal
                </button>
                <button class="tool-btn" onclick="app.openClaudeInProject(${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-comments"></i> Claude AI
                </button>
            </div>

            <div class="tool-category">
                <h4><i class="fab fa-git-alt"></i> Git</h4>
                <button class="tool-btn" onclick="app.gitOperation(${currentObject.id}, 'status'); app.toggleToolsDropdown();">
                    <i class="fas fa-info-circle"></i> Status
                </button>
                <button class="tool-btn" onclick="app.gitOperation(${currentObject.id}, 'pull'); app.toggleToolsDropdown();">
                    <i class="fas fa-download"></i> Pull
                </button>
                <button class="tool-btn" onclick="app.gitOperation(${currentObject.id}, 'commit'); app.toggleToolsDropdown();">
                    <i class="fas fa-check"></i> Commit
                </button>
                <button class="tool-btn" onclick="app.gitOperation(${currentObject.id}, 'push'); app.toggleToolsDropdown();">
                    <i class="fas fa-upload"></i> Push
                </button>
            </div>

            <div class="tool-category">
                <h4><i class="fas fa-folder-open"></i> Files</h4>
                <button class="tool-btn" onclick="app.showImportModal(${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-file-import"></i> Import Project
                </button>
                <button class="tool-btn" onclick="app.showExportModal(${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-file-export"></i> Export Project
                </button>
                <button class="tool-btn" onclick="app.showSynchModal(${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-sync-alt"></i> Synch
                </button>
                <button class="tool-btn" onclick="app.openTool('files', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-folder"></i> File Browser
                </button>
            </div>

            <div class="tool-category">
                <h4><i class="fas fa-laptop"></i> Local PC</h4>
                <button class="tool-btn" onclick="AppLocalTools.openModal(); app.toggleToolsDropdown();">
                    <i class="fas fa-plug"></i> Připojit lokální PC
                </button>
                <button class="tool-btn" onclick="AppLocalTools.openToolForProject('cursor', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-magic"></i> Cursor (lokální)
                </button>
                <button class="tool-btn" onclick="AppLocalTools.openToolForProject('windsurf', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-wind"></i> Windsurf (lokální)
                </button>
                <button class="tool-btn" onclick="AppLocalTools.openToolForProject('terminal', ${currentObject.id}); app.toggleToolsDropdown();">
                    <i class="fas fa-terminal"></i> Terminál (lokální)
                </button>
            </div>
        </div>
    `;
};

// Legacy function for compatibility
Components.renderToolsSidebar = Components.renderToolsDropdown;

// Render Claude AI modal
Components.renderClaudeModal = function(objectId, objectName) {
    return `
        <div class="claude-modal-content">
            <div class="claude-header">
                <h3><i class="fas fa-robot"></i> ${objectName || 'Claude AI'}</h3>
                <button onclick="app.closeClaudeModal()" class="close-btn">&times;</button>
            </div>

            <div class="claude-chat" id="claude-chat">
                <div class="claude-welcome">
                    <p>👋 Hi! I'm Claude, your AI assistant.</p>
                    <p>I can help with code review, debugging, documentation, and more.</p>
                </div>
            </div>

            <div class="claude-input-area">
                <textarea id="claude-input" placeholder="Ask me anything..." rows="2"></textarea>
                <button onclick="app.sendClaudeMessage()" class="send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
};

// Add message to Claude chat
Components.addClaudeMessage = function(message, isUser = false) {
    const chatEl = document.getElementById('claude-chat');
    const messageEl = document.createElement('div');
    messageEl.className = `claude-message ${isUser ? 'user' : 'assistant'}`;

    // Check if message contains HTML (like buttons)
    const isHTML = /<[a-z][\s\S]*>/i.test(message);
    const messageContent = isHTML ? message : message.replace(/\n/g, '<br>');

    messageEl.innerHTML = `
        <div class="message-avatar">
            ${isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
        </div>
        <div class="message-content">
            ${messageContent}
        </div>
    `;

    chatEl.appendChild(messageEl);
    chatEl.scrollTop = chatEl.scrollHeight;
};
