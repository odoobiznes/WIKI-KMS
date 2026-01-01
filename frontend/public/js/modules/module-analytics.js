/**
 * KMS Module - ANALYTICS
 * Monitoring and analytics module
 *
 * Features:
 * - Usage statistics
 * - Billing analytics
 * - Error tracking
 * - AI usage metrics
 * - Processing time analysis
 */

const AnalyticsModule = {
    statsHidden: true, // Statistics section hidden by default
    dateRange: '7d',

    init() {
        console.log('📊 AnalyticsModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'analytics') {
                this.render();
            }
        });

        document.addEventListener('projectSelected', () => {
            if (ModuleRouter.currentModule === 'analytics') {
                this.render();
            }
        });
    },

    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        mainView.innerHTML = `
            <div class="analytics-module-container">
                ${this.renderDashboard()}
            </div>
        `;
    },

    toggleStats() {
        this.statsHidden = !this.statsHidden;
        const statsSection = document.querySelector('.module-stats-section');
        const toggleBtn = document.querySelector('.btn-icon-toggle');
        if (statsSection) {
            statsSection.classList.toggle('hidden', this.statsHidden);
        }
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', !this.statsHidden);
            toggleBtn.querySelector('i').className = `fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}`;
            toggleBtn.title = this.statsHidden ? 'Show Statistics' : 'Hide Statistics';
        }
    },

    renderDashboard() {
        return `
            <div class="analytics-dashboard">
                <div class="module-header-row">
                    <div class="module-header-left">
                        <h2><i class="fas fa-chart-line"></i> Analytics</h2>
                        <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                                onclick="AnalyticsModule.toggleStats()"
                                title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                            <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                        </button>
                    </div>
                    <div class="module-header-actions">
                        <button class="btn btn-secondary" onclick="AnalyticsModule.render()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
                <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-eye"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">1,234</div>
                                <div class="stat-label">Total Views</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-robot"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">456</div>
                                <div class="stat-label">AI Requests</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">12</div>
                                <div class="stat-label">Errors</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">1.2s</div>
                                <div class="stat-label">Avg Response</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="charts-row">
                    <div class="chart-card">
                        <h4><i class="fas fa-chart-line"></i> Usage Over Time</h4>
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-area"></i>
                            <p>Chart visualization</p>
                        </div>
                    </div>
                    <div class="chart-card">
                        <h4><i class="fas fa-chart-pie"></i> Request Types</h4>
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-pie"></i>
                            <p>Chart visualization</p>
                        </div>
                    </div>
                </div>

                <div class="tables-row">
                    <div class="table-card">
                        <h4><i class="fas fa-list"></i> Recent Errors</h4>
                        <table class="analytics-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>10:30:15</td>
                                    <td><span class="badge error">Error</span></td>
                                    <td>Connection timeout</td>
                                </tr>
                                <tr>
                                    <td>09:15:22</td>
                                    <td><span class="badge warning">Warning</span></td>
                                    <td>Slow response time</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },


    setDateRange(range) {
        this.dateRange = range;
        showNotification(`Date range: ${range}`, 'info');
        // TODO: Reload data
    },

    refresh() {
        showNotification('Refreshing analytics...', 'info');
    },

    exportReport() {
        showNotification('Exporting report...', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => AnalyticsModule.init());
window.AnalyticsModule = AnalyticsModule;
