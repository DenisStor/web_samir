/**
 * Shared Helpers Module
 * Общие утилиты для всех частей приложения
 * @module SharedHelpers
 */
(function() {
    'use strict';

    // =================================================================
    // XSS PROTECTION
    // =================================================================

    /**
     * Escape HTML entities для защиты от XSS
     * @param {string|null|undefined} text - Текст для экранирования
     * @returns {string} Экранированный текст
     * @example
     * escapeHtml('<script>alert("xss")</script>') // '&lt;script&gt;alert("xss")&lt;/script&gt;'
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        var str = String(text);
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Escape для HTML атрибутов (включая одинарные кавычки)
     * Используется в onclick и других атрибутах с одинарными кавычками
     * @param {string|null|undefined} text - Текст для экранирования
     * @returns {string} Экранированный текст
     * @example
     * escapeAttr("test'value") // 'test&#39;value'
     */
    function escapeAttr(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // =================================================================
    // ID GENERATION
    // =================================================================

    /**
     * Генерация уникального ID с префиксом
     * @param {string} [prefix='item'] - Префикс ID (например 'master', 'product')
     * @returns {string} Уникальный ID вида prefix_timestamp_random
     * @example
     * generateId('master') // 'master_1705312847123_k8j2m9n3x'
     */
    function generateId(prefix) {
        var p = prefix || 'item';
        return p + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // =================================================================
    // SLUG GENERATION
    // =================================================================

    /**
     * Генерация slug из текста (транслитерация + нормализация)
     * @param {string} text - Исходный текст
     * @returns {string} URL-friendly slug
     * @example
     * generateSlug('Помада для укладки') // 'pomada-dlya-ukladki'
     */
    function generateSlug(text) {
        if (!text) return '';

        var translitMap = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        return text
            .toLowerCase()
            .split('')
            .map(function(char) {
                return translitMap[char] !== undefined ? translitMap[char] : char;
            })
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
    }

    // =================================================================
    // DEBOUNCE / THROTTLE
    // =================================================================

    /**
     * Debounce - отложенный вызов функции
     * @param {Function} func - Функция для отложенного вызова
     * @param {number} wait - Время ожидания в мс
     * @returns {Function} Debounced функция
     * @example
     * var debouncedSearch = debounce(search, 300);
     * input.addEventListener('input', debouncedSearch);
     */
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    /**
     * Throttle через requestAnimationFrame
     * @param {Function} func - Функция для throttle
     * @returns {Function} Throttled функция
     * @example
     * var throttledScroll = throttleRAF(onScroll);
     * window.addEventListener('scroll', throttledScroll, { passive: true });
     */
    function throttleRAF(func) {
        var rafId = null;
        return function() {
            var context = this;
            var args = arguments;
            if (rafId) return;
            rafId = requestAnimationFrame(function() {
                func.apply(context, args);
                rafId = null;
            });
        };
    }

    // =================================================================
    // FORMAT UTILITIES
    // =================================================================

    /**
     * Форматирование цены в рубли
     * @param {number|string} price - Цена
     * @returns {string} Отформатированная цена
     * @example
     * formatPrice(1500) // '1 500 ₽'
     */
    function formatPrice(price) {
        var num = parseInt(price, 10);
        if (isNaN(num)) return '0 ₽';
        return num.toLocaleString('ru-RU') + ' ₽';
    }

    /**
     * Форматирование даты
     * @param {string|Date} date - Дата
     * @param {Object} [options] - Опции форматирования
     * @returns {string} Отформатированная дата
     */
    function formatDate(date, options) {
        if (!date) return '';
        var d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '';

        var defaultOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };

        return d.toLocaleDateString('ru-RU', options || defaultOptions);
    }

    // =================================================================
    // EXPORT
    // =================================================================

    window.SharedHelpers = {
        // XSS
        escapeHtml: escapeHtml,
        escapeAttr: escapeAttr,

        // ID & Slug
        generateId: generateId,
        generateSlug: generateSlug,

        // Timing
        debounce: debounce,
        throttleRAF: throttleRAF,

        // Formatting
        formatPrice: formatPrice,
        formatDate: formatDate
    };

    // Глобальные алиасы для обратной совместимости
    window.escapeHtml = escapeHtml;
    window.escapeAttr = escapeAttr;
    window.generateId = generateId;
    window.generateSlug = generateSlug;
    window.debounce = debounce;

})();
