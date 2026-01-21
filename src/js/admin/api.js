/**
 * Admin API Module
 * Клиент для работы с серверным API
 */

var AdminAPI = (function() {
    'use strict';

    var AUTH_TOKEN_KEY = 'says_admin_token';
    var sessionExpiredHandled = false; // Предотвращает повторную обработку

    // =================================================================
    // TOKEN MANAGEMENT
    // =================================================================

    function getToken() {
        return sessionStorage.getItem(AUTH_TOKEN_KEY);
    }

    function setToken(token) {
        if (token) {
            sessionStorage.setItem(AUTH_TOKEN_KEY, token);
            sessionExpiredHandled = false; // Сбрасываем флаг при новом токене
        } else {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
        }
    }

    /**
     * Обработка истекшей сессии (вызывается однократно)
     */
    function handleSessionExpired() {
        if (sessionExpiredHandled) return;
        sessionExpiredHandled = true;

        setToken(null);
        if (typeof showToast === 'function') {
            showToast('Сессия истекла. Пожалуйста, войдите снова.', 'error');
        }

        // Показываем форму логина вместо reload
        if (typeof AdminAuth !== 'undefined' && typeof AdminAuth.showLoginForm === 'function') {
            AdminAuth.showLoginForm();
        } else {
            // Fallback: показываем модальное окно или перезагружаем страницу с задержкой
            setTimeout(function() {
                sessionExpiredHandled = false;
                location.reload();
            }, 2000);
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

    /**
     * Проверка на 401 Unauthorized и обработка истекшей сессии
     * @param {Response} response - Объект ответа fetch
     * @throws {Error} Если статус 401
     */
    function checkUnauthorized(response) {
        if (response.status === 401) {
            handleSessionExpired();
            throw new Error('Unauthorized');
        }
    }

    /**
     * Обработка ошибок HTTP
     * @param {Response} response - Объект ответа fetch
     * @throws {Error} Если ответ не ok
     */
    async function handleHttpError(response) {
        if (!response.ok) {
            var errorData = await response.json().catch(function() { return {}; });
            throw new Error(errorData.error || 'HTTP ' + response.status);
        }
    }

    // =================================================================
    // HTTP METHODS
    // =================================================================

    /**
     * GET запрос
     * @param {string} endpoint - API эндпоинт
     * @returns {Promise<Object|null>} Данные или null при ошибке
     */
    async function get(endpoint) {
        try {
            var response = await fetch('/api/' + endpoint);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        } catch (error) {
            console.error('API GET ' + endpoint + ' error:', error);
            return null;
        }
    }

    /**
     * POST запрос (требует авторизации)
     * @param {string} endpoint - API эндпоинт
     * @param {Object} data - Данные для отправки
     * @returns {Promise<Object>} Ответ сервера
     * @throws {Error} При ошибке запроса
     */
    async function save(endpoint, data) {
        try {
            var response = await fetch('/api/' + endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            checkUnauthorized(response);
            await handleHttpError(response);

            return response.json();
        } catch (error) {
            console.error('API POST ' + endpoint + ' error:', error);
            throw error;
        }
    }

    /**
     * Загрузка изображения (base64)
     * @param {string} imageData - Base64 данные изображения
     * @returns {Promise<Object>} Результат загрузки с URL
     * @throws {Error} При ошибке загрузки
     */
    async function upload(imageData) {
        try {
            var response = await fetch('/api/upload', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ image: imageData })
            });

            checkUnauthorized(response);
            await handleHttpError(response);

            return response.json();
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Удаление файла
     * @param {string} filename - Имя файла для удаления
     * @returns {Promise<Object>} Результат удаления
     * @throws {Error} При ошибке удаления
     */
    async function deleteFile(filename) {
        try {
            var response = await fetch('/api/upload/' + filename, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            checkUnauthorized(response);
            await handleHttpError(response);

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
            get('faq'),
            get('social'),
            get('stats'),
            get('shop/categories'),
            get('shop/products'),
            get('legal')
        ]);

        return {
            masters: results[0],
            services: results[1],
            articles: results[2],
            faq: results[3],
            social: results[4],
            stats: results[5],
            shopCategories: results[6],
            products: results[7],
            legal: results[8]
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
