/**
 * Module: AppStats
 * Purpose: Statistiky a health check
 * Dependencies: api.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppStats = {
    /**
     * Load statistics
     */
    async loadStats() {
        try {
            const stats = await API.getStats();
            const statCat = document.getElementById('stat-categories');
            const statObj = document.getElementById('stat-objects');
            const statDoc = document.getElementById('stat-documents');
            if (statCat) statCat.textContent = stats.counts?.categories || 0;
            if (statObj) statObj.textContent = stats.counts?.objects || 0;
            if (statDoc) statDoc.textContent = stats.counts?.documents || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    /**
     * Check system health
     */
    async checkHealth() {
        try {
            const health = await API.getHealth();
            const statusEl = document.getElementById('sync-status');
            if (health.status === 'healthy') {
                statusEl.innerHTML = '<i class="fas fa-circle"></i>';
                statusEl.title = 'Healthy';
            } else {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i>';
                statusEl.title = 'Unhealthy';
            }
        } catch (error) {
            const statusEl = document.getElementById('sync-status');
            statusEl.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i>';
            statusEl.title = 'Offline';
        }
    },

    /**
     * Refresh all data
     */
    async refresh() {
        Components.showToast('Refreshing...', 'info');
        await Promise.all([
            AppCategories.loadCategories(),
            this.loadStats(),
            this.checkHealth()
        ]);
        Components.showToast('Refreshed successfully', 'success');
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppStats = AppStats;
}

