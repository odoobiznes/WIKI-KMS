// API Client for KMS
// Enhanced with error handling, retry logic, and toast notifications

class APIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }
}

const API = {
    baseURL: window.location.origin + '/api',

    // Get stored token
    getToken() {
        return localStorage.getItem('access_token');
    },

    // Check if token is expired
    isTokenExpired() {
        const expiresAt = localStorage.getItem('token_expires_at');
        if (!expiresAt) return true;
        return Date.now() >= parseInt(expiresAt);
    },

    // Refresh token
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            console.warn('No refresh token available');
            this.logout();
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                console.warn('Token refresh failed:', response.status);
                this.logout();
                return false;
            }

            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
                console.log('Token refreshed successfully');
                return true;
            }
            this.logout();
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');
        window.location.href = '/login.html';
    },

    // Get authorization header
    getAuthHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    baseURL_old: window.location.hostname === 'localhost'
        ? 'http://localhost:8000/api'
        : '/api',

    retryCount: 3,
    retryDelay: 1000,

    // Show toast notification if available
    showNotification(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    // Fetch with retry logic
    async fetchWithRetry(url, options = {}, retries = this.retryCount) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                console.warn(`⟳ Retry ${i + 1}/${retries} for ${url}`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
            }
        }
    },

    // Helper methods for HTTP verbs
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    async post(endpoint, data = null, options = {}) {
        const opts = { ...options, method: 'POST' };
        if (data) {
            opts.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return this.request(endpoint, opts);
    },

    async put(endpoint, data = null, options = {}) {
        const opts = { ...options, method: 'PUT' };
        if (data) {
            opts.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return this.request(endpoint, opts);
    },

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },

    async request(endpoint, options = {}) {
        // Skip auth check for login and refresh endpoints
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
            const token = this.getToken();
            if (!token) {
                // No token - redirect to login
                this.logout();
                throw new APIError('Not authenticated', 401, {});
            }

            // Check if token is expired and refresh if needed
            if (this.isTokenExpired()) {
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    // Refresh failed - redirect to login
                    this.logout();
                    throw new APIError('Session expired', 401, {});
                }
            }
        }

        // Ensure endpoint starts with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${cleanEndpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers
        };

        // Remove Content-Type if body is FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const response = await this.fetchWithRetry(url, {
                headers: headers,
                ...options
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
                }
                const message = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                const error = new APIError(message, response.status, errorData);
                error.response = response; // Attach response for easier error handling
                throw error;
            }

            const data = await response.json();
            console.log(`✓ API ${endpoint}:`, typeof data === 'object' ?
                (Array.isArray(data) ? `${data.length} items` : 'OK') : data);
            return data;
        } catch (error) {
            console.error(`✗ API ${endpoint}:`, error.message);

            // Show user-friendly notification
            if (error instanceof APIError) {
                if (error.status === 404) {
                    this.showNotification(`Not found: ${endpoint}`, 'warning');
                } else if (error.status >= 500) {
                    this.showNotification('Server error - try again later', 'error');
                } else {
                    this.showNotification(error.message, 'error');
                }
            } else {
                this.showNotification('Network error - check connection', 'error');
            }

            throw error;
        }
    },

    // Categories
    async getCategories(type = null) {
        const params = type ? `?type=${type}` : '';
        return this.request(`/categories/${params}`);
    },

    async getCategory(id) {
        return this.request(`/categories/${id}`);
    },

    async createCategory(data) {
        return this.request('/categories/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateCategory(id, data) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    },

    // Subcategories
    async getSubcategories(categoryId) {
        return this.request(`/subcategories/?category_id=${categoryId}`);
    },

    async getSubcategory(id) {
        return this.request(`/subcategories/${id}`);
    },

    async createSubcategory(data) {
        return this.request('/subcategories/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateSubcategory(id, data) {
        return this.request(`/subcategories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteSubcategory(id) {
        return this.request(`/subcategories/${id}`, {
            method: 'DELETE'
        });
    },

    // Objects/Projects
    async getObjects(categoryId = null, subcategoryId = null, status = null) {
        let params = [];
        if (categoryId) params.push(`category_id=${categoryId}`);
        if (subcategoryId) params.push(`subcategory_id=${subcategoryId}`);
        if (status) params.push(`status=${status}`);
        const query = params.length ? '?' + params.join('&') : '';
        return this.request(`/objects/${query}`);
    },

    async getObject(id) {
        return this.request(`/objects/${id}`);
    },

    async getObjectDocuments(id) {
        return this.request(`/objects/${id}/documents`);
    },

    async createObject(data) {
        return this.request('/objects/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateObject(id, data) {
        return this.request(`/objects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteObject(id) {
        return this.request(`/objects/${id}`, {
            method: 'DELETE'
        });
    },

    // Documents
    async getDocument(id) {
        return this.request(`/documents/${id}`);
    },

    async getDocumentContent(id) {
        const url = `${this.baseURL}/documents/${id}/content`;
        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new APIError(
                errorText || `Failed to load document content: ${response.statusText}`,
                response.status,
                errorText
            );
        }

        return await response.text();
    },

    async createDocument(data) {
        return this.request('/documents/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteDocument(documentId) {
        return this.request(`/documents/${documentId}`, {
            method: 'DELETE'
        });
    },

    async updateDocument(id, data) {
        return this.request(`/documents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Search
    async search(query, limit = 20) {
        return this.request(`/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
    },

    async searchSuggestions(query) {
        return this.request(`/search/suggest?q=${encodeURIComponent(query)}`);
    },

    // System
    async getStats() {
        return this.request('/system/stats');
    },

    async getHealth() {
        return this.request('/system/health');
    },

    async getChangelog(limit = 10) {
        return this.request(`/system/changelog?limit=${limit}`);
    },

    async getSyncStatus(limit = 10) {
        return this.request(`/system/sync-status?limit=${limit}`);
    },

    // Tools
    async getToolsStatus() {
        return this.request('/tools/status');
    },

    async openTerminal(objectId, folder = null) {
        return this.request('/tools/terminal/open', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, folder })
        });
    },

    async openFileBrowser(objectId, folder = null) {
        return this.request('/tools/files/open', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, folder })
        });
    },

    async openVSCode(objectId, folder = null) {
        return this.request('/tools/vscode/open', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, folder })
        });
    },

    async openCursor(objectId, folder = null) {
        return this.request('/tools/cursor/open', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, folder })
        });
    },

    async openWindsurf(objectId, folder = null) {
        return this.request('/tools/windsurf/open', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, folder })
        });
    },

    async claudeChat(objectId, message, includeContext = true) {
        // Get API key from localStorage (AI settings)
        let apiKey = null;
        try {
            const settings = JSON.parse(localStorage.getItem('kms-ai-settings') || '{}');
            const claudeProvider = settings.providers?.find(p => p.type === 'claude' && p.enabled);
            if (claudeProvider && claudeProvider.apiKey) {
                apiKey = claudeProvider.apiKey;
            }
        } catch (e) {
            console.warn('Error loading Claude API key from settings:', e);
        }
        return this.request('/tools/claude/chat', {
            method: 'POST',
            body: JSON.stringify({
                object_id: objectId,
                message: message,
                include_context: includeContext,
                api_key: apiKey  // Send API key from frontend settings
            })
        });
    },

    async getClaudeModels() {
        return this.request('/tools/claude/models');
    },

    // Git operations
    async gitOperation(objectId, operation, message = null, branch = null, remote = null) {
        return this.request('/tools/git/operation', {
            method: 'POST',
            body: JSON.stringify({
                object_id: objectId,
                operation: operation,
                message: message,
                branch: branch,
                remote: remote
            })
        });
    },

    // Import project
    async importProject(importData) {
        return this.request('/tools/import', {
            method: 'POST',
            body: JSON.stringify(importData)
        });
    },

    async uploadImportFiles(formData) {
        // Upload files from local computer
        const token = this.getToken();
        if (!token) {
            throw new APIError(401, 'Authentication required');
        }

        const url = `${this.baseURL}/tools/import/upload`;
        console.log('Uploading files to:', url);
        console.log('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, v instanceof File ? v.name : v]));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type - browser will set it automatically with boundary for multipart/form-data
            },
            body: formData
        });

        console.log('Upload response:', response.status, response.statusText);

        if (!response.ok) {
            let errorDetail = response.statusText;
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail || errorData.message || errorData.error || response.statusText;
            } catch (e) {
                // If response is not JSON, use statusText
                const text = await response.text().catch(() => '');
                errorDetail = text || response.statusText;
            }
            console.error('Upload failed:', response.status, errorDetail);
            throw new APIError(response.status, errorDetail || 'Upload failed');
        }

        return await response.json();
    },

    async downloadFile(path, allowAny = true, useSudo = true) {
        const token = this.getToken();
        const params = new URLSearchParams({
            path: path,
            allow_any: allowAny.toString(),
            use_sudo: useSudo.toString()
        });

        const url = `${this.baseURL}/tools/files/download?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new APIError(`HTTP ${response.status}: ${errorText}`, response.status, errorText);
            }

            return response;
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    },

    async exportProject(objectId, data) {
        return this.request('/tools/export', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, ...data })
        });
    },

    async synchProject(objectId, data) {
        return this.request('/tools/synch', {
            method: 'POST',
            body: JSON.stringify({ object_id: objectId, ...data })
        });
    }
};
