/**
 * Admin Modals Module
 * Управление модальными окнами
 */

var AdminModals = (function() {
    'use strict';

    var currentModal = null;

    /**
     * Открыть модальное окно
     */
    function open(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentModal = modal;

        // Обработчик закрытия по Escape
        document.addEventListener('keydown', handleEscape);

        // Обработчик закрытия по клику на оверлей
        modal.addEventListener('click', handleOverlayClick);
    }

    /**
     * Закрыть модальное окно
     */
    function close(modalId) {
        var modal = modalId ? document.getElementById(modalId) : currentModal;
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Удаляем обработчики
        document.removeEventListener('keydown', handleEscape);
        modal.removeEventListener('click', handleOverlayClick);

        currentModal = null;

        // Сброс формы если есть
        var form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Закрыть текущее модальное окно
     */
    function closeCurrent() {
        if (currentModal) {
            close();
        }
    }

    /**
     * Обработчик нажатия Escape
     */
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeCurrent();
        }
    }

    /**
     * Обработчик клика по оверлею
     */
    function handleOverlayClick(e) {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            closeCurrent();
        }
    }

    /**
     * Установить заголовок модального окна
     */
    function setTitle(modalId, title) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        var titleEl = modal.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Инициализация кнопок закрытия
     */
    function init() {
        // Инициализация кнопок закрытия
        var closeButtons = document.querySelectorAll('.modal-close, [data-modal-close]');
        closeButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                closeCurrent();
            });
        });

        // Инициализация кнопок открытия
        var openButtons = document.querySelectorAll('[data-modal-open]');
        openButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var modalId = this.getAttribute('data-modal-open');
                if (modalId) {
                    open(modalId);
                }
            });
        });
    }

    // Публичный API
    return {
        init: init,
        open: open,
        close: close,
        closeCurrent: closeCurrent,
        setTitle: setTitle
    };
})();

// Глобальные функции для совместимости
function openModal(modalId) {
    AdminModals.open(modalId);
}

function closeModal(modalId) {
    AdminModals.close(modalId);
}

// Экспорт
window.AdminModals = AdminModals;
window.openModal = openModal;
window.closeModal = closeModal;
