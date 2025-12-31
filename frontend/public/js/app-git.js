/**
 * Module: AppGit
 * Purpose: Git operace - status, pull, commit, push
 * Dependencies: api.js, components.js
 * Author: KMS Team
 * Version: 1.0.0
 */

const AppGit = {
    /**
     * Perform Git operation
     */
    async gitOperation(objectId, operation) {
        try {
            if (operation === 'commit') {
                const message = prompt('Zadej commit message:');
                if (!message || message.trim() === '') {
                    Components.showToast('Commit message je povinný', 'error');
                    return;
                }

                const response = await API.gitOperation(objectId, operation, message);
                Components.showToast(response.message || 'Commit úspěšný', 'success');
            } else if (operation === 'push' || operation === 'pull') {
                const branch = prompt('Zadej branch (nech prázdné pro main/master):') || null;
                const response = await API.gitOperation(objectId, operation, null, branch);
                Components.showToast(response.message || `Git ${operation} úspěšný`, 'success');
            } else {
                const response = await API.gitOperation(objectId, operation);
                if (operation === 'status') {
                    console.log('Git status:', response.output);
                    Components.showToast('Git status zobrazen v konzoli', 'info');
                } else {
                    Components.showToast(response.message || `Git ${operation} úspěšný`, 'success');
                }
            }
        } catch (error) {
            console.error(`Error performing Git ${operation}:`, error);
            const errorMsg = error.message || `Chyba při ${operation}`;
            Components.showToast(errorMsg, 'error');
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AppGit = AppGit;
}

