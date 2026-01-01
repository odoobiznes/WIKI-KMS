/**
 * KMS Module - IDEAS
 * Create/Plan Phase module
 *
 * Features:
 * - Project consolidation
 * - AI Analysis with multiple AI providers
 * - Generate tasks, phases, guides
 * - Backup
 */

const IdeasModule = {
    ideas: [],
    statsHidden: true,
    selectedAIProvider: null,
    aiProviders: [], // Will be loaded from settings
    chatTestStatus: {}, // Track test status for each provider
    chatPendingChanges: [], // Track pending changes to confirm

    async init() {
        console.log('💡 IdeasModule initialized');

        // Load AI providers from settings
        await this.loadAIProviders();

        // Listen for settings changes to reload providers
        document.addEventListener('settingsChanged', (e) => {
            this.loadAIProviders();
        });

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'ideas') {
                this.render();
            }
        });
    },

    async loadAIProviders() {
        try {
            const settings = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
            this.aiProviders = settings.providers || [];
            this.selectedAIProvider = settings.defaultProvider || null;

            // Debug logging
            console.log('IdeasModule: Loaded AI providers', {
                count: this.aiProviders.length,
                providers: this.aiProviders.map(p => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    enabled: p.enabled,
                    hasApiKey: !!p.apiKey,
                    apiKeyLength: p.apiKey ? p.apiKey.length : 0
                })),
                selected: this.selectedAIProvider
            });
        } catch (e) {
            console.error('Error loading AI providers:', e);
            this.aiProviders = [];
        }
    },

    async render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        const project = StateManager.getCurrentObject();

        mainView.innerHTML = `
            <div class="ideas-module-container">
                ${this.renderModuleHeader()}
                ${project ? this.renderContent(project) : this.renderNoProject()}
            </div>
        `;

        // Load saved specification if project exists
        if (project) {
            await this.loadProjectSpec(project.id);
            await this.loadProjectData(project.id);
            await this.loadPhasesAndTasks();
        }
    },

    async loadPhasesAndTasks() {
        try {
            const project = StateManager.getCurrentObject();
            if (!project) return;

            // Try to load from API endpoint first
            let phases = await this.loadPhases();
            let tasks = [];

            // If no phases from API, try metadata
            if (!phases || phases.length === 0) {
                const fullProject = await API.getObject(project.id);
                const metadata = fullProject.metadata || {};
                phases = metadata.phases || [];
                tasks = metadata.tasks || [];
            } else {
                // Load tasks from metadata
                const fullProject = await API.getObject(project.id);
                const metadata = fullProject.metadata || {};
                tasks = metadata.tasks || [];
            }

            if (phases && phases.length > 0) {
                this.displayPhases(phases, tasks);
            }
        } catch (error) {
            console.error('Error loading phases and tasks:', error);
        }
    },

    async loadProjectData(projectId) {
        try {
            const fullProject = await API.getObject(projectId);
            const metadata = fullProject.metadata || {};

            // Load and display tasks if they exist
            if (metadata.tasks && metadata.tasks.length > 0) {
                this.displayTasks(metadata.tasks);
            }

            // Load and display suggestions if they exist
            if (metadata.suggestions && metadata.suggestions.length > 0) {
                const lastSuggestion = metadata.suggestions[metadata.suggestions.length - 1];
                this.displaySuggestions(lastSuggestion.content);
            }
        } catch (error) {
            console.error('Error loading project data:', error);
        }
    },

    displayTasks(tasks) {
        const container = document.getElementById('generated-phases');
        if (!container) {
            console.warn('Container #generated-phases not found');
            return;
        }

        if (!tasks || tasks.length === 0) {
            console.warn('No tasks to display');
            return;
        }

        console.log('Displaying tasks:', tasks);

        container.innerHTML = `
            <div class="phases-list">
                <div class="phase-card">
                    <div class="phase-header">
                        <span class="phase-badge">Úkoly</span>
                        <h5>Vygenerované úkoly</h5>
                    </div>
                    <div class="phase-tasks">
                        <ul>
                            ${tasks.map(task => {
                                const taskName = typeof task === 'string' ? task : (task.name || task.description || task.title || 'Úkol');
                                const taskDesc = typeof task === 'string' ? '' : (task.description && task.description !== taskName ? task.description : '');
                                const priority = typeof task === 'string' ? 'medium' : (task.priority || 'medium');
                                return `
                                <li class="task-item priority-${priority}">
                                    <strong>${taskName}</strong>
                                    ${taskDesc ? `<p>${taskDesc}</p>` : ''}
                                    <span class="task-meta">Priority: ${priority}</span>
                                </li>
                            `;
                            }).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    },

    displaySuggestions(content) {
        const container = document.getElementById('ai-suggestions');
        if (!container) {
            console.warn('Container #ai-suggestions not found');
            return;
        }

        if (!content) {
            console.warn('No suggestions content to display');
            return;
        }

        console.log('Displaying suggestions:', content);

        const formattedContent = this.formatMarkdown(content);
        container.innerHTML = `
            <div class="suggestion-content">
                ${formattedContent}
            </div>
        `;
    },

    renderModuleHeader() {
        return `
            <div class="module-header-row">
                <div class="module-header-left">
                    <h2><i class="fas fa-lightbulb"></i> Ideas</h2>
                    <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                            onclick="IdeasModule.toggleStats()"
                            title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                        <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
                <div class="module-header-actions">
                    <div class="ai-generate-dropdown">
                        <button class="btn btn-primary ai-generate-btn" onclick="IdeasModule.openChatGuide()">
                            <i class="fas fa-comments"></i> Chat Guide
                            <i class="fas fa-caret-down"></i>
                        </button>
                        <div class="ai-dropdown-menu" id="ai-chat-dropdown-menu">
                            ${this.aiProviders.filter(p => p.enabled).map(p => `
                                <div class="ai-dropdown-item" onclick="IdeasModule.openChatGuideWithProvider('${p.id}')">
                                    <i class="fas ${this.getProviderIcon(p.type)}"></i>
                                    <span>${p.name}</span>
                                    ${p.id === this.selectedAIProvider ? '<i class="fas fa-check"></i>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="IdeasModule.consolidate()">
                        <i class="fas fa-compress-alt"></i> Consolidate
                    </button>
                    <button class="btn btn-secondary" onclick="IdeasModule.aiAnalyze()">
                        <i class="fas fa-robot"></i> AI Analyze
                    </button>
                    <button class="btn btn-secondary" onclick="IdeasModule.generatePhases()">
                        <i class="fas fa-sitemap"></i> Generate Phases
                    </button>
                    <button class="btn btn-secondary" onclick="IdeasModule.generateTasks()">
                        <i class="fas fa-tasks"></i> Generate Tasks
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="IdeasModule.saveSpec()">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                ${this.renderStats()}
            </div>
        `;
    },

    renderStats() {
        return `
            <div class="resources-stats">
                <div class="stat-card stat-primary">
                    <div class="stat-icon"><i class="fas fa-lightbulb"></i></div>
                    <div class="stat-content">
                        <h3>${this.ideas.length}</h3>
                        <p>Ideas</p>
                    </div>
                </div>
                <div class="stat-card stat-info">
                    <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                    <div class="stat-content">
                        <h3>0</h3>
                        <p>Phases</p>
                    </div>
                </div>
                <div class="stat-card stat-secondary">
                    <div class="stat-icon"><i class="fas fa-robot"></i></div>
                    <div class="stat-content">
                        <h3>${this.aiProviders.filter(p => p.enabled).length}</h3>
                        <p>AI Providers</p>
                    </div>
                </div>
            </div>
        `;
    },

    toggleStats() {
        this.statsHidden = !this.statsHidden;
        const statsSection = document.querySelector('.ideas-module-container .module-stats-section');
        const toggleBtn = document.querySelector('.ideas-module-container .btn-icon-toggle');
        if (statsSection) {
            statsSection.classList.toggle('hidden', this.statsHidden);
        }
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', !this.statsHidden);
            toggleBtn.querySelector('i').className = `fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}`;
            toggleBtn.title = this.statsHidden ? 'Show Statistics' : 'Hide Statistics';
        }
    },

    renderNoProject() {
        return `
            <div class="no-project-selected">
                <div class="no-project-icon"><i class="fas fa-lightbulb"></i></div>
                <h3>No Project Selected</h3>
                <p>Select a project to start planning and ideation</p>
            </div>
        `;
    },

    renderContent(project) {
        const enabledProviders = this.aiProviders.filter(p => p.enabled);
        const hasProviders = enabledProviders.length > 0;

        return `
            <div class="ideas-content">
                <div class="ideas-grid">
                    <div class="ideas-card spec-card">
                        <h4><i class="fas fa-file-alt"></i> Project Specification</h4>
                        <div class="spec-content">
                            <textarea id="project-spec" class="spec-textarea" placeholder="Describe your project idea, goals, and requirements..."></textarea>
                        </div>
                    </div>

                    <div class="ideas-card">
                        <h4><i class="fas fa-lightbulb"></i> AI Suggestions</h4>
                        <div class="suggestions-list" id="ai-suggestions">
                            <div class="suggestion-placeholder">
                                <i class="fas fa-robot"></i>
                                <p>Click "AI Analyze" to get project suggestions</p>
                            </div>
                        </div>
                    </div>

                    <div class="ideas-card full-width">
                        <h4><i class="fas fa-tasks"></i> Generated Phases & Tasks</h4>
                        <div class="generated-content" id="generated-phases">
                            <div class="generated-placeholder">
                                <i class="fas fa-magic"></i>
                                <p>Click "Generate" to create phases, tasks, and guides</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getProviderIcon(type) {
        const icons = {
            'openai': 'fa-brain',
            'claude': 'fa-robot',
            'gemini': 'fa-gem',
            'cursor': 'fa-i-cursor',
            'composer': 'fa-music',
            'swe': 'fa-code',
            'custom': 'fa-cog'
        };
        return icons[type] || 'fa-robot';
    },

    toggleAIDropdown(event) {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        const dropdown = document.getElementById('ai-dropdown-menu');
        if (dropdown) {
            const isShowing = dropdown.classList.contains('show');

            // Close all other dropdowns first
            document.querySelectorAll('.ai-dropdown-menu.show').forEach(d => {
                if (d !== dropdown) d.classList.remove('show');
            });

            // Toggle this dropdown
            dropdown.classList.toggle('show');

            // Close on outside click
            const closeDropdown = (e) => {
                if (!e.target.closest('.ai-generate-dropdown')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };

            if (dropdown.classList.contains('show')) {
                setTimeout(() => document.addEventListener('click', closeDropdown), 0);
            } else {
                // Remove listener if closing
                document.removeEventListener('click', closeDropdown);
            }
        }
    },

    async generateWithProvider(providerId) {
        const dropdown = document.getElementById('ai-dropdown-menu');
        if (dropdown) dropdown.classList.remove('show');

        this.selectedAIProvider = providerId;
        const provider = this.aiProviders.find(p => p.id === providerId);

        if (!provider) {
            showNotification('Provider not found', 'error');
            return;
        }

        showNotification(`Generating with ${provider.name}...`, 'info');

        const spec = document.getElementById('project-spec')?.value || '';
        const project = StateManager.getCurrentObject();

        try {
            // Call AI API based on provider type
            const result = await this.callAIProvider(provider, spec, project);

            if (result) {
                document.getElementById('project-spec').value = result;
                showNotification(`Generated with ${provider.name}!`, 'success');
            }
        } catch (error) {
            console.error('AI Generation error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    },

    async callAIProvider(provider, currentSpec, project) {
        const prompt = `Generate a detailed project specification for: ${project?.object_name || 'Project'}

Current specification:
${currentSpec || 'No specification yet'}

Please provide:
1. Project overview
2. Goals and objectives
3. Key features
4. Technical requirements
5. Timeline estimate`;

        switch (provider.type) {
            case 'claude':
                return await this.callClaudeAPI(provider, prompt);
            case 'openai':
                return await this.callOpenAIAPI(provider, prompt);
            case 'gemini':
                return await this.callGeminiAPI(provider, prompt);
            default:
                // For custom providers, use generic endpoint
                return await this.callCustomAPI(provider, prompt);
        }
    },

    async callClaudeAPI(provider, prompt) {
        // Validate API key
        if (!provider || !provider.apiKey || provider.apiKey.trim() === '') {
            console.error('Claude API: Provider nebo API klíč chybí', {
                provider: provider ? { id: provider.id, name: provider.name, type: provider.type } : null,
                hasApiKey: !!provider?.apiKey,
                apiKeyValue: provider?.apiKey
            });
            throw new Error('Claude API klíč není nastaven. Nastavte ho v Settings → AI Providers nebo v Chat Guide.');
        }

        // Validate model name
        const model = provider.model || 'claude-sonnet-4-5-20250929';
        const apiKey = provider.apiKey.trim();
        const accessToken = localStorage.getItem('access_token');

        // Validate access token
        if (!accessToken) {
            console.error('Claude API: Access token chybí');
            throw new Error('Nejste přihlášeni. Prosím, přihlaste se znovu.');
        }

        // Debug logging
        console.log('Claude API: Sending request', {
            provider: provider.name,
            model,
            apiKeyLength: apiKey.length,
            apiKeyPrefix: apiKey.substring(0, 20) + '...',
            apiKeySuffix: '...' + apiKey.substring(Math.max(0, apiKey.length - 10)),
            hasAccessToken: !!accessToken,
            accessTokenLength: accessToken ? accessToken.length : 0
        });

        // Prepare request body
        const requestBody = {
            provider: 'claude',
            api_key: apiKey,
            model: model,
            prompt: prompt || ''
        };

        console.log('Claude API: Request body (without api_key value)', {
            provider: requestBody.provider,
            model: requestBody.model,
            promptLength: requestBody.prompt.length,
            apiKeyLength: requestBody.api_key.length,
            apiKeyPrefix: requestBody.api_key.substring(0, 20) + '...'
        });

        const response = await fetch('/api/tools/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMsg = errorData.detail || errorData.message || `API request failed: ${response.status} ${response.statusText}`;

            // Better error messages
            if (response.status === 401) {
                if (errorMsg.includes('x-api-key') || errorMsg.includes('api_key') || errorMsg.includes('invalid')) {
                    errorMsg = 'Neplatný Claude API klíč. Zkontrolujte, zda je správně nastaven v Settings → AI Providers.';
                } else {
                    errorMsg = 'Neautorizovaný přístup. Zkontrolujte přihlášení.';
                }
            } else if (response.status === 404) {
                if (errorMsg.includes('model')) {
                    errorMsg = `Model "${model}" neexistuje nebo není dostupný. Vyberte jiný model (např. claude-sonnet-4-5-20250929).`;
                } else {
                    errorMsg = 'API endpoint nenalezen. Zkontrolujte konfiguraci serveru.';
                }
            }

            throw new Error(errorMsg);
        }
        const data = await response.json();
        return data.content;
    },

    async callOpenAIAPI(provider, prompt) {
        const response = await fetch('/api/tools/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                provider: 'openai',
                api_key: provider.apiKey,
                model: provider.model || 'gpt-4',
                prompt: prompt
            })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        return data.content;
    },

    async callGeminiAPI(provider, prompt) {
        const response = await fetch('/api/tools/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                provider: 'gemini',
                api_key: provider.apiKey || '',
                model: provider.model || 'gemini-pro',
                prompt: prompt || ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.detail || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
            throw new Error(errorMsg);
        }
        const data = await response.json();
        return data.content;
    },

    async callCustomAPI(provider, prompt) {
        showNotification(`Custom provider ${provider.name} - coming soon`, 'info');
        return null;
    },

    openSettings() {
        // Close dropdown
        const dropdown = document.getElementById('ai-dropdown-menu');
        if (dropdown) dropdown.classList.remove('show');

        // Open settings page
        if (typeof SettingsModule !== 'undefined') {
            SettingsModule.open('ai-agents');
        } else {
            showNotification('Settings module not loaded', 'error');
        }
    },

    consolidate() {
        showNotification('Consolidating project information...', 'info');
        // TODO: Implement consolidation logic
    },

    aiAnalyze() {
        const project = StateManager.getCurrentObject();
        if (project) {
            app.openClaudeInProject(project.id);
        }
    },

    generate() {
        showNotification('Generating phases, tasks, and guides...', 'info');
        const container = document.getElementById('generated-phases');
        if (container) {
            container.innerHTML = `
                <div class="generated-phases-list">
                    <div class="phase-item">
                        <span class="phase-badge">Phase 1</span>
                        <span class="phase-name">Planning & Research</span>
                    </div>
                    <div class="phase-item">
                        <span class="phase-badge">Phase 2</span>
                        <span class="phase-name">Design & Architecture</span>
                    </div>
                    <div class="phase-item">
                        <span class="phase-badge">Phase 3</span>
                        <span class="phase-name">Implementation</span>
                    </div>
                    <div class="phase-item">
                        <span class="phase-badge">Phase 4</span>
                        <span class="phase-name">Testing & QA</span>
                    </div>
                    <div class="phase-item">
                        <span class="phase-badge">Phase 5</span>
                        <span class="phase-name">Deployment & Launch</span>
                    </div>
                </div>
            `;
        }
        showNotification('Phases generated!', 'success');
    },


    // Load project specification from storage
    async loadProjectSpec(projectId) {
        try {
            // Try to load from API first
            const response = await fetch(`/api/objects/${projectId}/spec`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.specification) {
                    const specField = document.getElementById('project-spec');
                    if (specField) {
                        specField.value = data.specification;
                    }
                    return;
                }
            }
        } catch (e) {
            console.log('API spec load failed, trying localStorage');
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(`kms-project-spec-${projectId}`);
        if (stored) {
            const specField = document.getElementById('project-spec');
            if (specField) {
                specField.value = stored;
            }
        }
    },

    // Save project specification
    async saveSpec() {
        const specField = document.getElementById('project-spec');
        const spec = specField?.value;
        const project = StateManager.getCurrentObject();

        if (!spec) {
            showNotification('Nothing to save', 'warning');
            return;
        }

        if (!project) {
            showNotification('No project selected', 'error');
            return;
        }

        // Save to localStorage immediately
        localStorage.setItem(`kms-project-spec-${project.id}`, spec);

        try {
            // Also try to save to API
            const response = await fetch(`/api/objects/${project.id}/spec`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ specification: spec })
            });

            if (response.ok) {
                showNotification('Specification saved!', 'success');
            } else {
                showNotification('Saved locally (API unavailable)', 'warning');
            }
        } catch (e) {
            console.error('API save failed:', e);
            showNotification('Saved locally', 'success');
        }
    },

    generateSpec() {
        // Show AI dropdown for selection
        this.toggleAIDropdown({ stopPropagation: () => {} });
    },

    // Chat Guide for project communication
    chatMessages: [],
    chatGuideOpen: false,

    openChatGuide(providerId = null) {
        if (providerId) {
            this.selectedAIProvider = providerId;
        }
        this.chatGuideOpen = true;
        this.renderChatGuide();
    },

    openChatGuideWithProvider(providerId) {
        // Close dropdown
        const dropdown = document.getElementById('ai-dropdown-menu');
        if (dropdown) dropdown.classList.remove('show');
        const chatDropdown = document.getElementById('ai-chat-dropdown-menu');
        if (chatDropdown) chatDropdown.classList.remove('show');

        this.openChatGuide(providerId);
    },

    closeChatGuide() {
        this.chatGuideOpen = false;
        const modal = document.getElementById('chat-guide-modal');
        if (modal) modal.remove();
    },

    renderChatGuide() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'error');
            return;
        }

        // Ensure providers are loaded
        if (this.aiProviders.length === 0) {
            this.loadAIProviders();
        }

        const enabledProviders = this.aiProviders.filter(p => p.enabled);

        // If no provider selected or selected provider not enabled, use first enabled
        let currentProvider = enabledProviders.find(p => p.id === this.selectedAIProvider);
        if (!currentProvider && enabledProviders.length > 0) {
            currentProvider = enabledProviders[0];
            this.selectedAIProvider = currentProvider.id;
        }

        const testStatus = this.chatTestStatus || {};

        const modal = document.createElement('div');
        modal.id = 'chat-guide-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content chat-guide-modal" style="max-width: 800px; max-height: 90vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-comments"></i> Project Chat Guide</h3>
                    <button class="modal-close" onclick="IdeasModule.closeChatGuide()" style="background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;" title="Zavřít">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-provider-selector" style="padding: 0.75rem 1rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 1rem;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">AI Provider:</label>
                        <select id="chat-provider-select" onchange="IdeasModule.changeChatProvider(this.value)" style="padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem;">
                            ${enabledProviders.length > 0 ? enabledProviders.map(p => `
                                <option value="${p.id}" ${p.id === this.selectedAIProvider ? 'selected' : ''}>${p.name}</option>
                            `).join('') : '<option value="">Žádný provider není povolen</option>'}
                        </select>
                        ${enabledProviders.length === 0 ? `
                            <button class="btn btn-sm btn-primary" onclick="SettingsModule.open('ai-agents'); IdeasModule.closeChatGuide();" style="margin-left: 0.5rem;">
                                <i class="fas fa-cog"></i> Nastavit
                            </button>
                        ` : ''}
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                        <label style="font-size: 0.85rem; font-weight: 600;">Model:</label>
                        <select id="chat-model-select" onchange="IdeasModule.changeChatModel(this.value)" style="padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; flex: 1;">
                            ${currentProvider ? this.getModelOptionsForProvider(currentProvider.type, currentProvider.model) : '<option value="">Vyberte provider</option>'}
                        </select>
                    </div>
                    ${currentProvider ? `
                        <button class="btn-icon-sm" onclick="IdeasModule.testChatConnection()" title="Test připojení" style="padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">
                            <i class="fas fa-check-circle" id="chat-test-icon" style="color: ${testStatus[currentProvider.id] === 'success' ? '#27ae60' : testStatus[currentProvider.id] === 'error' ? '#e74c3c' : '#95a5a6'};"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="modal-body chat-guide-body">
                    <div class="chat-messages" id="chat-messages">
                        ${this.chatMessages.length === 0 ? `
                            <div class="chat-welcome">
                                <i class="fas fa-robot"></i>
                                <p>Ahoj! Jsem váš asistent pro projekty. Pojďme diskutovat o vašem projektu a pomohu vám vytvořit komplexní specifikaci, fáze a úkoly.</p>
                                <p>S čím byste chtěli začít?</p>
                            </div>
                        ` : this.chatMessages.map(msg => `
                            <div class="chat-message ${msg.role}">
                                <div class="message-avatar">
                                    <i class="fas fa-${msg.role === 'user' ? 'user' : 'robot'}"></i>
                                </div>
                                <div class="message-content">${msg.content}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="chat-input-area">
                        <textarea id="chat-input" placeholder="Napište svou zprávu..." rows="2"></textarea>
                        <div class="chat-action-buttons">
                            <button class="btn btn-secondary" onclick="IdeasModule.sendChatMessageWithAction('description')" title="Uložit jako Popis projektu">
                                <i class="fas fa-file-alt"></i> Popis
                            </button>
                            <button class="btn btn-secondary" onclick="IdeasModule.sendChatMessageWithAction('tasks')" title="Uložit jako Úkoly">
                                <i class="fas fa-tasks"></i> Úkoly
                            </button>
                            <button class="btn btn-secondary" onclick="IdeasModule.sendChatMessageWithAction('suggestions')" title="Uložit jako Návrhy">
                                <i class="fas fa-lightbulb"></i> Návrhy
                            </button>
                            <button class="btn btn-primary" onclick="IdeasModule.confirmAndSaveChat()" title="Potvrdit a uložit všechny změny" style="margin-left: auto;">
                                <i class="fas fa-check"></i> Potvrdit a uložit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeChatGuide();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.chatGuideOpen) {
                this.closeChatGuide();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Initialize provider and model selects
        setTimeout(async () => {
            const provider = enabledProviders.find(p => p.id === this.selectedAIProvider) || enabledProviders[0];
            if (provider) {
                this.selectedAIProvider = provider.id;
                this.updateTestIcon(provider.id);
            }

            // Load project description as default text
            try {
                const fullProject = await API.getObject(project.id);
                const spec = fullProject.metadata?.specification || document.getElementById('project-spec')?.value || '';

                const input = document.getElementById('chat-input');
                if (input && spec) {
                    input.value = spec;
                }
            } catch (error) {
                console.error('Error loading project description:', error);
            }

            // Focus input
            const input = document.getElementById('chat-input');
            if (input) {
                input.focus();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Don't send on Enter, user should use action buttons
                    }
                });
            }
        }, 100);
    },

    async sendChatMessageWithAction(actionType) {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        if (!message) {
            showNotification('Zadejte zprávu', 'warning');
            return;
        }

        // Ensure providers are loaded
        if (this.aiProviders.length === 0) {
            await this.loadAIProviders();
        }

        // If no provider selected, try to find enabled provider
        if (!this.selectedAIProvider) {
            const enabledProviders = this.aiProviders.filter(p => p.enabled);
            if (enabledProviders.length > 0) {
                this.selectedAIProvider = enabledProviders[0].id;
            }
        }

        const provider = this.aiProviders.find(p => p.id === this.selectedAIProvider);
        if (!provider) {
            showNotification('Vyberte AI provider v Settings → AI Providers a zaškrtněte Enabled', 'error');
            if (typeof SettingsModule !== 'undefined') {
                SettingsModule.open('ai-agents');
            }
            return;
        }

        // Validate API key before sending
        if (!provider.apiKey || provider.apiKey.trim() === '') {
            showNotification('API klíč není nastaven. Nastavte ho v Settings → AI Providers.', 'error');
            // Open settings modal
            if (typeof SettingsModule !== 'undefined') {
                SettingsModule.open('ai-agents');
            }
            return;
        }

        const project = StateManager.getCurrentObject();
        if (!project) return;

        // Detect language from user message (before try block)
        const isCzech = /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(message) ||
                       message.toLowerCase().includes('potřebuji') ||
                       message.toLowerCase().includes('chci') ||
                       message.toLowerCase().includes('prosím');
        const responseLanguage = isCzech ? 'česky' : 'in the same language as the user question';

        // Load full project data with metadata
        const fullProject = await API.getObject(project.id);

        // Add user message
        this.chatMessages.push({ role: 'user', content: message });
        input.value = '';
        this.updateChatDisplay();

        // Show thinking progress indicator
        const typingId = Date.now();
        const thinkingStages = [
            'Analyzuji požadavek...',
            'Připravuji odpověď...',
            'Generuji obsah...',
            'Dokončuji...'
        ];
        let currentStage = 0;

        this.chatMessages.push({
            role: 'assistant',
            content: thinkingStages[0],
            thinking: true,
            id: typingId,
            stage: 0
        });
        this.updateChatDisplay();

        // Update thinking progress every 2 seconds
        const thinkingInterval = setInterval(() => {
            currentStage++;
            if (currentStage < thinkingStages.length) {
                const thinkingMsg = this.chatMessages.find(m => m.id === typingId);
                if (thinkingMsg) {
                    thinkingMsg.content = thinkingStages[currentStage];
                    thinkingMsg.stage = currentStage;
                    this.updateChatDisplay();
                }
            }
        }, 2000);

        try {
            // Get AI provider - reload from localStorage first to ensure we have latest data
            await this.loadAIProviders();
            const enabledProviders = this.aiProviders.filter(p => p.enabled);
            const provider = enabledProviders.find(p => p.id === this.selectedAIProvider) || enabledProviders[0];

            if (!provider) {
                throw new Error('Není nakonfigurován žádný AI poskytovatel. Přejděte do Settings → AI Providers a povolte alespoň jeden provider.');
            }

            // Validate API key before proceeding
            if (!provider.apiKey || provider.apiKey.trim() === '') {
                throw new Error('API klíč není nastaven pro vybraný provider. Nastavte ho v Settings → AI Providers.');
            }

            // Debug logging
            console.log('sendChatMessageWithAction: Provider info', {
                providerId: provider.id,
                providerName: provider.name,
                providerType: provider.type,
                hasApiKey: !!provider.apiKey,
                apiKeyLength: provider.apiKey ? provider.apiKey.length : 0,
                apiKeyPrefix: provider.apiKey ? provider.apiKey.substring(0, 20) + '...' : 'NONE',
                apiKeySuffix: provider.apiKey ? '...' + provider.apiKey.substring(provider.apiKey.length - 10) : 'NONE',
                model: provider.model,
                enabled: provider.enabled,
                allProviders: this.aiProviders.map(p => ({ id: p.id, name: p.name, enabled: p.enabled, hasApiKey: !!p.apiKey }))
            });

            // Build context based on action type
            const spec = document.getElementById('project-spec')?.value || '';
            const metadata = fullProject.metadata || {};
            const existingTasks = metadata.tasks || [];
            const projectStatus = fullProject.status || 'active';

            let context = '';

            if (actionType === 'description') {
                // Popis: zgeneruj mi popis tohoto projektu podle zadaneho textu
                context = `Zgeneruj mi popis tohoto projektu podle zadaného textu.

Projekt: ${fullProject.object_name || project.object_name}

Zadaný text:
${message}

Odpověz ${responseLanguage} a vytvoř stručný, ale komplexní popis projektu. Použij markdown formátování.`;
            } else if (actionType === 'tasks') {
                // Úkoly: zgeneruj mi úkoly na realizaci tohoto projektu
                // + text (pokud je psaný) + popis projektu + stav projektu
                context = `Zgeneruj mi úkoly na realizaci tohoto projektu.

Projekt: ${fullProject.object_name || project.object_name}
Stav projektu: ${projectStatus}

${message ? `Text z chatu:\n${message}\n` : ''}
${spec ? `Popis projektu:\n${spec}\n` : ''}

Odpověz ${responseLanguage} a vytvoř seznam konkrétních úkolů ve formátu:
- Úkol 1: Popis
- Úkol 2: Popis
...

Použij markdown formátování.`;
            } else if (actionType === 'suggestions') {
                // Návrhy: proanalizuj Popis, text z chatu, úkoly, stav projektu, chyby
                // a dej mi návrh co by bylo lepší udělat pro: zvýšení security, výkonu, stability, ... atd
                const tasksText = existingTasks.length > 0
                    ? existingTasks.map(t => `- ${t.name || t.description || 'Úkol'}`).join('\n')
                    : 'Žádné úkoly';

                context = `Proanalyzuj následující informace a dej mi návrhy co by bylo lepší udělat pro zvýšení security, výkonu, stability a kvality projektu.

Projekt: ${fullProject.object_name || project.object_name}
Stav projektu: ${projectStatus}

${spec ? `Popis projektu:\n${spec}\n` : ''}
${message ? `Text z chatu:\n${message}\n` : ''}
Úkoly:
${tasksText}

Odpověz ${responseLanguage} a vytvoř strukturované návrhy zaměřené na:
- Security (bezpečnost)
- Výkon (performance)
- Stabilita
- Kvalita kódu
- UX/UI
- Další důležité aspekty

Použij markdown formátování.`;
            }

            // Call AI - use context directly
            let response = '';
            switch (provider.type) {
                case 'claude':
                    response = await this.callClaudeAPI(provider, context);
                    break;
                case 'openai':
                    response = await this.callOpenAIAPI(provider, context);
                    break;
                case 'gemini':
                    response = await this.callGeminiAPI(provider, context);
                    break;
                default:
                    response = await this.callCustomAPI(provider, context);
            }

            // Clear thinking interval
            clearInterval(thinkingInterval);

            // Remove typing indicator and add response
            this.chatMessages = this.chatMessages.filter(m => m.id !== typingId);
            this.chatMessages.push({ role: 'assistant', content: response, actionType: actionType });
            this.updateChatDisplay();

            // Immediately display the result based on action type
            if (actionType === 'tasks') {
                const tasks = this.parseTasksFromResponse(response);
                if (tasks.length > 0) {
                    this.displayTasks(tasks);
                }
            } else if (actionType === 'suggestions') {
                this.displaySuggestions(response);
            } else if (actionType === 'description') {
                // Update spec field immediately
                const specField = document.getElementById('project-spec');
                if (specField) {
                    specField.value = response;
                }
            }

            // Mark as pending (not saved yet)
            const lastMessage = this.chatMessages[this.chatMessages.length - 1];
            if (lastMessage) {
                lastMessage.saved = false;
            }

            // Don't auto-save, wait for confirmation
            // await this.saveChatResponseToSection(actionType, response, project);

        } catch (error) {
            console.error('Chat error:', error);
            clearInterval(thinkingInterval);
            this.chatMessages = this.chatMessages.filter(m => m.id !== typingId);
            const errorMsg = isCzech ? `Omlouvám se, došlo k chybě: ${error.message}. Zkuste to prosím znovu.` : `Sorry, I encountered an error: ${error.message}. Please try again.`;
            this.chatMessages.push({ role: 'assistant', content: errorMsg });
            this.updateChatDisplay();
        }
    },

    async saveChatResponseToSection(actionType, response, project) {
        try {
            // Get current metadata
            const object = await API.getObject(project.id);
            const metadata = object.metadata || {};

            // Initialize history if not exists
            if (!metadata.chat_history) {
                metadata.chat_history = [];
            }

            // Add to history
            metadata.chat_history.push({
                timestamp: new Date().toISOString(),
                action: actionType,
                response: response
            });

            // Save to appropriate section
            if (actionType === 'description') {
                // Update specification
                metadata.specification = response;
                const specField = document.getElementById('project-spec');
                if (specField) {
                    specField.value = response;
                }
            } else if (actionType === 'tasks') {
                // Parse tasks from response and add to tasks
                const tasks = this.parseTasksFromResponse(response);
                if (!metadata.tasks) metadata.tasks = [];
                metadata.tasks = [...metadata.tasks, ...tasks];
            } else if (actionType === 'suggestions') {
                // Add to suggestions
                if (!metadata.suggestions) metadata.suggestions = [];
                metadata.suggestions.push({
                    timestamp: new Date().toISOString(),
                    content: response
                });
            }

            // Save to API
            await API.put(`/objects/${project.id}`, {
                metadata: metadata
            });

            showNotification(`Uloženo do ${actionType === 'description' ? 'Popisu' : actionType === 'tasks' ? 'Úkolů' : 'Návrhů'}`, 'success');

        } catch (error) {
            console.error('Error saving chat response:', error);
            showNotification('Chyba při ukládání', 'error');
        }
    },

    parseTasksFromResponse(response) {
        // Try to extract tasks from markdown formatted response
        const tasks = [];

        // Try multiple patterns
        const patterns = [
            /## Úkoly[\s\S]*?(?=##|$)/i,
            /## Tasks[\s\S]*?(?=##|$)/i,
            /^[-*]\s+(.+)$/gm,
            /^\d+\.\s+(.+)$/gm
        ];

        let taskText = '';
        for (const pattern of patterns) {
            const match = response.match(pattern);
            if (match) {
                taskText = Array.isArray(match) ? match[0] : match;
                break;
            }
        }

        // If no section found, try to extract from entire response
        if (!taskText) {
            taskText = response;
        }

        // Extract list items
        const taskRegex = /[-*]\s+(.+?)(?:\n|$)/g;
        let match;
        let taskId = 1;

        while ((match = taskRegex.exec(taskText)) !== null) {
            const taskName = match[1].trim();
            if (taskName && taskName.length > 3) { // Skip very short items
                tasks.push({
                    id: `task-${Date.now()}-${taskId++}`,
                    name: taskName,
                    description: '',
                    priority: 'medium',
                    status: 'pending',
                    created_at: new Date().toISOString()
                });
            }
        }

        // If no tasks found with list format, try numbered list
        if (tasks.length === 0) {
            const numberedRegex = /^\d+\.\s+(.+)$/gm;
            while ((match = numberedRegex.exec(taskText)) !== null) {
                const taskName = match[1].trim();
                if (taskName && taskName.length > 3) {
                    tasks.push({
                        id: `task-${Date.now()}-${taskId++}`,
                        name: taskName,
                        description: '',
                        priority: 'medium',
                        status: 'pending',
                        created_at: new Date().toISOString()
                    });
                }
            }
        }

        return tasks;
    },

    getModelOptionsForProvider(providerType, selectedModel) {
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
                'claude-opus-4-5-20251101',
                'claude-sonnet-4-5-20250929',
                'claude-haiku-4-5-20251001',
                'claude-opus-4-1-20250805',
                'claude-opus-4-20250514',
                'claude-sonnet-4-20250514',
                'claude-3-7-sonnet-20250219',
                'claude-3-5-haiku-20241022',
                'claude-3-haiku-20240307'
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

        const options = models[providerType] || ['default'];
        return options.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
    },

    changeChatProvider(providerId) {
        this.selectedAIProvider = providerId;
        const provider = this.aiProviders.find(p => p.id === providerId);
        if (provider) {
            const modelSelect = document.getElementById('chat-model-select');
            if (modelSelect) {
                modelSelect.innerHTML = this.getModelOptionsForProvider(provider.type, provider.model);
            }
            // Reset test status when changing provider
            this.updateTestIcon(providerId);

            // Save to settings
            const settings = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
            settings.defaultProvider = providerId;
            localStorage.setItem('kms-ai-settings', JSON.stringify(settings));
        }
    },

    changeChatModel(model) {
        const provider = this.aiProviders.find(p => p.id === this.selectedAIProvider);
        if (provider) {
            provider.model = model;
            // Save to settings
            const settings = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
            settings.providers = this.aiProviders;
            localStorage.setItem('kms-ai-settings', JSON.stringify(settings));
        }
    },

    async testChatConnection() {
        // Ensure providers are loaded
        if (this.aiProviders.length === 0) {
            await this.loadAIProviders();
        }

        const provider = this.aiProviders.find(p => p.id === this.selectedAIProvider);
        if (!provider) {
            showNotification('Vyberte AI provider v Settings → AI Providers a zaškrtněte Enabled', 'error');
            return;
        }

        if (!provider.apiKey || provider.apiKey.trim() === '') {
            showNotification('API klíč není nastaven. Nastavte ho v Settings → AI Providers.', 'error');
            if (typeof SettingsModule !== 'undefined') {
                SettingsModule.open('ai-agents');
            }
            return;
        }

        const testIcon = document.getElementById('chat-test-icon');
        if (testIcon) {
            testIcon.className = 'fas fa-spinner fa-spin';
            testIcon.style.color = '#95a5a6';
        }

        try {
            const response = await API.post('/tools/ai/test', {
                provider: provider.type,
                api_key: provider.apiKey.trim(),
                model: provider.model || 'claude-sonnet-4-5-20250929'
            });

            if (response.success) {
                this.chatTestStatus[provider.id] = 'success';
                if (testIcon) {
                    testIcon.className = 'fas fa-check-circle';
                    testIcon.style.color = '#27ae60';
                }
                showNotification('Připojení úspěšné', 'success');
            } else {
                throw new Error(response.message || 'Test failed');
            }
        } catch (error) {
            this.chatTestStatus[provider.id] = 'error';
            if (testIcon) {
                testIcon.className = 'fas fa-times-circle';
                testIcon.style.color = '#e74c3c';
            }
            showNotification(`Chyba připojení: ${error.message}`, 'error');
        }
    },

    updateTestIcon(providerId) {
        const testIcon = document.getElementById('chat-test-icon');
        if (testIcon) {
            const status = this.chatTestStatus[providerId];
            if (status === 'success') {
                testIcon.className = 'fas fa-check-circle';
                testIcon.style.color = '#27ae60';
            } else if (status === 'error') {
                testIcon.className = 'fas fa-times-circle';
                testIcon.style.color = '#e74c3c';
            } else {
                testIcon.className = 'fas fa-check-circle';
                testIcon.style.color = '#95a5a6';
            }
        }
    },

    async confirmAndSaveChat() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('Není vybrán projekt', 'error');
            return;
        }

        // Get all assistant messages with actionType
        const messagesToSave = this.chatMessages.filter(m => m.role === 'assistant' && m.actionType && !m.saved);

        if (messagesToSave.length === 0) {
            showNotification('Žádné změny k uložení', 'info');
            return;
        }

        showNotification('Ukládám všechny změny...', 'info');

        try {
            const object = await API.getObject(project.id);
            const metadata = object.metadata || {};

            if (!metadata.chat_history) {
                metadata.chat_history = [];
            }

            // Save all pending messages - přepsat znění do stránky
            for (const msg of messagesToSave) {
                if (msg.actionType === 'description') {
                    // Přepsat popis projektu
                    metadata.specification = msg.content;
                    const specField = document.getElementById('project-spec');
                    if (specField) {
                        specField.value = msg.content;
                    }
                } else if (msg.actionType === 'tasks') {
                    // Přepsat úkoly - extrahovat a přepsat seznam úkolů
                    const tasks = this.parseTasksFromResponse(msg.content);
                    metadata.tasks = tasks; // Přepsat, ne přidat
                    // Zobrazit úkoly
                    this.displayTasks(tasks);
                } else if (msg.actionType === 'suggestions') {
                    // Přepsat návrhy
                    if (!metadata.suggestions) metadata.suggestions = [];
                    // Najít poslední návrh a přepsat, nebo přidat nový
                    const lastSuggestion = metadata.suggestions[metadata.suggestions.length - 1];
                    if (lastSuggestion && lastSuggestion.timestamp) {
                        // Přepsat poslední
                        lastSuggestion.content = msg.content;
                        lastSuggestion.timestamp = new Date().toISOString();
                    } else {
                        // Přidat nový
                        metadata.suggestions.push({
                            timestamp: new Date().toISOString(),
                            content: msg.content
                        });
                    }
                    // Zobrazit návrhy
                    this.displaySuggestions(msg.content);
                }

                // Add to history
                metadata.chat_history.push({
                    timestamp: new Date().toISOString(),
                    action: msg.actionType,
                    response: msg.content
                });

                msg.saved = true;
            }

            // Save to API
            await API.put(`/objects/${project.id}`, {
                metadata: metadata
            });

            // Update spec field if description was saved
            const descriptionMsg = messagesToSave.find(m => m.actionType === 'description');
            if (descriptionMsg) {
                const specField = document.getElementById('project-spec');
                if (specField) {
                    specField.value = descriptionMsg.content;
                }
            }

            // Display tasks if they were saved
            const tasksMsg = messagesToSave.find(m => m.actionType === 'tasks');
            if (tasksMsg) {
                const tasks = this.parseTasksFromResponse(tasksMsg.content);
                this.displayTasks(tasks);
            }

            // Display suggestions if they were saved
            const suggestionsMsg = messagesToSave.find(m => m.actionType === 'suggestions');
            if (suggestionsMsg) {
                this.displaySuggestions(suggestionsMsg.content);
            }

            showNotification(`Uloženo ${messagesToSave.length} změn`, 'success');

            // Update display
            this.updateChatDisplay();

        } catch (error) {
            console.error('Error confirming chat changes:', error);
            showNotification(`Chyba při ukládání: ${error.message}`, 'error');
        }
    },

    updateChatDisplay() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        container.innerHTML = this.chatMessages.map(msg => {
            if (msg.thinking || msg.typing) {
                const progress = msg.stage !== undefined ? msg.stage : 0;
                const progressPercent = ((progress + 1) / 4) * 100;
                return `<div class="chat-message assistant thinking">
                    <div class="message-avatar"><i class="fas fa-robot"></i></div>
                    <div class="message-content">
                        <div class="thinking-progress">
                            <div class="thinking-text">${msg.content || 'Přemýšlím...'}</div>
                            <div class="thinking-bar">
                                <div class="thinking-bar-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }
            // Convert markdown to HTML for better formatting
            const formattedContent = this.formatMarkdown(msg.content);
            return `<div class="chat-message ${msg.role}">
                <div class="message-avatar"><i class="fas fa-${msg.role === 'user' ? 'user' : 'robot'}"></i></div>
                <div class="message-content">${formattedContent}</div>
            </div>`;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    formatMarkdown(text) {
        if (!text) return '';

        // Split by lines
        const lines = text.split('\n');
        let html = '';
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Headers
            if (line.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h3>${this.escapeHtml(line.substring(4))}</h3>`;
            } else if (line.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h2>${this.escapeHtml(line.substring(3))}</h2>`;
            } else if (line.startsWith('# ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<h1>${this.escapeHtml(line.substring(2))}</h1>`;
            } else if (line.match(/^[-*]\s+/)) {
                // List item
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const content = line.replace(/^[-*]\s+/, '');
                html += `<li>${this.escapeHtml(content)}</li>`;
            } else if (line === '') {
                // Empty line
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += '<br>';
            } else {
                // Regular text
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                let content = this.escapeHtml(line);
                // Bold
                content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html += `<p>${content}</p>`;
            }
        }

        if (inList) {
            html += '</ul>';
        }

        return html;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Generate phases from specification
    async generatePhases() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'error');
            return;
        }

        const spec = document.getElementById('project-spec')?.value;
        if (!spec) {
            showNotification('Please create a project specification first', 'warning');
            return;
        }

        showNotification('Generating phases...', 'info');

        try {
            const enabledProviders = this.aiProviders.filter(p => p.enabled);
            const provider = enabledProviders.find(p => p.id === this.selectedAIProvider) || enabledProviders[0];

            if (!provider) {
                throw new Error('No AI provider configured');
            }

            const prompt = `Based on this project specification, generate a structured list of development phases:

${spec}

Please provide phases in JSON format:
{
  "phases": [
    {
      "id": 1,
      "name": "Phase Name",
      "description": "Detailed description",
      "order": 1,
      "estimated_duration": "2 weeks",
      "tasks": []
    }
  ]
}

Make it practical and actionable.`;

            const response = await this.callAIProvider(provider, prompt, project);

            // Try to parse JSON from response
            let phases = [];
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    phases = JSON.parse(jsonMatch[0]).phases || [];
                }
            } catch (e) {
                // If parsing fails, create basic structure
                phases = [{ id: 1, name: "Phase 1", description: response, order: 1 }];
            }

            // Save phases
            await this.savePhasesAndTasks(phases, []);

            // Display phases
            this.displayPhases(phases);
            showNotification('Phases generated and saved!', 'success');

        } catch (error) {
            console.error('Generate phases error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    },

    // Generate tasks from phases
    async generateTasks() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'error');
            return;
        }

        // Load existing phases
        const phases = await this.loadPhases();
        if (phases.length === 0) {
            showNotification('Please generate phases first', 'warning');
            return;
        }

        showNotification('Generating tasks...', 'info');

        try {
            const enabledProviders = this.aiProviders.filter(p => p.enabled);
            const provider = enabledProviders.find(p => p.id === this.selectedAIProvider) || enabledProviders[0];

            if (!provider) {
                throw new Error('No AI provider configured');
            }

            // Validate API key
            if (!provider.apiKey || provider.apiKey.trim() === '') {
                throw new Error('API klíč není nastaven. Nastavte ho v Settings → AI Providers.');
            }

            const prompt = `Based on these project phases, generate detailed tasks for each phase:

${JSON.stringify(phases, null, 2)}

Please provide tasks in JSON format:
{
  "tasks": [
    {
      "id": 1,
      "phase_id": 1,
      "name": "Task Name",
      "description": "Detailed description",
      "priority": "high",
      "estimated_hours": 8,
      "status": "pending"
    }
  ]
}

Make tasks specific and actionable.`;

            const response = await this.callAIProvider(provider, prompt, project);

            // Try to parse JSON from response
            let tasks = [];
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    tasks = JSON.parse(jsonMatch[0]).tasks || [];
                }
            } catch (e) {
                showNotification('Could not parse tasks from response', 'warning');
                return;
            }

            // Save tasks with existing phases
            await this.savePhasesAndTasks(phases, tasks);

            // Display tasks in Ideas module
            this.displayPhases(phases, tasks);
            
            // Auto-sync to Tasks module
            await this.syncPhasesAndTasksToTasksModule(phases, tasks);
            
            showNotification(`${tasks.length} tasks generated and synced to TASKS!`, 'success');

        } catch (error) {
            console.error('Generate tasks error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    },

    async savePhasesAndTasks(phases, tasks) {
        const project = StateManager.getCurrentObject();
        if (!project) return;

        try {
            const response = await API.put(`/objects/${project.id}/phases`, { phases, tasks });

            // Also save to Tasks module
            await this.syncPhasesAndTasksToTasksModule(phases, tasks);

            return response;
        } catch (error) {
            console.error('Save phases/tasks error:', error);
            throw error;
        }
    },

    async syncPhasesAndTasksToTasksModule(phases, tasks) {
        const project = StateManager.getCurrentObject();
        if (!project || !tasks || tasks.length === 0) return;

        if (typeof TasksModule === 'undefined') {
            console.warn('TasksModule not available');
            return;
        }

        // Sync each task to Tasks module
        let syncedCount = 0;
        tasks.forEach(task => {
            const phase = phases.find(p => p.id === task.phase_id || p.order === task.phase_id);
            TasksModule.addExternalTask({
                ...task,
                title: task.name || task.title,
                project_id: project.id,
                project_name: project.object_name || project.name,
                phase_name: phase?.name || `Phase ${task.phase_id + 1}`,
                source: 'ideas',
                skipNotification: true
            });
            syncedCount++;
        });

        console.log(`Synced ${syncedCount} tasks to Tasks module`);
    },

    async loadPhases() {
        const project = StateManager.getCurrentObject();
        if (!project) return [];

        try {
            const response = await API.get(`/objects/${project.id}/phases`);
            if (response && response.phases) {
                return response.phases || [];
            }
        } catch (e) {
            console.error('Load phases error:', e);
        }

        return [];
    },

    displayPhases(phases, tasks = []) {
        const container = document.getElementById('generated-phases');
        if (!container) return;

        container.innerHTML = `
            <div class="phases-list">
                ${phases.map((phase, phaseIdx) => {
                    const phaseId = phase.id || phaseIdx;
                    const phaseTasks = tasks.filter(t => (t.phase_id === phase.id) || (t.phase_id === phaseIdx));
                    return `
                        <div class="phase-card" data-phase-id="${phaseId}">
                            <div class="phase-header" onclick="IdeasModule.togglePhase(${phaseId})">
                                <i class="fas fa-chevron-down phase-toggle"></i>
                                <span class="phase-badge">Phase ${phase.order || phaseIdx + 1}</span>
                                <h5>${this.escapeHtml(phase.name || 'Unnamed Phase')}</h5>
                                <span style="color: #888; font-size: 0.75rem; margin-left: auto;">${phaseTasks.length} tasks</span>
                            </div>
                            ${phase.description ? `<div class="phase-description">${this.escapeHtml(phase.description)}</div>` : ''}
                            <div class="phase-tasks">
                                <ul>
                                    ${phaseTasks.map((task, taskIdx) => {
                                        const taskId = task.id || taskIdx;
                                        const priority = task.priority || 'medium';
                                        return `
                                        <li class="phase-task-item" data-task-id="${taskId}" onclick="IdeasModule.openTaskInTasks('${taskId}')">
                                            <span class="task-priority-dot ${priority}"></span>
                                            <span class="task-name">${this.escapeHtml(task.name || task.title || 'Task')}</span>
                                            <div class="task-actions" onclick="event.stopPropagation()">
                                                <button onclick="IdeasModule.editTask('${taskId}')" title="Edit"><i class="fas fa-edit"></i></button>
                                                <button onclick="IdeasModule.sendTaskToTasks('${taskId}')" title="Send to Tasks"><i class="fas fa-arrow-right"></i></button>
                                            </div>
                                        </li>
                                    `;
                                    }).join('')}
                                    ${phaseTasks.length === 0 ? '<li class="phase-task-item" style="color: #999; font-style: italic;">No tasks in this phase</li>' : ''}
                                </ul>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top: 0.5rem; text-align: right;">
                <button class="btn btn-sm btn-primary" onclick="IdeasModule.syncAllToTasks()">
                    <i class="fas fa-sync"></i> Sync All to TASKS
                </button>
            </div>
        `;
    },

    togglePhase(phaseId) {
        const card = document.querySelector(`.phase-card[data-phase-id="${phaseId}"]`);
        if (card) {
            card.classList.toggle('collapsed');
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    async openTaskInTasks(taskId) {
        // Navigate to TASKS module and highlight the task
        window.location.hash = '#tasks';
        setTimeout(() => {
            if (typeof TasksModule !== 'undefined') {
                TasksModule.highlightTask(taskId);
            }
        }, 300);
    },

    async editTask(taskId) {
        // Open task edit modal
        const project = StateManager.getCurrentObject();
        if (!project) return;

        try {
            const fullProject = await API.getObject(project.id);
            const tasks = fullProject.metadata?.generated_tasks || [];
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (task) {
                const newName = prompt('Task name:', task.name || task.title || '');
                if (newName !== null) {
                    task.name = newName;
                    task.title = newName;
                    await this.savePhasesAndTasks(fullProject.metadata?.generated_phases || [], tasks);
                    this.loadPhasesAndTasks();
                }
            }
        } catch (error) {
            console.error('Edit task error:', error);
        }
    },

    async sendTaskToTasks(taskId) {
        const project = StateManager.getCurrentObject();
        if (!project) return;

        try {
            const fullProject = await API.getObject(project.id);
            const tasks = fullProject.metadata?.generated_tasks || [];
            const task = tasks.find(t => String(t.id) === String(taskId));
            
            if (task && typeof TasksModule !== 'undefined') {
                TasksModule.addExternalTask({
                    ...task,
                    title: task.name || task.title,
                    project_id: project.id,
                    project_name: project.object_name || project.name,
                    source: 'ideas'
                });
                showNotification('Task sent to TASKS module', 'success');
            }
        } catch (error) {
            console.error('Send task error:', error);
            showNotification('Error sending task', 'error');
        }
    },

    async syncAllToTasks() {
        const project = StateManager.getCurrentObject();
        if (!project) {
            showNotification('No project selected', 'warning');
            return;
        }

        try {
            const fullProject = await API.getObject(project.id);
            const phases = fullProject.metadata?.generated_phases || [];
            const tasks = fullProject.metadata?.generated_tasks || [];
            
            if (typeof TasksModule !== 'undefined') {
                let count = 0;
                tasks.forEach(task => {
                    const phase = phases.find(p => p.id === task.phase_id);
                    TasksModule.addExternalTask({
                        ...task,
                        title: task.name || task.title,
                        project_id: project.id,
                        project_name: project.object_name || project.name,
                        phase_name: phase?.name || `Phase ${task.phase_id + 1}`,
                        source: 'ideas',
                        skipNotification: true
                    });
                    count++;
                });
                showNotification(`${count} tasks synced to TASKS module`, 'success');
            }
        } catch (error) {
            console.error('Sync all tasks error:', error);
            showNotification('Error syncing tasks', 'error');
        }
    },

    setupInlineEditing() {
        // Phase name editing
        document.querySelectorAll('.phase-name-editable').forEach(el => {
            el.addEventListener('blur', (e) => {
                const phaseId = e.target.dataset.phaseId;
                const newName = e.target.textContent.trim();
                this.updatePhaseField(phaseId, 'name', newName);
            });
        });

        // Phase description editing
        document.querySelectorAll('.phase-description-editable').forEach(el => {
            el.addEventListener('blur', (e) => {
                const phaseId = e.target.dataset.phaseId;
                const newDesc = e.target.textContent.trim();
                this.updatePhaseField(phaseId, 'description', newDesc);
            });
        });

        // Task name editing
        document.querySelectorAll('.task-name-editable').forEach(el => {
            el.addEventListener('blur', (e) => {
                const taskId = e.target.dataset.taskId;
                const newName = e.target.textContent.trim();
                this.updateTaskField(taskId, 'name', newName);
            });
        });

        // Task description editing
        document.querySelectorAll('.task-description-editable').forEach(el => {
            el.addEventListener('blur', (e) => {
                const taskId = e.target.dataset.taskId;
                const newDesc = e.target.textContent.trim();
                this.updateTaskField(taskId, 'description', newDesc);
            });
        });
    },

    async updatePhaseField(phaseId, field, value) {
        try {
            const phases = await this.loadPhases();
            const phase = phases.find((p, idx) => (p.id || idx) == phaseId);
            if (phase) {
                phase[field] = value;
                const project = StateManager.getCurrentObject();
                if (project) {
                    const fullProject = await API.getObject(project.id);
                    const metadata = fullProject.metadata || {};
                    const tasks = metadata.tasks || [];
                    await this.savePhasesAndTasks(phases, tasks);
                }
            }
        } catch (error) {
            console.error('Error updating phase field:', error);
        }
    },

    async updateTaskField(taskId, field, value) {
        try {
            const project = StateManager.getCurrentObject();
            if (!project) return;

            const fullProject = await API.getObject(project.id);
            const metadata = fullProject.metadata || {};
            const tasks = metadata.tasks || [];
            const task = tasks.find((t, idx) => (t.id || idx) == taskId);

            if (task) {
                task[field] = value;
                metadata.tasks = tasks;
                await API.put(`/objects/${project.id}`, { metadata });
            }
        } catch (error) {
            console.error('Error updating task field:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => IdeasModule.init());
window.IdeasModule = IdeasModule;
