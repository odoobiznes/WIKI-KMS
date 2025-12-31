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

const TasksModule = {
    projectsHidden: true,
    tasks: [],
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
    render() {
        const mainView = document.getElementById('main-view');
        if (!mainView) return;

        // Note: Toolbar is rendered by ModuleRouter.renderModuleHeader()
        mainView.innerHTML = `
            <div class="tasks-module-container">
                ${this.renderProjectToggle()}
                ${this.renderTaskBoard()}
            </div>
        `;
    },

    /**
     * Render project toggle (hidden by default)
     */
    renderProjectToggle() {
        const currentProject = StateManager.getCurrentObject();
        
        return `
            <div class="tasks-project-section ${this.projectsHidden ? 'collapsed' : ''}">
                <div class="project-toggle-header" onclick="TasksModule.toggleProjects()">
                    <div class="project-toggle-info">
                        <i class="fas fa-${this.projectsHidden ? 'eye-slash' : 'eye'}"></i>
                        <span>${this.projectsHidden ? 'Show Projects' : 'Hide Projects'}</span>
                        ${currentProject ? `<span class="current-project-name">| ${currentProject.object_name || currentProject.name}</span>` : ''}
                    </div>
                    <i class="fas fa-chevron-${this.projectsHidden ? 'down' : 'up'}"></i>
                </div>
                <div class="project-list-collapsed" style="${this.projectsHidden ? 'display: none;' : ''}">
                    ${SharedComponents.renderProjectPanel({
                        collapsed: false,
                        moduleId: 'tasks'
                    })}
                </div>
            </div>
        `;
    },

    /**
     * Render task board (Kanban style)
     */
    renderTaskBoard() {
        return `
            <div class="tasks-board">
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
     * Render individual task card
     */
    renderTaskCard(task) {
        const priority = this.priorities.find(p => p.id === task.priority);
        
        return `
            <div class="task-card" 
                 draggable="true" 
                 ondragstart="TasksModule.handleDragStart(event, ${task.id})"
                 data-task-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-priority" style="background: ${priority?.color || '#6c757d'}">
                        ${priority?.name || 'Normal'}
                    </span>
                    <div class="task-card-actions">
                        <button onclick="TasksModule.editTask(${task.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="TasksModule.deleteTask(${task.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-card-title">${task.title}</div>
                ${task.description ? `<div class="task-card-description">${task.description}</div>` : ''}
                <div class="task-card-footer">
                    ${task.assignee ? `
                        <div class="task-assignee">
                            <i class="fas fa-user"></i>
                            <span>${task.assignee}</span>
                        </div>
                    ` : ''}
                    ${task.dueDate ? `
                        <div class="task-due-date">
                            <i class="fas fa-calendar"></i>
                            <span>${task.dueDate}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
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
     * Toggle projects visibility
     */
    toggleProjects() {
        this.projectsHidden = !this.projectsHidden;
        
        const section = document.querySelector('.tasks-project-section');
        const list = document.querySelector('.project-list-collapsed');
        const icon = section.querySelector('.project-toggle-info i');
        const text = section.querySelector('.project-toggle-info span');
        
        section.classList.toggle('collapsed', this.projectsHidden);
        list.style.display = this.projectsHidden ? 'none' : '';
        icon.className = `fas fa-${this.projectsHidden ? 'eye-slash' : 'eye'}`;
        text.textContent = this.projectsHidden ? 'Show Projects' : 'Hide Projects';
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
    async loadProjectTasks() {
        const project = StateManager.getCurrentObject();
        
        // Demo tasks
        this.tasks = [
            { id: 1, title: 'Setup project structure', description: 'Initialize the project with proper folder structure', status: 'done', priority: 'high', assignee: 'Developer' },
            { id: 2, title: 'Implement authentication', description: 'Add user login and registration', status: 'in-progress', priority: 'critical', assignee: 'Developer' },
            { id: 3, title: 'Create API endpoints', description: 'REST API for all entities', status: 'todo', priority: 'high', assignee: null },
            { id: 4, title: 'Write documentation', description: 'API and user documentation', status: 'todo', priority: 'medium', assignee: null },
            { id: 5, title: 'Code review', description: 'Review authentication module', status: 'review', priority: 'high', assignee: 'Lead Dev' }
        ];

        this.render();
        showNotification('Tasks loaded', 'success');
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
        this.render();
        showNotification('Task created', 'success');
    },

    /**
     * Edit task
     */
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        showNotification(`Edit task: ${task.title}`, 'info');
        // TODO: Show edit modal
    },

    /**
     * Delete task
     */
    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.render();
        showNotification('Task deleted', 'success');
    },

    // Drag & Drop handlers
    handleDragStart(event, taskId) {
        event.dataTransfer.setData('text/plain', taskId);
    },

    handleDragOver(event) {
        event.preventDefault();
    },

    handleDrop(event, newStatus) {
        event.preventDefault();
        const taskId = parseInt(event.dataTransfer.getData('text/plain'));
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.status = newStatus;
            this.render();
            showNotification(`Task moved to ${newStatus}`, 'success');
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    TasksModule.init();
});

// Export for global access
window.TasksModule = TasksModule;

