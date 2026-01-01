/**
 * KMS Module - TASKS
 * Team Work module with hidden projects by default
 *
 * Features:
 * - Projects hidden by default, shown in collapsed mode
 * - Task management: New, Edit, Delete
 * - Team assignment
 * - Stage and priority management
 * - Simple functional interface for ongoing work
 */

// Helper function for notifications
if (typeof window.showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        if (typeof Components !== 'undefined' && Components.showToast) {
            Components.showToast(message, type);
        } else if (typeof API !== 'undefined' && API.showNotification) {
            API.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            // Fallback: create a simple notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
                color: white;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-size: 0.9rem;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    };
}

const TasksModule = {
    statsHidden: true, // Statistics section hidden by default
    tasks: [],
    isLoading: false, // Flag to prevent infinite loops
    filters: {
        priority: 'all',
        assignee: 'all',
        status: 'all'
    },

    // Task statuses
    statuses: [
        { id: 'todo', name: 'To Do', color: '#6c757d' },
        { id: 'in-progress', name: 'In Progress', color: '#3498db' },
        { id: 'review', name: 'Review', color: '#f39c12' },
        { id: 'done', name: 'Done', color: '#27ae60' }
    ],

    // Priority levels
    priorities: [
        { id: 'low', name: 'Low', color: '#27ae60' },
        { id: 'medium', name: 'Medium', color: '#f39c12' },
        { id: 'high', name: 'High', color: '#e67e22' },
        { id: 'critical', name: 'Critical', color: '#e74c3c' }
    ],

    /**
     * Initialize TASKS module
     */
    init() {
        console.log('📋 TasksModule initialized');

        document.addEventListener('moduleChanged', (e) => {
            if (e.detail.currentModule === 'tasks') {
                this.render();
            }
        });

        document.addEventListener('projectSelected', () => {
            if (ModuleRouter.currentModule === 'tasks') {
                this.loadProjectTasks();
            }
        });
    },

    /**
     * Render the TASKS module
     */
    async render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        // Load objects if not in state
        let objects = StateManager.getObjects() || [];
        if (objects.length === 0) {
            try {
                objects = await API.getObjects().catch(() => []);
                StateManager.setObjects(objects);
            } catch (error) {
                console.error('Error loading objects:', error);
            }
        }

        // Note: Toolbar is rendered by ModuleRouter.renderModuleHeader()
        mainView.innerHTML = `
            <div class="tasks-module-container">
                ${this.renderModuleHeader()}
                ${this.renderTaskBoard()}
            </div>
        `;

        // Load tasks if project is selected (without notification to prevent spam)
        const currentProject = StateManager.getCurrentObject();
        if (currentProject) {
            await this.loadProjectTasks(false);
        } else {
            this.tasks = [];
            this.updateTaskBoard();
        }
    },

    /**
     * Render module header with stats toggle
     */
    renderModuleHeader() {
        const stats = this.calculateStats();

        return `
            <div class="module-header-row">
                <div class="module-header-left">
                    <h2><i class="fas fa-tasks"></i> Tasks</h2>
                    <button class="btn-icon-toggle ${this.statsHidden ? '' : 'active'}"
                            onclick="TasksModule.toggleStats()"
                            title="${this.statsHidden ? 'Show Statistics' : 'Hide Statistics'}">
                        <i class="fas fa-${this.statsHidden ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </div>
                <div class="module-header-actions">
                    <button class="btn btn-primary" onclick="TasksModule.showNewTaskModal()">
                        <i class="fas fa-plus"></i> New Task
                    </button>
                    <button class="btn btn-secondary" onclick="TasksModule.clearAllTasks()" title="Clear all tasks">
                        <i class="fas fa-trash-alt"></i> Clear All
                    </button>
                    <button class="btn btn-secondary" onclick="TasksModule.reloadTasks()">
                        <i class="fas fa-sync"></i> Reload
                    </button>
                </div>
            </div>
            <div class="module-stats-section ${this.statsHidden ? 'hidden' : ''}">
                <div class="resources-stats">
                    <div class="stat-card stat-primary" style="--module-color: #27ae60">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <h3>${stats.done}</h3>
                            <p>Done</p>
                        </div>
                    </div>
                    <div class="stat-card stat-info" style="--module-color: #3498db">
                        <div class="stat-icon"><i class="fas fa-spinner"></i></div>
                        <div class="stat-content">
                            <h3>${stats.inProgress}</h3>
                            <p>In Progress</p>
                        </div>
                    </div>
                    <div class="stat-card stat-secondary" style="--module-color: #f39c12">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-content">
                            <h3>${stats.todo}</h3>
                            <p>To Do</p>
                        </div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                        <div class="stat-content">
                            <h3>${stats.total}</h3>
                            <p>Total</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Calculate task statistics
     */
    calculateStats() {
        return {
            total: this.tasks.length,
            todo: this.tasks.filter(t => t.status === 'todo').length,
            inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
            review: this.tasks.filter(t => t.status === 'review').length,
            done: this.tasks.filter(t => t.status === 'done').length
        };
    },

    /**
     * Render task board (Kanban style)
     */
    renderTaskBoard() {
        return `
            <div class="tasks-board" id="tasks-board">
                ${this.statuses.map(status => `
                    <div class="tasks-column" data-status="${status.id}">
                        <div class="column-header" style="--status-color: ${status.color}">
                            <span class="column-title">${status.name}</span>
                            <span class="column-count">${this.getTasksByStatus(status.id).length}</span>
                        </div>
                        <div class="column-tasks" ondragover="TasksModule.handleDragOver(event)" ondrop="TasksModule.handleDrop(event, '${status.id}')">
                            ${this.getTasksByStatus(status.id).map(task => this.renderTaskCard(task)).join('')}
                            ${this.getTasksByStatus(status.id).length === 0 ? `
                                <div class="empty-column">
                                    <p>No tasks</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Update task board without full re-render
     */
    updateTaskBoard() {
        const board = document.getElementById('tasks-board');
        if (!board) return;

        // Update each column
        this.statuses.forEach(status => {
            const column = board.querySelector(`[data-status="${status.id}"]`);
            if (!column) return;

            const tasks = this.getTasksByStatus(status.id);
            const countEl = column.querySelector('.column-count');
            const tasksContainer = column.querySelector('.column-tasks');

            if (countEl) {
                countEl.textContent = tasks.length;
            }

            if (tasksContainer) {
                tasksContainer.innerHTML = tasks.length > 0
                    ? tasks.map(task => this.renderTaskCard(task)).join('')
                    : '<div class="empty-column"><p>No tasks</p></div>';
            }
        });
    },

    /**
     * Render individual task card
     */
    renderTaskCard(task) {
        const priority = this.priorities.find(p => p.id === task.priority);
        const taskId = String(task.id);
        const taskIdAttr = this.escapeHtml(taskId);

        return `
            <div class="task-card task-card-compact"
                 draggable="true"
                 ondragstart="TasksModule.handleDragStart(event)"
                 onclick="TasksModule.viewTaskFromCard(this)"
                 data-task-id="${taskIdAttr}">
                <div class="task-card-row">
                    <span class="task-card-title">${this.escapeHtml(task.title)}</span>
                    <span class="task-priority" style="background: ${priority?.color || '#6c757d'}">
                        ${priority?.name || 'Normal'}
                    </span>
                    <div class="task-card-actions" onclick="event.stopPropagation();">
                        <button onclick="TasksModule.viewTaskFromCard(this.closest('.task-card'))" title="View/Edit">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="TasksModule.deleteTaskFromCard(this.closest('.task-card'))" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-card-description"><i class="fas fa-tag"></i> ${this.escapeHtml(task.description)}</div>` : ''}
            </div>
        `;
    },

    /**
     * View task from card element
     */
    viewTaskFromCard(cardElement) {
        const taskId = cardElement?.getAttribute('data-task-id');
        if (taskId) {
            this.viewTask(taskId);
        }
    },

    /**
     * Delete task from card element
     */
    deleteTaskFromCard(cardElement) {
        const taskId = cardElement?.getAttribute('data-task-id');
        if (taskId) {
            this.deleteTask(taskId);
        }
    },

    /**
     * Get tasks by status
     */
    getTasksByStatus(status) {
        return this.tasks.filter(task => {
            if (task.status !== status) return false;
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) return false;
            if (this.filters.assignee !== 'all' && task.assignee !== this.filters.assignee) return false;
            return true;
        });
    },

    /**
     * Toggle statistics visibility
     */
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

    /**
     * Set filter
     */
    setFilter(type, value) {
        this.filters[type] = value;
        this.render();
    },

    /**
     * Load tasks for current project
     */
    async loadProjectTasks(showNotification = false) {
        // Prevent infinite loops
        if (this.isLoading) {
            return;
        }

        const project = StateManager.getCurrentObject();
        if (!project) {
            this.tasks = [];
            this.updateTaskBoard();
            return;
        }

        this.isLoading = true;
        try {
            // Load full project with metadata
            const fullProject = await API.getObject(project.id);
            const metadata = fullProject.metadata || {};

            // Get tasks from metadata
            let tasks = [];
            const tasksFromMetadata = metadata.tasks || [];

            // Process tasks from metadata.tasks
            tasksFromMetadata.forEach((task, idx) => {
                if (typeof task === 'string') {
                    tasks.push({
                        id: `task-${idx}-${Date.now()}`,
                        title: task,
                        description: '',
                        status: 'todo',
                        priority: 'medium',
                        assignee: null,
                        dueDate: null
                    });
                } else if (task && (task.title || task.name)) {
                    tasks.push({
                        id: task.id || `task-${idx}-${Date.now()}`,
                        title: task.title || task.name,
                        description: task.description || '',
                        status: task.status || 'todo',
                        priority: task.priority || 'medium',
                        assignee: task.assignee || null,
                        dueDate: task.dueDate || null,
                        phase_id: task.phase_id,
                        phase_name: task.phase_name
                    });
                }
            });

            // Also extract tasks from phases if they exist
            const phases = metadata.phases || [];
            phases.forEach((phase, phaseIdx) => {
                if (phase.tasks && Array.isArray(phase.tasks)) {
                    phase.tasks.forEach((task, taskIdx) => {
                        // Skip if task is just empty or invalid
                        if (!task) return;

                        // Create unique ID
                        const taskId = task.id || `phase-${phaseIdx}-task-${taskIdx}-${Date.now()}`;

                        // Check if task already exists (deduplication)
                        const existingTask = tasks.find(t => t.id === taskId ||
                            (t.title === (task.name || task.title) && t.phase_id === (phase.id || phaseIdx)));

                        if (!existingTask) {
                            tasks.push({
                                id: taskId,
                                title: task.name || task.title || `Task ${taskIdx + 1}`,
                                description: task.description || '',
                                status: task.status || 'todo',
                                priority: task.priority || 'medium',
                                assignee: task.assignee || null,
                                phase_id: phase.id || phaseIdx,
                                phase_name: phase.name || `Phase ${phaseIdx + 1}`,
                                dueDate: task.dueDate || null
                            });
                        }
                    });
                }
            });

            // Final deduplication by ID
            const seenIds = new Set();
            this.tasks = tasks.filter(task => {
                if (seenIds.has(task.id)) {
                    return false;
                }
                seenIds.add(task.id);
                return true;
            });

            // Update only the board, not full render
            this.updateTaskBoard();
            if (showNotification) {
                showNotification(`Loaded ${this.tasks.length} tasks`, 'success');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.updateTaskBoard();
            if (showNotification) {
                showNotification('Error loading tasks', 'error');
            }
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Clear all tasks from current view
     */
    clearAllTasks() {
        if (this.tasks.length === 0) {
            showNotification('No tasks to clear', 'info');
            return;
        }

        if (!confirm(`Are you sure you want to clear all ${this.tasks.length} tasks from the view?`)) {
            return;
        }

        this.tasks = [];
        this.updateTaskBoard();
        showNotification('All tasks cleared from view', 'success');
    },

    /**
     * Reload tasks from project (force reload)
     */
    async reloadTasks() {
        // Reset loading flag to force reload
        this.isLoading = false;
        // Clear current tasks
        this.tasks = [];
        this.updateTaskBoard();
        // Reload from project
        await this.loadProjectTasks(true);
    },

    /**
     * Show new task modal
     */
    showNewTaskModal() {
        const modalHtml = `
            <div id="task-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-plus"></i> New Task</h2>
                        <span class="close-btn" onclick="TasksModule.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="task-title" class="form-control" placeholder="Task title">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="task-description" class="form-control" rows="3" placeholder="Task description"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priority</label>
                                <select id="task-priority" class="form-control">
                                    ${this.priorities.map(p => `
                                        <option value="${p.id}">${p.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select id="task-status" class="form-control">
                                    ${this.statuses.map(s => `
                                        <option value="${s.id}">${s.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Assignee</label>
                            <input type="text" id="task-assignee" class="form-control" placeholder="Team member name">
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" id="task-due-date" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="TasksModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="TasksModule.createTask()">Create Task</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('task-modal');
        if (modal) modal.remove();
    },

    /**
     * Create new task
     */
    createTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const status = document.getElementById('task-status').value;
        const assignee = document.getElementById('task-assignee').value;
        const dueDate = document.getElementById('task-due-date').value;

        if (!title) {
            showNotification('Please enter task title', 'warning');
            return;
        }

        const newTask = {
            id: Date.now(),
            title,
            description,
            priority,
            status,
            assignee: assignee || null,
            dueDate: dueDate || null
        };

        this.tasks.push(newTask);
        this.closeModal();
        this.updateTaskBoard();
        showNotification('Task created', 'success');
    },

    /**
     * View/Edit task modal
     */
    viewTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId || String(t.id) === String(taskId));
        if (!task) {
            showNotification('Task not found', 'error');
            return;
        }

        const status = this.statuses.find(s => s.id === task.status);
        const priority = this.priorities.find(p => p.id === task.priority);

        const modalHtml = `
            <div id="task-view-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-tasks"></i> Task Details</h2>
                        <span class="close-btn" onclick="TasksModule.closeViewModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="view-task-title" class="form-control" value="${this.escapeHtml(task.title)}" placeholder="Task title">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="view-task-description" class="form-control" rows="4" placeholder="Task description">${this.escapeHtml(task.description || '')}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priority</label>
                                <select id="view-task-priority" class="form-control">
                                    ${this.priorities.map(p => `
                                        <option value="${p.id}" ${task.priority === p.id ? 'selected' : ''}>${p.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select id="view-task-status" class="form-control">
                                    ${this.statuses.map(s => `
                                        <option value="${s.id}" ${task.status === s.id ? 'selected' : ''}>${s.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Assignee</label>
                            <input type="text" id="view-task-assignee" class="form-control" value="${this.escapeHtml(task.assignee || '')}" placeholder="Team member name">
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" id="view-task-due-date" class="form-control" value="${task.dueDate || ''}">
                        </div>
                        ${task.phase_name ? `
                            <div class="form-group">
                                <label>Phase</label>
                                <input type="text" class="form-control" value="${this.escapeHtml(task.phase_name)}" readonly style="background: #f5f5f5;">
                            </div>
                        ` : ''}
                        <div class="task-meta-info" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
                            <small style="color: #666;">
                                <i class="fas fa-info-circle"></i>
                                Task ID: ${task.id}
                                ${task.phase_id ? ` | Phase ID: ${task.phase_id}` : ''}
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="TasksModule.closeViewModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="TasksModule.deleteTask('${taskId}'); TasksModule.closeViewModal();">Delete</button>
                        <button class="btn btn-primary" onclick="TasksModule.saveTask('${taskId}')">Save Changes</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('task-view-modal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Close view modal
     */
    closeViewModal() {
        const modal = document.getElementById('task-view-modal');
        if (modal) modal.remove();
    },

    /**
     * Save task changes
     */
    saveTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId || String(t.id) === String(taskId));
        if (!task) {
            showNotification('Task not found', 'error');
            return;
        }

        const title = document.getElementById('view-task-title').value;
        if (!title) {
            showNotification('Please enter task title', 'warning');
            return;
        }

        // Update task
        task.title = title;
        task.description = document.getElementById('view-task-description').value;
        task.priority = document.getElementById('view-task-priority').value;
        task.status = document.getElementById('view-task-status').value;
        task.assignee = document.getElementById('view-task-assignee').value || null;
        task.dueDate = document.getElementById('view-task-due-date').value || null;

        // TODO: Save to backend/API
        // For now, just update local state
        this.closeViewModal();
        this.updateTaskBoard();
        showNotification('Task updated', 'success');
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Edit task (alias for viewTask)
     */
    editTask(taskId) {
        this.viewTask(taskId);
    },

    /**
     * Delete task
     */
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId || String(t.id) === String(taskId));
        if (!task) {
            showNotification('Task not found', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

        this.tasks = this.tasks.filter(t => t.id !== taskId && String(t.id) !== String(taskId));
        this.updateTaskBoard();
        showNotification('Task deleted', 'success');
    },

    // Drag & Drop handlers
    handleDragStart(event) {
        event.stopPropagation(); // Prevent opening task on drag
        const taskId = event.currentTarget?.getAttribute('data-task-id');
        if (taskId) {
            event.dataTransfer.setData('text/plain', taskId);
        }
    },

    handleDragOver(event) {
        event.preventDefault();
    },

    handleDrop(event, newStatus) {
        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain');
        const task = this.tasks.find(t => String(t.id) === String(taskId));

        if (task) {
            task.status = newStatus;
            this.updateTaskBoard();
            const statusName = this.statuses.find(s => s.id === newStatus)?.name || newStatus;
            showNotification(`Task moved to ${statusName}`, 'success');
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    TasksModule.init();
});

// Export for global access
window.TasksModule = TasksModule;
