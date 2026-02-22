/**
 * Utils Module
 *
 * Общие утилиты для всего приложения.
 * Управление DOM, scroll, события.
 */

var SaysApp = window.SaysApp || {};

// =================================================================
// DOM УТИЛИТЫ
// =================================================================

/**
 * Получить элемент по селектору
 * @param {string} selector - CSS селектор
 * @param {Element} parent - родительский элемент (по умолчанию document)
 * @returns {Element|null}
 */
SaysApp.$ = function (selector, parent) {
    parent = parent || document;
    return parent.querySelector(selector);
};

/**
 * Получить все элементы по селектору
 * @param {string} selector - CSS селектор
 * @param {Element} parent - родительский элемент (по умолчанию document)
 * @returns {NodeList}
 */
SaysApp.$$ = function (selector, parent) {
    parent = parent || document;
    return parent.querySelectorAll(selector);
};

/**
 * Получить элемент по ID
 * @param {string} id - ID элемента
 * @returns {Element|null}
 */
SaysApp.byId = function (id) {
    return document.getElementById(id);
};

// =================================================================
// SCROLL УТИЛИТЫ
// =================================================================

/**
 * Заблокировать/разблокировать скролл страницы — делегирует в SharedHelpers
 * @param {boolean} lock - true для блокировки, false для разблокировки
 */
SaysApp.lockScroll = SharedHelpers.lockScroll;

// =================================================================
// ARIA УТИЛИТЫ (Accessibility)
// =================================================================

/**
 * Установить aria-атрибуты для элемента
 * @param {Element} element - DOM элемент
 * @param {Object} attrs - объект с aria-атрибутами
 */
SaysApp.setAria = function (element, attrs) {
    if (!element) return;
    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            element.setAttribute('aria-' + key, attrs[key].toString());
        }
    }
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
SaysApp.on = function (target, event, handler, options) {
    options = options || {};
    target.addEventListener(event, handler, options);
    return function () {
        target.removeEventListener(event, handler, options);
    };
};

/**
 * Выполнить функцию когда DOM готов
 * @param {Function} fn - функция для выполнения
 */
SaysApp.ready = function (fn) {
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
SaysApp.toggleClass = function (element, className, force) {
    if (!element) return false;
    return element.classList.toggle(className, force);
};

/**
 * Проверить наличие класса
 * @param {Element} element - DOM элемент
 * @param {string} className - название класса
 * @returns {boolean}
 */
SaysApp.hasClass = function (element, className) {
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
SaysApp.onEscape = function (callback) {
    var handler = function (e) {
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
 * Форматировать дату — делегирует в SharedHelpers
 */
SaysApp.formatDate = SharedHelpers.formatDate;

/**
 * Форматировать дату кратко (ДД.ММ.ГГГГ)
 * @param {string|Date} dateStr - строка даты или объект Date
 * @returns {string} - отформатированная дата
 */
SaysApp.formatDateShort = function (dateStr) {
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
 * Debounce — делегирует в SharedHelpers
 */
SaysApp.debounce = SharedHelpers.debounce;

/**
 * Throttle функция
 * @param {Function} fn - функция для throttle
 * @param {number} limit - минимальный интервал в миллисекундах
 * @returns {Function} - throttled функция
 */
SaysApp.throttle = function (fn, limit) {
    var inThrottle = false;
    return function () {
        var context = this;
        var args = arguments;
        if (!inThrottle) {
            fn.apply(context, args);
            inThrottle = true;
            setTimeout(function () {
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
window.debounce = SaysApp.debounce;
window.throttle = SaysApp.throttle;
