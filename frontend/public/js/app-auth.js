/**
 * Module: AppAuth
 * Purpose: Autentizace, user menu, změna hesla, logout
 * Dependencies: api.js, app-state.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppAuth = {
    /**
     * Load user info from API
     */
    async loadUserInfo() {
        try {
            const token = API.getToken();
            if (!token) {
                console.warn('No token found, redirecting to login');
                window.location.href = '/login.html';
                return;
            }

            const user = await API.request('/auth/me');
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = user.username || user.email || 'User';
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
            if (error.status === 401 || error.message?.includes('Session expired') || error.message?.includes('Unauthorized')) {
                console.warn('Token invalid, redirecting to login');
                API.logout();
                window.location.href = '/login.html';
            }
        }
    },

    /**
     * Toggle user menu dropdown
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await API.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            API.logout();
        }
    },

    /**
     * Show change password modal
     */
    async showChangePassword() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Změnit heslo</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="changePasswordForm">
                        <div class="form-group">
                            <label for="oldPassword">Současné heslo:</label>
                            <input type="password" id="oldPassword" required autocomplete="current-password">
                        </div>
                        <div class="form-group">
                            <label for="newPassword">Nové heslo:</label>
                            <input type="password" id="newPassword" required autocomplete="new-password" minlength="6">
                            <small class="form-text">Minimálně 6 znaků</small>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Potvrďte nové heslo:</label>
                            <input type="password" id="confirmPassword" required autocomplete="new-password" minlength="6">
                        </div>
                        <div id="changePasswordError" class="error-message" style="display: none;"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Zrušit
                    </button>
                    <button type="button" class="btn btn-primary" id="changePasswordSubmit">
                        <i class="fas fa-save"></i> Změnit heslo
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.toggleUserMenu();

        const form = modal.querySelector('#changePasswordForm');
        const submitBtn = modal.querySelector('#changePasswordSubmit');
        const errorDiv = modal.querySelector('#changePasswordError');

        const handleSubmit = async () => {
            const oldPassword = modal.querySelector('#oldPassword').value;
            const newPassword = modal.querySelector('#newPassword').value;
            const confirmPassword = modal.querySelector('#confirmPassword').value;

            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            if (!oldPassword || !newPassword || !confirmPassword) {
                errorDiv.textContent = 'Vyplňte všechna pole';
                errorDiv.style.display = 'block';
                return;
            }

            if (newPassword !== confirmPassword) {
                errorDiv.textContent = 'Hesla se neshodují!';
                errorDiv.style.display = 'block';
                return;
            }

            if (newPassword.length < 6) {
                errorDiv.textContent = 'Heslo musí mít alespoň 6 znaků!';
                errorDiv.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ukládání...';

            try {
                await API.request('/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        old_password: oldPassword,
                        new_password: newPassword
                    })
                });

                modal.querySelector('.modal-body').innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: #28a745;"></i>
                        <h4 class="mt-3">Heslo bylo úspěšně změněno!</h4>
                    </div>
                `;
                modal.querySelector('.modal-footer').innerHTML = `
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Zavřít
                    </button>
                `;
            } catch (error) {
                let errorMsg = 'Neznámá chyba';
                if (error instanceof Error) {
                    errorMsg = error.message;
                    if (error.response && typeof error.response === 'object') {
                        errorMsg = error.response.detail || error.response.message || errorMsg;
                    }
                } else if (typeof error === 'object') {
                    errorMsg = error.detail || error.message || 'Neznámá chyba';
                }
                errorDiv.textContent = 'Chyba při změně hesla: ' + errorMsg;
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Změnit heslo';
            }
        };

        submitBtn.addEventListener('click', handleSubmit);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSubmit();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        modal.querySelector('#oldPassword').focus();
    },

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        if (!API.getToken() && !window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppAuth = AppAuth;
}

