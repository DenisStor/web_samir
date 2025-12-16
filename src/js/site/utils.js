/**
 * Utils Module
 *
 * Общие утилиты для всего приложения.
 * Управление DOM, scroll, события.
 */

const SaysApp = window.SaysApp || {};

// =================================================================
// DOM УТИЛИТЫ
// =================================================================

/**
 * Получить элемент по селектору
 * @param {string} selector - CSS селектор
 * @param {Element} parent - родительский элемент (по умолчанию document)
 * @returns {Element|null}
 */
SaysApp.$ = function(selector, parent = document) {
    return parent.querySelector(selector);
};

/**
 * Получить все элементы по селектору
 * @param {string} selector - CSS селектор
 * @param {Element} parent - родительский элемент (по умолчанию document)
 * @returns {NodeList}
 */
SaysApp.$$ = function(selector, parent = document) {
    return parent.querySelectorAll(selector);
};

/**
 * Получить элемент по ID
 * @param {string} id - ID элемента
 * @returns {Element|null}
 */
SaysApp.byId = function(id) {
    return document.getElementById(id);
};

// =================================================================
// SCROLL УТИЛИТЫ
// =================================================================

/**
 * Заблокировать/разблокировать скролл страницы
 * @param {boolean} lock - true для блокировки, false для разблокировки
 */
SaysApp.lockScroll = function(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
};

/**
 * Проверить, заблокирован ли скролл
 * @returns {boolean}
 */
SaysApp.isScrollLocked = function() {
    return document.body.style.overflow === 'hidden';
};

// =================================================================
// ARIA УТИЛИТЫ (Accessibility)
// =================================================================

/**
 * Установить aria-атрибуты для элемента
 * @param {Element} element - DOM элемент
 * @param {Object} attrs - объект с aria-атрибутами
 */
SaysApp.setAria = function(element, attrs) {
    if (!element) return;
    Object.entries(attrs).forEach(([key, value]) => {
        element.setAttribute(`aria-${key}`, value.toString());
    });
};

// =================================================================
// СОБЫТИЯ
// =================================================================

/**
 * Добавить обработчик события с автоматической очисткой
 * @param {Element|Window|Document} target - целевой элемент
 * @param {string} event - название события
 * @param {Function} handler - обработчик
 * @param {Object} options - опции addEventListener
 * @returns {Function} - функция для удаления обработчика
 */
SaysApp.on = function(target, event, handler, options = {}) {
    target.addEventListener(event, handler, options);
    return () => target.removeEventListener(event, handler, options);
};

/**
 * Выполнить функцию когда DOM готов
 * @param {Function} fn - функция для выполнения
 */
SaysApp.ready = function(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
};

// =================================================================
// КЛАССЫ
// =================================================================

/**
 * Переключить класс на элементе
 * @param {Element} element - DOM элемент
 * @param {string} className - название класса
 * @param {boolean} force - принудительно добавить/удалить
 * @returns {boolean} - добавлен ли класс
 */
SaysApp.toggleClass = function(element, className, force) {
    if (!element) return false;
    return element.classList.toggle(className, force);
};

/**
 * Проверить наличие класса
 * @param {Element} element - DOM элемент
 * @param {string} className - название класса
 * @returns {boolean}
 */
SaysApp.hasClass = function(element, className) {
    if (!element) return false;
    return element.classList.contains(className);
};

// =================================================================
// KEYBOARD
// =================================================================

/**
 * Обработчик нажатия Escape
 * @param {Function} callback - функция для вызова при нажатии Escape
 * @returns {Function} - функция для удаления обработчика
 */
SaysApp.onEscape = function(callback) {
    const handler = (e) => {
        if (e.key === 'Escape') {
            callback(e);
        }
    };
    return SaysApp.on(document, 'keydown', handler);
};

// =================================================================
// ФОРМАТИРОВАНИЕ
// =================================================================

/**
 * Форматировать дату в русском формате
 * @param {string|Date} dateStr - строка даты или объект Date
 * @param {Object} options - опции форматирования
 * @returns {string} - отформатированная дата
 */
SaysApp.formatDate = function(dateStr, options = {}) {
    if (!dateStr) return '';

    var defaultOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    try {
        var date = dateStr instanceof Date ? dateStr : new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('ru-RU', Object.assign({}, defaultOptions, options));
    } catch (e) {
        return String(dateStr);
    }
};

/**
 * Форматировать дату кратко (ДД.ММ.ГГГГ)
 * @param {string|Date} dateStr - строка даты или объект Date
 * @returns {string} - отформатированная дата
 */
SaysApp.formatDateShort = function(dateStr) {
    if (!dateStr) return '';

    try {
        var date = dateStr instanceof Date ? dateStr : new Date(dateStr);
        if (isNaN(date.getTime())) return String(dateStr);

        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();

        return day + '.' + month + '.' + year;
    } catch (e) {
        return String(dateStr);
    }
};

/**
 * Генерировать уникальный ID
 * @param {string} prefix - префикс для ID
 * @returns {string} - уникальный ID
 */
SaysApp.generateId = function(prefix) {
    prefix = prefix || 'id';
    return prefix + '_' + Date.now() + Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce функция
 * @param {Function} fn - функция для debounce
 * @param {number} delay - задержка в миллисекундах
 * @returns {Function} - debounced функция
 */
SaysApp.debounce = function(fn, delay) {
    var timeoutId = null;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
            fn.apply(context, args);
        }, delay);
    };
};

/**
 * Throttle функция
 * @param {Function} fn - функция для throttle
 * @param {number} limit - минимальный интервал в миллисекундах
 * @returns {Function} - throttled функция
 */
SaysApp.throttle = function(fn, limit) {
    var inThrottle = false;
    return function() {
        var context = this;
        var args = arguments;
        if (!inThrottle) {
            fn.apply(context, args);
            inThrottle = true;
            setTimeout(function() {
                inThrottle = false;
            }, limit);
        }
    };
};

// Экспорт в глобальный scope
window.SaysApp = SaysApp;

// Также экспортируем отдельные функции для удобства
window.formatDate = SaysApp.formatDate;
window.formatDateShort = SaysApp.formatDateShort;
window.generateId = SaysApp.generateId;
window.debounce = SaysApp.debounce;
window.throttle = SaysApp.throttle;
