/**
 * Toast Notifications Module
 * Система уведомлений для админ-панели
 */

var AdminToast = (function() {
    'use strict';

    var container = null;

    /**
     * Инициализация контейнера
     */
    function init() {
        container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    /**
     * Показать уведомление
     * @param {string} message - текст сообщения
     * @param {string} type - тип уведомления: 'success', 'error', 'warning', 'info'
     * @param {number} duration - длительность показа в мс (по умолчанию 3000)
     */
    function show(message, type, duration) {
        type = type || 'success';
        duration = duration || 3000;

        if (!container) init();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        var icon = getIcon(type);
        toast.innerHTML = '<span class="toast-icon">' + icon + '</span>' +
                          '<span class="toast-message">' + window.escapeHtml(message) + '</span>';

        container.appendChild(toast);

        // Анимация появления
        setTimeout(function() {
            toast.classList.add('show');
        }, 10);

        // Автоматическое скрытие
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);

        return toast;
    }

    /**
     * Получить иконку для типа уведомления
     */
    function getIcon(type) {
        var icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        return icons[type] || icons.info;
    }

    // Shorthand методы
    function success(message, duration) {
        return show(message, 'success', duration);
    }

    function error(message, duration) {
        return show(message, 'error', duration);
    }

    function warning(message, duration) {
        return show(message, 'warning', duration);
    }

    function info(message, duration) {
        return show(message, 'info', duration);
    }

    // Публичный API
    return {
        init: init,
        show: show,
        success: success,
        error: error,
        warning: warning,
        info: info
    };
})();

// Глобальная функция для совместимости
function showToast(message, type, duration) {
    return AdminToast.show(message, type, duration);
}

// Экспорт
window.AdminToast = AdminToast;
window.showToast = showToast;
