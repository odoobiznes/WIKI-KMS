/**
 * KMS Module - SETTINGS
 * System configuration and AI Agents management
 */

const SettingsModule = {
    isOpen: false,
    currentTab: 'general',
    aiProviders: [],

    init() {
        console.log('⚙️ SettingsModule initialized');
        this.loadSettings();
    },

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
            this.aiProviders = settings.providers || this.getDefaultProviders();
        } catch (e) {
            console.error('Error loading settings:', e);
            this.aiProviders = this.getDefaultProviders();
        }
    },

    getDefaultProviders() {
        return [
            { id: 'claude-1', name: 'Claude', type: 'claude', model: 'claude-sonnet-4-5-20250929', apiKey: '', enabled: false },
            { id: 'openai-1', name: 'OpenAI GPT-5.2', type: 'openai', model: 'gpt-5.2', apiKey: '', enabled: false },
            { id: 'gemini-1', name: 'Google Gemini', type: 'gemini', model: 'gemini-3-pro', apiKey: '', enabled: false },
            { id: 'cursor-1', name: 'Cursor', type: 'cursor', model: 'default', apiKey: '', enabled: false },
            { id: 'composer-1', name: 'Composer', type: 'composer', model: 'default', apiKey: '', enabled: false },
            { id: 'swe-1', name: 'SWE 1.5', type: 'swe', model: 'swe-1.5', apiKey: '', enabled: false }
        ];
    },

    saveSettings() {
        // Collect current values from inputs before saving
        this.aiProviders.forEach((provider, index) => {
            const keyInput = document.getElementById(`apikey-${index}`);
            if (keyInput) {
                provider.apiKey = keyInput.value.trim();
                console.log(`Settings: Saved API key for ${provider.name} (${provider.id}): length=${provider.apiKey.length}, prefix=${provider.apiKey.substring(0, 15)}...`);
            }
        });

        const settings = {
            providers: this.aiProviders,
            defaultProvider: this.aiProviders.find(p => p.enabled)?.id || null
        };
        localStorage.setItem('kms-ai-settings', JSON.stringify(settings));

        // Verify it was saved
        const saved = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
        console.log('Settings: Saved to localStorage', {
            providersCount: saved.providers?.length || 0,
            defaultProvider: saved.defaultProvider,
            claudeProvider: saved.providers?.find(p => p.type === 'claude')
        });

        // Notify other modules
        document.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));

        if (typeof showNotification !== 'undefined') {
            showNotification('Settings saved!', 'success');
        } else if (typeof Components !== 'undefined' && Components.showToast) {
            Components.showToast('Settings saved!', 'success');
        }
    },

    open(tab = 'general') {
        this.isOpen = true;
        this.currentTab = tab;
        this.render();
    },

    close() {
        this.isOpen = false;
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.remove();
        }
    },

    render() {
        // Remove existing modal
        const existing = document.getElementById('settings-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal-overlay" id="settings-modal" onclick="SettingsModule.handleOverlayClick(event)">
                <div class="settings-modal">
                    <div class="settings-header">
                        <h2><i class="fas fa-cog"></i> Settings</h2>
                        <button class="btn-close" onclick="SettingsModule.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="settings-body">
                        <div class="settings-sidebar">
                            <button class="settings-tab ${this.currentTab === 'general' ? 'active' : ''}"
                                    onclick="SettingsModule.switchTab('general')">
                                <i class="fas fa-sliders-h"></i> General
                            </button>
                            <button class="settings-tab ${this.currentTab === 'ai-agents' ? 'active' : ''}"
                                    onclick="SettingsModule.switchTab('ai-agents')">
                                <i class="fas fa-robot"></i> AI Agents
                            </button>
                            <button class="settings-tab ${this.currentTab === 'appearance' ? 'active' : ''}"
                                    onclick="SettingsModule.switchTab('appearance')">
                                <i class="fas fa-palette"></i> Appearance
                            </button>
                            <button class="settings-tab ${this.currentTab === 'integrations' ? 'active' : ''}"
                                    onclick="SettingsModule.switchTab('integrations')">
                                <i class="fas fa-plug"></i> Integrations
                            </button>
                        </div>
                        <div class="settings-content">
                            ${this.renderTabContent()}
                        </div>
                    </div>
                    <div class="settings-footer">
                        <button class="btn btn-secondary" onclick="SettingsModule.close()">Cancel</button>
                        <button class="btn btn-primary" onclick="SettingsModule.saveSettings()">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleOverlayClick(event) {
        if (event.target.id === 'settings-modal') {
            this.close();
        }
    },

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab.replace('-', ' ')));
        });

        // Update content
        const content = document.querySelector('.settings-content');
        if (content) {
            content.innerHTML = this.renderTabContent();
        }
    },

    renderTabContent() {
        switch (this.currentTab) {
            case 'general':
                return this.renderGeneralSettings();
            case 'ai-agents':
                return this.renderAIAgentsSettings();
            case 'appearance':
                return this.renderAppearanceSettings();
            case 'integrations':
                return this.renderIntegrationsSettings();
            default:
                return '<p>Select a settings category</p>';
        }
    },

    renderGeneralSettings() {
        return `
            <h3>General Settings</h3>
            <div class="settings-section">
                <div class="setting-item">
                    <label>Language</label>
                    <select>
                        <option value="cs" selected>Čeština</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Default Module</label>
                    <select>
                        <option value="ideas">IDEAS</option>
                        <option value="develop" selected>DEVELOP</option>
                        <option value="deploy">DEPLOY</option>
                        <option value="tasks">TASKS</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Auto-save</label>
                    <input type="checkbox" checked>
                </div>
            </div>
        `;
    },

    renderAIAgentsSettings() {
        return `
            <h3><i class="fas fa-robot"></i> AI Agents Configuration</h3>
            <p class="settings-description">Configure AI providers for project generation, analysis, and code assistance.</p>

            <div class="ai-providers-list">
                ${this.aiProviders.map((provider, index) => this.renderProviderCard(provider, index)).join('')}
            </div>

            <div class="ai-providers-actions">
                <button class="btn btn-secondary" onclick="SettingsModule.addProvider()">
                    <i class="fas fa-plus"></i> Add Custom Provider
                </button>
            </div>
        `;
    },

    renderProviderCard(provider, index) {
        const icons = {
            'openai': 'fa-brain',
            'claude': 'fa-robot',
            'gemini': 'fa-gem',
            'cursor': 'fa-i-cursor',
            'composer': 'fa-music',
            'swe': 'fa-code',
            'custom': 'fa-cog'
        };
        const icon = icons[provider.type] || 'fa-robot';

        return `
            <div class="ai-provider-card ${provider.enabled ? 'enabled' : ''}">
                <div class="provider-header">
                    <div class="provider-info">
                        <i class="fas ${icon}"></i>
                        <span class="provider-name">${provider.name}</span>
                        <span class="provider-type">${provider.type}</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${provider.enabled ? 'checked' : ''}
                               onchange="SettingsModule.toggleProvider(${index})">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="provider-config">
                    <div class="config-row">
                        <label>API Key</label>
                        <div class="api-key-input">
                            <input type="password" id="apikey-${index}"
                                   value="${provider.apiKey}"
                                   placeholder="Enter API key..."
                                   oninput="SettingsModule.updateProviderKey(${index}, this.value)"
                                   onblur="SettingsModule.updateProviderKey(${index}, this.value)">
                            <button class="btn-icon-sm" onclick="SettingsModule.toggleKeyVisibility(${index})">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-row">
                        <label>Model</label>
                        <select onchange="SettingsModule.updateProviderModel(${index}, this.value)">
                            ${this.getModelOptions(provider.type, provider.model)}
                        </select>
                    </div>
                    <div class="config-row actions">
                        <button class="btn btn-sm btn-secondary" onclick="SettingsModule.testProvider(${index})">
                            <i class="fas fa-check-circle"></i> Test Connection
                        </button>
                        ${provider.type === 'custom' ? `
                            <button class="btn btn-sm btn-danger" onclick="SettingsModule.removeProvider(${index})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    getModelOptions(type, selectedModel) {
        const models = {
            'openai': [
                'gpt-5.2',
                'gpt-5.2-2025-12-11',
                'gpt-5.2-chat-latest',
                'gpt-5.2-pro',
                'gpt-5.2-pro-2025-12-11',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo'
            ],
            'claude': [
                'claude-opus-4.5',
                'claude-sonnet-4.5',
                'claude-haiku-4.5',
                'claude-opus-4.1',
                'claude-opus-4',
                'claude-sonnet-4',
                'claude-opus-3',
                'claude-haiku-3.5'
            ],
            'gemini': [
                'gemini-3-pro',
                'gemini-3-fast',
                'gemini-3-thinking',
                'gemini-pro',
                'gemini-pro-vision'
            ],
            'cursor': ['default'],
            'composer': ['default'],
            'swe': ['swe-1.5', 'swe-1.0'],
            'custom': ['default']
        };

        const options = models[type] || ['default'];
        return options.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
    },

    toggleProvider(index) {
        this.aiProviders[index].enabled = !this.aiProviders[index].enabled;
        this.render(); // Re-render to update card styling
    },

    updateProviderKey(index, key) {
        if (this.aiProviders[index]) {
            this.aiProviders[index].apiKey = key;
        }
    },

    updateProviderModel(index, model) {
        this.aiProviders[index].model = model;
    },

    toggleKeyVisibility(index) {
        const input = document.getElementById(`apikey-${index}`);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    },

    async testProvider(index) {
        const provider = this.aiProviders[index];

        if (!provider.apiKey) {
            showNotification('Please enter an API key first', 'warning');
            return;
        }

        showNotification(`Testing ${provider.name}...`, 'info');

        try {
            const response = await fetch('/api/tools/ai/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    provider: provider.type,
                    api_key: provider.apiKey,
                    model: provider.model
                })
            });

            if (response.ok) {
                showNotification(`${provider.name} connection successful!`, 'success');
            } else {
                const error = await response.json();
                showNotification(`Connection failed: ${error.detail || 'Unknown error'}`, 'error');
            }
        } catch (e) {
            showNotification(`Connection failed: ${e.message}`, 'error');
        }
    },

    addProvider() {
        const newProvider = {
            id: `custom-${Date.now()}`,
            name: 'Custom Provider',
            type: 'custom',
            model: 'default',
            apiKey: '',
            enabled: false,
            endpoint: ''
        };

        this.aiProviders.push(newProvider);
        this.switchTab('ai-agents'); // Re-render
    },

    removeProvider(index) {
        if (confirm('Remove this provider?')) {
            this.aiProviders.splice(index, 1);
            this.switchTab('ai-agents'); // Re-render
        }
    },

    renderAppearanceSettings() {
        return `
            <h3>Appearance</h3>
            <div class="settings-section">
                <div class="setting-item">
                    <label>Theme</label>
                    <select>
                        <option value="light" selected>Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Compact Mode</label>
                    <input type="checkbox">
                </div>
                <div class="setting-item">
                    <label>Font Size</label>
                    <select>
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
            </div>
        `;
    },

    renderIntegrationsSettings() {
        return `
            <h3>Integrations</h3>
            <div class="settings-section">
                <div class="integration-item">
                    <div class="integration-info">
                        <i class="fab fa-github"></i>
                        <div>
                            <strong>GitHub</strong>
                            <p>Connect your GitHub account for repository sync</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary">Configure</button>
                </div>
                <div class="integration-item">
                    <div class="integration-info">
                        <i class="fab fa-google"></i>
                        <div>
                            <strong>Google OAuth</strong>
                            <p>Sign in with Google account</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary">Configure</button>
                </div>
                <div class="integration-item">
                    <div class="integration-info">
                        <i class="fas fa-database"></i>
                        <div>
                            <strong>Database Backup</strong>
                            <p>Automatic backup settings</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary">Configure</button>
                </div>
            </div>
        `;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => SettingsModule.init());
window.SettingsModule = SettingsModule;
