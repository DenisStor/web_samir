/**
 * Admin API Module
 * Клиент для работы с серверным API
 */

var AdminAPI = (function() {
    'use strict';

    var AUTH_TOKEN_KEY = 'says_admin_token';

    // =================================================================
    // TOKEN MANAGEMENT
    // =================================================================

    function getToken() {
        return sessionStorage.getItem(AUTH_TOKEN_KEY);
    }

    function setToken(token) {
        if (token) {
            sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
        }
    }

    function getAuthHeaders() {
        var token = getToken();
        var headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    // =================================================================
    // HTTP METHODS
    // =================================================================

    /**
     * GET запрос
     */
    async function get(endpoint) {
        try {
            var response = await fetch('/api/' + endpoint);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        } catch (error) {
            console.error('API GET ' + endpoint + ' error:', error);
            return {};
        }
    }

    /**
     * POST запрос (требует авторизации)
     */
    async function save(endpoint, data) {
        try {
            var response = await fetch('/api/' + endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            // Обработка unauthorized
            if (response.status === 401) {
                setToken(null);
                if (typeof showToast === 'function') {
                    showToast('Сессия истекла. Пожалуйста, войдите снова.', 'error');
                }
                location.reload();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                var errorData = await response.json().catch(function() { return {}; });
                throw new Error(errorData.error || 'HTTP ' + response.status);
            }
            return response.json();
        } catch (error) {
            console.error('API POST ' + endpoint + ' error:', error);
            throw error;
        }
    }

    /**
     * Загрузка изображения (base64)
     */
    async function upload(imageData) {
        try {
            var response = await fetch('/api/upload', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ image: imageData })
            });

            if (response.status === 401) {
                setToken(null);
                if (typeof showToast === 'function') {
                    showToast('Сессия истекла. Пожалуйста, войдите снова.', 'error');
                }
                location.reload();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                var errorData = await response.json().catch(function() { return {}; });
                throw new Error(errorData.error || 'HTTP ' + response.status);
            }
            return response.json();
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Удаление файла
     */
    async function deleteFile(filename) {
        try {
            var response = await fetch('/api/upload/' + filename, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                setToken(null);
                if (typeof showToast === 'function') {
                    showToast('Сессия истекла. Пожалуйста, войдите снова.', 'error');
                }
                location.reload();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                var errorData = await response.json().catch(function() { return {}; });
                throw new Error(errorData.error || 'HTTP ' + response.status);
            }
            return response.json();
        } catch (error) {
            console.error('Delete file error:', error);
            throw error;
        }
    }

    // =================================================================
    // AUTHENTICATION
    // =================================================================

    /**
     * Вход в систему
     */
    async function login(password) {
        try {
            var response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });

            var data = await response.json();

            if (response.status === 429) {
                throw new Error('Слишком много попыток. Попробуйте позже.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Неверный пароль');
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Выход из системы
     */
    async function logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        setToken(null);
    }

    /**
     * Проверка авторизации
     */
    async function checkAuth() {
        try {
            var token = getToken();
            if (!token) return false;

            var response = await fetch('/api/auth/check', {
                method: 'POST',
                headers: getAuthHeaders()
            });

            var data = await response.json();
            return data.valid === true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    // =================================================================
    // DATA LOADING
    // =================================================================

    /**
     * Загрузка всех данных
     */
    async function loadAllData() {
        var results = await Promise.all([
            get('masters'),
            get('services'),
            get('articles'),
            get('principles'),
            get('faq'),
            get('social'),
            get('stats')
        ]);

        return {
            masters: results[0],
            services: results[1],
            articles: results[2],
            principles: results[3],
            faq: results[4],
            social: results[5],
            stats: results[6]
        };
    }

    // Публичный API
    return {
        // Token management
        getToken: getToken,
        setToken: setToken,

        // HTTP methods
        get: get,
        save: save,
        upload: upload,
        deleteFile: deleteFile,

        // Auth
        login: login,
        logout: logout,
        checkAuth: checkAuth,

        // Data
        loadAllData: loadAllData
    };
})();

// Экспорт
window.AdminAPI = AdminAPI;
