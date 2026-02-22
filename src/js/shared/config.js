/**
 * Config Module - Централизованный доступ к конфигурации
 * @module AppConfig
 */
(function () {
    'use strict';

    // Дефолтные значения (fallback если config.json не загружен)
    var defaults = {
        site: {
            name: "Say's Barbers",
            domain: 'saysbarbers.ru',
            phone: '+7 (911) 070-11-07',
            telegram: 'https://t.me/saysbarbers'
        },
        api: {
            baseUrl: '/api',
            timeout: 30000
        },
        auth: {
            sessionTimeoutHours: 24,
            maxLoginAttempts: 5,
            lockoutMinutes: 15
        },
        ui: {
            toastDuration: 3000,
            debounceDelay: 300,
            animationDuration: 300,
            maxImageSize: 5242880,
            maxUploadImages: 10,
            articlesPerPage: 3
        },
        colors: {
            danger: '#ff4757',
            dangerHover: '#ff3344',
            dangerLight: '#ff6b6b',
            dangerSubtle: 'rgba(255, 71, 87, 0.15)'
        },
        idPrefixes: {
            master: 'master_',
            article: 'article_',
            product: 'product_',
            category: 'category_',
            legal: 'legal_',
            faq: 'faq_'
        }
    };

    var config = null;
    var loaded = false;
    var loadPromise = null;

    /**
     * Получить значение из вложенного объекта по пути
     * @param {Object} obj - Объект для поиска
     * @param {string} path - Путь вида 'site.name' или 'ui.toastDuration'
     * @returns {*} Найденное значение или undefined
     */
    function getNestedValue(obj, path) {
        if (!obj || !path) return undefined;

        var parts = path.split('.');
        var value = obj;

        for (var i = 0; i < parts.length; i++) {
            if (value && typeof value === 'object' && parts[i] in value) {
                value = value[parts[i]];
            } else {
                return undefined;
            }
        }
        return value;
    }

    /**
     * Получить значение конфигурации по пути
     * @param {string} path - Путь к значению (например 'site.name', 'ui.toastDuration')
     * @param {*} [defaultValue] - Значение по умолчанию если не найдено
     * @returns {*} Значение конфигурации
     * @example
     * AppConfig.get('site.name') // "Say's Barbers"
     * AppConfig.get('ui.toastDuration', 3000) // 3000
     */
    function get(path, defaultValue) {
        // Сначала ищем в загруженном конфиге
        var value = getNestedValue(config, path);
        if (value !== undefined) return value;

        // Затем в дефолтах
        value = getNestedValue(defaults, path);
        if (value !== undefined) return value;

        // Возвращаем переданный default
        return defaultValue;
    }

    /**
     * Асинхронная загрузка конфигурации
     * @returns {Promise<Object>} Загруженная конфигурация
     */
    function load() {
        if (loaded) return Promise.resolve(config);
        if (loadPromise) return loadPromise;

        loadPromise = fetch('/config.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Config not found');
                }
                return response.json();
            })
            .then(function (data) {
                config = data;
                loaded = true;
                return config;
            })
            .catch(function (error) {
                console.warn('AppConfig: Using defaults, config.json not loaded:', error.message);
                config = defaults;
                loaded = true;
                return config;
            });

        return loadPromise;
    }

    /**
     * Проверить, загружен ли конфиг
     * @returns {boolean}
     */
    function isLoaded() {
        return loaded;
    }

    /**
     * Получить все дефолтные значения
     * @returns {Object}
     */
    function getDefaults() {
        return defaults;
    }

    // Экспорт
    window.AppConfig = {
        get: get,
        load: load,
        isLoaded: isLoaded,
        getDefaults: getDefaults
    };
})();
