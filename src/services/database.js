// ============================================
// Service API Financia - Connexion PHP/MySQL
// ============================================

export const API_BASE_URL = 'http://financia.ehk-editions.com/index.php';

// Fonction utilitaire pour les requêtes API
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Erreur API');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const transactionService = {
    // Ajouter une transaction
    async addTransaction(transaction) {
        const response = await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
        return response.data;
    },

    // Obtenir toutes les transactions avec filtres optionnels
    async getTransactions(filters = {}) {
        const user = authService.getStoredUser();
        if (!user || !user.id) {
            throw new Error('Utilisateur non authentifié');
        }

        const params = new URLSearchParams();
        params.append('user_id', user.id);

        if (filters.type) params.append('type', filters.type);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.limit) params.append('limit', filters.limit);

        const queryString = params.toString();
        const endpoint = `/transactions?${queryString}`;

        const response = await apiRequest(endpoint);
        return response.data || [];
    },

    // Mettre à jour une transaction
    async updateTransaction(id, data) {
        const response = await apiRequest(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    // Supprimer une transaction
    async deleteTransaction(id) {
        await apiRequest(`/transactions/${id}`, {
            method: 'DELETE',
        });
        return true;
    },

    // Obtenir le solde
    async getBalance() {
        const user = authService.getStoredUser();
        if (!user || !user.id) {
            throw new Error('Utilisateur non authentifié');
        }

        const response = await apiRequest(`/balance?user_id=${user.id}`);
        return response.data.balance;
    },

    // Obtenir le résumé mensuel
    async getMonthlySummary(month, year) {
        const user = authService.getStoredUser();
        if (!user || !user.id) {
            throw new Error('Utilisateur non authentifié');
        }

        const response = await apiRequest(`/summary?month=${month}&year=${year}&user_id=${user.id}`);
        return response.data;
    },

    // Obtenir les statistiques par catégorie
    async getCategoryStats(startDate, endDate) {
        const user = authService.getStoredUser();
        if (!user || !user.id) {
            throw new Error('Utilisateur non authentifié');
        }

        const params = new URLSearchParams();
        params.append('user_id', user.id);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const queryString = params.toString();
        const endpoint = `/stats?${queryString}`;

        const response = await apiRequest(endpoint);
        return response.data || {};
    },

    // Exporter les données
    async exportData() {
        const response = await apiRequest('/export');
        return JSON.stringify(response.data, null, 2);
    },

    // Importer des données
    async importData(jsonData) {
        const transactions = JSON.parse(jsonData);
        const response = await apiRequest('/import', {
            method: 'POST',
            body: JSON.stringify({ transactions }),
        });
        return response.data.imported;
    },

    // Supprimer toutes les données
    async clearAllData() {
        await apiRequest('/clear', {
            method: 'DELETE',
        });
        return true;
    },

    // Vérifier la santé de l'API
    async checkHealth() {
        try {
            const response = await apiRequest('/health');
            return response.data;
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    },
};

// Service pour les catégories
export const categoryService = {
    // Obtenir toutes les catégories
    async getCategories(filters = {}) {
        const params = new URLSearchParams();

        if (filters.type) params.append('type', filters.type);

        const queryString = params.toString();
        const endpoint = `/categories${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest(endpoint);
        return response.data || [];
    },

    // Obtenir une catégorie par ID
    async getCategoryById(id) {
        const response = await apiRequest(`/categories/${id}`);
        return response.data;
    },

    // Obtenir les catégories par type
    async getCategoriesByType(type) {
        const response = await apiRequest(`/categories/type/${type}`);
        return response.data || [];
    },

    // Créer une catégorie
    async createCategory(category) {
        const response = await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify(category),
        });
        return response.data;
    },

    // Mettre à jour une catégorie
    async updateCategory(id, data) {
        const response = await apiRequest(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    // Supprimer une catégorie
    async deleteCategory(id) {
        await apiRequest(`/categories/${id}`, {
            method: 'DELETE',
        });
        return true;
    },
};

// Service d'authentification
export const authService = {
    // Inscription
    async register(data) {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    // Connexion
    async login(data) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    // Obtenir les infos de l'utilisateur connecté
    async getMe() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Non authentifié');
        }

        const response = await apiRequest('/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    },

    // Mettre à jour le profil
    async updateProfile(data) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Non authentifié');
        }

        const response = await apiRequest('/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return response.data;
    },

    // Déconnexion
    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return true;
    },

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Obtenir l'utilisateur stocké
    getStoredUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Obtenir le token
    getToken() {
        return localStorage.getItem('token');
    },
};

export default transactionService;
