/**
 * Module: AppTools
 * Purpose: Integrace nástrojů - Terminal, VS Code, Claude AI, Cursor, Windsurf
 * Dependencies: api.js, components.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppTools = {
    /**
     * Open tool for object
     */
    async openTool(tool, objectId) {
        try {
            let response;

            switch(tool) {
                case 'terminal':
                    response = await API.openTerminal(objectId);
                    break;
                case 'files':
                    response = await API.openFileBrowser(objectId);
                    break;
                case 'vscode':
                    response = await API.openVSCode(objectId);
                    break;
                case 'cursor':
                    response = await API.openCursor(objectId);
                    break;
                case 'windsurf':
                    response = await API.openWindsurf(objectId);
                    break;
            }

            // Desktop editors run on server
            if (tool === 'cursor' || tool === 'windsurf') {
                Components.showToast(`${response.tool_name} spuštěn na serveru pro projekt "${response.project_name}"`, 'success');
                Components.showToast(`Připoj se přes XRDP pro přístup k editoru`, 'info');
                return;
            }

            // Web tools - open in new window
            const width = 1400;
            const height = 900;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            window.open(
                response.url,
                `kms-${tool}-${objectId}`,
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );

        } catch (error) {
            console.error('Error opening tool:', error);
            Components.showToast(`Failed to open ${tool}`, 'error');
        }
    },

    /**
     * Open local terminal with instructions
     */
    async openLocalTerminal(objectId) {
        try {
            const object = await API.getObject(objectId);
            const folderPath = object.metadata?.folder_path || object.file_path || '/opt/kms';

            Components.showToast('Otevřete terminál a spusťte: cd ' + folderPath, 'info');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(`cd "${folderPath}"`).then(() => {
                    Components.showToast('Příkaz zkopírován do schránky', 'success');
                });
            }
        } catch (error) {
            console.error('Error opening local terminal:', error);
            Components.showToast('Chyba při otevírání místního terminálu', 'error');
        }
    },

    /**
     * Open Claude AI modal
     */
    openClaudModal(objectId) {
        StateManager.setCurrentClaudeObjectId(objectId);
        const obj = StateManager.getCurrentObject();

        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = Components.renderClaudeModal(objectId, obj.name);
        modal.classList.add('show');

        // Load chat history
        const historyKey = `claude-chat-${objectId}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const chatEl = document.getElementById('claude-chat');

        if (history.length > 0) {
            const welcome = chatEl.querySelector('.claude-welcome');
            if (welcome) welcome.remove();
        }

        history.forEach(msg => {
            Components.addClaudeMessage(msg.message, msg.isUser);
        });

        setTimeout(() => {
            document.getElementById('claude-input').focus();
        }, 100);

        document.getElementById('claude-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendClaudeMessage();
            }
        });
    },

    /**
     * Close Claude AI modal
     */
    closeClaudeModal() {
        const currentClaudeObjectId = StateManager.getCurrentClaudeObjectId();
        if (currentClaudeObjectId) {
            const chatEl = document.getElementById('claude-chat');
            if (chatEl) {
                const messages = Array.from(chatEl.querySelectorAll('.claude-message'));
                const history = messages.map(msg => {
                    const isUser = msg.classList.contains('user');
                    const content = msg.querySelector('.message-content');
                    return {
                        isUser: isUser,
                        message: content ? content.textContent : ''
                    };
                }).filter(msg => msg.message.trim() !== '' && !msg.message.includes('Thinking...'));

                const historyKey = `claude-chat-${currentClaudeObjectId}`;
                localStorage.setItem(historyKey, JSON.stringify(history));
            }
        }

        StateManager.setCurrentClaudeObjectId(null);
        AppUIHelpers.closeModal();
    },

    /**
     * Send message to Claude AI
     */
    async sendClaudeMessage() {
        const input = document.getElementById('claude-input');
        const message = input.value.trim();

        if (!message) return;

        Components.addClaudeMessage(message, true);
        input.value = '';
        Components.addClaudeMessage('Thinking...', false);

        try {
            const currentClaudeObjectId = StateManager.getCurrentClaudeObjectId();
            const response = await API.claudeChat(currentClaudeObjectId, message);

            const chat = document.getElementById('claude-chat');
            chat.removeChild(chat.lastChild);
            Components.addClaudeMessage(response.response, false);

            // Save to history
            if (currentClaudeObjectId) {
                const historyKey = `claude-chat-${currentClaudeObjectId}`;
                const chatEl = document.getElementById('claude-chat');
                const messages = Array.from(chatEl.querySelectorAll('.claude-message'));
                const history = messages.map(msg => {
                    const isUser = msg.classList.contains('user');
                    const content = msg.querySelector('.message-content');
                    return {
                        isUser: isUser,
                        message: content ? content.textContent : ''
                    };
                }).filter(msg => msg.message.trim() !== '' && !msg.message.includes('Thinking...'));
                localStorage.setItem(historyKey, JSON.stringify(history));
            }

        } catch (error) {
            console.error('Claude error:', error);
            const chat = document.getElementById('claude-chat');
            chat.removeChild(chat.lastChild);

            // Check if error message contains configuration instructions
            const errorMessage = error.message || error.toString() || 'Sorry, I encountered an error. Please try again.';
            let displayMessage = errorMessage;

            // If it's a configuration error, add a button to open Settings
            if (errorMessage.includes('nakonfigurován') || errorMessage.includes('API klíč') || errorMessage.includes('Settings')) {
                displayMessage = errorMessage.replace(/\n/g, '<br>');
                displayMessage += '<br><br><button onclick="if(typeof SettingsModule !== \'undefined\') { SettingsModule.open(\'ai-agents\'); app.closeClaudeModal(); }" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"><i class="fas fa-cog"></i> Otevřít Settings</button>';
            }

            Components.addClaudeMessage(displayMessage, false);
        }
    },

    /**
     * Open Claude in project folder
     */
    async openClaudeInProject(objectId) {
        try {
            const object = await API.getObject(objectId);
            const folderPath = object.metadata?.folder_path || object.file_path || '/opt/kms';

            this.openClaudModal(objectId);
            Components.showToast('Claude AI otevřen pro projekt ve složce: ' + folderPath, 'info');
        } catch (error) {
            console.error('Error opening Claude in project:', error);
            Components.showToast('Chyba při otevírání Claude AI', 'error');
        }
    },

    /**
     * Open Claude in local terminal
     */
    async openClaudeInLocalTerminal(objectId) {
        try {
            const object = await API.getObject(objectId);
            const folderPath = object.metadata?.folder_path || object.file_path || '/opt/kms';

            const token = API.getToken();
            if (!token) {
                Components.showToast('Nejste přihlášeni', 'error');
                return;
            }

            Components.showToast('Otevřete terminál a spusťte příkaz pro Claude CLI', 'info');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(`cd "${folderPath}"`).then(() => {
                    Components.showToast('Cesta zkopírována do schránky. Nastavte ANTHROPIC_API_KEY a spusťte: claude chat', 'success');
                });
            }
        } catch (error) {
            console.error('Error opening Claude in local terminal:', error);
            Components.showToast('Chyba při otevírání Claude AI v terminálu', 'error');
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppTools = AppTools;
}
